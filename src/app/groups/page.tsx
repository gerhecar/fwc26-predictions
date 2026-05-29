import { AppShell } from '@/components/layout/app-shell'
import { Card } from '@/components/ui/card'

export default function GroupsPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Predicción de Grupos</h1>
        <Card>
          <p className="text-text-secondary">
            Selecciona el orden de clasificación para cada grupo del Mundial 2026.
          </p>
        </Card>
      </div>
    </AppShell>
  )
}
