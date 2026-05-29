import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import Link from 'next/link'

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

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('*')
    .eq('slug', 'world-cup-2026')
    .single()

  const { count: userCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  const { count: predictionCount } = await supabase
    .from('predictions')
    .select('*', { count: 'exact', head: true })

  const { count: submittedCount } = await supabase
    .from('predictions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'submitted')

  const { count: groupCount } = await supabase
    .from('user_groups')
    .select('*', { count: 'exact', head: true })

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold">Panel de Administración</h1>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <p className="text-3xl font-bold text-white">{userCount ?? 0}</p>
            <p className="text-sm text-gray-400">Usuarios</p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <p className="text-3xl font-bold text-white">{predictionCount ?? 0}</p>
            <p className="text-sm text-gray-400">Pronósticos</p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <p className="text-3xl font-bold text-fifa-gold">{submittedCount ?? 0}</p>
            <p className="text-sm text-gray-400">Enviados</p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <p className="text-3xl font-bold text-white">{groupCount ?? 0}</p>
            <p className="text-sm text-gray-400">Grupos privados</p>
          </div>
        </div>

        <AdminDashboard
          initialStatus={tournament?.status || 'draft'}
          tournamentId={tournament?.id || ''}
        />

        <div className="flex gap-4">
          <Link
            href="/admin/results"
            className="flex-1 bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:bg-gray-700/50 transition-all"
          >
            <div className="text-2xl mb-2">📋</div>
            <h3 className="font-semibold text-white">Cargar resultados</h3>
            <p className="text-sm text-gray-400">Ingresar resultados oficiales de cada partido</p>
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
