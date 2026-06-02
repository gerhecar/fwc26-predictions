import { GROUP_LETTERS } from '@/lib/predictions/constants'
import type { ScoreBreakdown, ScoreDetail, ScoreResult, TieBreakerMetrics, GroupPrediction, BracketPick, ScoringConfig, GroupLetter } from '@/types'

interface BetPrediction {
  groupStage: Record<string, string[]>
  bestThirdPlaced: string[]
  knockout: Record<number, string>
  champion: string | null
}

interface OfficialResults {
  groupStage: Record<string, string[]>
  bestThirdPlaced: string[]
  knockout: Record<number, string>
  champion: string | null
}

const POINTS = {
  GROUP_EXACT: 10,
  GROUP_WRONG_POSITION: 5,
  BEST_THIRD: 10,
  R32: 20,
  R16: 35,
  QF: 50,
  SF: 75,
  CHAMPION: 150,
}

function getKnockoutRoundTeams(ko: Record<number, string>, matches: number[]): Set<string> {
  const teams = new Set<string>()
  for (const mn of matches) {
    if (ko[mn]) teams.add(ko[mn])
  }
  return teams
}

const R32_MATCHES = [73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88]
const R16_MATCHES = [89, 90, 91, 92, 93, 94, 95, 96]
const QF_MATCHES = [97, 98, 99, 100]
const SF_MATCHES = [101, 102]
const FINAL_MATCH = [104]

export function calculateScore(
  prediction: BetPrediction,
  official: OfficialResults,
): ScoreResult {
  const breakdown: ScoreBreakdown = {
    groupStage: 0,
    bestThirdPlaced: 0,
    roundOf32: 0,
    roundOf16: 0,
    quarterFinals: 0,
    semiFinals: 0,
    champion: 0,
  }

  const details: ScoreDetail = {
    groupStage: [],
    bestThirdPlaced: [],
    knockout: [],
  }

  // 1. Group Stage Scoring
  for (const letter of GROUP_LETTERS) {
    const predTeams = prediction.groupStage[letter] || []
    const officialTeams = official.groupStage[letter] || []

    if (predTeams.length === 0 || officialTeams.length === 0) continue

    for (let pos = 0; pos < Math.min(predTeams.length, officialTeams.length); pos++) {
      const predTeam = predTeams[pos]
      const officialTeam = officialTeams[pos]

      if (predTeam === officialTeam) {
        breakdown.groupStage += POINTS.GROUP_EXACT
        details.groupStage.push({ group: letter, team: predTeam, position: pos + 1, points: POINTS.GROUP_EXACT, exact: true })
      } else {
        // Check if the team is in the same group at a different position
        const teamInOfficialGroup = officialTeams.includes(predTeam)
        if (teamInOfficialGroup) {
          breakdown.groupStage += POINTS.GROUP_WRONG_POSITION
          details.groupStage.push({ group: letter, team: predTeam, position: pos + 1, points: POINTS.GROUP_WRONG_POSITION, exact: false })
        }
      }
    }
  }

  // 2. Best Third-Placed Scoring
  const officialThirdTeams = official.bestThirdPlaced
    .map(l => official.groupStage[l]?.[2])
    .filter(Boolean) as string[]

  const predThirdGroups = prediction.bestThirdPlaced || []

  for (const groupLetter of predThirdGroups) {
    const predThirdTeam = prediction.groupStage[groupLetter]?.[2]
    if (!predThirdTeam) continue

    if (officialThirdTeams.includes(predThirdTeam)) {
      breakdown.bestThirdPlaced += POINTS.BEST_THIRD
      details.bestThirdPlaced.push({ group: groupLetter, team: predThirdTeam, points: POINTS.BEST_THIRD })
    }
  }

  // 3. Knockout Stage Scoring (set-based)
  const officialR32Winners = getKnockoutRoundTeams(official.knockout, R32_MATCHES)
  const officialR16Winners = getKnockoutRoundTeams(official.knockout, R16_MATCHES)
  const officialQFWinners = getKnockoutRoundTeams(official.knockout, QF_MATCHES)
  const officialSFWinners = getKnockoutRoundTeams(official.knockout, SF_MATCHES)
  const officialChampion = official.knockout[104] || official.champion || null

  const predR32Winners = getKnockoutRoundTeams(prediction.knockout, R32_MATCHES)
  const predR16Winners = getKnockoutRoundTeams(prediction.knockout, R16_MATCHES)
  const predQFWinners = getKnockoutRoundTeams(prediction.knockout, QF_MATCHES)
  const predSFWinners = getKnockoutRoundTeams(prediction.knockout, SF_MATCHES)
  const predChampion = prediction.knockout[104] || prediction.champion || null

  // R32 → R16: teams that advanced
  for (const team of predR32Winners) {
    if (officialR32Winners.has(team)) {
      breakdown.roundOf32 += POINTS.R32
      details.knockout.push({ round: 'roundOf32', matchNumber: 0, team, points: POINTS.R32 })
    }
  }

  // R16 → QF
  for (const team of predR16Winners) {
    if (officialR16Winners.has(team)) {
      breakdown.roundOf16 += POINTS.R16
      details.knockout.push({ round: 'roundOf16', matchNumber: 0, team, points: POINTS.R16 })
    }
  }

  // QF → SF
  for (const team of predQFWinners) {
    if (officialQFWinners.has(team)) {
      breakdown.quarterFinals += POINTS.QF
      details.knockout.push({ round: 'quarterFinals', matchNumber: 0, team, points: POINTS.QF })
    }
  }

  // SF → Final
  for (const team of predSFWinners) {
    if (officialSFWinners.has(team)) {
      breakdown.semiFinals += POINTS.SF
      details.knockout.push({ round: 'semiFinals', matchNumber: 0, team, points: POINTS.SF })
    }
  }

  // Champion
  if (predChampion && officialChampion && predChampion === officialChampion) {
    breakdown.champion += POINTS.CHAMPION
    details.knockout.push({ round: 'champion', matchNumber: 104, team: predChampion, points: POINTS.CHAMPION })
  }

  const totalScore = breakdown.groupStage + breakdown.bestThirdPlaced +
    breakdown.roundOf32 + breakdown.roundOf16 + breakdown.quarterFinals +
    breakdown.semiFinals + breakdown.champion

  return { totalScore, breakdown, details }
}

export function calculateTieBreakers(
  prediction: BetPrediction,
  official: OfficialResults,
  scoreResult: ScoreResult,
): TieBreakerMetrics {
  const championCorrect = !!(
    (prediction.knockout[104] && official.knockout[104] && prediction.knockout[104] === official.knockout[104]) ||
    (!prediction.knockout[104] && prediction.champion && official.champion && prediction.champion === official.champion)
  )

  const sfMatchNums = [101, 102]
  const actualFinalists = new Set(sfMatchNums.map(m => official.knockout[m]).filter(Boolean))
  const predFinalists = new Set(sfMatchNums.map(m => prediction.knockout[m]).filter(Boolean))
  let finalistsCorrect = 0
  for (const t of predFinalists) { if (actualFinalists.has(t)) finalistsCorrect++ }

  const qfMatchNums = [97, 98, 99, 100]
  const actualSF = new Set(qfMatchNums.map(m => official.knockout[m]).filter(Boolean))
  const predSF = new Set(qfMatchNums.map(m => prediction.knockout[m]).filter(Boolean))
  let semifinalistsCorrect = 0
  for (const t of predSF) { if (actualSF.has(t)) semifinalistsCorrect++ }

  const r16MatchNums = [89, 90, 91, 92, 93, 94, 95, 96]
  const actualQF = new Set(r16MatchNums.map(m => official.knockout[m]).filter(Boolean))
  const predQF = new Set(r16MatchNums.map(m => prediction.knockout[m]).filter(Boolean))
  let quarterfinalistsCorrect = 0
  for (const t of predQF) { if (actualQF.has(t)) quarterfinalistsCorrect++ }

  const actualQualified = new Set<string>()
  for (const letter of GROUP_LETTERS) {
    const teams = official.groupStage[letter] || []
    if (teams[0]) actualQualified.add(teams[0])
    if (teams[1]) actualQualified.add(teams[1])
  }
  for (const letter of official.bestThirdPlaced) {
    const teams = official.groupStage[letter] || []
    if (teams[2]) actualQualified.add(teams[2])
  }

  const predQualified = new Set<string>()
  for (const letter of GROUP_LETTERS) {
    const teams = prediction.groupStage[letter] || []
    if (teams[0]) predQualified.add(teams[0])
    if (teams[1]) predQualified.add(teams[1])
  }
  for (const letter of prediction.bestThirdPlaced) {
    const teams = prediction.groupStage[letter] || []
    if (teams[2]) predQualified.add(teams[2])
  }

  let qualifiedTeamsCorrect = 0
  for (const t of predQualified) { if (actualQualified.has(t)) qualifiedTeamsCorrect++ }

  const knockoutScore =
    scoreResult.breakdown.roundOf32 +
    scoreResult.breakdown.roundOf16 +
    scoreResult.breakdown.quarterFinals +
    scoreResult.breakdown.semiFinals +
    scoreResult.breakdown.champion

  return {
    championCorrect,
    finalistsCorrect,
    semifinalistsCorrect,
    quarterfinalistsCorrect,
    qualifiedTeamsCorrect,
    knockoutScore,
  }
}

export function filterScoreByLockedPhases(
  score: ScoreResult,
  lockedPhases: Set<'groupStage' | 'bestThirdPlaced' | 'knockout'>,
): ScoreResult {
  const b = { ...score.breakdown }
  const d = { ...score.details, groupStage: [...score.details.groupStage], bestThirdPlaced: [...score.details.bestThirdPlaced], knockout: [...score.details.knockout] }

  if (!lockedPhases.has('groupStage')) {
    b.groupStage = 0
    d.groupStage = []
  }
  if (!lockedPhases.has('bestThirdPlaced')) {
    b.bestThirdPlaced = 0
    d.bestThirdPlaced = []
  }
  if (!lockedPhases.has('knockout')) {
    b.roundOf32 = 0
    b.roundOf16 = 0
    b.quarterFinals = 0
    b.semiFinals = 0
    b.champion = 0
    d.knockout = []
  }

  const totalScore = b.groupStage + b.bestThirdPlaced + b.roundOf32 + b.roundOf16 + b.quarterFinals + b.semiFinals + b.champion
  return { totalScore, breakdown: b, details: d }
}

// Old scoring engine — kept for backward compatibility with standings recalculation
const DEFAULT_SCORING: ScoringConfig = {
  group_correct_1st: 4,
  group_correct_2nd: 2,
  group_correct_3rd: 1,
  third_place_correct: 2,
  knockout_correct: 3,
  champion_correct: 10,
}

function calculateUserScore(
  predictions: GroupPrediction[],
  bracketPicks: BracketPick,
  actualResults: {
    groupStandings: Array<{ team_id: string; group_id: string; position: 1 | 2 | 3 | 4 }>
    matchResults: Array<{ match_number: number; winner_id: string }>
    thirdPlaceQualifiers: GroupLetter[]
    championId: string | null
  },
  scoring: ScoringConfig = DEFAULT_SCORING,
): number {
  let total = 0
  const groupResultMap = new Map<string, { pos: 1 | 2 | 3 | 4; teamId: string }>()
  for (const r of actualResults.groupStandings) {
    groupResultMap.set(r.group_id + '_' + r.position, { pos: r.position, teamId: r.team_id })
  }
  for (const pred of predictions) {
    const firstActual = groupResultMap.get(pred.group_id + '_' + '1')
    if (firstActual && firstActual.teamId === pred.first_place_team_id) total += scoring.group_correct_1st
    const secondActual = groupResultMap.get(pred.group_id + '_' + '2')
    if (secondActual && secondActual.teamId === pred.second_place_team_id) total += scoring.group_correct_2nd
    const thirdActual = groupResultMap.get(pred.group_id + '_' + '3')
    if (thirdActual && thirdActual.teamId === pred.third_place_team_id) total += scoring.group_correct_3rd
  }
  if (predictions.length > 0) {
    const userThirdPlaceGroups: GroupLetter[] = predictions[0]?.third_place_qualified as GroupLetter[] || []
    for (const group of userThirdPlaceGroups) {
      if (actualResults.thirdPlaceQualifiers.includes(group)) total += scoring.third_place_correct
    }
  }
  const resultWinnerMap = new Map<number, string>()
  for (const mr of actualResults.matchResults) resultWinnerMap.set(mr.match_number, mr.winner_id)
  for (const [matchNumStr, pickedTeamId] of Object.entries(bracketPicks)) {
    const matchNum = Number(matchNumStr)
    const actualWinner = resultWinnerMap.get(matchNum)
    if (actualWinner && actualWinner === pickedTeamId) total += scoring.knockout_correct
  }
  if (actualResults.championId && bracketPicks[104] === actualResults.championId) total += scoring.champion_correct
  return total
}

export function calculateAllScores(
  allPredictions: GroupPrediction[],
  allBracketPicks: Map<string, BracketPick>,
  actualResults: {
    groupStandings: Array<{ team_id: string; group_id: string; position: 1 | 2 | 3 | 4 }>
    matchResults: Array<{ match_number: number; winner_id: string }>
    thirdPlaceQualifiers: GroupLetter[]
    championId: string | null
  },
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
