import { getPool } from '@/lib/db/pool'
import type { Group, Team } from '@/types'

export async function getTournamentGroups(tournamentId: string): Promise<(Group & { teams: Team[] })[]> {
  const pool = getPool()

  const [groupRows] = await pool.execute(
    'SELECT * FROM `groups` WHERE tournament_id = ? ORDER BY letter',
    [tournamentId],
  )
  const groups = groupRows as any[]

  const result: (Group & { teams: Team[] })[] = []

  for (const g of groups) {
    const [teamRows] = await pool.execute(
      'SELECT * FROM teams WHERE group_id = ?',
      [g.id],
    )
    result.push({
      id: g.id,
      tournament_id: g.tournament_id,
      letter: g.letter,
      name: g.name,
      teams: teamRows as Team[],
    })
  }

  return result
}

export async function getUserGroupPredictions(userId: string, tournamentId: string) {
  const pool = getPool()

  const [rows] = await pool.execute(
    'SELECT * FROM predictions WHERE user_id = ? AND tournament_id = ?',
    [userId, tournamentId],
  )

  const predictions = (rows as any[]).map((p) => ({
    ...p,
    third_place_qualified: p.third_place_qualified
      ? JSON.parse(p.third_place_qualified)
      : null,
    bracket_predictions: p.bracket_predictions
      ? JSON.parse(p.bracket_predictions)
      : null,
  }))

  return predictions
}

export async function getUserPredictions(userId: string): Promise<any[]> {
  const pool = getPool()
  const [rows] = await pool.execute(
    'SELECT * FROM predictions WHERE user_id = ?',
    [userId],
  )
  return (rows as any[]).map((p) => ({
    ...p,
    third_place_qualified: p.third_place_qualified
      ? JSON.parse(p.third_place_qualified)
      : null,
    bracket_predictions: p.bracket_predictions
      ? JSON.parse(p.bracket_predictions)
      : null,
  }))
}
