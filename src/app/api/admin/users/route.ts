import { getAllUsers, getCurrentUser } from '@/lib/auth/auth'
import type { AdminUserListParams } from '@/types'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    const params: AdminUserListParams = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '25'),
      search: searchParams.get('search') || '',
      sortBy: (searchParams.get('sortBy') || 'created_at') as AdminUserListParams['sortBy'],
      sortOrder: (searchParams.get('sortOrder') || 'desc') as AdminUserListParams['sortOrder'],
      roleFilter: (searchParams.get('roleFilter') || 'all') as AdminUserListParams['roleFilter'],
      statusFilter: (searchParams.get('statusFilter') || 'all') as AdminUserListParams['statusFilter'],
    }

    const data = await getAllUsers(params)

    return Response.json(data)
  } catch {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }
}
