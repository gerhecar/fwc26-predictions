'use client'

import { usePredictionsStore } from '@/lib/predictions/store'
import { GROUP_LETTERS } from '@/lib/predictions/constants'
import { GroupCard } from './group-card'

interface GroupsViewProps {
  onContinue: () => void
  onBack?: () => void
}

export function GroupsView({ onContinue, onBack }: GroupsViewProps) {
  const groupPredictions = usePredictionsStore((s) => s.groupPredictions)
  const setGroupOrder = usePredictionsStore((s) => s.setGroupOrder)

  const allComplete = GROUP_LETTERS.every(
    (l) => (groupPredictions[l]?.length ?? 0) === 4,
  )

  const pendingCount = GROUP_LETTERS.filter(
    (l) => (groupPredictions[l]?.length ?? 0) !== 4,
  ).length

  return (
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
        {GROUP_LETTERS.map((letter) => (
          <GroupCard
            key={letter}
            letter={letter}
            orderedTeams={groupPredictions[letter] || []}
            onReorder={(l, teams) => setGroupOrder(l, teams)}
          />
        ))}
      </div>

      <div className="flex items-center justify-center gap-4 border-t border-white/10 pt-6">
        {onBack && (
          <button
            onClick={onBack}
            className="rounded-full border border-white/20 px-8 py-3 text-sm font-bold tracking-wide text-text-secondary transition-all hover:border-white/40 hover:text-white"
          >
            ← VOLVER
          </button>
        )}
        <button
          onClick={onContinue}
          disabled={!allComplete}
          className={`relative rounded-full px-12 py-3.5 text-base font-bold tracking-wide transition-all duration-200 ${
            allComplete
              ? 'bg-accent-green text-black shadow-lg shadow-accent-green/30 hover:shadow-accent-green/50 animate-glow-pulse hover:scale-[1.02]'
              : 'cursor-not-allowed bg-white/5 text-text-secondary border border-white/10'
          }`}
        >
          {allComplete
            ? 'CONTINUAR A TERCEROS LUGARES'
            : `${pendingCount} GRUPO${pendingCount !== 1 ? 'S' : ''} PENDIENTE${pendingCount !== 1 ? 'S' : ''}`}
        </button>
      </div>
    </div>
  )
}
