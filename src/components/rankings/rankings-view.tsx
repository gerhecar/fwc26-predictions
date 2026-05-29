'use client'

import { useState } from 'react'

export interface StandingWithProfile {
  id: string
  user_id: string
  tournament_id: string
  user_group_id: string | null
  total_points: number
  rank: number
  calculated_at: string
  display_name?: string
  avatar_url?: string | null
}

interface UserGroup {
  id: string
  name: string
}

interface Props {
  globalStandings: StandingWithProfile[]
  userGroups: UserGroup[]
  groupStandings: Record<string, StandingWithProfile[]>
  currentUserId: string | null
}

function MedalIcon({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-fifa-gold text-lg">🥇</span>
  if (rank === 2) return <span className="text-gray-300 text-lg">🥈</span>
  if (rank === 3) return <span className="text-amber-600 text-lg">🥉</span>
  return <span className="text-gray-500 w-6 text-center text-sm">#{rank}</span>
}

function StandingsTable({ standings, currentUserId, title }: {
  standings: StandingWithProfile[]
  currentUserId: string | null
  title: string
}) {
  if (standings.length === 0) {
    return (
      <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6 text-center">
        <p className="text-gray-500">Sin puntajes aún. El administrador debe cargar resultados y recalcular.</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-800/30 border border-gray-700 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-gray-700">
        <h2 className="font-semibold text-white">{title}</h2>
      </div>
      <div className="divide-y divide-gray-700/50">
        {standings.map((s) => {
          const isMe = s.user_id === currentUserId
          return (
            <div
              key={s.id}
              className={`flex items-center gap-3 px-4 py-3 ${
                isMe ? 'bg-fifa-gold/5 border-l-2 border-fifa-gold' : ''
              }`}
            >
              <div className="w-10 flex justify-center">
                <MedalIcon rank={s.rank} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${isMe ? 'text-fifa-gold' : 'text-white'}`}>
                  {s.display_name || 'Usuario'}
                  {isMe && <span className="text-xs text-fifa-gold ml-2">(tú)</span>}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-white">{s.total_points}</p>
                <p className="text-xs text-gray-500">pts</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function RankingsView({ globalStandings, userGroups, groupStandings, currentUserId }: Props) {
  const [activeTab, setActiveTab] = useState<string>('global')

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('global')}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
            activeTab === 'global'
              ? 'bg-fifa-gold text-fifa-navy'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          🌍 Global
        </button>
        {userGroups.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setActiveTab(g.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === g.id
                ? 'bg-fifa-gold text-fifa-navy'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            👥 {g.name}
          </button>
        ))}
      </div>

      {activeTab === 'global' && (
        <StandingsTable
          standings={globalStandings}
          currentUserId={currentUserId}
          title="Clasificación Global"
        />
      )}

      {userGroups.map((g) => (
        activeTab === g.id && (
          <StandingsTable
            key={g.id}
            standings={groupStandings[g.id] || []}
            currentUserId={currentUserId}
            title={`${g.name} — Grupo`}
          />
        )
      ))}
    </div>
  )
}
