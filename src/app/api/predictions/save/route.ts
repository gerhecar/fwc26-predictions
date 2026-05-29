import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { getPool } from '@/lib/db/pool'
import { generatePredictionJson } from '@/lib/predictions/json-export'
import { sendPredictionEmail } from '@/lib/email/send-prediction'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body: {
      groupPredictions: Record<string, string[]>
      thirdPlaceSelection: string[]
      bracketPicks: Record<number, string>
    } = await request.json()

    const { groupPredictions, thirdPlaceSelection, bracketPicks } = body

    if (!groupPredictions || typeof groupPredictions !== 'object') {
      return NextResponse.json({ error: 'groupPredictions requerido' }, { status: 400 })
    }
    if (!Array.isArray(thirdPlaceSelection)) {
      return NextResponse.json({ error: 'thirdPlaceSelection requerido' }, { status: 400 })
    }
    if (!bracketPicks || typeof bracketPicks !== 'object') {
      return NextResponse.json({ error: 'bracketPicks requerido' }, { status: 400 })
    }

    const champion = bracketPicks[104]
    if (!champion) {
      return NextResponse.json({ error: 'Debes seleccionar un campeón' }, { status: 400 })
    }

    const predictionId = crypto.randomUUID()

    const predictionJson = generatePredictionJson(
      user.id,
      user.display_name,
      predictionId,
      groupPredictions,
      thirdPlaceSelection,
      bracketPicks,
    )

    const pool = getPool()
    await pool.execute(
      `INSERT INTO bet_submissions (id, user_id, prediction_json, champion_name, status)
       VALUES (?, ?, ?, ?, 'submitted')`,
      [predictionId, user.id, JSON.stringify(predictionJson), champion],
    )

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
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('Save prediction failed:', message)
    return NextResponse.json(
      { error: 'Error al guardar el pronóstico' },
      { status: 500 },
    )
  }
}
