import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth'
import { getPool } from '@/lib/db/pool'

async function hasValidationColumns(pool: ReturnType<typeof getPool>): Promise<boolean> {
  try {
    const [rows] = await pool.execute("SHOW COLUMNS FROM bet_submissions LIKE 'validated_at'")
    return (rows as any[]).length > 0
  } catch {
    return false
  }
}

export async function GET(
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
    const hasCols = await hasValidationColumns(pool)

    const selectCols = hasCols
      ? `b.id, b.bet_name, b.user_id, u.display_name, b.prediction_json, b.champion_name,
         b.status, b.validated_at, b.validated_by, b.email_sent, b.email_error, b.submitted_at`
      : `b.id, b.bet_name, b.user_id, u.display_name, b.prediction_json, b.champion_name,
         b.status, b.email_sent, b.email_error, b.submitted_at`

    const [rows] = await pool.execute(
      `SELECT ${selectCols}
       FROM bet_submissions b
       JOIN users u ON u.id = b.user_id
       WHERE b.id = ?`,
      [id],
    )

    const bets = rows as any[]
    if (bets.length === 0) {
      return NextResponse.json({ error: 'Apuesta no encontrada' }, { status: 404 })
    }

    const bet = bets[0]
    const predictionJson = typeof bet.prediction_json === 'string'
      ? JSON.parse(bet.prediction_json)
      : bet.prediction_json

    return NextResponse.json({
      id: bet.id,
      betName: bet.bet_name,
      userId: bet.user_id,
      displayName: bet.display_name,
      prediction: predictionJson,
      champion: bet.champion_name,
      status: bet.status,
      validatedAt: hasCols ? (bet.validated_at ?? null) : null,
      validatedBy: hasCols ? (bet.validated_by ?? null) : null,
      emailSent: !!bet.email_sent,
      emailError: bet.email_error ?? null,
      submittedAt: bet.submitted_at,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('Admin get bet detail failed:', message)
    return NextResponse.json({ error: 'Error al obtener apuesta' }, { status: 500 })
  }
}

export async function DELETE(
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

    if (bets[0].status === 'deleted') {
      return NextResponse.json({ error: 'La apuesta ya está eliminada' }, { status: 400 })
    }

    // Get the bet's linked invitation before deleting
    const [betRows] = await pool.execute(
      'SELECT user_id, invitation_id FROM bet_submissions WHERE id = ?',
      [id],
    )
    const bet = (betRows as any[])[0]
    if (!bet) {
      return NextResponse.json({ error: 'Apuesta no encontrada' }, { status: 404 })
    }

    await pool.execute(
      `UPDATE bet_submissions SET status = 'deleted', deleted_at = NOW(), deleted_by = ? WHERE id = ?`,
      [user.id, id],
    )

    // Revoke the invitation token linked to this bet (if any)
    if (bet.invitation_id) {
      await pool.execute(
        `UPDATE bet_invitations SET status = 'revoked', updated_at = NOW()
         WHERE id = ? AND status = 'active'`,
        [bet.invitation_id],
      )
    }

    // Revoke any other active invitations for this user (they can generate fresh ones)
    await pool.execute(
      `UPDATE bet_invitations SET status = 'revoked', updated_at = NOW()
       WHERE user_id = ? AND status = 'active'`,
      [bet.user_id],
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('Admin delete bet failed:', message)
    return NextResponse.json({ error: 'Error al eliminar apuesta' }, { status: 500 })
  }
}
