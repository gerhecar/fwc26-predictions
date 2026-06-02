'use client'

import { useCallback, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { UserDetailPanel } from './user-detail-panel'
import { BackToAdmin } from './back-to-admin'
import type { AdminUser, AdminUserListResponse, AdminUserListParams } from '@/types'

interface Props {
  initialData: AdminUserListResponse
  initialParams: AdminUserListParams
}

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  user: 'bg-blue-100 text-blue-700',
}

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-red-100 text-red-700',
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function SortIcon({ active, direction }: { active: boolean; direction: 'asc' | 'desc' }) {
  return (
    <span className={`ml-1 inline-block ${active ? 'text-white' : 'text-gray-500'}`}>
      {active ? (direction === 'asc' ? '▲' : '▼') : '⇅'}
    </span>
  )
}

export function AdminUsersView({ initialData, initialParams }: Props) {
  const router = useRouter()
  const sp = useSearchParams()

  const [data, setData] = useState(initialData)
  const [params, setParams] = useState(initialParams)
  const [loading, setLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [searchInput, setSearchInput] = useState(initialParams.search || '')

  const fetchUsers = useCallback(async (newParams: AdminUserListParams) => {
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      if (newParams.page && newParams.page > 1) qs.set('page', String(newParams.page))
      if (newParams.limit && newParams.limit !== 25) qs.set('limit', String(newParams.limit))
      if (newParams.search) qs.set('search', newParams.search)
      if (newParams.sortBy && newParams.sortBy !== 'created_at') qs.set('sortBy', newParams.sortBy)
      if (newParams.sortOrder && newParams.sortOrder !== 'desc') qs.set('sortOrder', newParams.sortOrder)
      if (newParams.roleFilter && newParams.roleFilter !== 'all') qs.set('roleFilter', newParams.roleFilter)
      if (newParams.statusFilter && newParams.statusFilter !== 'all') qs.set('statusFilter', newParams.statusFilter)

      router.push(`/admin/users${qs.toString() ? `?${qs.toString()}` : ''}`)

      const res = await fetch(`/api/admin/users?${qs.toString()}`)
      const json = await res.json()
      if (json.users) setData(json)
    } finally {
      setLoading(false)
    }
  }, [router])

  const updateParam = useCallback((key: string, value: string) => {
    const next = { ...params, [key]: value, page: key === 'page' ? Number(value) : 1 }
    setParams(next)
    fetchUsers(next)
  }, [params, fetchUsers])

  const handleSearch = useCallback((value: string) => {
    setSearchInput(value)
    const next = { ...params, search: value, page: 1 }
    setParams(next)
    fetchUsers(next)
  }, [params, fetchUsers])

  const handleSort = useCallback((col: string) => {
    const order = params.sortBy === col && params.sortOrder === 'asc' ? 'desc' : 'asc'
    updateParam('sortBy', col)
    updateParam('sortOrder', order)
  }, [params, updateParam])

  const handleActionComplete = useCallback(() => {
    setSelectedUser(null)
    fetchUsers(params)
  }, [params, fetchUsers])

  return (
    <div className="flex flex-col gap-6">
      <BackToAdmin />
      <div>
        <h1 className="text-2xl font-bold text-text-primary">User Management</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {data.total} usuario{data.total !== 1 ? 's' : ''} registrado{data.total !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full rounded-lg border border-border bg-white px-4 py-2 text-sm text-text-primary placeholder-text-secondary focus:border-fifa-blue focus:outline-none sm:max-w-xs"
        />

        <div className="flex gap-2">
          <select
            value={params.roleFilter || 'all'}
            onChange={(e) => updateParam('roleFilter', e.target.value)}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-primary focus:border-fifa-blue focus:outline-none"
          >
            <option value="all">All roles</option>
            <option value="user">Users</option>
            <option value="admin">Administrators</option>
          </select>

          <select
            value={params.statusFilter || 'all'}
            onChange={(e) => updateParam('statusFilter', e.target.value)}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-primary focus:border-fifa-blue focus:outline-none"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-fifa-navy text-white">
              <th
                className="cursor-pointer px-4 py-3 font-semibold"
                onClick={() => handleSort('display_name')}
              >
                User <SortIcon active={params.sortBy === 'display_name'} direction={params.sortOrder as 'asc' | 'desc'} />
              </th>
              <th
                className="cursor-pointer px-4 py-3 font-semibold"
                onClick={() => handleSort('email')}
              >
                Email <SortIcon active={params.sortBy === 'email'} direction={params.sortOrder as 'asc' | 'desc'} />
              </th>
              <th
                className="cursor-pointer px-4 py-3 font-semibold"
                onClick={() => handleSort('role')}
              >
                Role <SortIcon active={params.sortBy === 'role'} direction={params.sortOrder as 'asc' | 'desc'} />
              </th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th
                className="cursor-pointer px-4 py-3 font-semibold"
                onClick={() => handleSort('created_at')}
              >
                Registered <SortIcon active={params.sortBy === 'created_at'} direction={params.sortOrder as 'asc' | 'desc'} />
              </th>
              <th className="px-4 py-3 font-semibold">Predictions</th>
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
            ) : data.users.length === 0 ? (
              <tr className="border-t border-border">
                <td colSpan={6} className="px-4 py-12 text-center text-text-secondary">
                  No users found
                </td>
              </tr>
            ) : (
              data.users.map((user) => (
                <tr
                  key={user.id}
                  className="cursor-pointer border-t border-border transition-colors hover:bg-gray-50"
                  onClick={() => setSelectedUser(user)}
                >
                  <td className="px-4 py-3 font-medium text-text-primary">
                    {user.display_name}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_BADGE[user.role] || ROLE_BADGE.user}`}>
                      {user.role === 'admin' ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[user.is_active ? 'active' : 'inactive']}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {user.prediction_count ?? 0}
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

      {selectedUser && (
        <UserDetailPanel
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onActionComplete={handleActionComplete}
        />
      )}
    </div>
  )
}
