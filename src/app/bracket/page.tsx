import { AppShell } from '@/components/layout/app-shell'
import { createClient } from '@/lib/supabase/server'
import { getTournamentGroups, getUserGroupPredictions } from '@/lib/groups/queries'
import { BracketView } from '@/components/bracket/bracket-view'
import type { GroupLetter } from '@/types'

export default async function BracketPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <AppShell>
        <p className="text-text-secondary">Inicia sesión para ver tu bracket.</p>
      </AppShell>
    )
  }

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('*')
    .eq('slug', 'world-cup-2026')
    .single()

  if (!tournament) {
    return (
      <AppShell>
        <p className="text-text-secondary">No se encontró el torneo.</p>
      </AppShell>
    )
  }

  const groups = await getTournamentGroups(tournament.id)

  const predictions = await getUserGroupPredictions(user.id, tournament.id)

  const thirdPlacePrediction = predictions.find((p) => p.third_place_qualified && p.third_place_qualified.length > 0)
  const thirdPlaceGroups: GroupLetter[] = thirdPlacePrediction
    ? (thirdPlacePrediction.third_place_qualified as GroupLetter[])
    : []

  const anyPrediction = predictions[0]

  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Llave del Mundial</h1>
        <BracketView
          groups={groups}
          predictions={predictions}
          thirdPlaceGroups={thirdPlaceGroups}
          tournamentId={tournament.id}
          initialPicks={anyPrediction?.bracket_predictions as Record<number, string> | undefined}
          initialChampion={anyPrediction?.champion_id || null}
          isSubmitted={anyPrediction?.status === 'submitted'}
        />
      </div>
    </AppShell>
  )
}
