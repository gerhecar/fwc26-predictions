import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { getPool } from '@/lib/db/pool'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await params

    const pool = getPool()
    const [rows] = await pool.execute(
      `SELECT id, bet_name, prediction_json, champion_name, submitted_at
       FROM bet_submissions
       WHERE id = ? AND user_id = ?`,
      [id, user.id],
    )

    const bets = rows as Array<{
      id: string
      bet_name: string
      prediction_json: string
      champion_name: string
      submitted_at: string
    }>

    if (bets.length === 0) {
      return NextResponse.json({ error: 'Apuesta no encontrada' }, { status: 404 })
    }

    const bet = bets[0]
    const predictionJson = typeof bet.prediction_json === 'string'
      ? JSON.parse(bet.prediction_json)
      : bet.prediction_json

    return NextResponse.json({
      id: bet.id,
      betName: bet.bet_name,
      prediction: predictionJson,
      champion: bet.champion_name,
      submittedAt: bet.submitted_at,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('Fetch bet detail failed:', message)
    return NextResponse.json(
      { error: 'Error al obtener la apuesta' },
      { status: 500 },
    )
  }
}
