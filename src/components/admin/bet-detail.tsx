'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { validateBet, deleteBet } from '@/lib/admin/actions'
import { BackToAdmin } from './back-to-admin'
import type { BetStatus } from '@/types'

interface BetDetailData {
  id: string
  betName: string
  userId: string
  displayName: string
  prediction: Record<string, unknown>
  champion: string | null
  status: BetStatus
  validatedAt: string | null
  validatedBy: string | null
  emailSent: boolean
  emailError: string | null
  submittedAt: string
}

interface Props {
  bet: BetDetailData
}

const STATUS_BADGE: Record<string, string> = {
  submitted: 'bg-yellow-100 text-yellow-700',
  valid: 'bg-green-100 text-green-700',
  deleted: 'bg-red-100 text-red-700',
}

const STATUS_LABEL: Record<string, string> = {
  submitted: 'Pending',
  valid: 'Valid',
  deleted: 'Deleted',
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AdminBetDetail({ bet }: Props) {
  const router = useRouter()
  const [working, setWorking] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleValidate = async () => {
    setWorking(true)
    setMessage(null)
    const result = await validateBet(bet.id)
    setMessage({ type: result.success ? 'success' : 'error', text: result.message })
    setWorking(false)
    if (result.success) router.refresh()
  }

  const handleDelete = async () => {
    setWorking(true)
    setMessage(null)
    const result = await deleteBet(bet.id)
    setMessage({ type: result.success ? 'success' : 'error', text: result.message })
    setWorking(false)
    if (result.success) {
      setConfirmDelete(false)
      router.push('/admin/bets')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <BackToAdmin />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{bet.betName}</h1>
          <p className="mt-1 text-sm text-text-secondary">
            by {bet.displayName} · {formatDate(bet.submittedAt)}
          </p>
        </div>
        <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${STATUS_BADGE[bet.status]}`}>
          {STATUS_LABEL[bet.status]}
        </span>
      </div>

      {message && (
        <div className={`rounded-lg p-3 text-sm ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-medium text-text-secondary">Bet ID</p>
          <p className="mt-0.5 text-sm text-text-primary font-mono">{bet.id.slice(0, 8)}...</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-medium text-text-secondary">User</p>
          <p className="mt-0.5 text-sm text-text-primary">{bet.displayName}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-medium text-text-secondary">Champion</p>
          <p className="mt-0.5 text-sm text-text-primary">{bet.champion || '—'}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-medium text-text-secondary">Validated on</p>
          <p className="mt-0.5 text-sm text-text-primary">{formatDate(bet.validatedAt)}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-medium text-text-secondary">Validated by</p>
          <p className="mt-0.5 text-sm text-text-primary">{bet.validatedBy || '—'}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-medium text-text-secondary">Email sent</p>
          <p className="mt-0.5 text-sm text-text-primary">
            {bet.emailSent ? 'Yes' : 'No'}
            {bet.emailError && <span className="ml-2 text-red-600">({bet.emailError})</span>}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-3 text-lg font-semibold text-text-primary">Full Prediction</h2>
        <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs text-green-400">
          {JSON.stringify(bet.prediction, null, 2)}
        </pre>
      </div>

      <div className="flex gap-3 border-t border-border pt-6">
        {bet.status === 'submitted' && (
          <button
            onClick={handleValidate}
            disabled={working}
            className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {working ? 'Validating...' : 'Validate Bet'}
          </button>
        )}

        {bet.status !== 'deleted' && (
          <>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={working}
                className="rounded-lg border border-red-200 px-6 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Delete Bet
              </button>
            ) : (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="mb-3 text-sm font-medium text-red-700">
                  Permanently delete this bet? This action cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={working}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {working ? 'Deleting...' : 'Yes, delete'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    disabled={working}
                    className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-semibold text-text-primary hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
