'use client'

import { useState } from 'react'
import { updateTournamentStatus, recalculateStandings } from '@/lib/scoring/actions'

interface Props {
  initialStatus: string
  tournamentId: string
}

export function AdminDashboard({ initialStatus, tournamentId }: Props) {
  const [status, setStatus] = useState(initialStatus)
  const [recalculating, setRecalculating] = useState(false)
  const [recResult, setRecResult] = useState<string | null>(null)

  const handleStatusChange = async (newStatus: string) => {
    await updateTournamentStatus(tournamentId, newStatus)
    setStatus(newStatus)
  }

  const handleRecalculate = async () => {
    setRecalculating(true)
    setRecResult(null)
    try {
      const result = await recalculateStandings(tournamentId)
      setRecResult(`Updated ${result.updated} users`)
    } catch {
      setRecResult('Error recalculating')
    }
    setRecalculating(false)
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
      <h2 className="font-semibold text-white mb-4">Tournament Status</h2>
      <div className="flex gap-2 flex-wrap mb-4">
        {(['draft', 'active', 'locked', 'completed'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleStatusChange(s)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              status === s
                ? 'bg-fifa-gold text-fifa-navy'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {s === 'draft' ? 'Draft' : s === 'active' ? 'Active' : s === 'locked' ? 'Locked' : 'Completed'}
          </button>
        ))}
      </div>

      <div className="border-t border-gray-700 pt-4">
        <button
          type="button"
          onClick={handleRecalculate}
          disabled={recalculating}
          className="px-6 py-2 rounded-lg bg-fifa-blue text-white font-semibold hover:bg-fifa-blue/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {recalculating ? 'Calculating...' : 'Recalculate scores'}
        </button>
        {recResult && (
          <p className="text-sm text-gray-400 mt-2">{recResult}</p>
        )}
      </div>
    </div>
  )
}
