'use server'

import { getCurrentUser } from '@/lib/auth/auth'
import { getPool } from '@/lib/db/pool'
import crypto from 'crypto'

export async function loadGroupsWithTeams() {
  const pool = getPool()
  const [groupRows] = await pool.execute(
    'SELECT * FROM `groups` ORDER BY letter',
  )
  const groups = groupRows as any[]

  const result = []
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
      teams: teamRows as any[],
    })
  }

  return result
}

export async function loadUserPredictions() {
  const user = await getCurrentUser()
  if (!user) return []

  const pool = getPool()
  const [rows] = await pool.execute(
    'SELECT * FROM predictions WHERE user_id = ?',
    [user.id],
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

export async function saveGroupPrediction(
  groupId: string,
  tournamentId: string,
  teamIds: string[],
  predictionId?: string,
) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const pool = getPool()

  const payload = {
    user_id: user.id,
    tournament_id: tournamentId,
    group_id: groupId,
    first_place_team_id: teamIds[0],
    second_place_team_id: teamIds[1],
    third_place_team_id: teamIds[2],
    fourth_place_team_id: teamIds[3],
  }

  if (predictionId) {
    await pool.execute(
      `UPDATE predictions
       SET first_place_team_id = ?, second_place_team_id = ?,
           third_place_team_id = ?, fourth_place_team_id = ?
       WHERE id = ?`,
      [payload.first_place_team_id, payload.second_place_team_id,
       payload.third_place_team_id, payload.fourth_place_team_id,
       predictionId],
    )
  } else {
    await pool.execute(
      `INSERT INTO predictions (id, user_id, tournament_id, group_id,
        first_place_team_id, second_place_team_id,
        third_place_team_id, fourth_place_team_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [crypto.randomUUID(), payload.user_id, payload.tournament_id, payload.group_id,
       payload.first_place_team_id, payload.second_place_team_id,
       payload.third_place_team_id, payload.fourth_place_team_id],
    )
  }

  return { success: true }
}

export async function saveThirdPlacePicks(selected: string[]) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const pool = getPool()
  const [rows] = await pool.execute(
    'SELECT id FROM predictions WHERE user_id = ?',
    [user.id],
  )
  const predictions = rows as any[]

  if (predictions.length > 0) {
    const ids = predictions.map((p: any) => p.id)
    const placeholders = ids.map(() => '?').join(',')
    await pool.execute(
      `UPDATE predictions SET third_place_qualified = ?
       WHERE id IN (${placeholders})`,
      [JSON.stringify(selected), ...ids],
    )
  }

  return { success: true }
}
