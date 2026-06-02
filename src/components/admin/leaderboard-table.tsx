'use client'

import { useState, useEffect } from 'react'
import { BackToAdmin } from './back-to-admin'
import type { LeaderboardEntry, LeaderboardResponse } from '@/types'

export function AdminLeaderboardTable() {
  const [data, setData] = useState<LeaderboardResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    fetch('/api/admin/leaderboard')
      .then(r => r.json())
      .then((d: LeaderboardResponse) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return <div className="text-text-secondary text-sm">Cargando leaderboard...</div>
  }

  if (!data || !data.entries || data.entries.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <BackToAdmin />
        <p className="text-text-secondary">No hay apuestas validadas para mostrar.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <BackToAdmin />
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">
          Leaderboard {data.provisionalOnly ? '(Provisional)' : '(Oficial)'}
        </h2>
        <button
          onClick={load}
          className="rounded-full border border-white/10 px-4 py-1.5 text-xs text-text-secondary hover:text-white transition-all"
        >
          Recargar
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-left text-xs font-bold tracking-wide text-text-secondary uppercase">
              <th className="px-4 py-3 w-12 text-center">#</th>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Apuesta</th>
              <th className="px-4 py-3 text-right">Provisional</th>
              <th className="px-4 py-3 text-right">Oficial</th>
              <th className="px-4 py-3 text-right">Total Anterior</th>
            </tr>
          </thead>
          <tbody>
            {data.entries.map((entry: LeaderboardEntry, i: number) => (
              <tr key={entry.userId + entry.betName} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 text-center text-text-secondary font-mono">{i + 1}</td>
                <td className="px-4 py-3 text-white font-medium">{entry.displayName}</td>
                <td className="px-4 py-3 text-text-secondary">{entry.betName}</td>
                <td className="px-4 py-3 text-right font-mono text-accent-green">
                  {entry.provisionalScore}
                  {entry.provisionalScoredAt && (
                    <span className="block text-[10px] text-text-secondary">
                      {new Date(entry.provisionalScoredAt).toLocaleDateString('es-ES')}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-mono text-fifa-gold">
                  {entry.officialScore || '—'}
                </td>
                <td className="px-4 py-3 text-right font-mono text-text-secondary">
                  {entry.totalScore || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-text-secondary text-right">
        Actualizado: {new Date(data.calculatedAt).toLocaleString('es-ES')}
      </p>
    </div>
  )
}
