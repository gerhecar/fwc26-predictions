'use server'

import { createClient } from '@/lib/supabase/server'
import { calculateAllScores } from '@/lib/scoring/engine'
import type { BracketPick, GroupLetter, ScoringConfig } from '@/types'

export async function updateTournamentStatus(tournamentId: string, status: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tournaments')
    .update({ status })
    .eq('id', tournamentId)

  if (error) throw new Error(error.message)
  return { success: true }
}

export async function getAdminStats() {
  const supabase = await createClient()

  const { count: userCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  const { count: predictionCount } = await supabase
    .from('predictions')
    .select('*', { count: 'exact', head: true })

  const { count: submittedCount } = await supabase
    .from('predictions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'submitted')

  const { count: groupCount } = await supabase
    .from('user_groups')
    .select('*', { count: 'exact', head: true })

  return {
    userCount: userCount || 0,
    predictionCount: predictionCount || 0,
    submittedCount: submittedCount || 0,
    groupCount: groupCount || 0,
  }
}

export async function saveMatchResult(matchNumber: number, winnerId: string, tournamentId: string) {
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('matches')
    .select('id')
    .eq('tournament_id', tournamentId)
    .eq('match_number', matchNumber)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('matches')
      .update({ winner_id: winnerId })
      .eq('id', existing.id)

    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('matches')
      .insert({
        tournament_id: tournamentId,
        match_number: matchNumber,
        winner_id: winnerId,
        stage: getStageForMatch(matchNumber),
      })

    if (error) throw new Error(error.message)
  }

  return { success: true }
}

export async function saveGroupResult(
  groupId: string,
  tournamentId: string,
  positions: { first: string; second: string; third: string; fourth: string },
) {
  const supabase = await createClient()
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
  const supabase = await createClient()

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('scoring_config')
    .eq('id', tournamentId)
    .single()

  const scoring: ScoringConfig = tournament?.scoring_config as ScoringConfig || {
    group_correct_1st: 4,
    group_correct_2nd: 2,
    group_correct_3rd: 1,
    third_place_correct: 2,
    knockout_correct: 3,
    champion_correct: 10,
  }

  const { data: predictions } = await supabase
    .from('predictions')
    .select('*')
    .eq('tournament_id', tournamentId)

  if (!predictions || predictions.length === 0) {
    return { success: true, updated: 0 }
  }

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .eq('tournament_id', tournamentId)

  const { data: groups } = await supabase
    .from('groups')
    .select('*, teams(*)')
    .eq('tournament_id', tournamentId)

  const matchResults = (matches || [])
    .filter(m => m.winner_id)
    .map(m => ({ match_number: m.match_number, winner_id: m.winner_id }))

  const championMatch = matches?.find(m => m.match_number === 104)
  const championId = championMatch?.winner_id || null

  const thirdPlaceFromMatches = new Set<string>()
  for (const pred of predictions) {
    if (pred.third_place_qualified) {
      for (const g of pred.third_place_qualified as string[]) {
        thirdPlaceFromMatches.add(g)
      }
    }
  }

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

  const { data: existingStandings } = await supabase
    .from('standings')
    .select('id, user_id')
    .eq('tournament_id', tournamentId)

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

  const now = new Date().toISOString()

  for (const entry of rankedUsers) {
    const existingId = existingMap.get(entry.user_id)
    if (existingId) {
      await supabase
        .from('standings')
        .update({
          total_points: entry.total_points,
          rank: entry.rank,
          calculated_at: now,
        })
        .eq('id', existingId)
    } else {
      await supabase
        .from('standings')
        .insert({
          user_id: entry.user_id,
          tournament_id: entry.tournament_id,
          total_points: entry.total_points,
          rank: entry.rank,
          calculated_at: now,
        })
    }
  }

  return { success: true, updated: rankedUsers.length }
}
