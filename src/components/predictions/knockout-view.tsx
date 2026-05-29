'use client'

import { useMemo, useCallback } from 'react'
import { usePredictionsStore, getQualifiedTeams, getThirdPlaceTeam } from '@/lib/predictions/store'
import { GROUP_LETTERS, getFlag } from '@/lib/predictions/constants'
import { lookupAnnexC } from '@/lib/groups/annex-c'
import type { GroupLetter } from '@/types'

interface MatchSlot {
  matchNumber: number
  stage: string
  homeTeam: string | null
  awayTeam: string | null
  homeLabel: string
  awayLabel: string
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

const R32_THIRD_META = [
  { matchNumber: 74, homeLabel: '1° Grupo E', homeGroup: { pos: 'winner' as const, letter: 'E' } },
  { matchNumber: 77, homeLabel: '1° Grupo I', homeGroup: { pos: 'winner' as const, letter: 'I' } },
  { matchNumber: 79, homeLabel: '1° Grupo A', homeGroup: { pos: 'winner' as const, letter: 'A' } },
  { matchNumber: 80, homeLabel: '1° Grupo L', homeGroup: { pos: 'winner' as const, letter: 'L' } },
  { matchNumber: 81, homeLabel: '1° Grupo D', homeGroup: { pos: 'winner' as const, letter: 'D' } },
  { matchNumber: 82, homeLabel: '1° Grupo G', homeGroup: { pos: 'winner' as const, letter: 'G' } },
  { matchNumber: 85, homeLabel: '1° Grupo B', homeGroup: { pos: 'winner' as const, letter: 'B' } },
  { matchNumber: 87, homeLabel: '1° Grupo K', homeGroup: { pos: 'winner' as const, letter: 'K' } },
]

const POSITION_MAP: Record<string, number> = {
  '1A': 79, '1B': 85, '1D': 81, '1E': 74,
  '1G': 82, '1I': 77, '1K': 87, '1L': 80,
}

const STAGE_ORDER = ['round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final'] as const

const STAGE_LABELS: Record<string, string> = {
  round_of_32: '32avos de final',
  round_of_16: 'Octavos de final',
  quarter_final: 'Cuartos de final',
  semi_final: 'Semifinal',
  third_place: 'Tercer lugar',
  final: 'Final',
}

const R32_MATCHES = [73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88]

interface MatchCardProps {
  match: MatchSlot
  winner: string | null
  allPicks: Record<number, string>
  locked: boolean
  onPick: (matchNumber: number, team: string) => void
  onClear: (matchNumber: number) => void
}

function getTeamName(
  groupPredictions: Record<string, string[]>,
  thirdPlaceAssignments: Record<number, string> | null,
  match: MatchSlot,
  side: 'home' | 'away',
): string | null {
  if (side === 'home') return match.homeTeam
  return match.awayTeam
}

const stageChildMap: Record<number, number[]> = {
  73: [], 74: [], 75: [], 76: [], 77: [], 78: [], 79: [], 80: [],
  81: [], 82: [], 83: [], 84: [], 85: [], 86: [], 87: [], 88: [],
  90: [73, 75], 89: [74, 77], 91: [76, 78], 92: [79, 80],
  93: [83, 84], 94: [81, 82], 95: [86, 88], 96: [85, 87],
  97: [89, 90], 98: [93, 94], 99: [91, 92], 100: [95, 96],
  101: [97, 98], 102: [99, 100],
  103: [101, 102], 104: [101, 102],
}

function getAffected(matchNumber: number): number[] {
  const result: number[] = []
  const stack = [matchNumber]
  while (stack.length > 0) {
    const current = stack.pop()!
    for (const [parent, children] of Object.entries(stageChildMap)) {
      if (children.includes(current) && !result.includes(Number(parent))) {
        result.push(Number(parent))
        stack.push(Number(parent))
      }
    }
  }
  return result
}

function resolveMatch(
  match: MatchSlot,
  bracketPicks: Record<number, string>,
  allMatches: MatchSlot[],
): { home: string | null; away: string | null } {
  const homeTeam = resolveTeam(match.homeTeam, match.homeLabel, bracketPicks, allMatches)
  const awayTeam = resolveTeam(match.awayTeam, match.awayLabel, bracketPicks, allMatches)
  return { home: homeTeam, away: awayTeam }
}

function resolveTeam(
  directTeam: string | null,
  label: string,
  bracketPicks: Record<number, string>,
  allMatches: MatchSlot[],
): string | null {
  if (directTeam) return directTeam
  const childMatchNum = extractMatchNumber(label)
  if (childMatchNum !== null && bracketPicks[childMatchNum]) {
    return bracketPicks[childMatchNum]
  }
  if (childMatchNum !== null) {
    const childMatch = allMatches.find(m => m.matchNumber === childMatchNum)
    if (childMatch) {
      const resolved = resolveMatch(childMatch, bracketPicks, allMatches)
      return resolved.home || resolved.away || null
    }
  }
  return null
}

function extractMatchNumber(label: string): number | null {
  const match = label.match(/#(\d+)/)
  return match ? parseInt(match[1], 10) : null
}

function MatchCard({ match, winner, allPicks, locked, onPick, onClear }: MatchCardProps) {
  const hasWinner = !!winner
  return (
    <div className={`rounded-xl border p-3 min-w-[200px] transition-all ${
      hasWinner ? 'border-accent-green/40 bg-accent-green/5' : 'border-white/10 bg-white/5'
    }`}>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px] text-text-secondary mb-0.5">
          <span>#{match.matchNumber}</span>
          <span className="font-[family-name:var(--font-bebas)] tracking-wider text-[10px] uppercase">{STAGE_ORDER.find(s => s === match.stage) ? match.stage.replace(/_/g, ' ') : match.stage}</span>
        </div>

        <button
          type="button"
          disabled={locked || !match.homeTeam}
          onClick={() => match.homeTeam && onPick(match.matchNumber, match.homeTeam)}
          className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-all ${
            winner === match.homeTeam
              ? 'bg-accent-green/20 text-accent-green font-bold'
              : 'bg-white/5 text-text-secondary hover:bg-white/[0.07] hover:text-white'
          } ${locked || !match.homeTeam ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {match.homeTeam || match.homeLabel}
        </button>

        <div className="border-t border-white/10" />

        <button
          type="button"
          disabled={locked || !match.awayTeam}
          onClick={() => match.awayTeam && onPick(match.matchNumber, match.awayTeam)}
          className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-all ${
            winner === match.awayTeam
              ? 'bg-accent-green/20 text-accent-green font-bold'
              : 'bg-white/5 text-text-secondary hover:bg-white/[0.07] hover:text-white'
          } ${locked || !match.awayTeam ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {match.awayTeam || match.awayLabel}
        </button>

        {hasWinner && (
          <button
            type="button"
            onClick={() => onClear(match.matchNumber)}
            className="text-[11px] text-accent-gold hover:text-red-400 transition-colors mt-1 text-center"
          >
            Cambiar
          </button>
        )}
      </div>
    </div>
  )
}

interface KnockoutViewProps {
  onEditGroups: () => void
  onEditThirdPlace: () => void
}

export function KnockoutView({ onEditGroups, onEditThirdPlace }: KnockoutViewProps) {
  const groupPredictions = usePredictionsStore((s) => s.groupPredictions)
  const thirdPlaceSelection = usePredictionsStore((s) => s.thirdPlaceSelection)
  const bracketPicks = usePredictionsStore((s) => s.bracketPicks)
  const setBracketPick = usePredictionsStore((s) => s.setBracketPick)
  const submitted = usePredictionsStore((s) => s.submitted)
  const setSubmitted = usePredictionsStore((s) => s.setSubmitted)

  const qualifiedTeams = useMemo(
    () => getQualifiedTeams(groupPredictions, thirdPlaceSelection),
    [groupPredictions, thirdPlaceSelection],
  )

  const thirdAssignments = useMemo(() => {
    return lookupAnnexC(thirdPlaceSelection as GroupLetter[])
  }, [thirdPlaceSelection])

  const getTeam = useCallback(
    (pos: 'winner' | 'runner_up', letter: string): string | null => {
      const teams = groupPredictions[letter]
      if (!teams) return null
      return pos === 'winner' ? teams[0] : teams[1]
    },
    [groupPredictions],
  )

  const getThird = useCallback(
    (letter: string): string | null => {
      return getThirdPlaceTeam(groupPredictions, letter)
    },
    [groupPredictions],
  )

  const baseMatches = useMemo((): MatchSlot[] => {
    const matches: MatchSlot[] = []

    for (const [matchNum, info] of Object.entries(R32_FIXED)) {
      matches.push({
        matchNumber: Number(matchNum),
        stage: 'round_of_32',
        homeTeam: getTeam(info.homeGroup!.pos, info.homeGroup!.letter),
        awayTeam: getTeam(info.awayGroup!.pos, info.awayGroup!.letter),
        homeLabel: info.homeLabel,
        awayLabel: info.awayLabel,
      })
    }

    for (const info of R32_THIRD_META) {
      const thirdGroup = thirdAssignments?.[info.matchNumber]
      matches.push({
        matchNumber: info.matchNumber,
        stage: 'round_of_32',
        homeTeam: getTeam(info.homeGroup.pos, info.homeGroup.letter),
        awayTeam: thirdGroup ? getThird(thirdGroup) : null,
        homeLabel: info.homeLabel,
        awayLabel: thirdGroup ? `3° Grupo ${thirdGroup}` : '3° lugar por definir',
      })
    }

    const r16: [number, number, number][] = [
      [90, 73, 75], [89, 74, 77], [91, 76, 78], [92, 79, 80],
      [93, 83, 84], [94, 81, 82], [95, 86, 88], [96, 85, 87],
    ]
    for (const [matchNum, child1, child2] of r16) {
      matches.push({
        matchNumber: matchNum,
        stage: 'round_of_16',
        homeTeam: null,
        awayTeam: null,
        homeLabel: `Ganador #${child1}`,
        awayLabel: `Ganador #${child2}`,
      })
    }

    const qf: [number, number, number][] = [
      [97, 89, 90], [98, 93, 94], [99, 91, 92], [100, 95, 96],
    ]
    for (const [matchNum, child1, child2] of qf) {
      matches.push({
        matchNumber: matchNum,
        stage: 'quarter_final',
        homeTeam: null,
        awayTeam: null,
        homeLabel: `Ganador #${child1}`,
        awayLabel: `Ganador #${child2}`,
      })
    }

    const sf: [number, number, number][] = [
      [101, 97, 98], [102, 99, 100],
    ]
    for (const [matchNum, child1, child2] of sf) {
      matches.push({
        matchNumber: matchNum,
        stage: 'semi_final',
        homeTeam: null,
        awayTeam: null,
        homeLabel: `Ganador #${child1}`,
        awayLabel: `Ganador #${child2}`,
      })
    }

    matches.push({
      matchNumber: 103,
      stage: 'third_place',
      homeTeam: null,
      awayTeam: null,
      homeLabel: 'Perdedor #101',
      awayLabel: 'Perdedor #102',
    })

    matches.push({
      matchNumber: 104,
      stage: 'final',
      homeTeam: null,
      awayTeam: null,
      homeLabel: 'Ganador #101',
      awayLabel: 'Ganador #102',
    })

    return matches.sort((a, b) => a.matchNumber - b.matchNumber)
  }, [getTeam, getThird, thirdAssignments])

  const resolvedMatches = useMemo(() => {
    return baseMatches.map((m) => {
      const resolved = resolveMatch(m, bracketPicks, baseMatches)
      return {
        ...m,
        homeTeam: resolved.home || m.homeTeam,
        awayTeam: resolved.away || m.awayTeam,
      }
    })
  }, [baseMatches, bracketPicks])

  const isR32Complete = R32_MATCHES.every(m => !!bracketPicks[m])

  const handlePick = useCallback(
    (matchNumber: number, team: string) => {
      if (submitted) return
      const toClear = getAffected(matchNumber)
      setBracketPick(matchNumber, team)
      for (const mn of toClear) {
        setBracketPick(mn, null)
      }
    },
    [submitted, setBracketPick],
  )

  const handleClear = useCallback(
    (matchNumber: number) => {
      if (submitted) return
      const toClear = getAffected(matchNumber)
      setBracketPick(matchNumber, null)
      for (const mn of toClear) {
        setBracketPick(mn, null)
      }
    },
    [submitted, setBracketPick],
  )

  const allPicksComplete = baseMatches.every(m => !!bracketPicks[m.matchNumber])

  const champion = bracketPicks[104] || null

  const grouped = useMemo(() => {
    const map: Record<string, MatchSlot[]> = {}
    for (const m of resolvedMatches) {
      if (!map[m.stage]) map[m.stage] = []
      map[m.stage].push(m)
    }
    return map
  }, [resolvedMatches])

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="border-b border-white/10 pb-5">
        <h1 className="font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-white sm:text-4xl">
          LLAVE DE ELIMINACIÓN
        </h1>
        <p className="mt-2 text-sm text-text-secondary max-w-2xl">
          Selecciona el ganador de cada partido. Completa la llave para definir tu campeón.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onEditGroups}
          disabled={submitted}
          className="rounded-full border border-white/20 px-5 py-2 text-xs font-bold tracking-wide text-text-secondary transition-all hover:border-white/40 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← EDITAR GRUPOS
        </button>
        <button
          onClick={onEditThirdPlace}
          disabled={submitted}
          className="rounded-full border border-white/20 px-5 py-2 text-xs font-bold tracking-wide text-text-secondary transition-all hover:border-white/40 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← EDITAR 3° LUGARES
        </button>
        {allPicksComplete && !submitted && (
          <button
            onClick={() => setSubmitted(true)}
            className="rounded-full bg-accent-green px-5 py-2 text-xs font-bold tracking-wide text-black transition-all hover:scale-[1.02]"
          >
            ENVIAR PRONÓSTICO FINAL
          </button>
        )}
        {submitted && (
          <span className="rounded-full border border-accent-green/30 bg-accent-green/10 px-4 py-1.5 text-xs font-bold tracking-wide text-accent-green">
            ✓ PRONÓSTICO ENVIADO
          </span>
        )}
      </div>

      {champion && !submitted && (
        <div className="rounded-2xl border border-accent-gold/30 bg-accent-gold/5 p-4 text-center backdrop-blur-md">
          <p className="font-[family-name:var(--font-bebas)] text-xl tracking-wide text-accent-gold">
            TU CAMPEÓN: {getFlag(champion)} {champion}
          </p>
        </div>
      )}

      {champion && submitted && (
        <div className="rounded-2xl border border-accent-green/30 bg-accent-green/10 p-6 text-center backdrop-blur-md animate-slide-up">
          <p className="font-[family-name:var(--font-bebas)] text-2xl tracking-wide text-accent-green">
            ¡PRONÓSTICO ENVIADO!
          </p>
          <p className="mt-2 text-lg text-white">
            {getFlag(champion)} {champion}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            Ya no puedes modificar tu pronóstico.
          </p>
        </div>
      )}

      {!champion && isR32Complete && !submitted && (
        <div className="rounded-2xl border border-accent-gold/20 bg-accent-gold/5 p-4 text-center backdrop-blur-md">
          <p className="text-sm font-medium text-accent-gold">
            ¡Todos los 32avos completados! Continúa con las siguientes rondas.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-8 overflow-x-auto pb-8">
        {STAGE_ORDER.filter((s) => grouped[s]?.length).map((stage) => {
          const prevStageIdx = STAGE_ORDER.indexOf(stage) - 1
          const isLocked = submitted

          let unlocked = !isLocked
          if (stage === 'round_of_32') {
            unlocked = !isLocked
          } else if (prevStageIdx >= 0) {
            const prevStage = STAGE_ORDER[prevStageIdx]
            const prevMatches = grouped[prevStage]
            unlocked = !isLocked && prevMatches.every(m => !!bracketPicks[m.matchNumber])
          }

          return (
            <div key={stage} className={!unlocked && !isLocked ? 'opacity-40 pointer-events-none' : ''}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="font-[family-name:var(--font-bebas)] text-lg tracking-wide text-accent-gold">
                  {STAGE_LABELS[stage]?.toUpperCase() || stage.toUpperCase()}
                </h2>
                {!unlocked && !isLocked && (
                  <span className="text-[11px] text-text-secondary">(completa la ronda anterior)</span>
                )}
              </div>
              <div className="flex gap-3 flex-wrap">
                {grouped[stage].map((match) => (
                  <MatchCard
                    key={match.matchNumber}
                    match={match}
                    winner={bracketPicks[match.matchNumber] || null}
                    allPicks={bracketPicks}
                    locked={!unlocked || submitted}
                    onPick={handlePick}
                    onClear={handleClear}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
