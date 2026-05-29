import type { GroupPrediction, ScoringConfig, BracketPick, GroupLetter } from '@/types'

interface TeamResult {
  team_id: string
  group_id: string
  position: 1 | 2 | 3 | 4
}

interface MatchResult {
  match_number: number
  winner_id: string
}

interface ActualResults {
  groupStandings: TeamResult[]
  matchResults: MatchResult[]
  thirdPlaceQualifiers: GroupLetter[]
  championId: string | null
}

const DEFAULT_SCORING: ScoringConfig = {
  group_correct_1st: 4,
  group_correct_2nd: 2,
  group_correct_3rd: 1,
  third_place_correct: 2,
  knockout_correct: 3,
  champion_correct: 10,
}

export function calculateUserScore(
  predictions: GroupPrediction[],
  bracketPicks: BracketPick,
  actualResults: ActualResults,
  scoring: ScoringConfig = DEFAULT_SCORING,
): number {
  let total = 0

  const groupResultMap = new Map<string, { pos: 1 | 2 | 3 | 4; teamId: string }>()
  for (const r of actualResults.groupStandings) {
    groupResultMap.set(r.group_id + '_' + r.position, { pos: r.position, teamId: r.team_id })
  }

  for (const pred of predictions) {
    const firstActual = groupResultMap.get(pred.group_id + '_' + '1')
    if (firstActual && firstActual.teamId === pred.first_place_team_id) {
      total += scoring.group_correct_1st
    }

    const secondActual = groupResultMap.get(pred.group_id + '_' + '2')
    if (secondActual && secondActual.teamId === pred.second_place_team_id) {
      total += scoring.group_correct_2nd
    }

    const thirdActual = groupResultMap.get(pred.group_id + '_' + '3')
    if (thirdActual && thirdActual.teamId === pred.third_place_team_id) {
      total += scoring.group_correct_3rd
    }
  }

  if (predictions.length > 0) {
    const userThirdPlaceGroups: GroupLetter[] = predictions[0]?.third_place_qualified as GroupLetter[] || []
    for (const group of userThirdPlaceGroups) {
      if (actualResults.thirdPlaceQualifiers.includes(group)) {
        total += scoring.third_place_correct
      }
    }
  }

  const resultWinnerMap = new Map<number, string>()
  for (const mr of actualResults.matchResults) {
    resultWinnerMap.set(mr.match_number, mr.winner_id)
  }

  for (const [matchNumStr, pickedTeamId] of Object.entries(bracketPicks)) {
    const matchNum = Number(matchNumStr)
    const actualWinner = resultWinnerMap.get(matchNum)
    if (actualWinner && actualWinner === pickedTeamId) {
      total += scoring.knockout_correct
    }
  }

  if (actualResults.championId && bracketPicks[104] === actualResults.championId) {
    total += scoring.champion_correct
  }

  return total
}

export function calculateAllScores(
  allPredictions: GroupPrediction[],
  allBracketPicks: Map<string, BracketPick>,
  actualResults: ActualResults,
  scoring: ScoringConfig = DEFAULT_SCORING,
): Map<string, number> {
  const scores = new Map<string, number>()

  const userPredictionsMap = new Map<string, GroupPrediction[]>()
  for (const pred of allPredictions) {
    const existing = userPredictionsMap.get(pred.user_id) || []
    existing.push(pred)
    userPredictionsMap.set(pred.user_id, existing)
  }

  for (const [userId, predictions] of userPredictionsMap) {
    const picks = allBracketPicks.get(userId) || {}
    const score = calculateUserScore(predictions, picks, actualResults, scoring)
    scores.set(userId, score)
  }

  return scores
}
