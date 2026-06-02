import { getCurrentUser } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { RulesView } from '@/components/rules/rules-view'

export const dynamic = 'force-dynamic'

export default async function RulesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')

  return (
    <AppShell>
      <RulesView />
    </AppShell>
  )
}
