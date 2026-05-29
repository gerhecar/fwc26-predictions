import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold">Mi Perfil</h1>
        <Card>
          <div className="flex flex-col gap-3">
            <div>
              <span className="text-sm text-text-secondary">Nombre</span>
              <p className="font-medium">{profile?.display_name}</p>
            </div>
            <div>
              <span className="text-sm text-text-secondary">Email</span>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <span className="text-sm text-text-secondary">Rol</span>
              <p className="font-medium">{profile?.role === 'admin' ? 'Admin' : 'Usuario'}</p>
            </div>
          </div>
        </Card>

        <form
          action={async () => {
            'use server'
            const supabase = await createClient()
            await supabase.auth.signOut()
            redirect('/auth/login')
          }}
        >
          <Button type="submit" variant="danger" className="w-full">
            Cerrar sesión
          </Button>
        </form>
      </div>
    </AppShell>
  )
}
