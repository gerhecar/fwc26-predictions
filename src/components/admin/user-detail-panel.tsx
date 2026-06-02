'use client'

import { useState } from 'react'
import { toggleUserStatus, changeUserRole, deleteUser } from '@/lib/admin/actions'
import type { AdminUser } from '@/types'

interface Props {
  user: AdminUser
  onClose: () => void
  onActionComplete: () => void
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

export function UserDetailPanel({ user, onClose, onActionComplete }: Props) {
  const [working, setWorking] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleToggleActive() {
    setWorking(true)
    setMessage(null)
    const result = await toggleUserStatus(user.id, !user.is_active)
    setMessage({ type: result.success ? 'success' : 'error', text: result.message })
    setWorking(false)
    if (result.success) onActionComplete()
  }

  async function handleToggleRole() {
    const newRole = user.role === 'admin' ? 'user' : 'admin'
    setWorking(true)
    setMessage(null)
    const result = await changeUserRole(user.id, newRole)
    setMessage({ type: result.success ? 'success' : 'error', text: result.message })
    setWorking(false)
    if (result.success) onActionComplete()
  }

  async function handleDelete() {
    setWorking(true)
    setMessage(null)
    const result = await deleteUser(user.id)
    setMessage({ type: result.success ? 'success' : 'error', text: result.message })
    setWorking(false)
    if (result.success) {
      setConfirmDelete(false)
      onActionComplete()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative flex w-full max-w-lg flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-bold text-text-primary">{user.display_name}</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-text-secondary">Email</p>
              <p className="mt-0.5 text-sm text-text-primary">{user.email}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-text-secondary">ID</p>
              <p className="mt-0.5 truncate text-sm text-text-primary" title={user.id}>
                {user.id.slice(0, 8)}...
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-text-secondary">Role</p>
              <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                {user.role === 'admin' ? 'Administrator' : 'User'}
              </span>
            </div>
            <div>
              <p className="text-xs font-medium text-text-secondary">Status</p>
              <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {user.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div>
              <p className="text-xs font-medium text-text-secondary">Registered</p>
              <p className="mt-0.5 text-sm text-text-primary">{formatDate(user.created_at)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-text-secondary">Last access</p>
              <p className="mt-0.5 text-sm text-text-primary">{formatDate(user.last_login_at)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-text-secondary">Predictions</p>
              <p className="mt-0.5 text-sm text-text-primary">{user.prediction_count ?? 0}</p>
            </div>
          </div>

          {message && (
            <div className={`mt-4 rounded-lg p-3 text-sm ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          <div className="mt-6 space-y-3 border-t border-border pt-6">
            <button
              onClick={handleToggleActive}
              disabled={working}
              className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                user.is_active
                  ? 'bg-red-50 text-red-700 hover:bg-red-100'
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              } disabled:opacity-50`}
            >
              {user.is_active ? 'Disable account' : 'Enable account'}
            </button>

            <button
              onClick={handleToggleRole}
              disabled={working}
              className="w-full rounded-lg bg-purple-50 px-4 py-2.5 text-sm font-semibold text-purple-700 transition-colors hover:bg-purple-100 disabled:opacity-50"
            >
              {user.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
            </button>

            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={working}
                className="w-full rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                Delete account
              </button>
            ) : (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="mb-3 text-sm font-medium text-red-700">
                  Permanently delete {user.display_name}? Predictions will be kept anonymous. This action cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={working}
                    className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                  >
                    {working ? 'Deleting...' : 'Yes, delete'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    disabled={working}
                    className="flex-1 rounded-lg border border-border bg-white px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
