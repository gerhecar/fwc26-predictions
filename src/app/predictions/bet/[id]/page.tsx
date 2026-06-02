'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BetDetail } from '@/components/predictions/bet-detail'
import { getDashboardRoute } from '@/lib/auth/routes'
import type { PredictionExport } from '@/lib/predictions/json-export'

export default function BetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [data, setData] = useState<{
    betName: string
    prediction: PredictionExport
    champion: string
    submittedAt: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(u => setUserRole(u?.role || null))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch(`/api/predictions/bet/${id}`)
      .then(r => r.json())
      .then(res => {
        if (res.error) throw new Error(res.error)
        setData(res)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0e1a]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-green border-t-transparent" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0a0e1a]">
        <p className="text-red-400">{error || 'Apuesta no encontrada'}</p>
        <button
          onClick={() => router.push(getDashboardRoute(userRole))}
          className="rounded-full border border-white/20 px-5 py-2 text-xs font-bold tracking-wide text-text-secondary transition-all hover:border-white/40 hover:text-white"
        >
          VOLVER AL DASHBOARD
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <button
          onClick={() => router.push(getDashboardRoute(userRole))}
          className="mb-4 rounded-full border border-white/20 px-5 py-2 text-xs font-bold tracking-wide text-text-secondary transition-all hover:border-white/40 hover:text-white"
        >
          ← VOLVER AL DASHBOARD
        </button>
        <BetDetail
          prediction={data.prediction}
          betName={data.betName}
          submittedAt={data.submittedAt}
          champion={data.champion}
        />
      </div>
    </div>
  )
}
