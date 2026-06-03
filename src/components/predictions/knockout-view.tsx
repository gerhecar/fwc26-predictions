'use client'

import { useMemo, useCallback, useState, useEffect } from 'react'
import { usePredictionsStore, getThirdPlaceTeam } from '@/lib/predictions/store'
import { CountryFlag } from '@/components/ui/country-flag'
import { lookupAnnexC } from '@/lib/groups/annex-c'
import { BracketLayout } from './bracket-layout'
import type { GroupLetter } from '@/types'
import BG from '@/images/campo.jpg'
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
  73: { homeLabel: '2nd Group A', awayLabel: '2nd Group B', homeGroup: { pos: 'runner_up', letter: 'A' }, awayGroup: { pos: 'runner_up', letter: 'B' } },
  75: { homeLabel: '1st Group F', awayLabel: '2nd Group C', homeGroup: { pos: 'winner', letter: 'F' }, awayGroup: { pos: 'runner_up', letter: 'C' } },
  76: { homeLabel: '1st Group C', awayLabel: '2nd Group F', homeGroup: { pos: 'winner', letter: 'C' }, awayGroup: { pos: 'runner_up', letter: 'F' } },
  78: { homeLabel: '2nd Group E', awayLabel: '2nd Group I', homeGroup: { pos: 'runner_up', letter: 'E' }, awayGroup: { pos: 'runner_up', letter: 'I' } },
  83: { homeLabel: '2nd Group K', awayLabel: '2nd Group L', homeGroup: { pos: 'runner_up', letter: 'K' }, awayGroup: { pos: 'runner_up', letter: 'L' } },
  84: { homeLabel: '1st Group H', awayLabel: '2nd Group J', homeGroup: { pos: 'winner', letter: 'H' }, awayGroup: { pos: 'runner_up', letter: 'J' } },
  86: { homeLabel: '1st Group J', awayLabel: '2nd Group H', homeGroup: { pos: 'winner', letter: 'J' }, awayGroup: { pos: 'runner_up', letter: 'H' } },
  88: { homeLabel: '2nd Group D', awayLabel: '2nd Group G', homeGroup: { pos: 'runner_up', letter: 'D' }, awayGroup: { pos: 'runner_up', letter: 'G' } },
}

const R32_THIRD_META = [
  { matchNumber: 74, homeLabel: '1st Group E', homeGroup: { pos: 'winner' as const, letter: 'E' } },
  { matchNumber: 77, homeLabel: '1st Group I', homeGroup: { pos: 'winner' as const, letter: 'I' } },
  { matchNumber: 79, homeLabel: '1st Group A', homeGroup: { pos: 'winner' as const, letter: 'A' } },
  { matchNumber: 80, homeLabel: '1st Group L', homeGroup: { pos: 'winner' as const, letter: 'L' } },
  { matchNumber: 81, homeLabel: '1st Group D', homeGroup: { pos: 'winner' as const, letter: 'D' } },
  { matchNumber: 82, homeLabel: '1st Group G', homeGroup: { pos: 'winner' as const, letter: 'G' } },
  { matchNumber: 85, homeLabel: '1st Group B', homeGroup: { pos: 'winner' as const, letter: 'B' } },
  { matchNumber: 87, homeLabel: '1st Group K', homeGroup: { pos: 'winner' as const, letter: 'K' } },
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
        awayLabel: thirdGroup ? `3rd Group ${thirdGroup}` : '3rd place TBD',
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
        homeLabel: `Winner #${child1}`,
        awayLabel: `Winner #${child2}`,
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
        homeLabel: `Winner #${child1}`,
        awayLabel: `Winner #${child2}`,
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
        homeLabel: `Winner #${child1}`,
        awayLabel: `Winner #${child2}`,
      })
    }

    matches.push({
      matchNumber: 104,
      stage: 'final',
      homeTeam: null,
      awayTeam: null,
      homeLabel: 'Winner #101',
      awayLabel: 'Winner #102',
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

  // Lock body scroll when success overlay is visible
  useEffect(() => {
    if (saveSuccess) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      window.scrollTo(0, 0)
      return () => { document.body.style.overflow = prev }
    }
  }, [saveSuccess])

  // Bet name modal
  const [existingBets, setExistingBets] = useState<Array<{ id: string; bet_name: string; champion_name: string; submitted_at: string }>>([])
  const [showNameModal, setShowNameModal] = useState(false)
  const [betName, setBetName] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [betsMaxed, setBetsMaxed] = useState(false)
  const [fetched, setFetched] = useState(false)

  useEffect(() => {
    if (fetched) return
    fetch('/api/predictions/save')
      .then(r => r.json())
      .then(data => {
        setFetched(true)
        if (data.bets) {
          setExistingBets(data.bets)
          if (data.bets.length >= 2) {
            setBetsMaxed(true)
          }
        }
      })
      .catch(() => setFetched(true))
  }, [fetched])

  const performSave = useCallback(async (name: string) => {
    if (!allPicksComplete || submitted || submitting || betsMaxed) return
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
          betName: name,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Error saving')
      }
      setSubmitted(true)
      setSaveSuccess({ predictionId: data.predictionId })
      setBetName(name)
      setExistingBets(prev => [...prev, {
        id: data.predictionId,
        bet_name: name,
        champion_name: champion ?? '',
        submitted_at: data.submittedAt,
      }])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error saving prediction'
      setSubmitError(message)
    } finally {
      setSubmitting(false)
    }
  }, [allPicksComplete, submitted, submitting, betsMaxed, groupPredictions, thirdPlaceSelection, bracketPicks, setSubmitted, champion])

  const handleSaveBet = useCallback(() => {
    if (!allPicksComplete || submitted || submitting || betsMaxed) return
    setSubmitError(null)
    setNameError(null)
    setShowNameModal(true)
  }, [allPicksComplete, submitted, submitting, betsMaxed])

  const confirmBetName = useCallback(() => {
    const trimmed = betName.trim()
    if (!trimmed) {
      setNameError('Name is required')
      return
    }
    if (trimmed.length < 3) {
      setNameError('Minimum 3 characters')
      return
    }
    if (existingBets.some(b => b.bet_name.toLowerCase() === trimmed.toLowerCase())) {
      setNameError('You already have a bet with that name')
      return
    }
    setNameError(null)
    setShowNameModal(false)
    performSave(trimmed)
  }, [betName, existingBets, performSave])

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
          Select the winner of each match. Complete the bracket to pick your champion.
        </p>
      </div>

      {betsMaxed && !submitted && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center">
          <p className="font-[family-name:var(--font-bebas)] text-lg tracking-wide text-red-400">
            LIMIT REACHED
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            You have already created 2 bets. You cannot create more.
          </p>
        </div>
      )}

      {existingBets.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="font-[family-name:var(--font-bebas)] text-sm tracking-wide text-text-secondary">
            YOUR BETS ({existingBets.length}/2)
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {existingBets.map(b => (
              <span key={b.id} className="rounded-full border border-accent-green/20 bg-accent-green/5 px-3 py-1 text-xs text-accent-green">
                {b.bet_name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onEditGroups}
          disabled={submitted}
          className="rounded-full border border-white/20 px-5 py-2 text-xs font-bold tracking-wide text-text-secondary transition-all hover:border-white/40 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← EDIT GROUPS
        </button>
        <button
          onClick={onEditThirdPlace}
          disabled={submitted}
          className="rounded-full border border-white/20 px-5 py-2 text-xs font-bold tracking-wide text-text-secondary transition-all hover:border-white/40 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← EDIT 3RD PLACES
        </button>

        {submitted && (
          <span className="rounded-full border border-accent-green/30 bg-accent-green/10 px-4 py-1.5 text-xs font-bold tracking-wide text-accent-green">
            ✓ PREDICTION SUBMITTED
          </span>
        )}
      </div>

      {submitError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center text-sm text-red-400">
          {submitError}
        </div>
      )}

      {saveSuccess && (
        <section
          className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
          style={{ height: '100dvh', width: '100dvw' }}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${Trump.src})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
          <div className="absolute inset-0 bg-[#0a0e1a]/60" />
          <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-6 px-6 text-center max-w-4xl">
            <h1
              className="font-[family-name:var(--font-bebas)] text-fifa-gold drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)] leading-none"
              style={{ fontSize: 'clamp(2.25rem, 7vw, 7rem)' }}
            >
              MAKE PORRA GREAT AGAIN
            </h1>
            {champion && (
              <p className="flex items-center gap-2 text-base sm:text-lg md:text-xl text-white/80 drop-shadow-md">
                <CountryFlag name={champion} width={24} className="shrink-0" />
                {champion}
              </p>
            )}
            <p className="text-xs sm:text-sm text-text-secondary drop-shadow-md">
              ID: {saveSuccess.predictionId.slice(0, 8)}... — You can no longer modify your prediction.
            </p>
          </div>
        </section>
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
          {betsMaxed ? (
            <div className="text-center">
              <p className="text-sm text-text-secondary">Limit of 2 bets reached</p>
            </div>
          ) : (
            <button
              onClick={handleSaveBet}
              disabled={!allPicksComplete || submitting}
              className="relative rounded-full bg-accent-green px-12 py-4 text-base font-bold tracking-wide text-black transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(0,230,118,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  SUBMITTING...
                </span>
              ) : (
                'SAVE BET'
              )}
            </button>
          )}
        </div>
      )}

      {/* Bet name modal */}
      {showNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowNameModal(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0e1a] p-6 shadow-2xl">
            <p className="font-[family-name:var(--font-bebas)] text-xl tracking-wide text-white">
              NAME YOUR BET
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              Give your bet a unique name (e.g. "My Bet #1")
            </p>
            <input
              type="text"
              value={betName}
              onChange={e => { setBetName(e.target.value); setNameError(null) }}
              placeholder="E.g. My Prediction 1"
              className="mt-4 w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder-text-secondary outline-none transition-colors focus:border-accent-green"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') confirmBetName() }}
            />
            {nameError && (
              <p className="mt-2 text-sm text-red-400">{nameError}</p>
            )}
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => { setShowNameModal(false); setNameError(null) }}
                className="flex-1 rounded-full border border-white/20 px-5 py-2.5 text-xs font-bold tracking-wide text-text-secondary transition-all hover:border-white/40 hover:text-white"
              >
                CANCEL
              </button>
              <button
                onClick={confirmBetName}
                disabled={submitting}
                className="flex-1 rounded-full bg-accent-green px-5 py-2.5 text-xs font-bold tracking-wide text-black transition-all duration-200 hover:shadow-[0_0_20px_rgba(0,230,118,0.3)] disabled:opacity-50"
              >
                {submitting ? 'SAVING...' : 'CONFIRM'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
