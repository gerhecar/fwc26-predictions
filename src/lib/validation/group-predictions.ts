import { z } from 'zod'

export const groupPredictionSchema = z.object({
  first_place_team_id: z.string().uuid('You must select 1st place'),
  second_place_team_id: z.string().uuid('You must select 2nd place'),
  third_place_team_id: z.string().uuid('You must select 3rd place'),
  fourth_place_team_id: z.string().uuid('You must select 4th place'),
}).refine(
  (data) => {
    const ids = [data.first_place_team_id, data.second_place_team_id, data.third_place_team_id, data.fourth_place_team_id]
    return new Set(ids).size === 4
  },
  { message: 'Each team must be in a unique position' },
)

export const allGroupsPredictionSchema = z.record(
  z.string(),
  groupPredictionSchema,
)

export type GroupPredictionInput = z.infer<typeof groupPredictionSchema>

export function validateGroupPredictions(predictions: Record<string, unknown>) {
  return allGroupsPredictionSchema.safeParse(predictions)
}
