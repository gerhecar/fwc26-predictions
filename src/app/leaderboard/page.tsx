import { getCurrentUser } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { LeaderboardView } from '@/components/leaderboard/leaderboard-view'

export const dynamic = 'force-dynamic'

export default async function LeaderboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')

  return (
    <AppShell>
      <LeaderboardView />
    </AppShell>
  )
}
