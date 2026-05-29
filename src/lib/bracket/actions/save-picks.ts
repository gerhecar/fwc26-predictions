'use server'

import { createClient } from '@/lib/supabase/server'
import type { BracketPicks } from '@/lib/bracket/bracket-picks'

export async function saveBracketPicks(
  tournamentId: string,
  picks: BracketPicks,
  championId: string | null,
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('predictions')
    .update({
      bracket_predictions: picks as unknown as Record<string, unknown>,
      champion_id: championId,
    })
    .eq('user_id', user.id)
    .eq('tournament_id', tournamentId)

  if (error) throw new Error(error.message)

  return { success: true }
}

export async function submitPredictions(tournamentId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('predictions')
    .update({ status: 'submitted' })
    .eq('user_id', user.id)
    .eq('tournament_id', tournamentId)

  if (error) throw new Error(error.message)

  return { success: true }
}
