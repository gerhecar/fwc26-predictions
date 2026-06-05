'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CountryFlag } from '@/components/ui/country-flag'
import { GROUP_LETTERS, GROUP_TEAMS } from '@/lib/predictions/constants'
import { BackToAdmin } from './back-to-admin'
import { lookupAnnexC } from '@/lib/groups/annex-c'
import type { GroupLetter } from '@/types'

interface OfficialResults {
  groupStage: Record<string, string[]>
  bestThirdPlaced: string[]
  knockout: Record<number, string>
  champion: string | null
}

interface SavedData {
  results: OfficialResults
  status: string
}

type Tab = 'groups' | 'third' | 'knockout'

/* ─── Sortable Team Row ─── */
function SortableTeam({ team, rank }: { team: string; rank: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: team })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto' as const,
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex cursor-grab items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white active:cursor-grabbing"
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-text-secondary bg-white/10">
        {rank}
      </span>
      <CountryFlag name={team} width={18} className="shrink-0" />
      <span className="flex-1">{team}</span>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" className="text-white/20">
        <circle cx="4" cy="4" r="1.5" /><circle cx="10" cy="4" r="1.5" />
        <circle cx="4" cy="10" r="1.5" /><circle cx="10" cy="10" r="1.5" />
      </svg>
    </div>
  )
}

/* ─── Group Stage Tab ─── */
function GroupStageTab({
  groupStage,
  onChange,
}: {
  groupStage: Record<string, string[]>
  onChange: (v: Record<string, string[]>) => void
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleDragEnd = (letter: string) => (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const teams = groupStage[letter] || GROUP_TEAMS[letter]
    const oldIndex = teams.indexOf(active.id as string)
    const newIndex = teams.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return
    onChange({ ...groupStage, [letter]: arrayMove(teams, oldIndex, newIndex) })
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {GROUP_LETTERS.map((letter) => {
        const teams = groupStage[letter] || GROUP_TEAMS[letter]
        return (
          <div key={letter} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="font-[family-name:var(--font-bebas)] text-base tracking-wide text-white mb-3">
              Group {letter}
            </p>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd(letter)}>
              <SortableContext items={teams} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-1.5">
                  {teams.map((team, i) => (
                    <SortableTeam key={team} team={team} rank={i + 1} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Third Placed Tab ─── */
function ThirdPlacedTab({
  groupStage,
  selected,
  onChange,
}: {
  groupStage: Record<string, string[]>
  selected: string[]
  onChange: (v: string[]) => void
}) {
  const thirdTeams = GROUP_LETTERS.filter(l => groupStage[l] && groupStage[l].length >= 3)
    .map(l => ({ letter: l, team: groupStage[l][2] }))

  const toggle = (letter: string) => {
    if (selected.includes(letter)) {
      onChange(selected.filter(l => l !== letter))
    } else if (selected.length < 8) {
      onChange([...selected, letter])
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-text-secondary">
        Select exactly 8 teams that finished 3rd in their group ({selected.length}/8)
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {thirdTeams.map(({ letter, team }) => {
          const isSelected = selected.includes(letter)
          return (
            <button
              key={letter}
              onClick={() => toggle(letter)}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm text-left transition-all ${
                isSelected
                  ? 'border-accent-green/40 bg-accent-green/10 text-white'
                  : 'border-white/10 bg-white/5 text-text-secondary hover:border-white/30'
              }`}
            >
              <div className={`flex h-5 w-5 items-center justify-center rounded border ${
                isSelected ? 'border-accent-green bg-accent-green text-black' : 'border-white/20'
              }`}>
                {isSelected && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="2 6 4.5 8.5 10 3" />
                  </svg>
                )}
              </div>
              <CountryFlag name={team} width={18} className="shrink-0" />
              <span className="flex-1">{team}</span>
              <span className="text-[10px] text-text-secondary">3rd Group {letter}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Knockout Tab ─── */
const R32_DEFS: Record<number, string> = {
  73: '2°A vs 2°B', 75: '1°F vs 2°C', 76: '1°C vs 2°F',
  78: '2°E vs 2°I', 83: '2°K vs 2°L', 84: '1°H vs 2°J',
  86: '1°J vs 2°H', 88: '2°D vs 2°G',
}

const R32_THIRD: Record<number, string> = {
  74: '1°E vs 3°', 77: '1°I vs 3°', 79: '1°A vs 3°',
  80: '1°L vs 3°', 81: '1°D vs 3°', 82: '1°G vs 3°',
  85: '1°B vs 3°', 87: '1°K vs 3°',
}

const CHILD_MAP: Record<number, [number, number]> = {
  89: [74, 77], 90: [73, 75], 91: [76, 78], 92: [79, 80],
  93: [83, 84], 94: [81, 82], 95: [86, 88], 96: [85, 87],
  97: [89, 90], 98: [93, 94], 99: [91, 92], 100: [95, 96],
  101: [97, 98], 102: [99, 100],
  104: [101, 102],
}

const STAGE_LABELS: Record<string, string> = {
  r32: 'ROUND OF 32', r16: 'ROUND OF 16', qf: 'QUARTER FINALS', sf: 'SEMI FINALS', f: 'FINAL',
}
const STAGE_KEYS = ['r32', 'r16', 'qf', 'sf', 'f']

function getMatchLabel(mn: number): string {
  if (R32_DEFS[mn]) return R32_DEFS[mn]
  if (R32_THIRD[mn]) return R32_THIRD[mn]
  if (CHILD_MAP[mn]) {
    const [a, b] = CHILD_MAP[mn]
    return `#${a} vs #${b}`
  }
  return `#${mn}`
}

function getStage(mn: number): string {
  if (mn <= 88) return 'r32'
  if (mn <= 96) return 'r16'
  if (mn <= 100) return 'qf'
  if (mn <= 102) return 'sf'
  return 'f'
}

function KnockoutTab({
  groupStage,
  bestThirdPlaced,
  knockout,
  onChange,
}: {
  groupStage: Record<string, string[]>
  bestThirdPlaced: string[]
  knockout: Record<number, string>
  onChange: (v: Record<number, string>) => void
}) {
  const getTeam = useCallback((letter: string, pos: number) => {
    return groupStage[letter]?.[pos] ?? null
  }, [groupStage])

  const getThird = useCallback((letter: string) => {
    return groupStage[letter]?.[2] ?? null
  }, [groupStage])

  const thirdAssignments = useMemo(() => {
    if (bestThirdPlaced.length < 8) return null
    return lookupAnnexC(bestThirdPlaced as GroupLetter[])
  }, [bestThirdPlaced])

  const matchTeams = useCallback((mn: number): [string | null, string | null] => {
    if (R32_DEFS[mn]) {
      const [a, b] = R32_DEFS[mn].split(' vs ')
      const aMatch = a.match(/^(\d+)°(?: Grupo )?([A-L])$/)
      const bMatch = b.match(/^(\d+)°(?: Grupo )?([A-L])$/)
      return [
        aMatch ? getTeam(aMatch[2], parseInt(aMatch[1]) - 1) : null,
        bMatch ? getTeam(bMatch[2], parseInt(bMatch[1]) - 1) : null,
      ]
    }
    if (R32_THIRD[mn]) {
      const [a, b] = R32_THIRD[mn].split(' vs ')
      const aMatch = a.match(/^(\d+)°(?: Grupo )?([A-L])$/)
      if (aMatch && b.startsWith('3°')) {
        const thirdLetter = thirdAssignments?.[mn] ?? null
        return [
          getTeam(aMatch[2], parseInt(aMatch[1]) - 1),
          thirdLetter ? getThird(thirdLetter) : null,
        ]
      }
    }
    if (CHILD_MAP[mn]) {
      const [c1, c2] = CHILD_MAP[mn]
      return [knockout[c1] ?? null, knockout[c2] ?? null]
    }
    return [null, null]
  }, [R32_DEFS, R32_THIRD, CHILD_MAP, getTeam, getThird, knockout, thirdAssignments])

  const getAffected = useCallback((mn: number): number[] => {
    const result: number[] = []
    const stack = [mn]
    while (stack.length) {
      const cur = stack.pop()!
      for (const [parent, children] of Object.entries(CHILD_MAP)) {
        if (children.includes(cur) && !result.includes(Number(parent))) {
          result.push(Number(parent))
          stack.push(Number(parent))
        }
      }
    }
    return result
  }, [])

  const selectWinner = (mn: number, winner: string | null) => {
    const next = { ...knockout }
    if (winner === null) {
      delete next[mn]
    } else {
      next[mn] = winner
    }
    // Clear downstream
    for (const d of getAffected(mn)) {
      delete next[d]
    }
    onChange(next)
  }

  const clearMatch = (mn: number) => {
    const next = { ...knockout }
    delete next[mn]
    for (const d of getAffected(mn)) {
      delete next[d]
    }
    onChange(next)
  }

  // Group matches by stage
  const stageMatches: Record<string, number[]> = { r32: [], r16: [], qf: [], sf: [], f: [] }
  const allMatchNumbers = [
    ...Object.keys(R32_DEFS).map(Number),
    ...Object.keys(R32_THIRD).map(Number),
    ...Object.keys(CHILD_MAP).map(Number),
  ]
  for (const mn of allMatchNumbers) {
    const s = getStage(mn)
    stageMatches[s].push(mn)
  }
  for (const k of STAGE_KEYS) {
    stageMatches[k].sort((a, b) => a - b)
  }

  const r32resolved = useMemo(() => {
    const ms = [...Object.keys(R32_DEFS).map(Number), ...Object.keys(R32_THIRD).map(Number)]
    return ms.some(mn => {
      const [h, a] = matchTeams(mn)
      return h || a
    })
  }, [matchTeams])

  return (
    <div className="flex flex-col gap-6">
      {!r32resolved && (
        <div className="rounded-xl border border-fifa-gold/30 bg-fifa-gold/5 p-4 text-sm text-fifa-gold text-center">
          <p className="font-[family-name:var(--font-bebas)] text-base tracking-wide">KNOCKOUT BRACKET NOT AVAILABLE</p>
          <p className="mt-1 text-text-secondary">
            Fill in Group Stage results and select Best Third-Placed teams first.
            Winners: {Object.keys(groupStage).filter(l => groupStage[l]?.length >= 1).length}/12 &mdash;
            Runners-up: {Object.keys(groupStage).filter(l => groupStage[l]?.length >= 2).length}/12 &mdash;
            Best thirds: {bestThirdPlaced.length}/8
          </p>
        </div>
      )}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${STAGE_KEYS.length}, minmax(220px, 1fr))` }}>
        {STAGE_KEYS.map(stage => (
          <div key={stage} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="font-[family-name:var(--font-bebas)] text-sm tracking-wide text-white mb-3">
              {STAGE_LABELS[stage]}
            </p>
            <div className="flex flex-col gap-2">
              {stageMatches[stage].map(mn => {
                const [home, away] = matchTeams(mn)
                const winner = knockout[mn] ?? null
                return (
                  <div key={mn} className="rounded-lg border border-white/10 bg-white/5 p-2.5 text-xs">
                    <div className="mb-1 text-[10px] text-text-secondary font-mono flex items-center justify-between">
                      <span>#{mn} {getMatchLabel(mn)}</span>
                      {winner && (
                        <button
                          onClick={() => clearMatch(mn)}
                          className="text-red-400 hover:text-red-300"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      {home && (
                        <button
                          onClick={() => selectWinner(mn, winner === home ? null : home)}
                          className={`flex items-center gap-1.5 rounded px-2 py-1 text-left transition-all ${
                            winner === home
                              ? 'bg-accent-green/20 text-accent-green border border-accent-green/30'
                              : 'text-text-secondary hover:bg-white/10'
                          }`}
                        >
                          <CountryFlag name={home} width={14} className="shrink-0" />
                          <span className="truncate">{home}</span>
                          {winner === home && <span className="ml-auto text-[10px]">✓</span>}
                        </button>
                      )}
                      {away && (
                        <button
                          onClick={() => selectWinner(mn, winner === away ? null : away)}
                          className={`flex items-center gap-1.5 rounded px-2 py-1 text-left transition-all ${
                            winner === away
                              ? 'bg-accent-green/20 text-accent-green border border-accent-green/30'
                              : 'text-text-secondary hover:bg-white/10'
                          }`}
                        >
                          <CountryFlag name={away} width={14} className="shrink-0" />
                          <span className="truncate">{away}</span>
                          {winner === away && <span className="ml-auto text-[10px]">✓</span>}
                        </button>
                      )}
                      {!home && !away && (
                        <span className="text-text-secondary italic">Waiting for previous round</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {knockout[104] && (
        <div className="flex justify-center">
          <div className="flex items-center gap-3 rounded-2xl border border-fifa-gold/30 bg-fifa-gold/5 px-8 py-4">
            <CountryFlag name={knockout[104]} width={32} />
            <div>
              <p className="font-[family-name:var(--font-bebas)] text-lg tracking-wide text-fifa-gold">OFFICIAL CHAMPION</p>
              <p className="text-white">{knockout[104]}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── MAIN PANEL ─── */
export function AdminResultsPanel({ tournamentId: _unused }: { tournamentId: string }) {
  const [tab, setTab] = useState<Tab>('groups')
  const [groupStage, setGroupStage] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {}
    for (const letter of GROUP_LETTERS) {
      initial[letter] = GROUP_TEAMS[letter]
    }
    return initial
  })
  const [bestThirdPlaced, setBestThirdPlaced] = useState<string[]>([])
  const [knockout, setKnockout] = useState<Record<number, string>>({})
  const [status, setStatus] = useState('draft')
  const [calculating, setCalculating] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/admin/results')
      .then(r => r.json())
      .then(data => {
        if (data.results) {
          setGroupStage(data.results.groupStage || {})
          setBestThirdPlaced(data.results.bestThirdPlaced || [])
          setKnockout(data.results.knockout || {})
        }
        setStatus(data.status || 'draft')
      })
      .catch(() => {})
  }, [])

  const handleCalculate = async () => {
    setCalculating(true)
    setMsg(null)
    try {
      const fullGroupStage: Record<string, string[]> = {}
      for (const letter of GROUP_LETTERS) {
        fullGroupStage[letter] = groupStage[letter] || [...GROUP_TEAMS[letter]]
      }
      const champion = knockout[104] || null
      const res = await fetch('/api/admin/results', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupStage: fullGroupStage, bestThirdPlaced, knockout, champion }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')

      if (data.summary) {
        const s = data.summary
        setMsg({
          type: 'ok',
          text: `Scores calculated: ${s.scoredBets} bet${s.scoredBets !== 1 ? 's' : ''} scored` +
            (s.skippedBets > 0 ? `, ${s.skippedBets} skipped` : '') +
            (s.errors.length > 0 ? `, ${s.errors.length} error${s.errors.length !== 1 ? 's' : ''}` : ''),
        })
      } else {
        setMsg({ type: 'ok', text: 'Results saved and scores calculated.' })
      }
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Error calculating scores' })
    } finally {
      setCalculating(false)
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'groups', label: 'GROUP STAGE' },
    { key: 'third', label: 'THIRD PLACES' },
    { key: 'knockout', label: 'KNOCKOUT' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <BackToAdmin />

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-lg px-4 py-2 text-xs font-bold tracking-wide transition-all ${
              tab === t.key
                ? 'bg-accent-green text-black shadow-lg shadow-accent-green/20'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'groups' && <GroupStageTab groupStage={groupStage} onChange={setGroupStage} />}
      {tab === 'third' && (
        <ThirdPlacedTab groupStage={groupStage} selected={bestThirdPlaced} onChange={setBestThirdPlaced} />
      )}
      {tab === 'knockout' && (
        <KnockoutTab groupStage={groupStage} bestThirdPlaced={bestThirdPlaced} knockout={knockout} onChange={setKnockout} />
      )}

      {/* Message */}
      {msg && (
        <div className={`rounded-xl border p-3 text-sm text-center ${
          msg.type === 'ok' ? 'border-accent-green/30 bg-accent-green/10 text-accent-green' : 'border-red-500/30 bg-red-500/10 text-red-400'
        }`}>
          {msg.text}
        </div>
      )}

      {/* Single action button */}
      <div className="flex justify-center pt-4 border-t border-white/10">
        <button
          onClick={handleCalculate}
          disabled={calculating}
          className="rounded-full bg-accent-green px-10 py-3 text-sm font-bold tracking-wide text-black transition-all hover:shadow-[0_0_20px_rgba(0,230,118,0.3)] disabled:opacity-50"
        >
          {calculating ? 'CALCULATING SCORES...' : 'CALCULATE SCORES'}
        </button>
      </div>
    </div>
  )
}
