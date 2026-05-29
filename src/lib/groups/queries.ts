import { createClient } from '@/lib/supabase/server'
import type { Group, Team } from '@/types'

export async function getTournamentGroups(tournamentId: string): Promise<(Group & { teams: Team[] })[]> {
  const supabase = await createClient()

  const { data: groups } = await supabase
    .from('groups')
    .select('*, teams(*)')
    .eq('tournament_id', tournamentId)
    .order('letter')
    .returns<(Group & { teams: Team[] })[]>()

  return groups || []
}

export async function getUserGroupPredictions(userId: string, tournamentId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('predictions')
    .select('*')
    .eq('user_id', userId)
    .eq('tournament_id', tournamentId)

  return data || []
}
