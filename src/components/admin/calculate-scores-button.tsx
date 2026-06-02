'use client'

import { useState } from 'react'

export function CalculateScoresButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleClick = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/calculate-scores', { method: 'POST' })
      const data = await res.json()

      if (data.success && data.summary) {
        const s = data.summary
        setResult(
          `✅ ${s.scoredBets} bet${s.scoredBets !== 1 ? 's' : ''} scored` +
          (s.skippedBets > 0 ? `, ${s.skippedBets} skipped` : '') +
          (s.errors.length > 0 ? `, ${s.errors.length} error${s.errors.length !== 1 ? 's' : ''}` : '') +
          ` — ${new Date(s.calculatedAt).toLocaleString('en-US')}`
        )
      } else if (data.message) {
        setResult(data.message)
      } else if (data.error) {
        setResult(`Error: ${data.error}`)
      } else {
        setResult('Scores calculated successfully')
      }
    } catch {
      setResult('Error calculating scores')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full rounded-full bg-fifa-gold px-6 py-2 text-sm font-bold tracking-wide text-fifa-navy transition-all hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] disabled:opacity-50"
      >
        {loading ? 'CALCULATING...' : 'CALCULATE SCORES'}
      </button>
      {result && (
        <p className="mt-2 text-center text-sm text-gray-400">{result}</p>
      )}
    </div>
  )
}
