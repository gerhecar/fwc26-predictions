'use server'

import { getPool } from '@/lib/db/pool'
import { calculateAllScores } from '@/lib/scoring/engine'
import crypto from 'crypto'
import type { BracketPick, GroupLetter, ScoringConfig } from '@/types'

export async function updateTournamentStatus(tournamentId: string, status: string) {
  const pool = getPool()

  await pool.execute(
    'UPDATE tournaments SET status = ? WHERE id = ?',
    [status, tournamentId],
  )

  return { success: true }
}

export async function saveMatchResult(matchNumber: number, winnerId: string, tournamentId: string) {
  const pool = getPool()

  const [existingRows] = await pool.execute(
    'SELECT id FROM matches WHERE tournament_id = ? AND match_number = ?',
    [tournamentId, matchNumber],
  )
  const existing = existingRows as any[]

  if (existing.length > 0) {
    await pool.execute(
      'UPDATE matches SET winner_id = ? WHERE id = ?',
      [winnerId, existing[0].id],
    )
  } else {
    await pool.execute(
      `INSERT INTO matches (id, tournament_id, match_number, winner_id, stage)
       VALUES (?, ?, ?, ?, ?)`,
      [crypto.randomUUID(), tournamentId, matchNumber, winnerId, getStageForMatch(matchNumber)],
    )
  }

  return { success: true }
}

function getStageForMatch(matchNumber: number): string {
  if (matchNumber >= 73 && matchNumber <= 88) return 'round_of_32'
  if (matchNumber >= 89 && matchNumber <= 96) return 'round_of_16'
  if (matchNumber >= 97 && matchNumber <= 100) return 'quarter_final'
  if (matchNumber === 101 || matchNumber === 102) return 'semi_final'
  if (matchNumber === 103) return 'third_place'
  if (matchNumber === 104) return 'final'
  return 'round_of_32'
}

export async function recalculateStandings(tournamentId: string) {
  const pool = getPool()

  const [tournamentRows] = await pool.execute(
    'SELECT scoring_config FROM tournaments WHERE id = ?',
    [tournamentId],
  )
  const tournament = (tournamentRows as any[])[0]
  const scoring: ScoringConfig = tournament?.scoring_config
    ? JSON.parse(tournament.scoring_config)
    : {
        group_correct_1st: 4,
        group_correct_2nd: 2,
        group_correct_3rd: 1,
        third_place_correct: 2,
        knockout_correct: 3,
        champion_correct: 10,
      }

  const [predictionRows] = await pool.execute(
    'SELECT * FROM predictions WHERE tournament_id = ?',
    [tournamentId],
  )
  const predictions = (predictionRows as any[]).map((p) => ({
    ...p,
    third_place_qualified: p.third_place_qualified
      ? JSON.parse(p.third_place_qualified)
      : null,
    bracket_predictions: p.bracket_predictions
      ? JSON.parse(p.bracket_predictions)
      : null,
  }))

  if (!predictions || predictions.length === 0) {
    return { success: true, updated: 0 }
  }

  const [matchRows] = await pool.execute(
    'SELECT * FROM matches WHERE tournament_id = ?',
    [tournamentId],
  )
  const matches = matchRows as any[]

  const [groupRows] = await pool.execute(
    'SELECT * FROM `groups` WHERE tournament_id = ?',
    [tournamentId],
  )
  const groups = groupRows as any[]

  const matchResults = (matches || [])
    .filter((m: any) => m.winner_id)
    .map((m: any) => ({ match_number: m.match_number, winner_id: m.winner_id }))

  const championMatch = matches?.find((m: any) => m.match_number === 104)
  const championId = championMatch?.winner_id || null

  const userPicksMap = new Map<string, BracketPick>()
  for (const pred of predictions) {
    if (!userPicksMap.has(pred.user_id) && pred.bracket_predictions) {
      userPicksMap.set(pred.user_id, pred.bracket_predictions as BracketPick)
    }
  }

  const actualResults = {
    groupStandings: [],
    matchResults,
    thirdPlaceQualifiers: [] as GroupLetter[],
    championId,
  }

  const scores = calculateAllScores(predictions, userPicksMap, actualResults, scoring)

  const [existingStandingsRows] = await pool.execute(
    'SELECT id, user_id FROM standings WHERE tournament_id = ?',
    [tournamentId],
  )
  const existingStandings = existingStandingsRows as any[]

  const existingMap = new Map<string, string>()
  for (const s of existingStandings || []) {
    existingMap.set(s.user_id, s.id)
  }

  const rankedUsers = [...scores.entries()]
    .sort(([, a], [, b]) => b - a)
    .map(([userId, score], i) => ({
      user_id: userId,
      tournament_id: tournamentId,
      total_points: score,
      rank: i + 1,
    }))

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')

  for (const entry of rankedUsers) {
    const existingId = existingMap.get(entry.user_id)
    if (existingId) {
      await pool.execute(
        'UPDATE standings SET total_points = ?, `rank` = ?, calculated_at = ? WHERE id = ?',
        [entry.total_points, entry.rank, now, existingId],
      )
    } else {
      await pool.execute(
        'INSERT INTO standings (id, user_id, tournament_id, total_points, `rank`, calculated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [crypto.randomUUID(), entry.user_id, entry.tournament_id, entry.total_points, entry.rank, now],
      )
    }
  }

  return { success: true, updated: rankedUsers.length }
}
