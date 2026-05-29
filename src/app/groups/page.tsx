import { AppShell } from '@/components/layout/app-shell'
import { GroupPredictionsContent } from './group-predictions-content'

export const dynamic = 'force-dynamic'

export default function GroupsPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Predicción de Grupos</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Clasifica los 4 equipos de cada grupo del 1° al 4° lugar
          </p>
        </div>

        <GroupPredictionsContent />
      </div>
    </AppShell>
  )
}
