import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { getPool } from '@/lib/db/pool'
import { getTournamentId } from '@/lib/bracket/generate-bracket'

export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const pool = getPool()
    const tournamentId = await getTournamentId()

    // 1. Delete generated bracket matches
    if (tournamentId) {
      await pool.execute(
        `DELETE FROM matches WHERE tournament_id = ?`,
        [tournamentId],
      )
    }

    // 2. Reset or delete official_results row
    const [existing] = await pool.execute(
      `SELECT id FROM official_results ORDER BY updated_at DESC LIMIT 1`,
    )
    const rows = existing as Array<{ id: string }>
    if (rows.length > 0) {
      await pool.execute(
        `UPDATE official_results
         SET results_json = '{}', phase_status = NULL, status = 'draft', updated_by = ?
         WHERE id = ?`,
        [user.id, rows[0].id],
      )
    }

    // 3. Clear provisional and official score columns on bet_submissions
    await pool.execute(
      `UPDATE bet_submissions
       SET provisional_score = 0,
           provisional_score_breakdown = NULL,
           provisional_scored_at = NULL,
           official_score = 0,
           official_score_breakdown = NULL,
           official_scored_at = NULL,
           champion_correct = FALSE,
           finalists_correct = 0,
           semifinalists_correct = 0,
           quarterfinalists_correct = 0,
           qualified_teams_correct = 0,
           knockout_score = 0
       WHERE status IN ('submitted', 'valid')`,
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('Reset official results failed:', message)
    return NextResponse.json(
      { error: 'Error al restablecer resultados' },
      { status: 500 },
    )
  }
}
