'use client'

import { useState, useEffect } from 'react'
import { createGroup, joinGroup, leaveGroup, getUserGroups, getGroupMembers } from '@/lib/groups/actions/group-actions'

interface UserGroup {
  id: string
  name: string
  invite_code: string
  created_by: string
  created_at: string
  memberCount: number
}

export function GroupManager() {
  const [groups, setGroups] = useState<UserGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [createdCode, setCreatedCode] = useState<string | null>(null)

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    setLoading(true)
    const data = await getUserGroups()
    setGroups(data)
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    setError('')
    setMessage('')
    try {
      const result = await createGroup(newName.trim())
      setCreatedCode(result.inviteCode)
      setMessage(`Grupo "${newName}" creado. Comparte el código con tus amigos.`)
      setNewName('')
      loadGroups()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al crear grupo')
    }
  }

  const handleJoin = async () => {
    if (!inviteCode.trim()) return
    setError('')
    setMessage('')
    try {
      await joinGroup(inviteCode.trim().toUpperCase())
      setMessage('¡Te has unido al grupo!')
      setInviteCode('')
      loadGroups()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al unirse')
    }
  }

  const handleLeave = async (groupId: string) => {
    try {
      await leaveGroup(groupId)
      loadGroups()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al salir')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <h2 className="font-semibold text-white mb-3">Crear grupo</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre del grupo"
              className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="px-4 py-2 rounded-lg bg-fifa-blue text-white text-sm font-semibold hover:bg-fifa-blue/80 disabled:opacity-50"
            >
              Crear
            </button>
          </div>
          {createdCode && (
            <div className="mt-3 p-3 bg-fifa-gold/10 border border-fifa-gold/30 rounded-lg">
              <p className="text-xs text-fifa-gold mb-1">Código de invitación (compártelo):</p>
              <p className="text-2xl font-bold text-fifa-gold tracking-widest">{createdCode}</p>
            </div>
          )}
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <h2 className="font-semibold text-white mb-3">Unirse a un grupo</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Código de invitación"
              className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white font-mono tracking-widest"
            />
            <button
              type="button"
              onClick={handleJoin}
              disabled={!inviteCode.trim()}
              className="px-4 py-2 rounded-lg bg-fifa-green text-white text-sm font-semibold hover:bg-fifa-green/80 disabled:opacity-50"
            >
              Unirse
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {message && (
        <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-3">
          <p className="text-green-400 text-sm">{message}</p>
        </div>
      )}

      <div>
        <h2 className="font-semibold text-white text-lg mb-3">Mis grupos</h2>
        {loading ? (
          <p className="text-gray-400">Cargando...</p>
        ) : groups.length === 0 ? (
          <p className="text-gray-500">No estás en ningún grupo aún. Crea uno o únete con un código.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {groups.map((g) => (
              <div key={g.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">{g.name}</h3>
                    <p className="text-sm text-gray-400">{g.memberCount} miembros</p>
                    <p className="text-xs text-gray-500 font-mono mt-1">Código: {g.invite_code}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleLeave(g.id)}
                    className="px-3 py-1 rounded-lg bg-red-900/30 text-red-400 text-sm hover:bg-red-900/50 transition-all"
                  >
                    Salir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
