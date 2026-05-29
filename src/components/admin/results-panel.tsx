'use client'

'use client'

import { useState } from 'react'
import { saveMatchResult } from '@/lib/scoring/actions'

const R32_MATCHES = [
  { number: 73, label: '2°A vs 2°B' },
  { number: 74, label: '1°E vs 3°' },
  { number: 75, label: '1°F vs 2°C' },
  { number: 76, label: '1°C vs 2°F' },
  { number: 77, label: '1°I vs 3°' },
  { number: 78, label: '2°E vs 2°I' },
  { number: 79, label: '1°A vs 3°' },
  { number: 80, label: '1°L vs 3°' },
  { number: 81, label: '1°D vs 3°' },
  { number: 82, label: '1°G vs 3°' },
  { number: 83, label: '2°K vs 2°L' },
  { number: 84, label: '1°H vs 2°J' },
  { number: 85, label: '1°B vs 3°' },
  { number: 86, label: '1°J vs 2°H' },
  { number: 87, label: '1°K vs 3°' },
  { number: 88, label: '2°D vs 2°G' },
]

const R16_MATCHES = [
  { number: 89, label: 'Ganador #74 vs Ganador #77' },
  { number: 90, label: 'Ganador #73 vs Ganador #75' },
  { number: 91, label: 'Ganador #76 vs Ganador #78' },
  { number: 92, label: 'Ganador #79 vs Ganador #80' },
  { number: 93, label: 'Ganador #83 vs Ganador #84' },
  { number: 94, label: 'Ganador #81 vs Ganador #82' },
  { number: 95, label: 'Ganador #86 vs Ganador #88' },
  { number: 96, label: 'Ganador #85 vs Ganador #87' },
]

const QF_MATCHES = [
  { number: 97, label: 'Ganador #89 vs Ganador #90' },
  { number: 98, label: 'Ganador #93 vs Ganador #94' },
  { number: 99, label: 'Ganador #91 vs Ganador #92' },
  { number: 100, label: 'Ganador #95 vs Ganador #96' },
]

const SF_MATCHES = [
  { number: 101, label: 'Ganador #97 vs Ganador #98' },
  { number: 102, label: 'Ganador #99 vs Ganador #100' },
]

const FINAL_MATCHES = [
  { number: 103, label: 'Tercer lugar: Perdedor #101 vs Perdedor #102' },
  { number: 104, label: 'Final: Ganador #101 vs Ganador #102' },
]

function MatchResultRow({
  matchNumber,
  label,
  tournamentId,
  initialWinner,
}: {
  matchNumber: number
  label: string
  tournamentId: string
  initialWinner?: string
}) {
  const [winnerId, setWinnerId] = useState(initialWinner || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!winnerId) return
    setSaving(true)
    try {
      await saveMatchResult(matchNumber, winnerId, tournamentId)
    } catch {
      alert('Error al guardar')
    }
    setSaving(false)
  }

  return (
    <div className="flex items-center gap-3 border border-gray-700 rounded-lg p-3 bg-gray-800/30">
      <span className="text-sm text-gray-400 w-8">#{matchNumber}</span>
      <span className="text-sm text-gray-300 flex-1">{label}</span>
      <input
        type="text"
        value={winnerId}
        onChange={(e) => setWinnerId(e.target.value)}
        placeholder="Team ID"
        className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white w-64 font-mono"
      />
      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !winnerId}
        className="px-3 py-1 rounded bg-fifa-blue text-white text-sm hover:bg-fifa-blue/80 disabled:opacity-50"
      >
        {saving ? '...' : 'Guardar'}
      </button>
    </div>
  )
}

interface Props {
  tournamentId: string
}

export function AdminResultsPanel({ tournamentId }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="text-lg font-bold text-fifa-gold mb-3">32avos de final</h2>
        <div className="flex flex-col gap-2">
          {R32_MATCHES.map((m) => (
            <MatchResultRow key={m.number} matchNumber={m.number} label={m.label} tournamentId={tournamentId} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-fifa-gold mb-3">Octavos de final</h2>
        <div className="flex flex-col gap-2">
          {R16_MATCHES.map((m) => (
            <MatchResultRow key={m.number} matchNumber={m.number} label={m.label} tournamentId={tournamentId} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-fifa-gold mb-3">Cuartos de final</h2>
        <div className="flex flex-col gap-2">
          {QF_MATCHES.map((m) => (
            <MatchResultRow key={m.number} matchNumber={m.number} label={m.label} tournamentId={tournamentId} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-fifa-gold mb-3">Semifinales</h2>
        <div className="flex flex-col gap-2">
          {SF_MATCHES.map((m) => (
            <MatchResultRow key={m.number} matchNumber={m.number} label={m.label} tournamentId={tournamentId} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-fifa-gold mb-3">Final y Tercer lugar</h2>
        <div className="flex flex-col gap-2">
          {FINAL_MATCHES.map((m) => (
            <MatchResultRow key={m.number} matchNumber={m.number} label={m.label} tournamentId={tournamentId} />
          ))}
        </div>
      </section>
    </div>
  )
}
