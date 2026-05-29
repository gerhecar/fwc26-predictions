'use client'

import { useMemo, useState, useCallback, useEffect } from 'react'
import { CountryFlag } from '@/components/ui/country-flag'
import type { Team, GroupLetter, GroupPrediction } from '@/types'
import type { Group } from '@/types'
import { buildBracket } from '@/lib/bracket/bracket-engine'
import type { BracketMatchNode } from '@/lib/bracket/bracket-engine'
import { resolveBracketPicks } from '@/lib/bracket/bracket-picks'
import type { BracketPicks } from '@/lib/bracket/bracket-picks'
import { saveBracketPicks, submitPredictions } from '@/lib/bracket/actions/save-picks'
import { ChampionCelebration } from './champion-celebration'

interface Props {
  groups: (Group & { teams: Team[] })[]
  predictions: GroupPrediction[]
  thirdPlaceGroups: GroupLetter[]
  tournamentId: string
  initialPicks?: BracketPicks
  initialChampion?: string | null
  isSubmitted: boolean
}

function getGroupResult(groups: (Group & { teams: Team[] })[], predictions: GroupPrediction[]) {
  const predMap = new Map<string, GroupPrediction>()
  for (const p of predictions) predMap.set(p.group_id, p)

  return groups.map((g) => {
    const pred = predMap.get(g.id)
    const teamMap = new Map<string, Team>()
    for (const t of g.teams) teamMap.set(t.id, t)
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

const R32_MATCH_NUMBERS = [73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88]
const STAGE_MATCHES: Record<string, number[]> = {
  round_of_32: R32_MATCH_NUMBERS,
  round_of_16: [89, 90, 91, 92, 93, 94, 95, 96],
  quarter_final: [97, 98, 99, 100],
  semi_final: [101, 102],
  third_place: [103],
  final: [104],
}

function getAffectedMatches(matchNumber: number, allMatches: BracketMatchNode[]): number[] {
  const parentMap = new Map<number, number>()
  for (const m of allMatches) {
    for (const child of m.childMatchIds) {
      parentMap.set(child, m.matchNumber)
    }
  }

  const result: number[] = []
  let current = matchNumber
  while (parentMap.has(current)) {
    const parent = parentMap.get(current)!
    result.push(parent)
    current = parent
  }

  return result
}

function TeamButton({
  teamId,
  teamName,
  label,
  isWinner,
  isDisabled,
  onPick,
}: {
  teamId: string | null
  teamName: string | null
  label: string
  isWinner: boolean
  isDisabled: boolean
  onPick: () => void
}) {
  return (
    <button
      type="button"
      disabled={isDisabled || !teamId}
      onClick={onPick}
      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all flex items-center gap-2 ${
        isWinner
          ? 'bg-fifa-gold text-fifa-navy font-bold shadow-md shadow-fifa-gold/30'
          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
      } ${isDisabled || !teamId ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {teamName && <CountryFlag name={teamName} width={18} className="shrink-0" />}
      <span className="truncate">{teamName || label}</span>
    </button>
  )
}

function MatchCard({
  match,
  picks,
  isStageUnlocked,
  onPick,
  onChangePick,
}: {
  match: BracketMatchNode
  picks: BracketPicks
  isStageUnlocked: boolean
  onPick: (matchNumber: number, teamId: string) => void
  onChangePick: (matchNumber: number) => void
}) {
  const winnerId = picks[match.matchNumber]
  const canPick = isStageUnlocked && !winnerId

  return (
    <div className={`border rounded-lg p-3 min-w-[220px] ${
      winnerId ? 'border-fifa-gold/50 bg-fifa-gold/5' : 'border-gray-700 bg-gray-800/50'
    }`}>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span>#{match.matchNumber}</span>
          {winnerId && (
            <button
              type="button"
              onClick={() => onChangePick(match.matchNumber)}
              className="text-fifa-gold hover:text-red-400 transition-colors text-xs"
              title="Cambiar selección"
            >
              ✕
            </button>
          )}
        </div>

        <TeamButton
          teamId={match.home.teamId}
          teamName={match.home.teamName}
          label={match.home.label}
          isWinner={winnerId === match.home.teamId}
          isDisabled={!canPick}
          onPick={() => match.home.teamId && onPick(match.matchNumber, match.home.teamId)}
        />

        <div className="border-t border-gray-700" />

        <TeamButton
          teamId={match.away.teamId}
          teamName={match.away.teamName}
          label={match.away.label}
          isWinner={winnerId === match.away.teamId}
          isDisabled={!canPick}
          onPick={() => match.away.teamId && onPick(match.matchNumber, match.away.teamId)}
        />
      </div>
    </div>
  )
}

export function BracketView({ groups, predictions, thirdPlaceGroups, tournamentId, initialPicks, initialChampion, isSubmitted }: Props) {
  const [picks, setPicks] = useState<BracketPicks>(initialPicks || {})
  const [champion, setChampion] = useState<string | null>(initialChampion || null)
  const [saving, setSaving] = useState(false)
  const [hasSaved, setHasSaved] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(isSubmitted)

  const baseMatches = useMemo(() => {
    const groupResults = getGroupResult(groups, predictions)
    return buildBracket(groupResults, thirdPlaceGroups)
  }, [groups, predictions, thirdPlaceGroups])

  const resolvedMatches = useMemo(() => {
    return resolveBracketPicks(baseMatches, picks)
  }, [baseMatches, picks])

  const championTeam = useMemo(() => {
    if (!champion) return null
    for (const g of groups) {
      const t = g.teams.find(t => t.id === champion)
      if (t) return t
    }
    return null
  }, [champion, groups])

  const handlePick = useCallback((matchNumber: number, teamId: string) => {
    setPicks(prev => {
      if (prev[matchNumber] === teamId) return prev
      const toClear = getAffectedMatches(matchNumber, baseMatches)
      const next = { ...prev, [matchNumber]: teamId }
      for (const mn of toClear) {
        delete next[mn]
      }
      if (matchNumber === 104) setChampion(teamId)
      if (toClear.includes(104)) setChampion(null)
      return next
    })
    setHasSaved(false)
  }, [baseMatches])

  const handleChangePick = useCallback((matchNumber: number) => {
    setPicks(prev => {
      const toClear = getAffectedMatches(matchNumber, baseMatches)
      const next = { ...prev }
      delete next[matchNumber]
      for (const mn of toClear) delete next[mn]
      if (matchNumber === 104 || toClear.includes(104)) setChampion(null)
      return next
    })
    setHasSaved(false)
  }, [baseMatches])

  const isStageUnlocked = useCallback((stage: string): boolean => {
    const stageIndex = STAGE_ORDER.indexOf(stage as typeof STAGE_ORDER[number])
    if (stageIndex <= 1) return true

    const prevStage = STAGE_ORDER[stageIndex - 1]
    const prevMatchNums = STAGE_MATCHES[prevStage]

    if (prevStage === 'third_place' || prevStage === 'final') {
      return isStageUnlocked(STAGE_ORDER[stageIndex - 2])
    }

    return prevMatchNums.every(m => !!picks[m])
  }, [picks])

  const grouped = useMemo(() => {
    const map: Record<string, BracketMatchNode[]> = {}
    for (const m of resolvedMatches) {
      if (!map[m.stage]) map[m.stage] = []
      map[m.stage].push(m)
    }
    return map
  }, [resolvedMatches])

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveBracketPicks(tournamentId, picks, champion)
      setHasSaved(true)
    } catch { /* ignore */ }
    setSaving(false)
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      await saveBracketPicks(tournamentId, picks, champion)
      await submitPredictions(tournamentId)
      setHasSubmitted(true)
      setHasSaved(true)
    } catch { /* ignore */ }
    setSaving(false)
  }

  if (hasSubmitted) {
    return (
      <ChampionCelebration
        champion={championTeam}
        championId={champion}
        groups={groups}
      />
    )
  }

  const allR32Done = R32_MATCH_NUMBERS.every(m => !!picks[m])
  const allPicksDone = Object.keys(STAGE_MATCHES).every(s =>
    STAGE_MATCHES[s].every(m => !!picks[m])
  )
  const hasUnsavedChanges = JSON.stringify(picks) !== JSON.stringify(initialPicks || {}) ||
    champion !== (initialChampion || null)

  return (
    <div className="flex flex-col gap-6 pb-8">
      {championTeam && (
        <ChampionCelebration
          champion={championTeam}
          championId={champion}
          groups={groups}
          compact
        />
      )}

      {!championTeam && allR32Done && (
        <div className="bg-fifa-gold/10 border border-fifa-gold/30 rounded-lg p-4 text-center">
          <p className="text-fifa-gold font-semibold">¡Todos los 32avos completados! Continúa con las siguientes rondas.</p>
        </div>
      )}

      <div className="flex flex-col gap-8 overflow-x-auto">
        {STAGE_ORDER.filter((s) => grouped[s]?.length).map((stage) => {
          const unlocked = isStageUnlocked(stage)
          return (
            <div key={stage} className={!unlocked ? 'opacity-40 pointer-events-none' : ''}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-lg font-bold text-fifa-gold">{STAGE_LABELS[stage]}</h2>
                {!unlocked && <span className="text-xs text-gray-500">(completa la ronda anterior)</span>}
              </div>
              <div className="flex gap-3 flex-wrap">
                {grouped[stage].map((match) => (
                  <MatchCard
                    key={match.matchNumber}
                    match={match}
                    picks={picks}
                    isStageUnlocked={unlocked}
                    onPick={handlePick}
                    onChangePick={handleChangePick}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {allPicksDone && (
        <div className="flex flex-col gap-3 mt-4">
          <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-4 text-center">
            <p className="text-green-400 font-bold text-lg">¡Bracket completo!</p>
            <p className="text-green-300 text-sm flex items-center justify-center gap-1.5">
              {championTeam && <CountryFlag name={championTeam.name} width={20} className="shrink-0" />}
              Tu campeón: {championTeam?.name}
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !hasUnsavedChanges}
              className="px-6 py-2 rounded-lg bg-fifa-blue text-white font-semibold hover:bg-fifa-blue/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {saving ? 'Guardando...' : hasSaved ? '✓ Guardado' : 'Guardar bracket'}
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2 rounded-lg bg-fifa-gold text-fifa-navy font-bold hover:bg-fifa-gold/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {saving ? 'Guardando...' : 'Enviar pronósticos'}
            </button>
          </div>
        </div>
      )}

      {!allPicksDone && allR32Done && (
        <div className="flex justify-center mt-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !hasUnsavedChanges}
            className="px-6 py-2 rounded-lg bg-fifa-blue text-white font-semibold hover:bg-fifa-blue/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {saving ? 'Guardando...' : hasSaved ? '✓ Guardado' : 'Guardar bracket'}
          </button>
        </div>
      )}
    </div>
  )
}
