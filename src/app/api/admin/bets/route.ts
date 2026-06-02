import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { getPool } from '@/lib/db/pool'
import type { AdminBetListParams } from '@/types'

async function hasValidationColumns(pool: ReturnType<typeof getPool>): Promise<boolean> {
  try {
    const [rows] = await pool.execute("SHOW COLUMNS FROM bet_submissions LIKE 'validated_at'")
    return (rows as any[]).length > 0
  } catch {
    return false
  }
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25')))
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const sortByRaw = searchParams.get('sortBy') || 'submitted_at'
    const sortOrderRaw = searchParams.get('sortOrder') || 'desc'

    const pool = getPool()
    const conditions: string[] = ['b.status != ?']
    const queryParams: string[] = ['deleted']

    if (search) {
      conditions.push('(b.bet_name LIKE ? OR u.display_name LIKE ?)')
      queryParams.push(`%${search}%`, `%${search}%`)
    }

    if (status !== 'all') {
      conditions.push('b.status = ?')
      queryParams.push(status)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const allowedSorts = ['submitted_at', 'bet_name', 'status']
    const sortColumn = allowedSorts.includes(sortByRaw) ? sortByRaw : 'submitted_at'
    const order = sortOrderRaw === 'asc' ? 'ASC' : 'DESC'

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM bet_submissions b JOIN users u ON u.id = b.user_id ${where}`,
      queryParams,
    )
    const total = (countRows as any[])[0]?.total || 0

    const offset = (page - 1) * limit

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
      [...queryParams, String(limit), String(offset)],
    )

    const bets = (betRows as any[]).map((row: any) => ({
      ...row,
      validated_at: hasCols ? (row.validated_at ?? null) : null,
      validated_by: hasCols ? (row.validated_by ?? null) : null,
    }))

    return NextResponse.json({
      bets,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('Admin list bets failed:', message)
    return NextResponse.json({ error: 'Error al listar apuestas' }, { status: 500 })
  }
}
