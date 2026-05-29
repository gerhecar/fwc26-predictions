'use client'

import { useMemo } from 'react'
import { BracketMatchCard } from './bracket-match-card'

interface MatchSlot {
  matchNumber: number
  stage: string
  homeTeam: string | null
  awayTeam: string | null
  homeLabel: string
  awayLabel: string
}

interface BracketLayoutProps {
  matches: MatchSlot[]
  bracketPicks: Record<number, string>
  submitted: boolean
  columnLocked: Record<string, boolean>
  onPick: (matchNumber: number, team: string) => void
  onClear: (matchNumber: number) => void
}

const COLUMNS: { key: string; title: string; matchNumbers: number[] }[] = [
  { key: 'r32', title: 'Round of 32', matchNumbers: [73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88] },
  { key: 'r16', title: 'Round of 16', matchNumbers: [89, 90, 91, 92, 93, 94, 95, 96] },
  { key: 'qf', title: 'Quarter Finals', matchNumbers: [97, 98, 99, 100] },
  { key: 'sf', title: 'Semi Finals', matchNumbers: [101, 102] },
  { key: 'final', title: 'Final', matchNumbers: [104] },
  { key: 'third', title: 'Third Place', matchNumbers: [103] },
]

interface ColumnProps {
  title: string
  matchNumbers: number[]
  matchMap: Record<number, MatchSlot>
  bracketPicks: Record<number, string>
  submitted: boolean
  roundLocked: boolean
  onPick: (matchNumber: number, team: string) => void
  onClear: (matchNumber: number) => void
}

function RoundColumn({ title, matchNumbers, matchMap, bracketPicks, submitted, roundLocked, onPick, onClear }: ColumnProps) {
  return (
    <div className="flex w-[210px] shrink-0 flex-col gap-3">
      <div className="sticky top-0 z-10 pb-1">
        <h3 className="font-[family-name:var(--font-bebas)] text-sm tracking-[0.2em] text-accent-gold/60 uppercase">
          {title}
        </h3>
      </div>
      {matchNumbers.map((mn) => {
        const m = matchMap[mn]
        if (!m) return null
        return (
          <BracketMatchCard
            key={mn}
            matchNumber={m.matchNumber}
            stage={m.stage}
            homeTeam={m.homeTeam}
            awayTeam={m.awayTeam}
            homeLabel={m.homeLabel}
            awayLabel={m.awayLabel}
            winner={bracketPicks[m.matchNumber] || null}
            locked={submitted}
            roundLocked={roundLocked}
            onPick={onPick}
            onClear={onClear}
          />
        )
      })}
    </div>
  )
}

export function BracketLayout({ matches, bracketPicks, submitted, columnLocked, onPick, onClear }: BracketLayoutProps) {
  const matchMap = useMemo(() => {
    const map: Record<number, MatchSlot> = {}
    for (const m of matches) map[m.matchNumber] = m
    return map
  }, [matches])

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-6 min-w-[900px]">
        {COLUMNS.map((col, i) => (
          <div key={col.key} className="flex items-start gap-3">
            <RoundColumn
              title={col.title}
              matchNumbers={col.matchNumbers}
              matchMap={matchMap}
              bracketPicks={bracketPicks}
              submitted={submitted}
              roundLocked={columnLocked[col.key] ?? false}
              onPick={onPick}
              onClear={onClear}
            />
            {i < COLUMNS.length - 1 && (
              <div className="mt-8 flex h-full items-start pt-1">
                <span className="text-text-secondary/20 text-lg select-none">→</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
