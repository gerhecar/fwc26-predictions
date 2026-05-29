'use server'

import { getCurrentUser } from '@/lib/auth/auth'
import { getPool } from '@/lib/db/pool'
import type { BracketPicks } from '@/lib/bracket/bracket-picks'

export async function saveBracketPicks(
  tournamentId: string,
  picks: BracketPicks,
  championId: string | null,
) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const pool = getPool()
  await pool.execute(
    `UPDATE predictions
     SET bracket_predictions = ?, champion_id = ?
     WHERE user_id = ? AND tournament_id = ?`,
    [JSON.stringify(picks), championId, user.id, tournamentId],
  )

  return { success: true }
}

export async function submitPredictions(tournamentId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const pool = getPool()
  await pool.execute(
    `UPDATE predictions
     SET status = 'submitted'
     WHERE user_id = ? AND tournament_id = ?`,
    [user.id, tournamentId],
  )

  return { success: true }
}
