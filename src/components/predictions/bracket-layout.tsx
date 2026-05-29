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
  onPick: (matchNumber: number, team: string) => void
  onClear: (matchNumber: number) => void
}

type Side = 'left' | 'right'

const LEFT_R32 = [73, 75, 74, 77, 76, 78, 79, 80] as const
const RIGHT_R32 = [81, 82, 83, 84, 85, 87, 86, 88] as const

function stageAbbrev(stage: string): string {
  switch (stage) {
    case 'round_of_32': return 'R32'
    case 'round_of_16': return 'R16'
    case 'quarter_final': return 'QF'
    case 'semi_final': return 'SF'
    case 'third_place': return '3RD'
    case 'final': return 'FINAL'
    default: return stage.toUpperCase()
  }
}

interface BracketSideProps {
  side: Side
  matches: MatchSlot[]
  bracketPicks: Record<number, string>
  submitted: boolean
  onPick: (matchNumber: number, team: string) => void
  onClear: (matchNumber: number) => void
}

function BracketSide({ side, matches, bracketPicks, submitted, onPick, onClear }: BracketSideProps) {
  const matchMap = useMemo(() => {
    const map: Record<number, MatchSlot> = {}
    for (const m of matches) map[m.matchNumber] = m
    return map
  }, [matches])

  const r32Nums = side === 'left' ? LEFT_R32 : RIGHT_R32

  const r16Nums = useMemo(() => {
    if (side === 'left') return [90, 89, 91, 92]
    return [94, 93, 96, 95]
  }, [side])

  const qfNums = useMemo(() => {
    if (side === 'left') return [97, 99]
    return [98, 100]
  }, [side])

  const sfNum = side === 'left' ? 101 : 102

  function rowOf(idx: number, total: number): number {
    return Math.floor(idx * (total / (total / 2)))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid auto-rows-auto gap-x-4 gap-y-2" style={{
        gridTemplateColumns: `repeat(4, minmax(190px, 1fr))`,
        gridAutoRows: 'auto',
      }}>
        {/* Round labels */}
        <div className="text-[10px] font-[family-name:var(--font-bebas)] tracking-[0.2em] text-accent-gold/50 uppercase text-center pb-1" style={{ gridColumn: '1', gridRow: '1' }}>R32</div>
        <div className="text-[10px] font-[family-name:var(--font-bebas)] tracking-[0.2em] text-accent-gold/50 uppercase text-center pb-1" style={{ gridColumn: '2', gridRow: '1' }}>R16</div>
        <div className="text-[10px] font-[family-name:var(--font-bebas)] tracking-[0.2em] text-accent-gold/50 uppercase text-center pb-1" style={{ gridColumn: '3', gridRow: '1' }}>QF</div>
        <div className="text-[10px] font-[family-name:var(--font-bebas)] tracking-[0.2em] text-accent-gold/50 uppercase text-center pb-1" style={{ gridColumn: '4', gridRow: '1' }}>SF</div>

        {/* R32 matches — one per row */}
        {r32Nums.map((mn, i) => {
          const m = matchMap[mn]
          if (!m) return null
          const row = i + 2
          return (
            <div key={mn} style={{ gridColumn: '1', gridRow: `${row}` }}>
              <BracketMatchCard
                matchNumber={m.matchNumber}
                stage={m.stage}
                homeTeam={m.homeTeam}
                awayTeam={m.awayTeam}
                homeLabel={m.homeLabel}
                awayLabel={m.awayLabel}
                winner={bracketPicks[m.matchNumber] || null}
                locked={submitted}
                onPick={onPick}
                onClear={onClear}
              />
            </div>
          )
        })}

        {/* R16 matches — span 2 rows each */}
        {r16Nums.map((mn, i) => {
          const m = matchMap[mn]
          if (!m) return null
          const rowStart = 2 + i * 2
          const rowEnd = rowStart + 2
          return (
            <div key={mn} style={{ gridColumn: '2', gridRow: `${rowStart} / ${rowEnd}`, display: 'flex', alignItems: 'center' }}>
              <BracketMatchCard
                matchNumber={m.matchNumber}
                stage={m.stage}
                homeTeam={m.homeTeam}
                awayTeam={m.awayTeam}
                homeLabel={m.homeLabel}
                awayLabel={m.awayLabel}
                winner={bracketPicks[m.matchNumber] || null}
                locked={submitted}
                onPick={onPick}
                onClear={onClear}
              />
            </div>
          )
        })}

        {/* QF matches — span 4 rows each */}
        {qfNums.map((mn, i) => {
          const m = matchMap[mn]
          if (!m) return null
          const rowStart = 2 + i * 4
          const rowEnd = rowStart + 4
          return (
            <div key={mn} style={{ gridColumn: '3', gridRow: `${rowStart} / ${rowEnd}`, display: 'flex', alignItems: 'center' }}>
              <BracketMatchCard
                matchNumber={m.matchNumber}
                stage={m.stage}
                homeTeam={m.homeTeam}
                awayTeam={m.awayTeam}
                homeLabel={m.homeLabel}
                awayLabel={m.awayLabel}
                winner={bracketPicks[m.matchNumber] || null}
                locked={submitted}
                onPick={onPick}
                onClear={onClear}
              />
            </div>
          )
        })}

        {/* SF match — spans all rows */}
        {(() => {
          const m = matchMap[sfNum]
          if (!m) return null
          return (
            <div key={sfNum} style={{ gridColumn: '4', gridRow: `2 / ${2 + r32Nums.length}`, display: 'flex', alignItems: 'center' }}>
              <BracketMatchCard
                matchNumber={m.matchNumber}
                stage={m.stage}
                homeTeam={m.homeTeam}
                awayTeam={m.awayTeam}
                homeLabel={m.homeLabel}
                awayLabel={m.awayLabel}
                winner={bracketPicks[m.matchNumber] || null}
                locked={submitted}
                onPick={onPick}
                onClear={onClear}
              />
            </div>
          )
        })()}
      </div>
    </div>
  )
}

export function BracketLayout({ matches, bracketPicks, submitted, onPick, onClear }: BracketLayoutProps) {
  const matchMap = useMemo(() => {
    const map: Record<number, MatchSlot> = {}
    for (const m of matches) map[m.matchNumber] = m
    return map
  }, [matches])

  const finalMatch = matchMap[104]
  const thirdMatch = matchMap[103]

  return (
    <div className="flex flex-col gap-6 overflow-x-auto pb-6">
      <div className="flex gap-6 min-w-[900px]">
        {/* Left side */}
        <div className="flex-1">
          <BracketSide
            side="left"
            matches={matches}
            bracketPicks={bracketPicks}
            submitted={submitted}
            onPick={onPick}
            onClear={onClear}
          />
        </div>

        {/* Center: Final + Third */}
        <div className="flex w-[220px] shrink-0 flex-col justify-center gap-6 px-2">
          {finalMatch && (
            <div className="text-center">
              <div className="mb-2 text-[10px] font-[family-name:var(--font-bebas)] tracking-[0.25em] text-accent-gold uppercase">FINAL</div>
              <BracketMatchCard
                matchNumber={finalMatch.matchNumber}
                stage={finalMatch.stage}
                homeTeam={finalMatch.homeTeam}
                awayTeam={finalMatch.awayTeam}
                homeLabel={finalMatch.homeLabel}
                awayLabel={finalMatch.awayLabel}
                winner={bracketPicks[finalMatch.matchNumber] || null}
                locked={submitted}
                onPick={onPick}
                onClear={onClear}
              />
            </div>
          )}
          {thirdMatch && (
            <div className="text-center">
              <div className="mb-2 text-[10px] font-[family-name:var(--font-bebas)] tracking-[0.25em] text-accent-gold/50 uppercase">3RD PLACE</div>
              <div className="scale-[0.92] opacity-70">
                <BracketMatchCard
                  matchNumber={thirdMatch.matchNumber}
                  stage={thirdMatch.stage}
                  homeTeam={thirdMatch.homeTeam}
                  awayTeam={thirdMatch.awayTeam}
                  homeLabel={thirdMatch.homeLabel}
                  awayLabel={thirdMatch.awayLabel}
                  winner={bracketPicks[thirdMatch.matchNumber] || null}
                  locked={submitted}
                  onPick={onPick}
                  onClear={onClear}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right side (reversed) */}
        <div className="flex-1">
          <BracketSide
            side="right"
            matches={matches}
            bracketPicks={bracketPicks}
            submitted={submitted}
            onPick={onPick}
            onClear={onClear}
          />
        </div>
      </div>
    </div>
  )
}
