import { getCurrentUser } from '@/lib/auth/auth'
import { AppShell } from '@/components/layout/app-shell'
import { GroupManager } from '@/components/groups/group-manager'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function GroupsManagePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')

  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Grupos</h1>
        <p className="text-sm text-text-secondary">
          Crea grupos privados con amigos, comparte el código de invitación y comparen sus pronósticos.
        </p>
        <GroupManager />
      </div>
    </AppShell>
  )
}
