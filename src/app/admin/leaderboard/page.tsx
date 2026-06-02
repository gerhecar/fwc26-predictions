import { requireAdmin } from '@/lib/auth/auth'
import { AppShell } from '@/components/layout/app-shell'
import { AdminLeaderboardTable } from '@/components/admin/leaderboard-table'

export const dynamic = 'force-dynamic'

export default async function AdminLeaderboardPage() {
  await requireAdmin()

  return (
    <AppShell>
      <AdminLeaderboardTable />
    </AppShell>
  )
}
