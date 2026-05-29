import { getCurrentUser } from '@/lib/auth/auth'
import { getPool } from '@/lib/db/pool'
import { AppShell } from '@/components/layout/app-shell'
import { RankingsView, type StandingWithProfile } from '@/components/rankings/rankings-view'

export default async function RankingsPage() {
  const user = await getCurrentUser()

  const pool = getPool()
  const [tournamentRows] = await pool.execute(
    "SELECT * FROM tournaments WHERE slug = 'fifa-world-cup-2026'",
  )
  const tournament = (tournamentRows as any[])[0]

  if (!tournament) {
    return (
      <AppShell>
        <p className="text-text-secondary">No se encontró el torneo.</p>
      </AppShell>
    )
  }

  const [globalRows] = await pool.execute(
    `SELECT s.*, u.display_name, u.avatar_url
     FROM standings s
     JOIN users u ON u.id = s.user_id
     WHERE s.user_group_id IS NULL AND s.tournament_id = ?
     ORDER BY s.total_points DESC
     LIMIT 100`,
    [tournament.id],
  )
  const globalStandings = globalRows as StandingWithProfile[]

  let userGroups: { id: string; name: string }[] = []
  let groupStandings: Record<string, StandingWithProfile[]> = {}

  if (user) {
    const [memberRows] = await pool.execute(
      'SELECT group_id FROM user_group_members WHERE user_id = ?',
      [user.id],
    )
    const memberships = memberRows as any[]

    if (memberships.length > 0) {
      const groupIds = memberships.map((m: any) => m.group_id)
      const placeholders = groupIds.map(() => '?').join(',')
      const [groupRows] = await pool.execute(
        `SELECT id, name FROM user_groups WHERE id IN (${placeholders})`,
        groupIds,
      )
      userGroups = groupRows as { id: string; name: string }[]

      for (const g of userGroups) {
        const [sRows] = await pool.execute(
          `SELECT s.*, u.display_name, u.avatar_url
           FROM standings s
           JOIN users u ON u.id = s.user_id
           WHERE s.user_group_id = ? AND s.tournament_id = ?
           ORDER BY s.total_points DESC`,
          [g.id, tournament.id],
        )
        groupStandings[g.id] = sRows as StandingWithProfile[]
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
