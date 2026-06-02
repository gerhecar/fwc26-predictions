'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { usePredictionsStore } from '@/lib/predictions/store'
import { Card } from '@/components/ui/card'
import { CountryFlag } from '@/components/ui/country-flag'

interface BetSummary {
  id: string
  bet_name: string
  champion_name: string
  submitted_at: string
  submitted_via_invitation?: boolean
  invitation_id?: string | null
}

interface InvitationInfo {
  id: string
  bet_slot: number
  status: string
  expires_at: string
  used_at: string | null
  used_by_name: string | null
}

const APP_URL = typeof window !== 'undefined' ? window.location.origin : ''

export function DashboardClient({ displayName }: { displayName: string }) {
  const router = useRouter()
  const reset = usePredictionsStore((s) => s.reset)
  const [bets, setBets] = useState<BetSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [invitations, setInvitations] = useState<InvitationInfo[]>([])
  const [actionMsg, setActionMsg] = useState<{ slot: number; type: 'ok' | 'err'; text: string } | null>(null)

  const loadData = useCallback(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/predictions/save').then(r => r.json()),
      fetch('/api/invitations/user').then(r => r.json()),
    ])
      .then(([betsData, invData]) => {
        if (betsData.bets) setBets(betsData.bets)
        if (invData.invitations) setInvitations(invData.invitations)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleCreateBet = useCallback(() => {
    reset()
    router.push('/predictions')
  }, [reset, router])

  const handleViewBet = useCallback((betId: string) => {
    router.push(`/predictions/bet/${betId}`)
  }, [router])

  const getSlotBet = useCallback((slot: number): BetSummary | null => {
    // Slot 1 = first bet (by submission order), Slot 2 = second bet
    const slotBet = bets[slot - 1] || null
    return slotBet
  }, [bets])

  const getSlotInvitation = useCallback((slot: number): InvitationInfo | null => {
    const active = invitations.find(i => i.bet_slot === slot && i.status === 'active')
    return active || null
  }, [invitations])

  const generateInvitation = useCallback(async (betSlot: number) => {
    setActionMsg(null)
    try {
      const res = await fetch('/api/invitations/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betSlot }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      if (data.invitation?.inviteUrl) {
        await navigator.clipboard.writeText(data.invitation.inviteUrl)
        setActionMsg({ slot: betSlot, type: 'ok', text: 'Link copiado al portapapeles' })
      }
      loadData()
    } catch (err) {
      setActionMsg({ slot: betSlot, type: 'err', text: err instanceof Error ? err.message : 'Error' })
    }
  }, [loadData])

  const revokeInvitation = useCallback(async (invitationId: string, betSlot: number) => {
    setActionMsg(null)
    try {
      const res = await fetch('/api/invitations/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      setActionMsg({ slot: betSlot, type: 'ok', text: 'Invitación revocada' })
      loadData()
    } catch (err) {
      setActionMsg({ slot: betSlot, type: 'err', text: err instanceof Error ? err.message : 'Error' })
    }
  }, [loadData])

  const copyInvitationLink = useCallback(async (betSlot: number) => {
    const inv = getSlotInvitation(betSlot)
    if (!inv) return
    // The token is only returned at generation time, so we need a way to get it.
    // For display, we show the link format only if we stored it.
    // Since we don't store the raw token in the list, we refetch from the API.
    // For simplicity, regenerate the link using the stored info.
    // Actually, the token is stored in the generate response but not in the list endpoint.
    // Let's regenerate to get a fresh link.
    setActionMsg({ slot: betSlot, type: 'ok', text: 'Regenera el link desde el botón Generar' })
  }, [getSlotInvitation])

  const slots = [
    { index: 0, slot: 1, bet: getSlotBet(1) },
    { index: 1, slot: 2, bet: getSlotBet(2) },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-white">
          Bienvenido, {displayName}
        </h1>
        <p className="text-text-secondary text-sm">Mundial FIFA 2026</p>
      </div>

      {/* My Predictions section */}
      <div>
        <h2 className="font-[family-name:var(--font-bebas)] text-xl tracking-wide text-white mb-4">
          MIS APUESTAS
        </h2>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent-green border-t-transparent" />
            Cargando...
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {slots.map(({ index, slot, bet }) => {
              const inv = getSlotInvitation(slot)
              const actionMsgSlot = actionMsg?.slot === slot ? actionMsg : null
              return (
                <Card key={index} className={bet ? '' : 'border-dashed border-white/20'}>
                  {bet ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-[family-name:var(--font-bebas)] text-lg tracking-wide text-white">
                            {bet.bet_name}
                          </p>
                          <p className="text-[11px] text-text-secondary mt-0.5">
                            {new Date(bet.submitted_at).toLocaleDateString('es-ES', {
                              year: 'numeric', month: 'short', day: 'numeric'
                            })}
                          </p>
                        </div>
                        <span className="rounded-full border border-accent-green/30 bg-accent-green/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-accent-green">
                          {bet.submitted_via_invitation ? 'INVITADO' : 'ENVIADO'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CountryFlag name={bet.champion_name} width={20} className="shrink-0" />
                        <span className="text-text-secondary">Campeón:</span>
                        <span className="text-white">{bet.champion_name}</span>
                      </div>
                      <button
                        onClick={() => handleViewBet(bet.id)}
                        className="mt-1 self-start rounded-full border border-white/20 px-5 py-2 text-xs font-bold tracking-wide text-text-secondary transition-all hover:border-white/40 hover:text-white"
                      >
                        VIEW BET
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 py-4">
                      <button
                        onClick={handleCreateBet}
                        className="flex w-full flex-col items-center gap-2 py-3 text-center transition-all hover:opacity-80"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-white/20 text-white/40">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="10" y1="4" x2="10" y2="16" />
                            <line x1="4" y1="10" x2="16" y2="10" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-[family-name:var(--font-bebas)] text-base tracking-wide text-white">
                            BET {slot}
                          </p>
                          <p className="text-xs text-text-secondary mt-0.5">Crear nueva apuesta</p>
                        </div>
                        <span className="rounded-full bg-accent-green px-6 py-1.5 text-xs font-bold tracking-wide text-black mt-1">
                          CREATE BET
                        </span>
                      </button>

                      <div className="border-t border-white/10 pt-3">
                        {inv ? (
                          <div className="flex flex-col gap-2">
                            <span className="text-[10px] text-accent-green/80 font-bold tracking-wide uppercase">
                              ✓ Invitación activa
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => generateInvitation(slot)}
                                className="flex-1 rounded-full border border-accent-green/30 px-3 py-1.5 text-[10px] font-bold tracking-wide text-accent-green transition-all hover:bg-accent-green/10"
                              >
                                REGENERAR
                              </button>
                              <button
                                onClick={() => revokeInvitation(inv.id, slot)}
                                className="flex-1 rounded-full border border-red-500/30 px-3 py-1.5 text-[10px] font-bold tracking-wide text-red-400 transition-all hover:bg-red-500/10"
                              >
                                REVOCAR
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => generateInvitation(slot)}
                            className="w-full rounded-full border border-white/20 px-3 py-2 text-[10px] font-bold tracking-wide text-text-secondary transition-all hover:border-white/40 hover:text-white"
                          >
                            + GENERAR INVITACIÓN
                          </button>
                        )}
                      </div>

                      {actionMsgSlot && (
                        <p className={`text-center text-[10px] ${actionMsgSlot.type === 'ok' ? 'text-accent-green' : 'text-red-400'}`}>
                          {actionMsgSlot.text}
                        </p>
                      )}
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Other sections */}
      <div className="grid gap-4 sm:grid-cols-2">
        <button onClick={() => router.push('/leaderboard')} className="text-left">
          <Card className="transition-all hover:border-white/30">
            <div className="text-3xl">🏅</div>
            <h3 className="mt-2 font-semibold text-white">Leaderboard</h3>
            <p className="mt-1 text-sm text-text-secondary">
              Ranking de apuestas con puntajes provisorios
            </p>
          </Card>
        </button>

        <button onClick={() => router.push('/rules')} className="text-left">
          <Card className="transition-all hover:border-white/30">
            <div className="text-3xl">📋</div>
            <h3 className="mt-2 font-semibold text-white">Reglas & Puntuaci&oacute;n</h3>
            <p className="mt-1 text-sm text-text-secondary">
              Sistema de puntuaci&oacute;n, desempates y reglas
            </p>
          </Card>
        </button>
      </div>

      <div className="text-center text-xs text-text-secondary">
        Máximo 2 apuestas por usuario
      </div>
    </div>
  )
}
