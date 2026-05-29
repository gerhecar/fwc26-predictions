import type { Team, GroupLetter } from '@/types'
import { lookupAnnexC } from '@/lib/groups/annex-c'
import type { GroupPrediction } from '@/types'

export interface BracketSlot {
  teamId: string | null
  teamName: string | null
  label: string
}

export interface BracketMatchNode {
  matchNumber: number
  stage: 'round_of_32' | 'round_of_16' | 'quarter_final' | 'semi_final' | 'third_place' | 'final'
  home: BracketSlot
  away: BracketSlot
  childMatchIds: number[]
}

const R32_FIXED: Record<number, { homeLabel: string; awayLabel: string; homeGroup?: { pos: 'winner' | 'runner_up'; letter: string }; awayGroup?: { pos: 'winner' | 'runner_up'; letter: string } }> = {
  73: { homeLabel: '2° Grupo A', awayLabel: '2° Grupo B', homeGroup: { pos: 'runner_up', letter: 'A' }, awayGroup: { pos: 'runner_up', letter: 'B' } },
  75: { homeLabel: '1° Grupo F', awayLabel: '2° Grupo C', homeGroup: { pos: 'winner', letter: 'F' }, awayGroup: { pos: 'runner_up', letter: 'C' } },
  76: { homeLabel: '1° Grupo C', awayLabel: '2° Grupo F', homeGroup: { pos: 'winner', letter: 'C' }, awayGroup: { pos: 'runner_up', letter: 'F' } },
  78: { homeLabel: '2° Grupo E', awayLabel: '2° Grupo I', homeGroup: { pos: 'runner_up', letter: 'E' }, awayGroup: { pos: 'runner_up', letter: 'I' } },
  83: { homeLabel: '2° Grupo K', awayLabel: '2° Grupo L', homeGroup: { pos: 'runner_up', letter: 'K' }, awayGroup: { pos: 'runner_up', letter: 'L' } },
  84: { homeLabel: '1° Grupo H', awayLabel: '2° Grupo J', homeGroup: { pos: 'winner', letter: 'H' }, awayGroup: { pos: 'runner_up', letter: 'J' } },
  86: { homeLabel: '1° Grupo J', awayLabel: '2° Grupo H', homeGroup: { pos: 'winner', letter: 'J' }, awayGroup: { pos: 'runner_up', letter: 'H' } },
  88: { homeLabel: '2° Grupo D', awayLabel: '2° Grupo G', homeGroup: { pos: 'runner_up', letter: 'D' }, awayGroup: { pos: 'runner_up', letter: 'G' } },
}

const R32_THIRD = [
  { matchNumber: 74, homeLabel: '1° Grupo E', homeGroup: { pos: 'winner' as const, letter: 'E' } },
  { matchNumber: 77, homeLabel: '1° Grupo I', homeGroup: { pos: 'winner' as const, letter: 'I' } },
  { matchNumber: 79, homeLabel: '1° Grupo A', homeGroup: { pos: 'winner' as const, letter: 'A' } },
  { matchNumber: 80, homeLabel: '1° Grupo L', homeGroup: { pos: 'winner' as const, letter: 'L' } },
  { matchNumber: 81, homeLabel: '1° Grupo D', homeGroup: { pos: 'winner' as const, letter: 'D' } },
  { matchNumber: 82, homeLabel: '1° Grupo G', homeGroup: { pos: 'winner' as const, letter: 'G' } },
  { matchNumber: 85, homeLabel: '1° Grupo B', homeGroup: { pos: 'winner' as const, letter: 'B' } },
  { matchNumber: 87, homeLabel: '1° Grupo K', homeGroup: { pos: 'winner' as const, letter: 'K' } },
]

interface GroupResult {
  letter: string
  first: Team | null
  second: Team | null
  third: Team | null
  fourth: Team | null
}

export function buildBracket(
  groupResults: GroupResult[],
  advancingThirdPlaceGroups: GroupLetter[],
): BracketMatchNode[] {
  const matches: BracketMatchNode[] = []

  const thirdAssignments = lookupAnnexC(advancingThirdPlaceGroups)

  const groupMap = new Map<string, GroupResult>()
  for (const gr of groupResults) {
    groupMap.set(gr.letter, gr)
  }

  function getTeam(pos: 'winner' | 'runner_up', letter: string): BracketSlot {
    const group = groupMap.get(letter)
    if (!group) return { teamId: null, teamName: null, label: `${pos === 'winner' ? '1°' : '2°'} Grupo ${letter}` }
    const team = pos === 'winner' ? group.first : group.second
    return {
      teamId: team?.id || null,
      teamName: team?.name || null,
      label: `${pos === 'winner' ? '1°' : '2°'} Grupo ${letter}`,
    }
  }

  function getThirdTeam(letter: string): BracketSlot {
    const group = groupMap.get(letter)
    if (!group) return { teamId: null, teamName: null, label: `3° Grupo ${letter}` }
    return {
      teamId: group.third?.id || null,
      teamName: group.third?.name || null,
      label: `3° Grupo ${letter}`,
    }
  }

  for (const [matchNum, info] of Object.entries(R32_FIXED)) {
    matches.push({
      matchNumber: Number(matchNum),
      stage: 'round_of_32',
      home: getTeam(info.homeGroup!.pos, info.homeGroup!.letter),
      away: getTeam(info.awayGroup!.pos, info.awayGroup!.letter),
      childMatchIds: [],
    })
  }

  for (const info of R32_THIRD) {
    const thirdGroup = thirdAssignments?.[info.matchNumber]
    matches.push({
      matchNumber: info.matchNumber,
      stage: 'round_of_32',
      home: getTeam(info.homeGroup.pos, info.homeGroup.letter),
      away: thirdGroup ? getThirdTeam(thirdGroup) : { teamId: null, teamName: null, label: '3° lugar por definir' },
      childMatchIds: [],
    })
  }

  const r16: [number, number, number][] = [
    [90, 73, 75],
    [89, 74, 77],
    [91, 76, 78],
    [92, 79, 80],
    [93, 83, 84],
    [94, 81, 82],
    [95, 86, 88],
    [96, 85, 87],
  ]

  for (const [matchNum, child1, child2] of r16) {
    matches.push({
      matchNumber: matchNum,
      stage: 'round_of_16',
      home: { teamId: null, teamName: null, label: `Ganador #${child1}` },
      away: { teamId: null, teamName: null, label: `Ganador #${child2}` },
      childMatchIds: [child1, child2],
    })
  }

  const qf: [number, number, number][] = [
    [97, 89, 90],
    [98, 93, 94],
    [99, 91, 92],
    [100, 95, 96],
  ]

  for (const [matchNum, child1, child2] of qf) {
    matches.push({
      matchNumber: matchNum,
      stage: 'quarter_final',
      home: { teamId: null, teamName: null, label: `Ganador #${child1}` },
      away: { teamId: null, teamName: null, label: `Ganador #${child2}` },
      childMatchIds: [child1, child2],
    })
  }

  const sf: [number, number, number][] = [
    [101, 97, 98],
    [102, 99, 100],
  ]

  for (const [matchNum, child1, child2] of sf) {
    matches.push({
      matchNumber: matchNum,
      stage: 'semi_final',
      home: { teamId: null, teamName: null, label: `Ganador #${child1}` },
      away: { teamId: null, teamName: null, label: `Ganador #${child2}` },
      childMatchIds: [child1, child2],
    })
  }

  matches.push({
    matchNumber: 103,
    stage: 'third_place',
    home: { teamId: null, teamName: null, label: 'Perdedor #101' },
    away: { teamId: null, teamName: null, label: 'Perdedor #102' },
    childMatchIds: [101, 102],
  })

  matches.push({
    matchNumber: 104,
    stage: 'final',
    home: { teamId: null, teamName: null, label: 'Ganador #101' },
    away: { teamId: null, teamName: null, label: 'Ganador #102' },
    childMatchIds: [101, 102],
  })

  return matches.sort((a, b) => a.matchNumber - b.matchNumber)
}
