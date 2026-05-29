import { getCurrentUser } from '@/lib/auth/auth'
import { getPool } from '@/lib/db/pool'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { Card } from '@/components/ui/card'
import Link from 'next/link'

const BG_URL =
  'https://images.unsplash.com/photo-1731312084255-6b38e3ea2484?fm=jpg&q=60&w=3000'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')

  const pool = getPool()
  const [rows] = await pool.execute(
    'SELECT display_name, role FROM users WHERE id = ?',
    [user.id],
  )
  const profile = (rows as any[])[0]

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: `url(${BG_URL})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="min-h-screen bg-[#0a0e1a]/70 backdrop-blur-[2px]">
        <AppShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Bienvenido, {profile?.display_name || 'Usuario'}
          </h1>
          <p className="text-text-secondary">Mundial FIFA 2026</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/predictions">
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <div className="text-3xl">📋</div>
              <h3 className="mt-2 font-semibold">Predicción de Grupos</h3>
              <p className="mt-1 text-sm text-text-secondary">
                Rankea los equipos del 1° al 4° en cada grupo
              </p>
            </Card>
          </Link>

          <Link href="/bracket">
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <div className="text-3xl">🏆</div>
              <h3 className="mt-2 font-semibold">Knockout Stage</h3>
              <p className="mt-1 text-sm text-text-secondary">
                Arma tu bracket y elige al campeón
              </p>
            </Card>
          </Link>

          <Link href="/rankings">
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <div className="text-3xl">📊</div>
              <h3 className="mt-2 font-semibold">Tabla de Posiciones</h3>
              <p className="mt-1 text-sm text-text-secondary">
                Mira cómo vas en la competencia
              </p>
            </Card>
          </Link>
        </div>

        {profile?.role === 'admin' && (
          <Link href="/admin">
            <Card className="cursor-pointer border-fifa-gold transition-shadow hover:shadow-md">
              <div className="text-3xl">⚙️</div>
              <h3 className="mt-2 font-semibold text-fifa-blue">Panel Admin</h3>
              <p className="mt-1 text-sm text-text-secondary">
                Gestionar torneo, cargar resultados, recalcular puntajes
              </p>
            </Card>
          </Link>
        )}
        </div>
        </AppShell>
      </div>
    </div>
  )
}
