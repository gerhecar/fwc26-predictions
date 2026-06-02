import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { getPool } from '@/lib/db/pool'
import { generatePredictionJson } from '@/lib/predictions/json-export'
import { sendPredictionEmail } from '@/lib/email/send-prediction'
import { rateLimit } from '@/lib/rate-limit'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Rate limit per user
    const rl = rateLimit(`bet:${user.id}`, 10, 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Demasiados intentos. Intenta de nuevo más tarde.' }, { status: 429 })
    }

    const body: {
      groupPredictions: Record<string, string[]>
      thirdPlaceSelection: string[]
      bracketPicks: Record<number, string>
      betName: string
    } = await request.json()

    const { groupPredictions, thirdPlaceSelection, bracketPicks, betName } = body

    if (!groupPredictions || typeof groupPredictions !== 'object') {
      return NextResponse.json({ error: 'groupPredictions requerido' }, { status: 400 })
    }
    if (!Array.isArray(thirdPlaceSelection)) {
      return NextResponse.json({ error: 'thirdPlaceSelection requerido' }, { status: 400 })
    }
    if (!bracketPicks || typeof bracketPicks !== 'object') {
      return NextResponse.json({ error: 'bracketPicks requerido' }, { status: 400 })
    }
    if (!betName || typeof betName !== 'string' || betName.trim().length === 0) {
      return NextResponse.json({ error: 'betName requerido' }, { status: 400 })
    }
    if (betName.trim().length > 255) {
      return NextResponse.json({ error: 'El nombre de la apuesta es demasiado largo (máx. 255 caracteres)' }, { status: 400 })
    }

    const champion = bracketPicks[104]
    if (!champion) {
      return NextResponse.json({ error: 'Debes seleccionar un campeón' }, { status: 400 })
    }

    const pool = getPool()
    const connection = await pool.getConnection()

    try {
      await connection.beginTransaction()

      // Lock the user's bet rows to prevent race conditions
      const [lockRows] = await connection.execute(
        "SELECT COUNT(*) AS cnt FROM bet_submissions WHERE user_id = ? AND status != 'deleted' FOR UPDATE",
        [user.id],
      )
      const existingCount = (lockRows as Array<{ cnt: number }>)[0]?.cnt ?? 0
      if (existingCount >= 2) {
        await connection.rollback()
        connection.release()
        return NextResponse.json({ error: 'Máximo 2 apuestas por usuario' }, { status: 400 })
      }

      // Check unique bet_name per user
      const [dupRows] = await connection.execute(
        'SELECT id FROM bet_submissions WHERE user_id = ? AND bet_name = ?',
        [user.id, betName.trim()],
      )
      if ((dupRows as Array<unknown>).length > 0) {
        await connection.rollback()
        connection.release()
        return NextResponse.json({ error: 'Ya tienes una apuesta con ese nombre' }, { status: 409 })
      }

      const predictionId = crypto.randomUUID()

      const predictionJson = generatePredictionJson(
        user.id,
        user.display_name,
        predictionId,
        betName.trim(),
        groupPredictions,
        thirdPlaceSelection,
        bracketPicks,
      )

      await connection.execute(
        `INSERT INTO bet_submissions (id, user_id, bet_name, prediction_json, champion_name, status)
         VALUES (?, ?, ?, ?, ?, 'submitted')`,
        [predictionId, user.id, betName.trim(), JSON.stringify(predictionJson), champion],
      )

      await connection.commit()
      connection.release()

      const emailResult = await sendPredictionEmail(predictionJson)

      if (!emailResult.success) {
        await pool.execute(
          'UPDATE bet_submissions SET email_sent = FALSE, email_error = ? WHERE id = ?',
          [emailResult.error || 'Unknown error', predictionId],
        )
      } else {
        await pool.execute(
          'UPDATE bet_submissions SET email_sent = TRUE WHERE id = ?',
          [predictionId],
        )
      }

      return NextResponse.json({
        success: true,
        predictionId,
        champion,
        submittedAt: predictionJson.submittedAt,
        emailSent: emailResult.success,
      })
    } catch (txErr) {
      await connection.rollback()
      connection.release()
      throw txErr
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('Save prediction failed:', message)
    return NextResponse.json(
      { error: 'Error al guardar el pronóstico' },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const pool = getPool()
    const [colRows] = await pool.execute(
      "SHOW COLUMNS FROM bet_submissions LIKE 'submitted_via_invitation'",
    )
    const hasInvCol = (colRows as Array<unknown>).length > 0

    const selectFields = hasInvCol
      ? `id, bet_name, champion_name, submitted_at, submitted_via_invitation, invitation_id`
      : `id, bet_name, champion_name, submitted_at`

    const [rows] = await pool.execute(
      `SELECT ${selectFields}
       FROM bet_submissions
       WHERE user_id = ? AND status != 'deleted'
       ORDER BY submitted_at ASC`,
      [user.id],
    )

    return NextResponse.json({ bets: rows })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('Fetch user bets failed:', message)
    return NextResponse.json(
      { error: 'Error al obtener apuestas' },
      { status: 500 },
    )
  }
}
