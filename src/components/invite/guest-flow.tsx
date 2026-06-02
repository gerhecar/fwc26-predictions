'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { GroupCard } from '@/components/predictions/group-card'
import { BracketLayout } from '@/components/predictions/bracket-layout'
import { CountryFlag } from '@/components/ui/country-flag'
import { GROUP_LETTERS, GROUP_TEAMS } from '@/lib/predictions/constants'
import { lookupAnnexC } from '@/lib/groups/annex-c'
import type { GroupLetter } from '@/types'

type Step = 'groups' | 'third-place' | 'knockout'

const STEPS: { key: Step; label: string; num: number }[] = [
  { key: 'groups', label: 'FASE DE GRUPOS', num: 1 },
  { key: 'third-place', label: 'TERCEROS LUGARES', num: 2 },
  { key: 'knockout', label: 'KNOCKOUT', num: 3 },
]

function isStepComplete(step: Step, currentStep: Step): boolean {
  const order: Step[] = ['groups', 'third-place', 'knockout']
  return order.indexOf(step) < order.indexOf(currentStep)
}

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

interface GuestFlowProps {
  token: string
}

export function GuestFlow({ token }: GuestFlowProps) {
  const [step, setStep] = useState<Step>('groups')
  const [groupPredictions, setGroupPredictions] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {}
    for (const letter of GROUP_LETTERS) {
      initial[letter] = GROUP_TEAMS[letter]
    }
    return initial
  })
  const [thirdPlaceSelection, setThirdPlaceSelection] = useState<string[]>([])
  const [bracketPicks, setBracketPicks] = useState<Record<number, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [betName, setBetName] = useState('')
  const [showNameModal, setShowNameModal] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  const handleSetGroupOrder = useCallback((letter: string, teams: string[]) => {
    setGroupPredictions(prev => {
      const updated = { ...prev, [letter]: teams }
      // Prune third place selections that no longer have a valid third team
      const stale = thirdPlaceSelection.filter(l => {
        const t = updated[l]
        return !t || t.length < 3
      })
      if (stale.length > 0) {
        setThirdPlaceSelection(prev => prev.filter(l => !stale.includes(l)))
      }
      // Prune bracket picks for teams no longer qualified
      const qualified = new Set<string>()
      for (const l of GROUP_LETTERS) {
        const t = updated[l]
        if (t && t.length >= 2) {
          qualified.add(t[0])
          qualified.add(t[1])
        }
        if (thirdPlaceSelection.includes(l) && updated[l]?.[2]) {
          qualified.add(updated[l][2])
        }
      }
      setBracketPicks(prev => {
        const next: Record<number, string> = {}
        for (const [mn, team] of Object.entries(prev)) {
          if (qualified.has(team)) next[Number(mn)] = team
        }
        return next
      })
      return updated
    })
  }, [thirdPlaceSelection])

  const toggleThirdPlace = useCallback((letter: string) => {
    setThirdPlaceSelection(prev => {
      if (prev.includes(letter)) {
        const next = prev.filter(l => l !== letter)
        // Prune bracket picks
        const qualified = new Set<string>()
        for (const l of GROUP_LETTERS) {
          const t = groupPredictions[l]
          if (t && t.length >= 2) {
            qualified.add(t[0])
            qualified.add(t[1])
          }
          if (next.includes(l) && groupPredictions[l]?.[2]) {
            qualified.add(groupPredictions[l][2])
          }
        }
        setBracketPicks(prev => {
          const p: Record<number, string> = {}
          for (const [mn, team] of Object.entries(prev)) {
            if (qualified.has(team)) p[Number(mn)] = team
          }
          return p
        })
        return next
      }
      if (prev.length >= 8) return prev
      const next = [...prev, letter]
      return next
    })
  }, [groupPredictions])

  const allGroupsComplete = GROUP_LETTERS.every(l => (groupPredictions[l]?.length ?? 0) === 4)

  // Third place helpers
  const getThirdPlaceTeam = useCallback((letter: string): string | null => {
    const teams = groupPredictions[letter]
    if (!teams || teams.length < 3) return GROUP_TEAMS[letter]?.[2] || null
    return teams[2]
  }, [groupPredictions])

  const thirdTeams = GROUP_LETTERS
    .filter(l => groupPredictions[l] && groupPredictions[l].length >= 3)
    .map(l => ({ letter: l, team: getThirdPlaceTeam(l) }))

  // Knockout
  const thirdAssignments = useMemo(() => {
    return lookupAnnexC(thirdPlaceSelection as GroupLetter[])
  }, [thirdPlaceSelection])

  const getTeam = useCallback((pos: 'winner' | 'runner_up', letter: string): string | null => {
    const teams = groupPredictions[letter]
    if (!teams) return null
    return pos === 'winner' ? teams[0] : teams[1]
  }, [groupPredictions])

  const getThird = useCallback((letter: string): string | null => {
    return getThirdPlaceTeam(letter)
  }, [getThirdPlaceTeam])

  const baseMatches = useMemo(() => {
    interface MatchSlot {
      matchNumber: number
      stage: string
      homeTeam: string | null
      awayTeam: string | null
      homeLabel: string
      awayLabel: string
    }

    const R32_FIXED: Record<number, { homeLabel: string; awayLabel: string; homeGroup: { pos: 'winner' | 'runner_up'; letter: string }; awayGroup: { pos: 'winner' | 'runner_up'; letter: string } }> = {
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

    const matches: MatchSlot[] = []

    for (const [matchNum, info] of Object.entries(R32_FIXED)) {
      matches.push({
        matchNumber: Number(matchNum),
        stage: 'round_of_32',
        homeTeam: getTeam(info.homeGroup.pos, info.homeGroup.letter),
        awayTeam: getTeam(info.awayGroup.pos, info.awayGroup.letter),
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
        homeTeam: null, awayTeam: null,
        homeLabel: `Ganador #${child1}`,
        awayLabel: `Ganador #${child2}`,
      })
    }

    const qf: [number, number, number][] = [
      [97, 89, 90], [98, 93, 94], [99, 91, 92], [100, 95, 96],
    ]
    for (const [matchNum, child1, child2] of qf) {
      matches.push({
        matchNumber: matchNum, stage: 'quarter_final',
        homeTeam: null, awayTeam: null,
        homeLabel: `Ganador #${child1}`, awayLabel: `Ganador #${child2}`,
      })
    }

    const sf: [number, number, number][] = [
      [101, 97, 98], [102, 99, 100],
    ]
    for (const [matchNum, child1, child2] of sf) {
      matches.push({
        matchNumber: matchNum, stage: 'semi_final',
        homeTeam: null, awayTeam: null,
        homeLabel: `Ganador #${child1}`, awayLabel: `Ganador #${child2}`,
      })
    }

    matches.push({
      matchNumber: 104, stage: 'final',
      homeTeam: null, awayTeam: null,
      homeLabel: 'Ganador #101', awayLabel: 'Ganador #102',
    })

    return matches.sort((a, b) => a.matchNumber - b.matchNumber)
  }, [getTeam, getThird, thirdAssignments])

  function resolveMatch(
    match: { matchNumber: number; stage: string; homeTeam: string | null; awayTeam: string | null; homeLabel: string; awayLabel: string },
  ): { home: string | null; away: string | null } {
    const homeTeam = resolveTeam(match.homeTeam, match.homeLabel)
    const awayTeam = resolveTeam(match.awayTeam, match.awayLabel)
    return { home: homeTeam, away: awayTeam }
  }

  function resolveTeam(directTeam: string | null, label: string): string | null {
    if (directTeam) return directTeam
    const match = label.match(/#(\d+)/)
    const childMatchNum = match ? parseInt(match[1], 10) : null
    if (childMatchNum !== null && bracketPicks[childMatchNum]) {
      return bracketPicks[childMatchNum]
    }
    return null
  }

  const resolvedMatches = useMemo(() => {
    return baseMatches.map(m => {
      const resolved = resolveMatch(m)
      return { ...m, homeTeam: resolved.home || m.homeTeam, awayTeam: resolved.away || m.awayTeam }
    })
  }, [baseMatches, bracketPicks]) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePick = useCallback((matchNumber: number, team: string) => {
    if (submitted) return
    setBracketPicks(prev => {
      const next = { ...prev, [matchNumber]: team }
      for (const mn of getAffected(matchNumber)) {
        delete next[mn]
      }
      return next
    })
  }, [submitted])

  const handleClear = useCallback((matchNumber: number) => {
    if (submitted) return
    setBracketPicks(prev => {
      const next = { ...prev }
      delete next[matchNumber]
      for (const mn of getAffected(matchNumber)) {
        delete next[mn]
      }
      return next
    })
  }, [submitted])

  const allPicksComplete = baseMatches.every(m => !!bracketPicks[m.matchNumber])
  const champion = bracketPicks[104] || null

  const performSave = useCallback(async (name: string) => {
    if (!allPicksComplete || submitted || submitting) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch(`/api/invite/${token}/save`, {
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
      if (!res.ok) throw new Error(data.error || 'Error al guardar')
      setSubmitted(true)
      setSaveSuccess(data.predictionId)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSubmitting(false)
    }
  }, [allPicksComplete, submitted, submitting, groupPredictions, thirdPlaceSelection, bracketPicks, token])

  const handleSaveBet = useCallback(() => {
    if (!allPicksComplete || submitted || submitting) return
    setSubmitError(null)
    setNameError(null)
    setShowNameModal(true)
  }, [allPicksComplete, submitted, submitting])

  const confirmBetName = useCallback(() => {
    const trimmed = betName.trim()
    if (!trimmed) { setNameError('El nombre es obligatorio'); return }
    if (trimmed.length < 3) { setNameError('Mínimo 3 caracteres'); return }
    setNameError(null)
    setShowNameModal(false)
    performSave(trimmed)
  }, [betName, performSave])

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 animate-fade-in">
      {/* Stepper */}
      <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
        <div className="flex items-center justify-center gap-0">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-200 ${
                  s.key === step
                    ? 'bg-accent-green text-black shadow-lg shadow-accent-green/30'
                    : isStepComplete(s.key, step)
                      ? 'bg-accent-green/30 text-accent-green'
                      : 'bg-white/10 text-text-secondary'
                }`}>
                  {isStepComplete(s.key, step) ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="2 7 5.5 10.5 12 4" />
                    </svg>
                  ) : s.num}
                </span>
                <span className={`text-[11px] font-[family-name:var(--font-bebas)] tracking-widest transition-colors duration-200 ${
                  s.key === step ? 'text-white' : 'text-text-secondary'
                }`}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`mx-3 mb-6 h-px w-12 sm:w-20 transition-colors duration-200 ${
                  isStepComplete(STEPS[i + 1].key, step) ? 'bg-accent-green/50' : 'bg-white/10'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Groups Step */}
      {step === 'groups' && (
        <div className="flex flex-col gap-6 animate-fade-in">
          <div className="border-b border-white/10 pb-5">
            <h1 className="font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-white sm:text-4xl">
              FASE DE GRUPOS
            </h1>
            <p className="mt-2 text-sm text-text-secondary max-w-2xl">
              Ordena los 4 equipos de cada grupo arrastrando. El 1° y 2° lugar avanzan a octavos; el 3° lugar puede clasificar entre los mejores terceros.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {GROUP_LETTERS.map(letter => (
              <GroupCard key={letter} letter={letter} orderedTeams={groupPredictions[letter] || []} onReorder={handleSetGroupOrder} />
            ))}
          </div>
          <div className="flex items-center justify-center border-t border-white/10 pt-6">
            <button
              onClick={() => setStep('third-place')}
              disabled={!allGroupsComplete}
              className={`relative rounded-full px-12 py-3.5 text-base font-bold tracking-wide transition-all duration-200 ${
                allGroupsComplete
                  ? 'bg-accent-green text-black shadow-lg shadow-accent-green/30 hover:shadow-accent-green/50 hover:scale-[1.02]'
                  : 'cursor-not-allowed bg-white/5 text-text-secondary border border-white/10'
              }`}
            >
              CONTINUAR A TERCEROS LUGARES
            </button>
          </div>
        </div>
      )}

      {/* Third Place Step */}
      {step === 'third-place' && (
        <div className="flex flex-col gap-6 animate-fade-in">
          <div className="border-b border-white/10 pb-5">
            <h1 className="font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-white sm:text-4xl">
              TERCEROS LUGARES
            </h1>
            <p className="mt-2 text-sm text-text-secondary max-w-2xl">
              Selecciona exactamente 8 grupos cuyos terceros lugares avanzarán a octavos de final.
            </p>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
            <span className="text-sm font-medium text-text-secondary">Grupos seleccionados</span>
            <span className={`text-xl font-bold font-[family-name:var(--font-bebas)] tracking-wide transition-colors ${
              thirdPlaceSelection.length === 8 ? 'text-accent-green' : 'text-text-secondary'
            }`}>{thirdPlaceSelection.length}/8</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {thirdTeams.map(({ letter, team }) => {
              const isSelected = thirdPlaceSelection.includes(letter)
              return (
                <button
                  key={letter}
                  onClick={() => toggleThirdPlace(letter)}
                  disabled={!isSelected && thirdPlaceSelection.length >= 8}
                  className={`group relative flex flex-col items-center gap-2.5 rounded-2xl border p-5 text-center transition-all duration-200 ${
                    isSelected
                      ? 'border-accent-green/60 bg-accent-green/5 shadow-[0_0_20px_rgba(0,230,118,0.12)] scale-[1.02]'
                      : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]'
                  } ${
                    !isSelected && thirdPlaceSelection.length >= 8 ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
                  }`}
                >
                  <span className={`text-sm font-[family-name:var(--font-bebas)] tracking-widest transition-colors ${
                    isSelected ? 'text-accent-green' : 'text-text-secondary group-hover:text-white'
                  }`}>GRUPO {letter}</span>
                  {team && (
                    <span className="flex flex-col items-center gap-1">
                      <CountryFlag name={team} width={28} className="shrink-0" />
                      <span className={`text-sm font-medium transition-colors ${isSelected ? 'text-white' : 'text-text-secondary'}`}>{team}</span>
                    </span>
                  )}
                  {isSelected && (
                    <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-accent-green">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="2 7 5.5 10.5 12 4" />
                      </svg>
                      Avanza
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          <div className="flex items-center justify-center gap-4 border-t border-white/10 pt-6">
            <button
              onClick={() => setStep('groups')}
              className="rounded-full border border-white/20 px-8 py-3 text-sm font-bold tracking-wide text-text-secondary transition-all hover:border-white/40 hover:text-white"
            >
              ← EDITAR GRUPOS
            </button>
            <button
              onClick={() => setStep('knockout')}
              disabled={thirdPlaceSelection.length !== 8}
              className={`relative rounded-full px-12 py-3.5 text-base font-bold tracking-wide transition-all duration-200 ${
                thirdPlaceSelection.length === 8
                  ? 'bg-accent-green text-black shadow-lg shadow-accent-green/30 hover:shadow-accent-green/50 hover:scale-[1.02]'
                  : 'cursor-not-allowed bg-white/5 text-text-secondary border border-white/10'
              }`}
            >
              {thirdPlaceSelection.length === 8 ? 'GUARDAR Y CONTINUAR AL KNOCKOUT' : `SELECCIONA ${8 - thirdPlaceSelection.length} MÁS`}
            </button>
          </div>
        </div>
      )}

      {/* Knockout Step */}
      {step === 'knockout' && (
        <div className="flex flex-col gap-6 animate-fade-in">
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
              onClick={() => setStep('groups')}
              className="rounded-full border border-white/20 px-5 py-2 text-xs font-bold tracking-wide text-text-secondary transition-all hover:border-white/40 hover:text-white"
            >
              ← EDITAR GRUPOS
            </button>
            <button
              onClick={() => setStep('third-place')}
              className="rounded-full border border-white/20 px-5 py-2 text-xs font-bold tracking-wide text-text-secondary transition-all hover:border-white/40 hover:text-white"
            >
              ← EDITAR 3° LUGARES
            </button>
          </div>

          {submitError && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center text-sm text-red-400">
              {submitError}
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
                ) : 'GUARDAR APUESTA'}
              </button>
            </div>
          )}

          {saveSuccess && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-green/20">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-green">
                  <polyline points="4 12 9 17 20 6" />
                </svg>
              </div>
              <h2 className="font-[family-name:var(--font-bebas)] text-2xl tracking-wide text-accent-green">
                APUESTA ENVIADA
              </h2>
              {champion && (
                <p className="flex items-center gap-2 text-white">
                  <CountryFlag name={champion} width={24} className="shrink-0" />
                  {champion}
                </p>
              )}
              <p className="text-sm text-text-secondary">
                Tu apuesta ha sido guardada exitosamente.
              </p>
            </div>
          )}

          {submitted && !saveSuccess && (
            <div className="flex justify-center pt-4">
              <span className="rounded-full border border-accent-green/30 bg-accent-green/10 px-4 py-1.5 text-xs font-bold tracking-wide text-accent-green">
                ✓ APUESTA ENVIADA
              </span>
            </div>
          )}
        </div>
      )}

      {/* Bet name modal */}
      {showNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowNameModal(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0e1a] p-6 shadow-2xl">
            <p className="font-[family-name:var(--font-bebas)] text-xl tracking-wide text-white">
              NOMBRA TU APUESTA
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              Ponle un nombre único a tu apuesta (ej: &quot;Mi Porra #1&quot;)
            </p>
            <input
              type="text"
              value={betName}
              onChange={e => { setBetName(e.target.value); setNameError(null) }}
              placeholder="Ej: Mi Pronóstico 1"
              className="mt-4 w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder-text-secondary outline-none transition-colors focus:border-accent-green"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') confirmBetName() }}
            />
            {nameError && <p className="mt-2 text-sm text-red-400">{nameError}</p>}
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => { setShowNameModal(false); setNameError(null) }}
                className="flex-1 rounded-full border border-white/20 px-5 py-2.5 text-xs font-bold tracking-wide text-text-secondary transition-all hover:border-white/40 hover:text-white"
              >
                CANCELAR
              </button>
              <button
                onClick={confirmBetName}
                disabled={submitting}
                className="flex-1 rounded-full bg-accent-green px-5 py-2.5 text-xs font-bold tracking-wide text-black transition-all duration-200 hover:shadow-[0_0_20px_rgba(0,230,118,0.3)] disabled:opacity-50"
              >
                {submitting ? 'GUARDANDO...' : 'CONFIRMAR'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
