import { AppShell } from '@/components/layout/app-shell'
import { Card } from '@/components/ui/card'

export default function RankingsPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Tabla de Posiciones</h1>
        <Card>
          <p className="text-text-secondary">
            Clasificación global y por grupos de amigos.
          </p>
        </Card>
      </div>
    </AppShell>
  )
}
