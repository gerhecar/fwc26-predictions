import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { getPool } from '@/lib/db/pool'
import type { LeaderboardResponse, LeaderboardEntry } from '@/types'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const pool = getPool()

    const [rows] = await pool.execute(`
      SELECT
        b.id,
        b.user_id,
        b.bet_name,
        b.provisional_score,
        b.provisional_scored_at,
        b.official_score,
        b.official_scored_at,
        b.total_score,
        b.status,
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

    const hasProvisional = bets.some((b: any) => (b.provisional_score || 0) > 0)
    const hasOfficial = bets.some((b: any) => (b.official_score || 0) > 0)

    const entries: LeaderboardEntry[] = bets.map((b: any) => ({
      userId: b.user_id,
      displayName: b.display_name,
      betName: b.bet_name,
      provisionalScore: b.provisional_score || 0,
      provisionalScoredAt: b.provisional_scored_at || null,
      officialScore: b.official_score || 0,
      officialScoredAt: b.official_scored_at || null,
      totalScore: b.total_score || 0,
      status: b.status,
      championCorrect: !!b.champion_correct,
      finalistsCorrect: b.finalists_correct || 0,
      semifinalistsCorrect: b.semifinalists_correct || 0,
      quarterfinalistsCorrect: b.quarterfinalists_correct || 0,
      qualifiedTeamsCorrect: b.qualified_teams_correct || 0,
      knockoutScore: b.knockout_score || 0,
    }))

    const response: LeaderboardResponse = {
      entries,
      provisionalOnly: hasProvisional && !hasOfficial,
      calculatedAt: new Date().toISOString(),
    }

    return NextResponse.json(response)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('Get leaderboard failed:', message)
    return NextResponse.json({ error: 'Error al obtener puntajes' }, { status: 500 })
  }
}
