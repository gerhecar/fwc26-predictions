import type { BracketMatchNode, BracketSlot } from '@/lib/bracket/bracket-engine'

export type BracketPicks = Record<number, string>

export function resolveBracketPicks(
  baseMatches: BracketMatchNode[],
  picks: BracketPicks,
): BracketMatchNode[] {
  const matches = baseMatches.map(m => ({ ...m, home: { ...m.home }, away: { ...m.away } }))
  const map = new Map(matches.map(m => [m.matchNumber, m]))

  function getMatchResult(matchNum: number): { winner: BracketSlot | null; loser: BracketSlot | null } {
    const match = map.get(matchNum)
    if (!match) return { winner: null, loser: null }

    const pick = picks[matchNum]
    if (pick) {
      const isHome = match.home.teamId === pick
      return {
        winner: isHome ? match.home : match.away,
        loser: isHome ? match.away : match.home,
      }
    }

    return { winner: null, loser: null }
  }

  for (const match of matches) {
    if (match.childMatchIds.length === 2) {
      const [c1, c2] = match.childMatchIds
      const r1 = getMatchResult(c1)
      const r2 = getMatchResult(c2)

      match.home = r1.winner
        ? { teamId: r1.winner.teamId, teamName: r1.winner.teamName, label: `Ganador #${c1}` }
        : { teamId: null, teamName: null, label: `Ganador #${c1}` }

      match.away = r2.winner
        ? { teamId: r2.winner.teamId, teamName: r2.winner.teamName, label: `Ganador #${c2}` }
        : { teamId: null, teamName: null, label: `Ganador #${c2}` }
    }

    if (match.matchNumber === 103) {
      const r101 = getMatchResult(101)
      const r102 = getMatchResult(102)

      match.home = r101.loser
        ? { teamId: r101.loser.teamId, teamName: r101.loser.teamName, label: 'Perdedor #101' }
        : { teamId: null, teamName: null, label: 'Perdedor #101' }

      match.away = r102.loser
        ? { teamId: r102.loser.teamId, teamName: r102.loser.teamName, label: 'Perdedor #102' }
        : { teamId: null, teamName: null, label: 'Perdedor #102' }
    }
  }

  return matches.sort((a, b) => a.matchNumber - b.matchNumber)
}

export function getChampion(picks: BracketPicks, matches: BracketMatchNode[]): string | null {
  return picks[104] || null
}

export function isRoundComplete(picks: BracketPicks, matchNumbers: number[]): boolean {
  return matchNumbers.every(m => !!picks[m])
}

export function getPickableTeamIds(match: BracketMatchNode): { id: string; label: string }[] {
  const result: { id: string; label: string }[] = []
  if (match.home.teamId) result.push({ id: match.home.teamId, label: match.home.teamName || match.home.label })
  if (match.away.teamId) result.push({ id: match.away.teamId, label: match.away.teamName || match.away.label })
  return result
}
