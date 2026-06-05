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

    const [rows] = await pool.execute(`
      SELECT
        b.bet_name,
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
        b.official_score DESC,
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

    const entries: UserLeaderboardEntry[] = bets.map((b: any, i: number) => ({
      position: i + 1,
      displayName: b.display_name,
      betName: b.bet_name,
      provisionalScore: b.official_score || 0,
      provisionalScoredAt: b.official_scored_at || null,
      officialScore: b.official_score || null,
      officialScoredAt: b.official_scored_at || null,
      statusLabel: b.official_score ? 'official' : 'not_calculated',
      championCorrect: !!b.champion_correct,
      finalistsCorrect: b.finalists_correct || 0,
      semifinalistsCorrect: b.semifinalists_correct || 0,
      quarterfinalistsCorrect: b.quarterfinalists_correct || 0,
      qualifiedTeamsCorrect: b.qualified_teams_correct || 0,
      knockoutScore: b.knockout_score || 0,
    }))

    const calculatedAt = entries.some(e => e.officialScoredAt)
      ? new Date().toISOString()
      : null

    const response: UserLeaderboardResponse = {
      entries,
      isDraft: false,
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
