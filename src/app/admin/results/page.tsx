import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { AdminResultsPanel } from '@/components/admin/results-panel'

export default async function AdminResultsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

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

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold">Cargar Resultados</h1>
        <p className="text-sm text-text-secondary">
          Ingresa el ID del equipo ganador para cada partido. Usa el ID real de la base de datos.
        </p>
        <AdminResultsPanel tournamentId={tournament.id} />
      </div>
    </AppShell>
  )
}
