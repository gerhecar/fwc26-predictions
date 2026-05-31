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
}

export function DashboardClient({ displayName }: { displayName: string }) {
  const router = useRouter()
  const reset = usePredictionsStore((s) => s.reset)
  const [bets, setBets] = useState<BetSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/predictions/save')
      .then(r => r.json())
      .then(data => {
        if (data.bets) setBets(data.bets)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleCreateBet = useCallback(() => {
    reset()
    router.push('/predictions')
  }, [reset, router])

  const handleViewBet = useCallback((betId: string) => {
    router.push(`/predictions/bet/${betId}`)
  }, [router])

  const slots = [
    { index: 0, bet: bets[0] ?? null },
    { index: 1, bet: bets[1] ?? null },
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
            {slots.map(({ index, bet }) => (
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
                        ENVIADO
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
                  <button
                    onClick={handleCreateBet}
                    className="flex w-full flex-col items-center gap-2 py-6 text-center transition-all hover:opacity-80"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-white/20 text-white/40">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="10" y1="4" x2="10" y2="16" />
                        <line x1="4" y1="10" x2="16" y2="10" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-[family-name:var(--font-bebas)] text-base tracking-wide text-white">
                        BET {index + 1}
                      </p>
                      <p className="text-xs text-text-secondary mt-0.5">Crear nueva apuesta</p>
                    </div>
                    <span className="rounded-full bg-accent-green px-6 py-1.5 text-xs font-bold tracking-wide text-black mt-1">
                      CREATE BET
                    </span>
                  </button>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Other sections */}
      <div className="grid gap-4 sm:grid-cols-2">
        <button onClick={() => router.push('/predictions')} className="text-left">
          <Card className="transition-all hover:border-white/30">
            <div className="text-3xl">📋</div>
            <h3 className="mt-2 font-semibold text-white">Nueva Predicción</h3>
            <p className="mt-1 text-sm text-text-secondary">
              Comienza desde la fase de grupos
            </p>
          </Card>
        </button>

        <button onClick={() => router.push('/rankings')} className="text-left">
          <Card className="transition-all hover:border-white/30">
            <div className="text-3xl">📊</div>
            <h3 className="mt-2 font-semibold text-white">Tabla de Posiciones</h3>
            <p className="mt-1 text-sm text-text-secondary">
              Mira cómo vas en la competencia
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
