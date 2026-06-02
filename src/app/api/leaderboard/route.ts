import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { getPool } from '@/lib/db/pool'
import type { UserLeaderboardResponse, UserLeaderboardEntry } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const pool = getPool()

    const [orRows] = await pool.execute(
      `SELECT phase_status FROM official_results
       WHERE tournament_id = (SELECT id FROM tournaments WHERE slug = 'fifa-world-cup-2026' LIMIT 1)
       LIMIT 1`,
    )
    const officialResult = (orRows as any[])[0]
    let isDraft = true
    if (officialResult?.phase_status) {
      const ps =
        typeof officialResult.phase_status === 'string'
          ? JSON.parse(officialResult.phase_status)
          : officialResult.phase_status
      isDraft = !ps.groupStage || ps.groupStage.status === 'draft'
    }

    const [rows] = await pool.execute(`
      SELECT
        b.bet_name,
        b.provisional_score,
        b.provisional_scored_at,
        b.official_score,
        b.official_scored_at,
        b.champion_correct,
        b.finalists_correct,
        b.semifinalists_correct,
        b.quarterfinalists_correct,
        b.qualified_teams_correct,
        b.knockout_score,
        b.submitted_at,
        u.display_name
      FROM bet_submissions b
      JOIN users u ON u.id = b.user_id
      WHERE b.status = 'valid'
      ORDER BY
        b.provisional_score DESC,
        b.champion_correct DESC,
        b.finalists_correct DESC,
        b.semifinalists_correct DESC,
        b.quarterfinalists_correct DESC,
        b.qualified_teams_correct DESC,
        b.knockout_score DESC,
        b.submitted_at ASC,
        b.bet_name ASC
    `)

    const bets = rows as any[]

    if (bets.length === 0) {
      const response: UserLeaderboardResponse = {
        entries: [],
        isDraft: true,
        calculatedAt: null,
      }
      return NextResponse.json(response)
    }

    const entries: UserLeaderboardEntry[] = bets.map((b: any, i: number) => {
      const hasProvisional = (b.provisional_score || 0) > 0
      const hasOfficial = (b.official_score || 0) > 0
      let statusLabel: 'provisional' | 'official' | 'not_calculated'
      if (hasOfficial) {
        statusLabel = 'official'
      } else if (hasProvisional) {
        statusLabel = 'provisional'
      } else {
        statusLabel = 'not_calculated'
      }

      return {
        position: i + 1,
        displayName: b.display_name,
        betName: b.bet_name,
        provisionalScore: b.provisional_score || 0,
        provisionalScoredAt: b.provisional_scored_at || null,
        officialScore: b.official_score || null,
        officialScoredAt: b.official_scored_at || null,
        statusLabel,
        championCorrect: !!b.champion_correct,
        finalistsCorrect: b.finalists_correct || 0,
        semifinalistsCorrect: b.semifinalists_correct || 0,
        quarterfinalistsCorrect: b.quarterfinalists_correct || 0,
        qualifiedTeamsCorrect: b.qualified_teams_correct || 0,
        knockoutScore: b.knockout_score || 0,
      }
    })

    const hasAnyDate = entries.some(
      e => e.provisionalScoredAt || e.officialScoredAt,
    )
    const calculatedAt = hasAnyDate ? new Date().toISOString() : null

    const response: UserLeaderboardResponse = {
      entries,
      isDraft,
      calculatedAt,
    }

    return NextResponse.json(response)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('Get user leaderboard failed:', message)
    return NextResponse.json(
      { error: 'Error al obtener el leaderboard' },
      { status: 500 },
    )
  }
}
