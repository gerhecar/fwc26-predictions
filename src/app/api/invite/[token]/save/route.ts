import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db/pool'
import { generatePredictionJson } from '@/lib/predictions/json-export'
import { sendPredictionEmail } from '@/lib/email/send-prediction'
import { rateLimit } from '@/lib/rate-limit'
import crypto from 'crypto'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    if (!token || token.length < 10) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 400 })
    }

    // Rate limit per token
    const rl = rateLimit(`invite:${token}`, 5, 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Demasiados intentos. Intenta de nuevo más tarde.' }, { status: 429 })
    }

    const body: {
      groupPredictions: Record<string, string[]>
      thirdPlaceSelection: string[]
      bracketPicks: Record<number, string>
      betName: string
      guestName?: string
    } = await request.json()

    const { groupPredictions, thirdPlaceSelection, bracketPicks, betName, guestName } = body

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

    // Atomic claim: try to mark invitation as used in a single UPDATE (race-condition-safe)
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    const [markResult] = await pool.execute(
      `UPDATE bet_invitations
       SET status = 'used', used_at = ?, used_by_name = ?, updated_at = NOW()
       WHERE token = ? AND status = 'active' AND expires_at > ?`,
      [now, guestName || null, token, now],
    )
    const markedRows = (markResult as any).affectedRows ?? 0

    if (markedRows === 0) {
      // Could be used, revoked, expired, or not found
      const [invRows] = await pool.execute(
        `SELECT status FROM bet_invitations WHERE token = ? LIMIT 1`,
        [token],
      )
      const invs = invRows as Array<{ status: string }>
      if (invs.length === 0) {
        return NextResponse.json({ error: 'Token no encontrado' }, { status: 404 })
      }
      const s = invs[0].status
      if (s === 'used') {
        return NextResponse.json({ error: 'Esta invitación ya fue utilizada' }, { status: 410 })
      }
      if (s === 'revoked') {
        return NextResponse.json({ error: 'Esta invitación fue revocada' }, { status: 410 })
      }
      if (s === 'expired') {
        return NextResponse.json({ error: 'La invitación ha expirado' }, { status: 410 })
      }
      return NextResponse.json({ error: 'Token no disponible' }, { status: 410 })
    }

    // Fetch invitation data after successful claim
    const [invRows] = await pool.execute(
      `SELECT id, user_id, bet_slot FROM bet_invitations WHERE token = ? LIMIT 1`,
      [token],
    )
    const invitations = invRows as Array<{ id: string; user_id: string; bet_slot: number }>
    const inv = invitations[0]

    // Check owner still has the slot available
    const [countRows] = await pool.execute(
      "SELECT COUNT(*) AS cnt FROM bet_submissions WHERE user_id = ? AND status != 'deleted'",
      [inv.user_id],
    )
    const existingCount = (countRows as Array<{ cnt: number }>)[0]?.cnt ?? 0

    if (existingCount >= 2) {
      return NextResponse.json({ error: 'El usuario ya tiene 2 apuestas' }, { status: 400 })
    }

    // Get owner info
    const [ownerRows] = await pool.execute(
      'SELECT id, email, display_name FROM users WHERE id = ?',
      [inv.user_id],
    )
    const owners = ownerRows as Array<{ id: string; email: string; display_name: string }>
    if (owners.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 500 })
    }
    const owner = owners[0]

    // Check unique bet_name for owner
    const [dupRows] = await pool.execute(
      'SELECT id FROM bet_submissions WHERE user_id = ? AND bet_name = ?',
      [inv.user_id, betName.trim()],
    )
    if ((dupRows as Array<unknown>).length > 0) {
      return NextResponse.json({ error: 'El usuario ya tiene una apuesta con ese nombre' }, { status: 409 })
    }

    const predictionId = crypto.randomUUID()

    const predictionJson = generatePredictionJson(
      owner.id,
      owner.display_name,
      predictionId,
      betName.trim(),
      groupPredictions,
      thirdPlaceSelection,
      bracketPicks,
    )

    // Check if invitation_id column exists
    const [colRows] = await pool.execute(
      "SHOW COLUMNS FROM bet_submissions LIKE 'invitation_id'",
    )
    const hasInvCol = (colRows as Array<unknown>).length > 0

    if (hasInvCol) {
      await pool.execute(
        `INSERT INTO bet_submissions (id, user_id, bet_name, prediction_json, champion_name, status, submitted_via_invitation, invitation_id)
         VALUES (?, ?, ?, ?, ?, 'submitted', TRUE, ?)`,
        [
          predictionId,
          inv.user_id,
          betName.trim(),
          JSON.stringify(predictionJson),
          champion,
          inv.id,
        ],
      )
    } else {
      await pool.execute(
        `INSERT INTO bet_submissions (id, user_id, bet_name, prediction_json, champion_name, status)
         VALUES (?, ?, ?, ?, ?, 'submitted')`,
        [
          predictionId,
          inv.user_id,
          betName.trim(),
          JSON.stringify(predictionJson),
          champion,
        ],
      )
    }

    // Send email to owner
    const emailResult = await sendPredictionEmail(predictionJson)

    if (!emailResult.success) {
      await pool.execute(
        'UPDATE bet_submissions SET email_sent = FALSE, email_error = ? WHERE id = ?',
        [emailResult.error || 'Error sending email', predictionId],
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
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('Guest save failed:', message)
    return NextResponse.json(
      { error: 'Error al guardar la apuesta' },
      { status: 500 },
    )
  }
}
