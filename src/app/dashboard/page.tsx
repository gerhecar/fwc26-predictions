import { getCurrentUser } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { DashboardClient } from '@/components/dashboard/dashboard-client'

const BG_URL =
  'https://images.unsplash.com/photo-1731312084255-6b38e3ea2484?fm=jpg&q=60&w=3000'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')

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
          <DashboardClient displayName={user.display_name} />
        </AppShell>
      </div>
    </div>
  )
}
