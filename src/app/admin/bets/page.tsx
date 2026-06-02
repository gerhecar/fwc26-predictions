import { requireAdmin } from '@/lib/auth/auth'
import { getPool } from '@/lib/db/pool'
import { AppShell } from '@/components/layout/app-shell'
import { AdminBetsView } from '@/components/admin/bets-view'
import type { AdminBetListParams } from '@/types'

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function hasValidationColumns(pool: ReturnType<typeof getPool>): Promise<boolean> {
  try {
    const [rows] = await pool.execute("SHOW COLUMNS FROM bet_submissions LIKE 'validated_at'")
    return (rows as any[]).length > 0
  } catch {
    return false
  }
}

export const dynamic = 'force-dynamic'

export default async function AdminBetsPage({ searchParams }: Props) {
  await requireAdmin()

  const sp = await searchParams
  const params: AdminBetListParams = {
    page: typeof sp.page === 'string' ? parseInt(sp.page) : 1,
    limit: typeof sp.limit === 'string' ? parseInt(sp.limit) : 25,
    search: typeof sp.search === 'string' ? sp.search : '',
    sortBy: (typeof sp.sortBy === 'string' ? sp.sortBy : 'submitted_at') as AdminBetListParams['sortBy'],
    sortOrder: (typeof sp.sortOrder === 'string' ? sp.sortOrder : 'desc') as AdminBetListParams['sortOrder'],
    status: (typeof sp.status === 'string' ? sp.status : 'all') as AdminBetListParams['status'],
  }

  const pool = getPool()
  const conditions: string[] = ['b.status != ?']
  const queryParams: string[] = ['deleted']

  if (params.search) {
    conditions.push('(b.bet_name LIKE ? OR u.display_name LIKE ?)')
    queryParams.push(`%${params.search}%`, `%${params.search}%`)
  }

  if (params.status && params.status !== 'all') {
    conditions.push('b.status = ?')
    queryParams.push(params.status)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) as total FROM bet_submissions b JOIN users u ON u.id = b.user_id ${where}`,
    queryParams,
  )
  const total = (countRows as any[])[0]?.total || 0

  const offset = ((params.page || 1) - 1) * (params.limit || 25)
  const sortColumn = 'submitted_at'
  const order = 'DESC'

  const hasCols = await hasValidationColumns(pool)

  const selectCols = hasCols
    ? `b.id, b.bet_name, b.user_id, u.display_name, b.champion_name, b.status, b.validated_at, b.validated_by, b.submitted_at`
    : `b.id, b.bet_name, b.user_id, u.display_name, b.champion_name, b.status, b.submitted_at`

  const [betRows] = await pool.execute(
    `SELECT ${selectCols}
     FROM bet_submissions b
     JOIN users u ON u.id = b.user_id
     ${where}
     ORDER BY b.${sortColumn} ${order}
     LIMIT ? OFFSET ?`,
    [...queryParams, String(params.limit || 25), String(offset)],
  )

  const bets = (betRows as any[]).map((row: any) => ({
    ...row,
    validated_at: hasCols ? (row.validated_at ?? null) : null,
    validated_by: hasCols ? (row.validated_by ?? null) : null,
  }))

  const data = {
    bets,
    total,
    page: params.page || 1,
    totalPages: Math.ceil(total / (params.limit || 25)),
  }

  return (
    <AppShell>
      <AdminBetsView initialData={data} initialParams={params} />
    </AppShell>
  )
}
