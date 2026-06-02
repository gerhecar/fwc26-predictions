import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { getPool } from '@/lib/db/pool'
import { calculateScore } from '@/lib/scoring/engine'
import type { ScoreResult, ScoringSummary } from '@/types'

export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const pool = getPool()

    // Load tournament
    const [tournamentRows] = await pool.execute(
      "SELECT id FROM tournaments WHERE slug = 'fifa-world-cup-2026' LIMIT 1",
    )
    const tournaments = tournamentRows as any[]
    if (tournaments.length === 0) {
      return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 })
    }
    const tournamentId = tournaments[0].id

    // Load official results
    const [officialRows] = await pool.execute(
      `SELECT results_json, status FROM official_results ORDER BY updated_at DESC LIMIT 1`,
    )
    const officialList = officialRows as any[]
    if (officialList.length === 0) {
      return NextResponse.json({ success: false, message: 'No hay resultados oficiales guardados.' })
    }

    const officialRow = officialList[0]
    if (officialRow.status !== 'published') {
      return NextResponse.json({ success: false, message: 'Los resultados oficiales deben estar publicados antes de calcular puntajes.' })
    }

    const officialData = typeof officialRow.results_json === 'string'
      ? JSON.parse(officialRow.results_json)
      : officialRow.results_json

    const official = {
      groupStage: officialData.groupStage || {},
      bestThirdPlaced: officialData.bestThirdPlaced || [],
      knockout: officialData.knockout || {},
      champion: officialData.champion || null,
    }

    // Load all valid bet submissions
    const [betRows] = await pool.execute(
      `SELECT id, user_id, bet_name, prediction_json, champion_name FROM bet_submissions WHERE status = 'valid'`,
    )
    const bets = betRows as any[]

    if (bets.length === 0) {
      return NextResponse.json({ success: false, message: 'No hay apuestas validadas para puntuar.' })
    }

    const summary: ScoringSummary = {
      scoredBets: 0,
      skippedBets: 0,
      errors: [],
      calculatedAt: new Date().toISOString(),
    }

    const scoredAt = new Date().toISOString().slice(0, 19).replace('T', ' ')

    for (const bet of bets) {
      try {
        const predictionJson = typeof bet.prediction_json === 'string'
          ? JSON.parse(bet.prediction_json)
          : bet.prediction_json

        const prediction = {
          groupStage: predictionJson.groupStage || {},
          bestThirdPlaced: predictionJson.bestThirdPlaced || [],
          knockout: predictionJson.knockout || {},
          champion: predictionJson.champion || bet.champion_name || null,
        }

        const scoreResult: ScoreResult = calculateScore(prediction, official)

        // Check if score_breakdown column exists
        const [colRows] = await pool.execute(
          "SHOW COLUMNS FROM bet_submissions LIKE 'score_breakdown'",
        )
        const hasScoreCols = (colRows as any[]).length > 0

        if (hasScoreCols) {
          await pool.execute(
            `UPDATE bet_submissions
             SET total_score = ?, score_breakdown = ?, scored_at = ?
             WHERE id = ?`,
            [
              scoreResult.totalScore,
              JSON.stringify({ breakdown: scoreResult.breakdown, details: scoreResult.details }),
              scoredAt,
              bet.id,
            ],
          )
        } else {
          await pool.execute(
            `UPDATE bet_submissions SET total_score = ?, scored_at = ? WHERE id = ?`,
            [scoreResult.totalScore, scoredAt, bet.id],
          )
        }

        summary.scoredBets++
      } catch (err) {
        summary.errors.push(`Error scoring bet ${bet.id} (${bet.bet_name}): ${err instanceof Error ? err.message : 'Unknown error'}`)
        summary.skippedBets++
      }
    }

    return NextResponse.json({
      success: true,
      summary,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('Calculate scores failed:', message)
    return NextResponse.json(
      { error: 'Error al calcular puntajes' },
      { status: 500 },
    )
  }
}
