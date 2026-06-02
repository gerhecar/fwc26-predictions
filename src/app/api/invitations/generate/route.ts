import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { getPool } from '@/lib/db/pool'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { betSlot } = await request.json() as { betSlot: 1 | 2 }
    if (betSlot !== 1 && betSlot !== 2) {
      return NextResponse.json({ error: 'betSlot debe ser 1 o 2' }, { status: 400 })
    }

    const pool = getPool()

    // Count existing non-deleted bets
    const [countRows] = await pool.execute(
      "SELECT COUNT(*) AS cnt FROM bet_submissions WHERE user_id = ? AND status != 'deleted'",
      [user.id],
    )
    const existingCount = (countRows as Array<{ cnt: number }>)[0]?.cnt ?? 0

    // Check if this specific slot is already submitted
    const [slotRows] = await pool.execute(
      "SELECT id FROM bet_submissions WHERE user_id = ? AND status != 'deleted' ORDER BY submitted_at ASC",
      [user.id],
    )
    const userBets = slotRows as Array<{ id: string }>
    if (userBets.length >= betSlot) {
      return NextResponse.json({ error: 'Este espacio ya tiene una apuesta' }, { status: 400 })
    }
    if (existingCount >= 2) {
      return NextResponse.json({ error: 'Máximo 2 apuestas por usuario' }, { status: 400 })
    }

    // Revoke previous active invitation for this slot
    await pool.execute(
      "UPDATE bet_invitations SET status = 'revoked', updated_at = NOW() WHERE user_id = ? AND bet_slot = ? AND status = 'active'",
      [user.id, betSlot],
    )

    // Generate token
    const rawToken = crypto.randomBytes(32).toString('hex')
    const id = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      .toISOString().slice(0, 19).replace('T', ' ')

    await pool.execute(
      `INSERT INTO bet_invitations (id, user_id, bet_slot, token, status, expires_at)
       VALUES (?, ?, ?, ?, 'active', ?)`,
      [id, user.id, betSlot, rawToken, expiresAt],
    )

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3000}`

    return NextResponse.json({
      success: true,
      invitation: {
        id,
        betSlot,
        token: rawToken,
        status: 'active',
        expiresAt,
        inviteUrl: `${baseUrl}/invite/${rawToken}`,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('Generate invitation failed:', message)
    return NextResponse.json({ error: 'Error al generar invitación' }, { status: 500 })
  }
}
