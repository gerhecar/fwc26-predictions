import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { getPool } from '@/lib/db/pool'
import { calculateScore, calculateTieBreakers, filterScoreByLockedPhases } from '@/lib/scoring/engine'
import {
  generateBracketFromResults,
  persistBracket,
  getTournamentId,
} from '@/lib/bracket/generate-bracket'
import type { ScoreResult, PhaseStatus, PhaseStatusEntry } from '@/types'

const PHASE_MAP: Record<string, keyof PhaseStatus> = {
  group: 'groupStage',
  third: 'bestThirdPlaced',
  knockout: 'knockout',
}

const PHASE_LABELS: Record<string, string> = {
  group: 'Fase de Grupos',
  third: 'Terceros Lugares',
  knockout: 'Knockout',
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ phase: string }> },
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { phase } = await params
    const phaseKey = PHASE_MAP[phase]
    if (!phaseKey) {
      return NextResponse.json({ error: `Fase inválida: ${phase}` }, { status: 400 })
    }

    const pool = getPool()

    const [existing] = await pool.execute(
      `SELECT id, results_json, phase_status FROM official_results ORDER BY updated_at DESC LIMIT 1`,
    )
    const rows = existing as Array<{ id: string; results_json: string; phase_status: string | null }>

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No hay resultados guardados. Guarda un borrador primero.' }, { status: 400 })
    }

    const row = rows[0]

    let phaseStatus: PhaseStatus = {
      groupStage: { status: 'draft', lockedAt: null, lockedBy: null },
      bestThirdPlaced: { status: 'draft', lockedAt: null, lockedBy: null },
      knockout: { status: 'draft', lockedAt: null, lockedBy: null },
    }

    if (row.phase_status) {
      const ps = typeof row.phase_status === 'string' ? JSON.parse(row.phase_status) : row.phase_status
      phaseStatus = { ...phaseStatus, ...ps }
    }

    if (phaseStatus[phaseKey].status === 'locked') {
      return NextResponse.json({ error: `La fase ${PHASE_LABELS[phase]} ya está bloqueada.` }, { status: 400 })
    }

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    const updatedEntry: PhaseStatusEntry = {
      status: 'locked',
      lockedAt: now,
      lockedBy: user.id,
    }
    phaseStatus[phaseKey] = updatedEntry

    // Determine which phases are locked
    const lockedPhases = new Set<'groupStage' | 'bestThirdPlaced' | 'knockout'>()
    for (const [k, v] of Object.entries(phaseStatus)) {
      if (v.status === 'locked') {
        lockedPhases.add(k as keyof PhaseStatus)
      }
    }

    const officialData = typeof row.results_json === 'string'
      ? JSON.parse(row.results_json)
      : row.results_json

    const official = {
      groupStage: officialData.groupStage || {},
      bestThirdPlaced: officialData.bestThirdPlaced || [],
      knockout: officialData.knockout || {},
      champion: officialData.champion || null,
    }

    // Score all valid bets with locked phases only
    const [betRows] = await pool.execute(
      `SELECT id, prediction_json, champion_name FROM bet_submissions WHERE status = 'valid'`,
    )
    const bets = betRows as any[]

    const scoredAt = now
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

        const fullScore: ScoreResult = calculateScore(prediction, official)
        const lockedScore = filterScoreByLockedPhases(fullScore, lockedPhases)
        const tb = calculateTieBreakers(prediction, official, fullScore)

        await pool.execute(
          `UPDATE bet_submissions
           SET official_score = ?, official_score_breakdown = ?, official_scored_at = ?,
               champion_correct = ?, finalists_correct = ?, semifinalists_correct = ?,
               quarterfinalists_correct = ?, qualified_teams_correct = ?, knockout_score = ?
           WHERE id = ?`,
          [
            lockedScore.totalScore,
            JSON.stringify({ breakdown: lockedScore.breakdown, details: lockedScore.details }),
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

    // Save updated phase_status
    await pool.execute(
      `UPDATE official_results SET phase_status = ?, updated_by = ? WHERE id = ?`,
      [JSON.stringify(phaseStatus), user.id, row.id],
    )

    // Auto-generate bracket if both groupStage and bestThirdPlaced are now locked
    let bracketGenerated = false
    if (
      phaseStatus.groupStage.status === 'locked' &&
      phaseStatus.bestThirdPlaced.status === 'locked' &&
      phaseKey !== 'knockout'
    ) {
      try {
        const groupStage = officialData.groupStage || {}
        const bestThird = officialData.bestThirdPlaced || []

        // Debug: qualified teams
        const gs = groupStage as Record<string, string[]>
        const winners = Object.values(gs).filter(t => t.length >= 1).length
        const runnersUp = Object.values(gs).filter(t => t.length >= 2).length
        const bestThirdWithData = bestThird.filter((l: string) => gs[l]?.[2] != null).length
        console.log('[AdminResults] Group Stage locked:', phaseStatus.groupStage.status === 'locked')
        console.log('[AdminResults] Best Thirds selected:', bestThird)
        console.log('[AdminResults] Group winners count:', winners)
        console.log('[AdminResults] Group runners-up count:', runnersUp)
        console.log('[AdminResults] Best third teams found:', bestThirdWithData, '/ 8')

        const tournamentId = await getTournamentId()
        if (tournamentId) {
          const bracket = await generateBracketFromResults(
            tournamentId,
            groupStage,
            bestThird,
          )
          console.log('[AdminResults] Generating Round of 32 bracket...')
          for (const m of bracket) {
            if (m.stage === 'round_of_32') {
              console.log(`[AdminResults]   R32-${String(m.matchNumber).padStart(2, '0')}: ${m.home.teamName ?? '?'} vs ${m.away.teamName ?? '?'}`)
            }
          }
          console.log('[AdminResults] Total R32 matches generated:', bracket.filter(m => m.stage === 'round_of_32').length)
          await persistBracket(tournamentId, bracket, row.id)
          console.log('[AdminResults] Knockout bracket persisted successfully')
          bracketGenerated = true
        }
      } catch (err) {
        console.error('Auto-generate bracket failed:', err)
        // Non-fatal: continue even if bracket generation fails
      }
    }

    return NextResponse.json({
      success: true,
      phase: phaseKey,
      phaseLabel: PHASE_LABELS[phase],
      status: 'locked',
      lockedAt: now,
      officialSummary: { scoredBets, skippedBets, errors, calculatedAt: now },
      bracketGenerated,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('Lock phase failed:', message)
    return NextResponse.json(
      { error: 'Error al bloquear fase' },
      { status: 500 },
    )
  }
}
