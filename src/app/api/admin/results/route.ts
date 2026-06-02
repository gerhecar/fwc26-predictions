import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { getPool } from '@/lib/db/pool'
import { calculateScore, calculateTieBreakers } from '@/lib/scoring/engine'
import crypto from 'crypto'
import type { ScoreResult, PhaseStatus } from '@/types'

const DEFAULT_PHASE_STATUS: PhaseStatus = {
  groupStage: { status: 'draft', lockedAt: null, lockedBy: null },
  bestThirdPlaced: { status: 'draft', lockedAt: null, lockedBy: null },
  knockout: { status: 'draft', lockedAt: null, lockedBy: null },
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const pool = getPool()
    const [rows] = await pool.execute(
      `SELECT id, results_json, phase_status, status, updated_by, updated_at
       FROM official_results
       ORDER BY updated_at DESC LIMIT 1`,
    )

    const results = rows as Array<{
      id: string
      results_json: string
      phase_status: string | null
      status: string
      updated_by: string
      updated_at: string
    }>

    if (results.length === 0) {
      return NextResponse.json({
        results: {
          groupStage: {},
          bestThirdPlaced: [],
          knockout: {},
          champion: null,
        },
        phaseStatus: DEFAULT_PHASE_STATUS,
        status: 'draft',
      })
    }

    const row = results[0]
    const parsed = typeof row.results_json === 'string'
      ? JSON.parse(row.results_json)
      : row.results_json

    let phaseStatus = DEFAULT_PHASE_STATUS
    if (row.phase_status) {
      const ps = typeof row.phase_status === 'string' ? JSON.parse(row.phase_status) : row.phase_status
      phaseStatus = { ...DEFAULT_PHASE_STATUS, ...ps }
    }

    return NextResponse.json({
      id: row.id,
      results: parsed,
      phaseStatus,
      status: row.status,
      updatedBy: row.updated_by,
      updatedAt: row.updated_at,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('Get official results failed:', message)
    return NextResponse.json(
      { error: 'Error al obtener resultados' },
      { status: 500 },
    )
  }
}

async function computeProvisionalScores(pool: any, officialData: any, userId: string) {
  const official = {
    groupStage: officialData.groupStage || {},
    bestThirdPlaced: officialData.bestThirdPlaced || [],
    knockout: officialData.knockout || {},
    champion: officialData.champion || null,
  }

  const [betRows] = await pool.execute(
    `SELECT id, prediction_json, champion_name FROM bet_submissions WHERE status = 'valid'`,
  )
  const bets = betRows as any[]

  const scoredAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
  let scoredBets = 0
  let skippedBets = 0
  const errors: string[] = []

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
      const tb = calculateTieBreakers(prediction, official, scoreResult)

      await pool.execute(
        `UPDATE bet_submissions
         SET provisional_score = ?, provisional_score_breakdown = ?, provisional_scored_at = ?,
             champion_correct = ?, finalists_correct = ?, semifinalists_correct = ?,
             quarterfinalists_correct = ?, qualified_teams_correct = ?, knockout_score = ?
         WHERE id = ?`,
        [
          scoreResult.totalScore,
          JSON.stringify({ breakdown: scoreResult.breakdown, details: scoreResult.details }),
          scoredAt,
          tb.championCorrect,
          tb.finalistsCorrect,
          tb.semifinalistsCorrect,
          tb.quarterfinalistsCorrect,
          tb.qualifiedTeamsCorrect,
          tb.knockoutScore,
          bet.id,
        ],
      )
      scoredBets++
    } catch (err) {
      errors.push(`Error scoring bet ${bet.id}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      skippedBets++
    }
  }

  return { scoredBets, skippedBets, errors, calculatedAt: scoredAt }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { groupStage, bestThirdPlaced, knockout, champion } = body

    const pool = getPool()

    const [existing] = await pool.execute(
      `SELECT id, phase_status FROM official_results ORDER BY updated_at DESC LIMIT 1`,
    )
    const existingRows = existing as Array<{ id: string; phase_status: string | null }>

    const resultsJson = JSON.stringify({ groupStage, bestThirdPlaced, knockout, champion })

    let resultsId: string

    if (existingRows.length > 0) {
      resultsId = existingRows[0].id
      let ps = DEFAULT_PHASE_STATUS
      if (existingRows[0].phase_status) {
        const parsed = typeof existingRows[0].phase_status === 'string' ? JSON.parse(existingRows[0].phase_status) : existingRows[0].phase_status
        ps = { ...DEFAULT_PHASE_STATUS, ...parsed }
      }
      await pool.execute(
        `UPDATE official_results SET results_json = ?, phase_status = ?, updated_by = ? WHERE id = ?`,
        [resultsJson, JSON.stringify(ps), user.id, resultsId],
      )
    } else {
      const [tournamentRows] = await pool.execute(
        "SELECT id FROM tournaments WHERE slug = 'fifa-world-cup-2026' LIMIT 1",
      )
      const tRows = tournamentRows as Array<{ id: string }>
      if (tRows.length === 0) {
        return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 })
      }

      resultsId = crypto.randomUUID()
      await pool.execute(
        `INSERT INTO official_results (id, tournament_id, results_json, phase_status, updated_by)
         VALUES (?, ?, ?, ?, ?)`,
        [resultsId, tRows[0].id, resultsJson, JSON.stringify(DEFAULT_PHASE_STATUS), user.id],
      )
    }

    // Compute provisional scores after save
    const summary = await computeProvisionalScores(pool, { groupStage, bestThirdPlaced, knockout, champion }, user.id)

    return NextResponse.json({ success: true, provisionalSummary: summary })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('Save official results failed:', message)
    return NextResponse.json(
      { error: 'Error al guardar resultados' },
      { status: 500 },
    )
  }
}
