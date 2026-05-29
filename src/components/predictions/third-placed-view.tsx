'use client'

import { usePredictionsStore } from '@/lib/predictions/store'
import { GROUP_LETTERS, getFlag, GROUP_TEAMS } from '@/lib/predictions/constants'

export function ThirdPlacedView() {
  const groupPredictions = usePredictionsStore((s) => s.groupPredictions)
  const thirdPlaceSelection = usePredictionsStore((s) => s.thirdPlaceSelection)
  const toggleThirdPlace = usePredictionsStore((s) => s.toggleThirdPlace)

  const allComplete = GROUP_LETTERS.every(
    (l) => (groupPredictions[l]?.length ?? 0) === 4,
  )

  if (!allComplete) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="text-text-secondary">
          Completa la predicción de todos los grupos primero.
        </p>
      </div>
    )
  }

  function getThirdPlace(letter: string): string | null {
    const teams = groupPredictions[letter]
    if (!teams || teams.length < 3) return GROUP_TEAMS[letter]?.[2] || null
    return teams[2]
  }

  const selectedCount = thirdPlaceSelection.length

  return (
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
        <span className="text-sm font-medium text-text-secondary">
          Grupos seleccionados
        </span>
        <span
          className={`text-xl font-bold font-[family-name:var(--font-bebas)] tracking-wide transition-colors ${
            selectedCount === 8 ? 'text-accent-green' : 'text-text-secondary'
          }`}
        >
          {selectedCount}/8
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {GROUP_LETTERS.map((letter) => {
          const thirdTeam = getThirdPlace(letter)
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
                !isSelected && thirdPlaceSelection.length >= 8
                  ? 'cursor-not-allowed opacity-40'
                  : 'cursor-pointer'
              }`}
            >
              <span
                className={`text-sm font-[family-name:var(--font-bebas)] tracking-widest transition-colors ${
                  isSelected ? 'text-accent-green' : 'text-text-secondary group-hover:text-white'
                }`}
              >
                GRUPO {letter}
              </span>
              {thirdTeam && (
                <span className="flex flex-col items-center gap-1">
                  <span className="text-2xl leading-none">{getFlag(thirdTeam)}</span>
                  <span className={`text-sm font-medium transition-colors ${
                    isSelected ? 'text-white' : 'text-text-secondary'
                  }`}>
                    {thirdTeam}
                  </span>
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

      {selectedCount === 8 && (
        <div className="animate-slide-up rounded-2xl border border-accent-green/20 bg-accent-green/5 p-5 backdrop-blur-md">
          <p className="font-[family-name:var(--font-bebas)] text-lg tracking-wide text-accent-green">
            RESUMEN DE CLASIFICADOS
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            8 mejores terceros lugares de los grupos:{' '}
            <span className="font-semibold text-white">
              {[...thirdPlaceSelection].sort().join(' · ')}
            </span>
          </p>
        </div>
      )}
    </div>
  )
}
