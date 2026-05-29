import { requireAdmin } from '@/lib/auth/auth'
import { getPool } from '@/lib/db/pool'
import { AppShell } from '@/components/layout/app-shell'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import Link from 'next/link'

export default async function AdminPage() {
  await requireAdmin()
  const pool = getPool()

  const [tournamentRows] = await pool.execute(
    "SELECT * FROM tournaments WHERE slug = 'fifa-world-cup-2026'",
  )
  const tournament = (tournamentRows as any[])[0]

  const [userCountRows] = await pool.execute('SELECT COUNT(*) as count FROM users')
  const userCount = (userCountRows as any[])[0]?.count || 0

  const [predictionCountRows] = await pool.execute('SELECT COUNT(*) as count FROM predictions')
  const predictionCount = (predictionCountRows as any[])[0]?.count || 0

  const [submittedRows] = await pool.execute(
    "SELECT COUNT(*) as count FROM predictions WHERE status = 'submitted'",
  )
  const submittedCount = (submittedRows as any[])[0]?.count || 0

  const [groupCountRows] = await pool.execute('SELECT COUNT(*) as count FROM user_groups')
  const groupCount = (groupCountRows as any[])[0]?.count || 0

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold">Panel de Administración</h1>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <p className="text-3xl font-bold text-white">{userCount}</p>
            <p className="text-sm text-gray-400">Usuarios</p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <p className="text-3xl font-bold text-white">{predictionCount}</p>
            <p className="text-sm text-gray-400">Pronósticos</p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <p className="text-3xl font-bold text-fifa-gold">{submittedCount}</p>
            <p className="text-sm text-gray-400">Enviados</p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <p className="text-3xl font-bold text-white">{groupCount}</p>
            <p className="text-sm text-gray-400">Grupos privados</p>
          </div>
        </div>

        <AdminDashboard
          initialStatus={tournament?.status || 'draft'}
          tournamentId={tournament?.id || ''}
        />

        <div className="flex gap-4 flex-wrap">
          <Link
            href="/admin/users"
            className="flex-1 min-w-[200px] bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:bg-gray-700/50 transition-all"
          >
            <div className="text-2xl mb-2">👥</div>
            <h3 className="font-semibold text-white">Usuarios</h3>
            <p className="text-sm text-gray-400">Gestionar usuarios registrados</p>
          </Link>
          <Link
            href="/admin/results"
            className="flex-1 min-w-[200px] bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:bg-gray-700/50 transition-all"
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
