import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/app-shell'
import { RankingsView, type StandingWithProfile } from '@/components/rankings/rankings-view'

export default async function RankingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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

  const { data: globalStandings } = await supabase
    .from('standings')
    .select('*, profiles(*)')
    .is('user_group_id', null)
    .eq('tournament_id', tournament.id)
    .order('total_points', { ascending: false })
    .limit(100)

  let userGroups: { id: string; name: string }[] = []
  let groupStandings: Record<string, StandingWithProfile[]> = {}

  if (user) {
    const { data: memberships } = await supabase
      .from('user_group_members')
      .select('group_id')
      .eq('user_id', user.id)

    if (memberships && memberships.length > 0) {
      const groupIds = memberships.map(m => m.group_id)

      const { data: groups } = await supabase
        .from('user_groups')
        .select('id, name')
        .in('id', groupIds)

      userGroups = groups || []

      for (const g of userGroups) {
        const { data: standings } = await supabase
          .from('standings')
          .select('*, profiles(*)')
          .eq('user_group_id', g.id)
          .eq('tournament_id', tournament.id)
          .order('total_points', { ascending: false })

        groupStandings[g.id] = standings || []
      }
    }
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold">Tabla de Posiciones</h1>

        <RankingsView
          globalStandings={globalStandings || []}
          userGroups={userGroups}
          groupStandings={groupStandings}
          currentUserId={user?.id || null}
        />
      </div>
    </AppShell>
  )
}
