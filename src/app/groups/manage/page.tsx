import { AppShell } from '@/components/layout/app-shell'
import { GroupManager } from '@/components/groups/group-manager'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function GroupsManagePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
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
