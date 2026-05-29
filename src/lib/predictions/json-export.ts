export interface PredictionExport {
  user: {
    display_name: string
  }
  groupStage: Record<string, string[]>
  bestThirdPlaced: string[]
  knockout: Record<number, string>
  champion: string | null
  thirdPlaceWinner: string | null
  submittedAt: string
}

export function generatePredictionJson(
  displayName: string,
  groupPredictions: Record<string, string[]>,
  thirdPlaceSelection: string[],
  bracketPicks: Record<number, string>,
): PredictionExport {
  return {
    user: {
      display_name: displayName,
    },
    groupStage: { ...groupPredictions },
    bestThirdPlaced: [...thirdPlaceSelection],
    knockout: Object.fromEntries(
      Object.entries(bracketPicks).filter(([, v]) => v !== null),
    ) as Record<number, string>,
    champion: bracketPicks[104] || null,
    thirdPlaceWinner: bracketPicks[103] || null,
    submittedAt: new Date().toISOString(),
  }
}
