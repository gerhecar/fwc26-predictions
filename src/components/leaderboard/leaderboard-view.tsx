'use client'

import { useState, useEffect } from 'react'
import type { UserLeaderboardResponse, UserLeaderboardEntry } from '@/types'

export function LeaderboardView() {
  const [data, setData] = useState<UserLeaderboardResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then((d: UserLeaderboardResponse) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-green border-t-transparent" />
          <p className="text-sm text-text-secondary">Loading leaderboard...</p>
        </div>
      </div>
    )
  }

  if (!data || !data.entries || data.entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-secondary">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <h2 className="font-[family-name:var(--font-bebas)] text-2xl tracking-wide text-white">
          Leaderboard not available
        </h2>
        <p className="text-sm text-text-secondary text-center max-w-md">
           Scores will appear once organizers start entering results.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-white">
          Leaderboard
        </h1>
        <p className="text-text-secondary text-sm">Valid bets ranking</p>
      </div>

      {data.isDraft && (
        <div className="rounded-xl border border-fifa-gold/20 bg-fifa-gold/5 px-4 py-3">
          <div className="flex items-start gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0 text-fifa-gold">
              <path d="M12 9v4M12 17h.01" />
              <circle cx="12" cy="12" r="10" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-fifa-gold">
                Provisional Scores
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                Ranking based on provisional results. Scores may change until official results are confirmed.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-left text-xs font-bold tracking-wide text-text-secondary uppercase">
              <th className="px-4 py-3 w-12 text-center">#</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Bet</th>
              <th className="px-4 py-3 text-right">Score</th>
              <th className="px-4 py-3 text-right">Estado</th>
            </tr>
          </thead>
          <tbody>
            {data.entries.map((entry: UserLeaderboardEntry) => (
              <tr key={entry.position} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 text-center text-text-secondary font-mono">
                  {entry.position}
                </td>
                <td className="px-4 py-3 text-white font-medium">
                  {entry.displayName}
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {entry.betName}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-mono text-accent-green text-base">
                    {entry.provisionalScore}
                  </span>
                  {entry.officialScore !== null && entry.officialScore !== entry.provisionalScore && (
                    <span className="block text-[11px] font-mono text-fifa-gold">
                      Official: {entry.officialScore}
                    </span>
                  )}
                  {(entry.provisionalScoredAt || entry.officialScoredAt) && (
                    <span className="block text-[10px] text-text-secondary">
                      {new Date(
                        entry.provisionalScoredAt || entry.officialScoredAt!,
                      ).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${
                      entry.statusLabel === 'official'
                        ? 'border border-fifa-gold/30 bg-fifa-gold/10 text-fifa-gold'
                        : entry.statusLabel === 'provisional'
                          ? 'border border-accent-green/30 bg-accent-green/10 text-accent-green'
                          : 'border border-white/10 bg-white/5 text-text-secondary'
                    }`}
                  >
                    {entry.statusLabel === 'official'
                      ? 'OFFICIAL'
                      : entry.statusLabel === 'provisional'
                        ? 'PROVISIONAL'
                        : 'NOT CALCULATED'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.calculatedAt && (
        <p className="text-[10px] text-text-secondary text-right">
          Updated: {new Date(data.calculatedAt).toLocaleString('en-US')}
        </p>
      )}

      <div className="text-center">
        <button
          onClick={load}
          className="rounded-full border border-white/10 px-5 py-2 text-xs text-text-secondary hover:text-white transition-all"
        >
          Reload
        </button>
      </div>
    </div>
  )
}
