import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { GROUP_LETTERS, GROUP_TEAMS } from './constants'

export type Step = 'groups' | 'third-place' | 'knockout'

export type BracketPicks = Record<number, string>

interface PredictionsState {
  step: Step
  groupPredictions: Record<string, string[]>
  thirdPlaceSelection: string[]
  bracketPicks: BracketPicks
  submitted: boolean
  setStep: (step: Step) => void
  setGroupOrder: (groupLetter: string, orderedTeams: string[]) => void
  toggleThirdPlace: (groupLetter: string) => void
  setThirdPlaceSelection: (selection: string[]) => void
  setBracketPick: (matchNumber: number, teamName: string | null) => void
  setSubmitted: (submitted: boolean) => void
  reset: () => void
}

export function getThirdPlaceTeam(
  groupPredictions: Record<string, string[]>,
  letter: string,
): string | null {
  const teams = groupPredictions[letter]
  if (!teams || teams.length < 3) return GROUP_TEAMS[letter]?.[2] || null
  return teams[2]
}

export function getThirdPlaceTeams(
  groupPredictions: Record<string, string[]>,
): Record<string, string | null> {
  const result: Record<string, string | null> = {}
  for (const letter of GROUP_LETTERS) {
    result[letter] = getThirdPlaceTeam(groupPredictions, letter)
  }
  return result
}

export function pruneKnockoutPicks(
  bracketPicks: BracketPicks,
  qualifiedTeams: Set<string>,
): BracketPicks {
  const pruned: BracketPicks = {}
  for (const [matchNum, team] of Object.entries(bracketPicks)) {
    if (qualifiedTeams.has(team)) {
      pruned[Number(matchNum)] = team
    }
  }
  return pruned
}

export function getQualifiedTeams(
  groupPredictions: Record<string, string[]>,
  thirdPlaceSelection: string[],
): Set<string> {
  const qualified = new Set<string>()
  for (const letter of GROUP_LETTERS) {
    const teams = groupPredictions[letter]
    if (teams && teams.length >= 2) {
      qualified.add(teams[0])
      qualified.add(teams[1])
    }
    if (thirdPlaceSelection.includes(letter)) {
      const third = getThirdPlaceTeam(groupPredictions, letter)
      if (third) qualified.add(third)
    }
  }
  return qualified
}

export const usePredictionsStore = create<PredictionsState>()(
  persist(
    (set) => ({
      step: 'groups',
      groupPredictions: {},
      thirdPlaceSelection: [],
      bracketPicks: {},
      submitted: false,

      setStep: (step) => set({ step }),

      setGroupOrder: (groupLetter, orderedTeams) =>
        set((state) => {
          const updated = {
            ...state.groupPredictions,
            [groupLetter]: orderedTeams,
          }

          const stale = state.thirdPlaceSelection.filter((letter) => {
            const thirdTeam = getThirdPlaceTeam(updated, letter)
            return thirdTeam === null
          })

          const thirdPlaceSelection = state.thirdPlaceSelection.filter(
            (letter) => !stale.includes(letter),
          )

          const qualified = getQualifiedTeams(updated, thirdPlaceSelection)
          const bracketPicks = pruneKnockoutPicks(state.bracketPicks, qualified)

          return {
            groupPredictions: updated,
            thirdPlaceSelection,
            bracketPicks,
          }
        }),

      toggleThirdPlace: (groupLetter) =>
        set((state) => {
          if (state.thirdPlaceSelection.includes(groupLetter)) {
            const thirdPlaceSelection = state.thirdPlaceSelection.filter(
              (l) => l !== groupLetter,
            )
            const qualified = getQualifiedTeams(
              state.groupPredictions,
              thirdPlaceSelection,
            )
            const bracketPicks = pruneKnockoutPicks(
              state.bracketPicks,
              qualified,
            )
            return { thirdPlaceSelection, bracketPicks }
          }
          if (state.thirdPlaceSelection.length >= 8) return state
          const thirdPlaceSelection = [...state.thirdPlaceSelection, groupLetter]
          const qualified = getQualifiedTeams(
            state.groupPredictions,
            thirdPlaceSelection,
          )
          const bracketPicks = pruneKnockoutPicks(
            state.bracketPicks,
            qualified,
          )
          return { thirdPlaceSelection, bracketPicks }
        }),

      setThirdPlaceSelection: (selection) =>
        set((state) => {
          const qualified = getQualifiedTeams(
            state.groupPredictions,
            selection,
          )
          const bracketPicks = pruneKnockoutPicks(
            state.bracketPicks,
            qualified,
          )
          return { thirdPlaceSelection: selection, bracketPicks }
        }),

      setBracketPick: (matchNumber, teamName) =>
        set((state) => {
          if (state.submitted) return state
          if (teamName === null) {
            const next = { ...state.bracketPicks }
            delete next[matchNumber]
            return { bracketPicks: next }
          }
          return {
            bracketPicks: {
              ...state.bracketPicks,
              [matchNumber]: teamName,
            },
          }
        }),

      setSubmitted: (submitted) => set({ submitted, step: submitted ? 'knockout' : 'groups' }),

      reset: () =>
        set({
          step: 'groups',
          groupPredictions: {},
          thirdPlaceSelection: [],
          bracketPicks: {},
          submitted: false,
        }),
    }),
    { name: 'fwc26-predictions-storage' },
  ),
)
