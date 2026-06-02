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
  const reset = usePredictionsStore((s) => s.reset)

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
          GROUP STAGE
        </h1>
        <p className="mt-2 text-sm text-text-secondary max-w-2xl">
          Drag to order the 4 teams in each group. 1st and 2nd place advance to Round of 32; 3rd place may qualify as best third-placed.
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
            ← BACK
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
            ? 'CONTINUE TO THIRD PLACES'
            : `${pendingCount} GROUP${pendingCount !== 1 ? 'S' : ''} PENDING`}
        </button>
        <button
          onClick={() => {
            if (window.confirm('Are you sure? All your predictions will be cleared.')) {
              reset()
            }
          }}
          className="rounded-full border border-red-500/30 px-6 py-3 text-sm font-bold tracking-wide text-red-400 transition-all hover:border-red-400/50 hover:bg-red-500/10"
        >
          RESET
        </button>
      </div>
    </div>
  )
}
