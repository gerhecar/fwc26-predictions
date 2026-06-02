import { requireAdmin, getAllUsers } from '@/lib/auth/auth'
import { AppShell } from '@/components/layout/app-shell'
import { AdminUsersView } from '@/components/admin/users-view'
import type { AdminUserListParams } from '@/types'

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage({ searchParams }: Props) {
  await requireAdmin()

  const sp = await searchParams
  const params: AdminUserListParams = {
    page: typeof sp.page === 'string' ? parseInt(sp.page) : 1,
    limit: typeof sp.limit === 'string' ? parseInt(sp.limit) : 25,
    search: typeof sp.search === 'string' ? sp.search : '',
    sortBy: (typeof sp.sortBy === 'string' ? sp.sortBy : 'created_at') as AdminUserListParams['sortBy'],
    sortOrder: (typeof sp.sortOrder === 'string' ? sp.sortOrder : 'desc') as AdminUserListParams['sortOrder'],
    roleFilter: (typeof sp.roleFilter === 'string' ? sp.roleFilter : 'all') as AdminUserListParams['roleFilter'],
    statusFilter: (typeof sp.statusFilter === 'string' ? sp.statusFilter : 'all') as AdminUserListParams['statusFilter'],
  }

  const data = await getAllUsers(params)

  return (
    <AppShell>
      <AdminUsersView initialData={data} initialParams={params} />
    </AppShell>
  )
}
