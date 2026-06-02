'use client'

import { useCallback, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { deleteBet, validateBet } from '@/lib/admin/actions'
import { BackToAdmin } from './back-to-admin'
import type { AdminBet, AdminBetListResponse, AdminBetListParams, BetStatus } from '@/types'

interface Props {
  initialData: AdminBetListResponse
  initialParams: AdminBetListParams
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

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function SortIcon({ active, direction }: { active: boolean; direction: 'asc' | 'desc' }) {
  return (
    <span className={`ml-1 inline-block ${active ? 'text-white' : 'text-gray-500'}`}>
      {active ? (direction === 'asc' ? '▲' : '▼') : '⇅'}
    </span>
  )
}

export function AdminBetsView({ initialData, initialParams }: Props) {
  const router = useRouter()
  const sp = useSearchParams()

  const [data, setData] = useState(initialData)
  const [params, setParams] = useState(initialParams)
  const [loading, setLoading] = useState(false)
  const [searchInput, setSearchInput] = useState(initialParams.search || '')
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null)
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchBets = useCallback(async (newParams: AdminBetListParams) => {
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      if (newParams.page && newParams.page > 1) qs.set('page', String(newParams.page))
      if (newParams.limit && newParams.limit !== 25) qs.set('limit', String(newParams.limit))
      if (newParams.search) qs.set('search', newParams.search)
      if (newParams.sortBy && newParams.sortBy !== 'submitted_at') qs.set('sortBy', newParams.sortBy)
      if (newParams.sortOrder && newParams.sortOrder !== 'desc') qs.set('sortOrder', newParams.sortOrder)
      if (newParams.status && newParams.status !== 'all') qs.set('status', newParams.status)

      router.push(`/admin/bets${qs.toString() ? `?${qs.toString()}` : ''}`)

      const res = await fetch(`/api/admin/bets?${qs.toString()}`)
      const json = await res.json()
      if (json.bets) setData(json)
    } finally {
      setLoading(false)
    }
  }, [router])

  const updateParam = useCallback((key: string, value: string) => {
    const next = { ...params, [key]: value, page: key === 'page' ? Number(value) : 1 }
    setParams(next)
    fetchBets(next)
  }, [params, fetchBets])

  const handleSearch = useCallback((value: string) => {
    setSearchInput(value)
    const next = { ...params, search: value, page: 1 }
    setParams(next)
    fetchBets(next)
  }, [params, fetchBets])

  const handleSort = useCallback((col: string) => {
    const order = params.sortBy === col && params.sortOrder === 'asc' ? 'desc' : 'asc'
    updateParam('sortBy', col)
    updateParam('sortOrder', order)
  }, [params, updateParam])

  const handleValidate = async (betId: string) => {
    setActionMsg(null)
    const result = await validateBet(betId)
    if (result.success) {
      setActionMsg({ type: 'success', text: result.message })
      fetchBets(params)
    } else {
      setActionMsg({ type: 'error', text: result.message })
    }
  }

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return
    setActionMsg(null)
    const result = await deleteBet(confirmDelete.id)
    if (result.success) {
      setActionMsg({ type: 'success', text: result.message })
      setConfirmDelete(null)
      fetchBets(params)
    } else {
      setActionMsg({ type: 'error', text: result.message })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <BackToAdmin />

      <div>
        <h1 className="text-2xl font-bold text-text-primary">Bet Management</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {data.total} apuesta{data.total !== 1 ? 's' : ''} registrada{data.total !== 1 ? 's' : ''}
        </p>
      </div>

      {actionMsg && (
        <div className={`rounded-lg p-3 text-sm ${
          actionMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {actionMsg.text}
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by bet name or user..."
          className="w-full rounded-lg border border-border bg-white px-4 py-2 text-sm text-text-primary placeholder-text-secondary focus:border-fifa-blue focus:outline-none sm:max-w-xs"
        />

        <div className="flex gap-2">
          <select
            value={params.status || 'all'}
            onChange={(e) => updateParam('status', e.target.value)}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-primary focus:border-fifa-blue focus:outline-none"
          >
            <option value="all">All statuses</option>
            <option value="submitted">Pending</option>
            <option value="valid">Valid</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-fifa-navy text-white">
              <th
                className="cursor-pointer px-4 py-3 font-semibold"
                onClick={() => handleSort('bet_name')}
              >
                Bet <SortIcon active={params.sortBy === 'bet_name'} direction={params.sortOrder as 'asc' | 'desc'} />
              </th>
              <th className="px-4 py-3 font-semibold">User</th>
              <th
                className="cursor-pointer px-4 py-3 font-semibold"
                onClick={() => handleSort('status')}
              >
                Status <SortIcon active={params.sortBy === 'status'} direction={params.sortOrder as 'asc' | 'desc'} />
              </th>
              <th className="px-4 py-3 font-semibold">Champion</th>
              <th
                className="cursor-pointer px-4 py-3 font-semibold"
                onClick={() => handleSort('submitted_at')}
              >
                Date <SortIcon active={params.sortBy === 'submitted_at'} direction={params.sortOrder as 'asc' | 'desc'} />
              </th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-border">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.bets.length === 0 ? (
              <tr className="border-t border-border">
                <td colSpan={6} className="px-4 py-12 text-center text-text-secondary">
                  No bets found
                </td>
              </tr>
            ) : (
              data.bets.map((bet) => (
                <tr
                  key={bet.id}
                  className="border-t border-border transition-colors hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium text-text-primary">
                    <Link href={`/admin/bets/${bet.id}`} className="hover:text-fifa-blue">
                      {bet.bet_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{bet.display_name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[bet.status]}`}>
                      {STATUS_LABEL[bet.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{bet.champion_name || '—'}</td>
                  <td className="px-4 py-3 text-text-secondary">{formatDate(bet.submitted_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Link
                        href={`/admin/bets/${bet.id}`}
                        className="rounded px-2 py-1 text-xs font-medium text-fifa-blue hover:bg-blue-50"
                      >
                        View
                      </Link>
                      {bet.status === 'submitted' && (
                        <button
                          onClick={() => handleValidate(bet.id)}
                          className="rounded px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-50"
                        >
                          Validate
                        </button>
                      )}
                      {bet.status !== 'deleted' && (
                        <button
                          onClick={() => setConfirmDelete({ id: bet.id, name: bet.bet_name })}
                          className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <select
            value={params.limit || 25}
            onChange={(e) => updateParam('limit', e.target.value)}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-primary focus:border-fifa-blue focus:outline-none"
          >
            <option value={10}>10 por página</option>
            <option value={25}>25 por página</option>
            <option value={50}>50 por página</option>
          </select>

          <div className="flex items-center gap-2">
            <button
              onClick={() => updateParam('page', String(data.page - 1))}
              disabled={data.page <= 1}
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-primary transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-text-secondary">
              Página {data.page} de {data.totalPages}
            </span>
            <button
              onClick={() => updateParam('page', String(data.page + 1))}
              disabled={data.page >= data.totalPages}
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-primary transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-text-primary">Delete bet</h3>
            <p className="mt-2 text-sm text-text-secondary">
              Permanently delete the bet <strong>{confirmDelete.name}</strong>? This action cannot be undone.
            </p>
            <div className="mt-4 flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Yes, delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
