import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db/pool'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    if (!token || token.length < 10) {
      return NextResponse.json({ valid: false, error: 'Token inválido' }, { status: 400 })
    }

    const pool = getPool()
    const [rows] = await pool.execute(
      `SELECT id, user_id, bet_slot, status, expires_at, used_at
       FROM bet_invitations
       WHERE token = ?
       LIMIT 1`,
      [token],
    )
    const invitations = rows as Array<{
      id: string
      user_id: string
      bet_slot: number
      status: string
      expires_at: string
      used_at: string | null
    }>

    if (invitations.length === 0) {
      return NextResponse.json({ valid: false, error: 'Token no encontrado' }, { status: 404 })
    }

    const inv = invitations[0]

    // Check if expired
    if (new Date(inv.expires_at) < new Date()) {
      // Auto-expire
      await pool.execute(
        "UPDATE bet_invitations SET status = 'expired', updated_at = NOW() WHERE id = ?",
        [inv.id],
      )
      return NextResponse.json({ valid: false, error: 'La invitación ha expirado' }, { status: 410 })
    }

    if (inv.status === 'used') {
      return NextResponse.json({ valid: false, error: 'Esta invitación ya fue utilizada' }, { status: 410 })
    }

    if (inv.status === 'revoked') {
      return NextResponse.json({ valid: false, error: 'Esta invitación fue revocada' }, { status: 410 })
    }

    if (inv.status === 'expired') {
      return NextResponse.json({ valid: false, error: 'La invitación ha expirado' }, { status: 410 })
    }

    // Check owner still has the slot available
    const [betRows] = await pool.execute(
      'SELECT COUNT(*) AS cnt FROM bet_submissions WHERE user_id = ?',
      [inv.user_id],
    )
    const betCount = (betRows as Array<{ cnt: number }>)[0]?.cnt ?? 0

    let slotAvailable = true
    let slotTakenMessage = ''

    if (betCount >= 2) {
      slotAvailable = false
      slotTakenMessage = 'El usuario ya ha alcanzado el máximo de 2 apuestas'
    } else if (betCount >= inv.bet_slot) {
      slotAvailable = false
      slotTakenMessage = 'Este espacio de apuesta ya está ocupado'
    }

    return NextResponse.json({
      valid: true,
      betSlot: inv.bet_slot,
      expiresAt: inv.expires_at,
      slotAvailable,
      ...(slotTakenMessage ? { slotTakenMessage } : {}),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('Validate invitation token failed:', message)
    return NextResponse.json({ valid: false, error: 'Error al validar invitación' }, { status: 500 })
  }
}
