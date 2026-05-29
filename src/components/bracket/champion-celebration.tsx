'use client'

import type { Team, Group } from '@/types'

interface Props {
  champion: Team | null
  championId: string | null
  groups: (Group & { teams: Team[] })[]
  compact?: boolean
}

function Confetti() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {Array.from({ length: 40 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-${Math.random() * 20}%`,
            backgroundColor: ['#fbbf24', '#3b82f6', '#ef4444', '#10b981', '#a855f7', '#ec4899'][Math.floor(Math.random() * 6)],
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 3}s`,
            transform: `rotate(${Math.random() * 360}deg)`,
            width: `${4 + Math.random() * 8}px`,
            height: `${4 + Math.random() * 8}px`,
          }}
        />
      ))}
    </div>
  )
}

export function ChampionCelebration({ champion, championId, groups, compact }: Props) {
  if (!championId) return null

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-fifa-gold/20 to-yellow-900/20 border border-fifa-gold/40 rounded-xl p-4 flex items-center gap-4">
        <div className="text-3xl">🏆</div>
        <div>
          <p className="text-xs text-fifa-gold uppercase tracking-wider">Tu campeón</p>
          <p className="text-xl font-bold text-white">{champion?.name || 'Seleccionado'}</p>
        </div>
      </div>
    )
  }

  const allTeams = groups.flatMap(g => g.teams)
  const championName = champion?.name || allTeams.find(t => t.id === championId)?.name || 'Campeón'

  return (
    <div className="relative">
      <Confetti />

      <div className="bg-gradient-to-b from-fifa-gold/20 to-transparent rounded-2xl p-8 text-center border border-fifa-gold/30">
        <div className="text-6xl mb-4 animate-bounce">🏆</div>
        <h1 className="text-3xl font-bold text-fifa-gold mb-2">¡Pronósticos completados!</h1>
        <p className="text-xl text-gray-300 mb-2">
          Tu campeón del Mundial 2026:
        </p>
        <p className="text-4xl font-black text-white mb-4">{championName}</p>
        <p className="text-sm text-gray-400">
          Tus pronósticos han sido guardados. Vuelve cuando termine el torneo para ver los resultados.
        </p>
      </div>
    </div>
  )
}
