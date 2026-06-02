import { requireAdmin } from '@/lib/auth/auth'
import { getPool } from '@/lib/db/pool'
import { AppShell } from '@/components/layout/app-shell'
import { AdminResultsPanel } from '@/components/admin/results-panel'

export const dynamic = 'force-dynamic'

export default async function AdminResultsPage() {
  await requireAdmin()
  const pool = getPool()

  const [tournamentRows] = await pool.execute(
    "SELECT * FROM tournaments WHERE slug = 'fifa-world-cup-2026'",
  )
  const tournament = (tournamentRows as any[])[0]

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
