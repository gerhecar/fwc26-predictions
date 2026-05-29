export interface PredictionExport {
  user: {
    id: string
    display_name: string
  }
  predictionId: string
  groupStage: Record<string, string[]>
  bestThirdPlaced: string[]
  knockout: Record<number, string>
  champion: string | null
  submittedAt: string
}

export function generatePredictionJson(
  userId: string,
  displayName: string,
  predictionId: string,
  groupPredictions: Record<string, string[]>,
  thirdPlaceSelection: string[],
  bracketPicks: Record<number, string>,
): PredictionExport {
  return {
    user: {
      id: userId,
      display_name: displayName,
    },
    predictionId,
    groupStage: { ...groupPredictions },
    bestThirdPlaced: [...thirdPlaceSelection],
    knockout: Object.fromEntries(
      Object.entries(bracketPicks).filter(([, v]) => v !== null),
    ) as Record<number, string>,
    champion: bracketPicks[104] || null,
    submittedAt: new Date().toISOString(),
  }
}
