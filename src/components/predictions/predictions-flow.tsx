'use client'

import { usePredictionsStore } from '@/lib/predictions/store'
import { GroupsView } from './groups-view'
import { ThirdPlacedView } from './third-placed-view'
import { KnockoutView } from './knockout-view'

const STEPS = [
  { key: 'groups' as const, label: 'GROUP STAGE', num: 1 },
  { key: 'third-place' as const, label: 'THIRD PLACES', num: 2 },
  { key: 'knockout' as const, label: 'KNOCKOUT', num: 3 },
]

function isStepComplete(step: string, currentStep: string): boolean {
  const order = ['groups', 'third-place', 'knockout']
  const stepIdx = order.indexOf(step)
  const currentIdx = order.indexOf(currentStep)
  return stepIdx < currentIdx
}

export function PredictionsFlow() {
  const step = usePredictionsStore((s) => s.step)
  const setStep = usePredictionsStore((s) => s.setStep)

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 animate-fade-in">
      <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
        <div className="flex items-center justify-center gap-0">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-200 ${
                    s.key === step
                      ? 'bg-accent-green text-black shadow-lg shadow-accent-green/30'
                      : isStepComplete(s.key, step)
                        ? 'bg-accent-green/30 text-accent-green'
                        : 'bg-white/10 text-text-secondary'
                  }`}
                >
                  {isStepComplete(s.key, step) ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="2 7 5.5 10.5 12 4" />
                    </svg>
                  ) : (
                    s.num
                  )}
                </span>
                <span
                  className={`text-[11px] font-[family-name:var(--font-bebas)] tracking-widest transition-colors duration-200 ${
                    s.key === step ? 'text-white' : 'text-text-secondary'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`mx-3 mb-6 h-px w-12 sm:w-20 transition-colors duration-200 ${
                    isStepComplete(STEPS[i + 1].key, step)
                      ? 'bg-accent-green/50'
                      : 'bg-white/10'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {step === 'groups' && (
        <GroupsView
          onContinue={() => setStep('third-place')}
          onBack={undefined}
        />
      )}

      {step === 'third-place' && (
        <ThirdPlacedView
          onBack={() => setStep('groups')}
          onSaveAndContinue={() => setStep('knockout')}
        />
      )}

      {step === 'knockout' && (
        <KnockoutView
          onEditGroups={() => setStep('groups')}
          onEditThirdPlace={() => setStep('third-place')}
        />
      )}
    </div>
  )
}
