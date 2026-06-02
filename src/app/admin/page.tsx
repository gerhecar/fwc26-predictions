import { requireAdmin } from '@/lib/auth/auth'
import { getPool } from '@/lib/db/pool'
import { AppShell } from '@/components/layout/app-shell'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { CalculateScoresButton } from '@/components/admin/calculate-scores-button'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

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

  const [betCountRows] = await pool.execute(
    "SELECT COUNT(*) as count FROM bet_submissions WHERE status != 'deleted'",
  )
  const betCount = (betCountRows as any[])[0]?.count || 0

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
            <p className="text-3xl font-bold text-white">{betCount}</p>
            <p className="text-sm text-gray-400">Apuestas activas</p>
          </div>
        </div>

        <AdminDashboard
          initialStatus={tournament?.status || 'draft'}
          tournamentId={tournament?.id || ''}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/admin/users"
            className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:bg-gray-700/50 transition-all"
          >
            <div className="text-2xl mb-2">👥</div>
            <h3 className="font-semibold text-white">Gestión de Usuarios</h3>
            <p className="text-sm text-gray-400">Ver, buscar y gestionar usuarios registrados</p>
          </Link>
          <Link
            href="/admin/bets"
            className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:bg-gray-700/50 transition-all"
          >
            <div className="text-2xl mb-2">📝</div>
            <h3 className="font-semibold text-white">Gestión de Apuestas</h3>
            <p className="text-sm text-gray-400">Ver, validar y eliminar apuestas</p>
          </Link>
          <Link
            href="/admin/results"
            className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:bg-gray-700/50 transition-all"
          >
            <div className="text-2xl mb-2">📋</div>
            <h3 className="font-semibold text-white">Cargar Resultados</h3>
            <p className="text-sm text-gray-400">Ingresar resultados oficiales de grupos y knockout</p>
          </Link>
          <Link
            href="/admin/leaderboard"
            className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:bg-gray-700/50 transition-all"
          >
            <div className="text-2xl mb-2">🏆</div>
            <h3 className="font-semibold text-white">Leaderboard</h3>
            <p className="text-sm text-gray-400">Ver puntajes provisionales y oficiales de todas las apuestas</p>
          </Link>
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-semibold text-white">Calcular Puntajes</h3>
            <p className="text-sm text-gray-400 mb-3">Recalcular puntajes comparando apuestas vs resultados</p>
            <CalculateScoresButton />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
