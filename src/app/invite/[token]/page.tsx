'use client'

import { use, useEffect, useState } from 'react'
import { GuestFlow } from '@/components/invite/guest-flow'

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)

  const [validating, setValidating] = useState(true)
  const [valid, setValid] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [betSlot, setBetSlot] = useState<number | null>(null)

  useEffect(() => {
    if (!token) return
    fetch(`/api/invite/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.valid) {
          setValid(true)
          setBetSlot(data.betSlot)
        } else {
          setError(data.error || 'Invitación inválida')
        }
      })
      .catch(() => setError('Error al validar la invitación'))
      .finally(() => setValidating(false))
  }, [token])

  if (validating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0e1a]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-green border-t-transparent" />
          <p className="text-sm text-text-secondary">Validando invitación...</p>
        </div>
      </div>
    )
  }

  if (!valid || error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0a0e1a] px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h1 className="font-[family-name:var(--font-bebas)] text-2xl tracking-wide text-white">
          Invitación Inválida
        </h1>
        <p className="text-sm text-text-secondary text-center max-w-md">
          {error || 'No se pudo validar la invitación'}
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <div className="border-b border-white/10 bg-white/[0.02] px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <span className="text-sm font-[family-name:var(--font-bebas)] tracking-wide text-accent-green/80">
            INVITACIÓN — Apuesta {betSlot}
          </span>
          <span className="text-xs text-text-secondary">
            Guest Mode
          </span>
        </div>
      </div>
      <GuestFlow token={token} />
    </div>
  )
}
