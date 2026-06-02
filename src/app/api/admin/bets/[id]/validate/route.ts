import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { getPool } from '@/lib/db/pool'

export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { id } = await params
    const pool = getPool()

    const [existing] = await pool.execute(
      'SELECT id, status FROM bet_submissions WHERE id = ?',
      [id],
    )
    const bets = existing as any[]
    if (bets.length === 0) {
      return NextResponse.json({ error: 'Apuesta no encontrada' }, { status: 404 })
    }

    if (bets[0].status !== 'submitted') {
      return NextResponse.json({ error: 'Solo se pueden validar apuestas en estado submitted' }, { status: 400 })
    }

    await pool.execute(
      "UPDATE bet_submissions SET status = 'valid', validated_at = NOW(), validated_by = ? WHERE id = ?",
      [user.id, id],
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('Admin validate bet failed:', message)
    return NextResponse.json({ error: 'Error al validar apuesta' }, { status: 500 })
  }
}
