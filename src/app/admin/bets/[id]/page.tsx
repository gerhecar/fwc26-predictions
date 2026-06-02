import { requireAdmin } from '@/lib/auth/auth'
import { getPool } from '@/lib/db/pool'
import { AppShell } from '@/components/layout/app-shell'
import { AdminBetDetail } from '@/components/admin/bet-detail'
import { notFound } from 'next/navigation'
import type { BetStatus } from '@/types'

interface Props {
  params: Promise<{ id: string }>
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

export default async function AdminBetDetailPage({ params }: Props) {
  await requireAdmin()
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
    notFound()
  }

  const bet = bets[0]
  const predictionJson = typeof bet.prediction_json === 'string'
    ? JSON.parse(bet.prediction_json)
    : bet.prediction_json

  const betData = {
    id: bet.id,
    betName: bet.bet_name,
    userId: bet.user_id,
    displayName: bet.display_name,
    prediction: predictionJson,
    champion: bet.champion_name,
    status: bet.status as BetStatus,
    validatedAt: hasCols ? (bet.validated_at ?? null) : null,
    validatedBy: hasCols ? (bet.validated_by ?? null) : null,
    emailSent: !!bet.email_sent,
    emailError: bet.email_error ?? null,
    submittedAt: bet.submitted_at,
  }

  return (
    <AppShell>
      <AdminBetDetail bet={betData} />
    </AppShell>
  )
}
