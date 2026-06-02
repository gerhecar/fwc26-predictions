import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { getPool } from '@/lib/db/pool'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const pool = getPool()
    const [rows] = await pool.execute(
      `SELECT id, bet_slot, status, expires_at, used_at, used_by_name, created_at
       FROM bet_invitations
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [user.id],
    )

    return NextResponse.json({ invitations: rows })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('Fetch invitations failed:', message)
    return NextResponse.json({ error: 'Error al obtener invitaciones' }, { status: 500 })
  }
}
