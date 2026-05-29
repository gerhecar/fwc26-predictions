'use client'

import { CountryFlag } from '@/components/ui/country-flag'

interface BracketMatchCardProps {
  matchNumber: number
  stage: string
  homeTeam: string | null
  awayTeam: string | null
  homeLabel: string
  awayLabel: string
  winner: string | null
  locked: boolean
  onPick: (matchNumber: number, team: string) => void
  onClear: (matchNumber: number) => void
}

function isPlaceholder(label: string): boolean {
  return /^(Ganador|Perdedor)\s*#/.test(label)
}

export function BracketMatchCard({
  matchNumber,
  stage,
  homeTeam,
  awayTeam,
  homeLabel,
  awayLabel,
  winner,
  locked,
  onPick,
  onClear,
}: BracketMatchCardProps) {
  const hasWinner = !!winner
  const homePlaceholder = !homeTeam && isPlaceholder(homeLabel)
  const awayPlaceholder = !awayTeam && isPlaceholder(awayLabel)

  return (
    <div
      className={`relative rounded-xl border p-3 transition-all duration-200 ${
        hasWinner
          ? 'border-accent-green/50 bg-accent-green/[0.06] shadow-[0_0_15px_rgba(0,230,118,0.08)]'
          : 'border-white/10 bg-white/[0.04] hover:border-white/20'
      } ${locked && !hasWinner ? 'opacity-40' : ''}`}
    >
      {hasWinner && (
        <div className="absolute -top-[3px] left-1/2 -translate-x-1/2 h-[3px] w-3/4 rounded-full bg-accent-green shadow-[0_0_6px_rgba(0,230,118,0.5)]" />
      )}

      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-medium text-text-secondary/60">
          #{matchNumber}
        </span>
        <span className="text-[9px] font-[family-name:var(--font-bebas)] tracking-[0.15em] uppercase text-accent-gold/70">
          {stage === 'round_of_32' ? 'R32'
            : stage === 'round_of_16' ? 'R16'
            : stage === 'quarter_final' ? 'QF'
            : stage === 'semi_final' ? 'SF'
            : 'FIN'}
        </span>
      </div>

      <button
        type="button"
        disabled={locked || !homeTeam || homePlaceholder}
        onClick={() => homeTeam && onPick(matchNumber, homeTeam)}
        className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-all ${
          winner === homeTeam
            ? 'bg-accent-green/15 text-accent-green font-bold'
            : 'bg-white/[0.03] text-text-secondary hover:bg-white/[0.06] hover:text-white'
        } ${locked || !homeTeam || homePlaceholder ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {homeTeam && !homePlaceholder ? (
          <CountryFlag name={homeTeam} width={18} className="shrink-0" />
        ) : (
          <span className="inline-flex h-[14px] w-[18px] shrink-0 items-center justify-center rounded-[2px] bg-white/5 text-[8px] text-text-secondary/40">?</span>
        )}
        <span className={`flex-1 truncate text-left ${homePlaceholder ? 'text-text-secondary/40 italic text-[11px]' : ''}`}>
          {homePlaceholder ? 'TBD' : (homeTeam || homeLabel)}
        </span>
        {winner === homeTeam && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" />
            <polyline points="3.5,6 5.5,8 8.5,4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div className="my-1 border-t border-white/[0.06]" />

      <button
        type="button"
        disabled={locked || !awayTeam || awayPlaceholder}
        onClick={() => awayTeam && onPick(matchNumber, awayTeam)}
        className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-all ${
          winner === awayTeam
            ? 'bg-accent-green/15 text-accent-green font-bold'
            : 'bg-white/[0.03] text-text-secondary hover:bg-white/[0.06] hover:text-white'
        } ${locked || !awayTeam || awayPlaceholder ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {awayTeam && !awayPlaceholder ? (
          <CountryFlag name={awayTeam} width={18} className="shrink-0" />
        ) : (
          <span className="inline-flex h-[14px] w-[18px] shrink-0 items-center justify-center rounded-[2px] bg-white/5 text-[8px] text-text-secondary/40">?</span>
        )}
        <span className={`flex-1 truncate text-left ${awayPlaceholder ? 'text-text-secondary/40 italic text-[11px]' : ''}`}>
          {awayPlaceholder ? 'TBD' : (awayTeam || awayLabel)}
        </span>
        {winner === awayTeam && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" />
            <polyline points="3.5,6 5.5,8 8.5,4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {hasWinner && (
        <button
          type="button"
          onClick={() => onClear(matchNumber)}
          className="mt-1.5 w-full text-[10px] text-text-secondary/50 hover:text-red-400 transition-colors text-center"
        >
          Cambiar
        </button>
      )}
    </div>
  )
}
