import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Step = 'groups' | 'third-place'

interface PredictionsState {
  step: Step
  groupPredictions: Record<string, string[]>
  thirdPlaceSelection: string[]
  setStep: (step: Step) => void
  setGroupOrder: (groupLetter: string, orderedTeams: string[]) => void
  toggleThirdPlace: (groupLetter: string) => void
  reset: () => void
}

export const usePredictionsStore = create<PredictionsState>()(
  persist(
    (set) => ({
      step: 'groups',
      groupPredictions: {},
      thirdPlaceSelection: [],
      setStep: (step) => set({ step }),
      setGroupOrder: (groupLetter, orderedTeams) =>
        set((state) => ({
          groupPredictions: { ...state.groupPredictions, [groupLetter]: orderedTeams },
        })),
      toggleThirdPlace: (groupLetter) =>
        set((state) => {
          if (state.thirdPlaceSelection.includes(groupLetter)) {
            return {
              thirdPlaceSelection: state.thirdPlaceSelection.filter((l) => l !== groupLetter),
            }
          }
          if (state.thirdPlaceSelection.length >= 8) return state
          return {
            thirdPlaceSelection: [...state.thirdPlaceSelection, groupLetter],
          }
        }),
      reset: () => set({ step: 'groups', groupPredictions: {}, thirdPlaceSelection: [] }),
    }),
    { name: 'fwc26-predictions-storage' },
  ),
)
