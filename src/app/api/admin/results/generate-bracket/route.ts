import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { getPool } from '@/lib/db/pool'
import {
  generateBracketFromResults,
  persistBracket,
  getTournamentId,
} from '@/lib/bracket/generate-bracket'
import type { PhaseStatus } from '@/types'

export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
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

    // Both group stage and best thirds must be locked
    if (phaseStatus.groupStage.status !== 'locked') {
      return NextResponse.json({ error: 'La fase de grupos debe estar bloqueada primero.' }, { status: 400 })
    }
    if (phaseStatus.bestThirdPlaced.status !== 'locked') {
      return NextResponse.json({ error: 'Los terceros lugares deben estar bloqueados primero.' }, { status: 400 })
    }

    const officialData = typeof row.results_json === 'string'
      ? JSON.parse(row.results_json)
      : row.results_json

    const tournamentId = await getTournamentId()
    if (!tournamentId) {
      return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 })
    }

    const bracket = await generateBracketFromResults(
      tournamentId,
      officialData.groupStage || {},
      officialData.bestThirdPlaced || [],
    )

    await persistBracket(tournamentId, bracket, row.id)

    // Pre-populate knockout data for R32 (home team names)
    const knockout: Record<number, string> = {}
    for (const match of bracket) {
      if (match.stage === 'round_of_32') {
        // No winners yet — just store the structure
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Bracket generated successfully',
      matches: bracket.map((m) => ({
        matchNumber: m.matchNumber,
        stage: m.stage,
        home: m.home.teamName,
        away: m.away.teamName,
        homeId: m.home.teamId,
        awayId: m.away.teamId,
      })),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('Generate bracket failed:', message)
    return NextResponse.json(
      { error: 'Error al generar el bracket' },
      { status: 500 },
    )
  }
}
