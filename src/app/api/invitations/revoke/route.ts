import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { getPool } from '@/lib/db/pool'

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { invitationId } = await request.json() as { invitationId: string }
    if (!invitationId) {
      return NextResponse.json({ error: 'invitationId requerido' }, { status: 400 })
    }

    const pool = getPool()

    const [rows] = await pool.execute(
      'SELECT id, user_id, status FROM bet_invitations WHERE id = ?',
      [invitationId],
    )
    const invitations = rows as Array<{ id: string; user_id: string; status: string }>

    if (invitations.length === 0) {
      return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 })
    }

    const invitation = invitations[0]
    if (invitation.user_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    if (invitation.status !== 'active') {
      return NextResponse.json({ error: 'La invitación ya no está activa' }, { status: 400 })
    }

    await pool.execute(
      "UPDATE bet_invitations SET status = 'revoked', updated_at = NOW() WHERE id = ?",
      [invitationId],
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('Revoke invitation failed:', message)
    return NextResponse.json({ error: 'Error al revocar invitación' }, { status: 500 })
  }
}
