'use client'

import { useMemo, useCallback, useState } from 'react'
import { usePredictionsStore, getThirdPlaceTeam } from '@/lib/predictions/store'
import { CountryFlag } from '@/components/ui/country-flag'
import { lookupAnnexC } from '@/lib/groups/annex-c'
import { BracketLayout } from './bracket-layout'
import type { GroupLetter } from '@/types'
import BG from '@/images/finals.jpg'
import Trump from '@/images/trump.jpg'

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

const STAGE_ORDER = ['round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'final'] as const

const R32_MATCHES = [73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88]

const stageChildMap: Record<number, number[]> = {
  73: [], 74: [], 75: [], 76: [], 77: [], 78: [], 79: [], 80: [],
  81: [], 82: [], 83: [], 84: [], 85: [], 86: [], 87: [], 88: [],
  90: [73, 75], 89: [74, 77], 91: [76, 78], 92: [79, 80],
  93: [83, 84], 94: [81, 82], 95: [86, 88], 96: [85, 87],
  97: [89, 90], 98: [93, 94], 99: [91, 92], 100: [95, 96],
  101: [97, 98], 102: [99, 100],
  104: [101, 102],
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
): { home: string | null; away: string | null } {
  const homeTeam = resolveTeam(match.homeTeam, match.homeLabel, bracketPicks)
  const awayTeam = resolveTeam(match.awayTeam, match.awayLabel, bracketPicks)
  return { home: homeTeam, away: awayTeam }
}

function resolveTeam(
  directTeam: string | null,
  label: string,
  bracketPicks: Record<number, string>,
): string | null {
  if (directTeam) return directTeam
  const childMatchNum = extractMatchNumber(label)
  if (childMatchNum !== null && bracketPicks[childMatchNum]) {
    return bracketPicks[childMatchNum]
  }
  return null
}

function extractMatchNumber(label: string): number | null {
  const match = label.match(/#(\d+)/)
  return match ? parseInt(match[1], 10) : null
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
      const resolved = resolveMatch(m, bracketPicks)
      return {
        ...m,
        homeTeam: resolved.home || m.homeTeam,
        awayTeam: resolved.away || m.awayTeam,
      }
    })
  }, [baseMatches, bracketPicks])

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

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<{ predictionId: string } | null>(null)

  const handleSaveBet = useCallback(async () => {
    if (!allPicksComplete || submitted || submitting) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch('/api/predictions/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupPredictions,
          thirdPlaceSelection,
          bracketPicks,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar')
      }
      setSubmitted(true)
      setSaveSuccess({ predictionId: data.predictionId })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar el pronóstico'
      setSubmitError(message)
    } finally {
      setSubmitting(false)
    }
  }, [allPicksComplete, submitted, submitting, groupPredictions, thirdPlaceSelection, bracketPicks, setSubmitted])

  return (
    <div className="relative flex flex-col gap-6 animate-fade-in">
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: `url(${BG.src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      />
      <div className="fixed inset-0 -z-10 bg-[#0a0e1a]/70 backdrop-blur-[2px]" />
      <div className="border-b border-white/10 pb-5">
        <h1 className="font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-white sm:text-4xl">
          KNOCKOUT STAGE
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

        {submitted && (
          <span className="rounded-full border border-accent-green/30 bg-accent-green/10 px-4 py-1.5 text-xs font-bold tracking-wide text-accent-green">
            ✓ PRONÓSTICO ENVIADO
          </span>
        )}
      </div>

      {submitError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center text-sm text-red-400">
          {submitError}
        </div>
      )}

      {champion && submitted && saveSuccess && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center animate-fade-in">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${Trump.src})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0 bg-[#0a0e1a]/60" />
          <div className="relative z-10 flex flex-col items-center gap-6 px-4 text-center">
            <p
              className="text-5xl leading-tight tracking-wide text-fifa-gold sm:text-7xl lg:text-8xl drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)]"
              style={{ fontFamily: 'var(--font-bebas)' }}
            >
              MAKE PORRA GREAT AGAIN
            </p>
            <p className="text-lg text-white/80 drop-shadow-md">
              <CountryFlag name={champion} width={24} className="inline-block -mt-0.5" /> {champion}
            </p>
            <p className="text-sm text-text-secondary drop-shadow-md">
              ID: {saveSuccess.predictionId.slice(0, 8)}... — Ya no puedes modificar tu pronóstico.
            </p>
          </div>
        </div>
      )}

      <BracketLayout
        matches={resolvedMatches}
        bracketPicks={bracketPicks}
        submitted={submitted}
        onPick={handlePick}
        onClear={handleClear}
      />

      {!submitted && (
        <div className="flex justify-center pt-4 border-t border-white/10">
          <button
            onClick={handleSaveBet}
            disabled={!allPicksComplete || submitting}
            className="relative rounded-full bg-accent-green px-12 py-4 text-base font-bold tracking-wide text-black transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(0,230,118,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                ENVIANDO...
              </span>
            ) : (
              'SAVE BET'
            )}
          </button>
        </div>
      )}
    </div>
  )
}
