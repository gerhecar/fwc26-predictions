'use client'

import { useMemo } from 'react'
import { CountryFlag } from '@/components/ui/country-flag'
import { GROUP_LETTERS } from '@/lib/predictions/constants'
import type { PredictionExport } from '@/lib/predictions/json-export'
import BG from '@/images/campo.avif'

interface BetDetailProps {
  prediction: PredictionExport
  betName: string
  submittedAt: string
  champion: string
}

const R32_LABELS: Record<number, string> = {
  73: '2°A vs 2°B', 74: '1°E vs 3°', 75: '1°F vs 2°C', 76: '1°C vs 2°F',
  77: '1°I vs 3°', 78: '2°E vs 2°I', 79: '1°A vs 3°', 80: '1°L vs 3°',
  81: '1°D vs 3°', 82: '1°G vs 3°', 83: '2°K vs 2°L', 84: '1°H vs 2°J',
  85: '1°B vs 3°', 86: '1°J vs 2°H', 87: '1°K vs 3°', 88: '2°D vs 2°G',
}

const R16_LABELS: Record<number, string> = {
  90: '#73 vs #75', 89: '#74 vs #77', 91: '#76 vs #78', 92: '#79 vs #80',
  93: '#83 vs #84', 94: '#81 vs #82', 95: '#86 vs #88', 96: '#85 vs #87',
}

const QF_LABELS: Record<number, string> = {
  97: '#89 vs #90', 98: '#93 vs #94', 99: '#91 vs #92', 100: '#95 vs #96',
}

const SF_LABELS: Record<number, string> = {
  101: '#97 vs #98', 102: '#99 vs #100',
}

const STAGES = [
  { name: 'R32', matches: [73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88], labels: R32_LABELS },
  { name: 'R16', matches: [89, 90, 91, 92, 93, 94, 95, 96], labels: R16_LABELS },
  { name: 'QF', matches: [97, 98, 99, 100], labels: QF_LABELS },
  { name: 'SF', matches: [101, 102], labels: SF_LABELS },
]

export function BetDetail({ prediction, betName, submittedAt, champion }: BetDetailProps) {
  const knockout = prediction.knockout || {}

  const groupStageEntries = useMemo(() => {
    return GROUP_LETTERS
      .filter(l => prediction.groupStage[l])
      .map(l => ({ letter: l, teams: prediction.groupStage[l] }))
  }, [prediction.groupStage])

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
          {betName}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Submitted on {new Date(submittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-accent-green">
          <CountryFlag name={champion} width={18} className="inline-block" />
          Champion: {champion}
        </p>
      </div>

      {/* Group Stage */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="font-[family-name:var(--font-bebas)] text-xl tracking-wide text-white mb-4">GROUP STAGE</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {groupStageEntries.map(({ letter, teams }) => (
            <div key={letter} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="font-[family-name:var(--font-bebas)] text-sm tracking-wide text-text-secondary mb-2">Group {letter}</p>
              <div className="space-y-1.5">
                {teams.map((team, idx) => (
                  <div key={team} className="flex items-center gap-2 text-sm">
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                      idx === 0 ? 'bg-fifa-gold/20 text-fifa-gold' :
                      idx === 1 ? 'bg-white/10 text-text-secondary' :
                      'bg-white/5 text-text-secondary'
                    }`}>
                      {idx + 1}
                    </span>
                    <CountryFlag name={team} width={16} className="shrink-0" />
                    <span className={`${idx <= 1 ? 'text-white' : 'text-text-secondary'}`}>{team}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Third Placed */}
      {prediction.bestThirdPlaced && prediction.bestThirdPlaced.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-[family-name:var(--font-bebas)] text-xl tracking-wide text-white mb-3">BEST THIRD-PLACED</h2>
          <div className="flex flex-wrap gap-2">
            {prediction.bestThirdPlaced.map(letter => (
              <span key={letter} className="rounded-full border border-accent-green/20 bg-accent-green/5 px-3 py-1 text-xs text-accent-green">
                3rd Group {letter}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Knockout */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="font-[family-name:var(--font-bebas)] text-xl tracking-wide text-white mb-4">KNOCKOUT</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STAGES.map(stage => {
            const filled = stage.matches.filter(m => knockout[m])
            if (filled.length === 0) return null
            return (
              <div key={stage.name}>
                <p className="font-[family-name:var(--font-bebas)] text-sm tracking-wide text-text-secondary mb-2">{stage.name}</p>
                <div className="space-y-1.5">
                  {filled.map(mn => (
                    <div key={mn} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
                      <span className="text-[10px] text-text-secondary font-mono w-6 shrink-0">#{mn}</span>
                      <CountryFlag name={knockout[mn]} width={16} className="shrink-0" />
                      <span className="text-white truncate">{knockout[mn]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Champion */}
      <div className="flex justify-center pt-4 border-t border-white/10">
        <div className="flex items-center gap-3 rounded-2xl border border-fifa-gold/30 bg-fifa-gold/5 px-8 py-4">
          <CountryFlag name={champion} width={32} />
          <div>
            <p className="font-[family-name:var(--font-bebas)] text-lg tracking-wide text-fifa-gold">CHAMPION</p>
            <p className="text-white">{champion}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
