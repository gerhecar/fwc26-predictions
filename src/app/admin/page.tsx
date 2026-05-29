import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { Card } from '@/components/ui/card'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold">Panel de Administración</h1>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <div className="text-3xl">🏟️</div>
            <h3 className="mt-2 font-semibold">Torneo</h3>
            <p className="mt-1 text-sm text-text-secondary">
              Crear y gestionar torneos
            </p>
          </Card>

          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <div className="text-3xl">📋</div>
            <h3 className="mt-2 font-semibold">Resultados</h3>
            <p className="mt-1 text-sm text-text-secondary">
              Cargar resultados oficiales
            </p>
          </Card>

          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <div className="text-3xl">📊</div>
            <h3 className="mt-2 font-semibold">Recalcular</h3>
            <p className="mt-1 text-sm text-text-secondary">
              Recalcular puntajes y posiciones
            </p>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
