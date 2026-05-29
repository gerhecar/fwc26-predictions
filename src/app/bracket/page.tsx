import { AppShell } from '@/components/layout/app-shell'
import { Card } from '@/components/ui/card'

export default function BracketPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Llave del Mundial</h1>
        <Card>
          <p className="text-text-secondary">
            Visualiza y completa tu bracket predictivo aquí.
          </p>
        </Card>
      </div>
    </AppShell>
  )
}
