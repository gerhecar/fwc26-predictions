'use client'

import { useMemo } from 'react'
import type { Team, GroupLetter, GroupPrediction } from '@/types'
import type { Group } from '@/types'
import { buildBracket } from '@/lib/bracket/bracket-engine'
import type { BracketMatchNode } from '@/lib/bracket/bracket-engine'

interface Props {
  groups: (Group & { teams: Team[] })[]
  predictions: GroupPrediction[]
  thirdPlaceGroups: GroupLetter[]
}

function getGroupResult(groups: (Group & { teams: Team[] })[], predictions: GroupPrediction[]) {
  const predMap = new Map<string, GroupPrediction>()
  for (const p of predictions) {
    predMap.set(p.group_id, p)
  }

  return groups.map((g) => {
    const pred = predMap.get(g.id)
    const teamMap = new Map<string, Team>()
    for (const t of g.teams) {
      teamMap.set(t.id, t)
    }

    return {
      letter: g.letter,
      first: pred ? (teamMap.get(pred.first_place_team_id) ?? null) : null,
      second: pred ? (teamMap.get(pred.second_place_team_id) ?? null) : null,
      third: pred ? (teamMap.get(pred.third_place_team_id) ?? null) : null,
      fourth: pred ? (teamMap.get(pred.fourth_place_team_id) ?? null) : null,
    }
  })
}

const STAGE_LABELS: Record<string, string> = {
  round_of_32: '32avos de final',
  round_of_16: 'Octavos de final',
  quarter_final: 'Cuartos de final',
  semi_final: 'Semifinal',
  third_place: 'Tercer lugar',
  final: 'Final',
}

const STAGE_ORDER = ['round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final'] as const

function MatchCard({ match }: { match: BracketMatchNode }) {
  return (
    <div className="border border-gray-700 rounded-lg p-3 bg-gray-800/50 min-w-[220px]">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span>#{match.matchNumber}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 text-sm truncate">
            {match.home.teamName ? (
              <span className="text-white font-medium">{match.home.teamName}</span>
            ) : (
              <span className="text-gray-500 italic">{match.home.label}</span>
            )}
          </div>
        </div>
        <div className="border-t border-gray-700" />
        <div className="flex items-center gap-2">
          <div className="flex-1 text-sm truncate">
            {match.away.teamName ? (
              <span className="text-white font-medium">{match.away.teamName}</span>
            ) : (
              <span className="text-gray-500 italic">{match.away.label}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function BracketView({ groups, predictions, thirdPlaceGroups }: Props) {
  const matches = useMemo(() => {
    const groupResults = getGroupResult(groups, predictions)
    return buildBracket(groupResults, thirdPlaceGroups)
  }, [groups, predictions, thirdPlaceGroups])

  const grouped = useMemo(() => {
    const map: Record<string, BracketMatchNode[]> = {}
    for (const m of matches) {
      if (!map[m.stage]) map[m.stage] = []
      map[m.stage].push(m)
    }
    return map
  }, [matches])

  return (
    <div className="flex flex-col gap-8 overflow-x-auto pb-8">
      {STAGE_ORDER.filter((s) => grouped[s]?.length).map((stage) => (
        <div key={stage}>
          <h2 className="text-lg font-bold text-fifa-gold mb-3">{STAGE_LABELS[stage]}</h2>
          <div className="flex gap-3 flex-wrap">
            {grouped[stage].map((match) => (
              <MatchCard key={match.matchNumber} match={match} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
