'use client'

import { useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { SortableTeamSlot } from './sortable-team-slot'
import { Card } from '@/components/ui/card'
import type { Team, GroupLetter } from '@/types'

interface TeamWithRank extends Team {
  rank: number | null
}

interface GroupRankCardProps {
  groupLetter: GroupLetter
  groupName: string
  teams: Team[]
  selectedTeams: TeamWithRank[]
  onReorder: (groupLetter: GroupLetter, teams: TeamWithRank[]) => void
  onSelectTeam: (groupLetter: GroupLetter, rankIndex: number, teamId: string) => void
  isComplete: boolean
}

const RANK_LABELS = ['1°', '2°', '3°', '4°']

function getFlagEmoji(countryName: string): string {
  const flags: Record<string, string> = {
    'Argentina': '🇦🇷',
    'Australia': '🇦🇺',
    'Austria': '🇦🇹',
    'Belgium': '🇧🇪',
    'Bosnia and Herzegovina': '🇧🇦',
    'Brazil': '🇧🇷',
    'Canada': '🇨🇦',
    'Cape Verde': '🇨🇻',
    'Croatia': '🇭🇷',
    'Curaçao': '🇨🇼',
    'Czech Republic': '🇨🇿',
    'DR Congo': '🇨🇩',
    'Denmark': '🇩🇰',
    'Ecuador': '🇪🇨',
    'Egypt': '🇪🇬',
    'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    'France': '🇫🇷',
    'Germany': '🇩🇪',
    'Ghana': '🇬🇭',
    'Haiti': '🇭🇹',
    'Iran': '🇮🇷',
    'Iraq': '🇮🇶',
    'Italy': '🇮🇹',
    'Ivory Coast': '🇨🇮',
    'Japan': '🇯🇵',
    'Jordan': '🇯🇴',
    'Korea Republic': '🇰🇷',
    'Mexico': '🇲🇽',
    'Morocco': '🇲🇦',
    'Netherlands': '🇳🇱',
    'New Zealand': '🇳🇿',
    'Nigeria': '🇳🇬',
    'Norway': '🇳🇴',
    'Paraguay': '🇵🇾',
    'Poland': '🇵🇱',
    'Portugal': '🇵🇹',
    'Qatar': '🇶🇦',
    'Saudi Arabia': '🇸🇦',
    'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    'Senegal': '🇸🇳',
    'South Africa': '🇿🇦',
    'Spain': '🇪🇸',
    'Sweden': '🇸🇪',
    'Switzerland': '🇨🇭',
    'Tunisia': '🇹🇳',
    'Turkey': '🇹🇷',
    'USA': '🇺🇸',
    'Ukraine': '🇺🇦',
    'Uruguay': '🇺🇾',
    'Uzbekistan': '🇺🇿',
    'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  }
  return flags[countryName] || '🏳️'
}

export function GroupRankCard({
  groupLetter,
  groupName,
  teams,
  selectedTeams,
  onReorder,
  onSelectTeam,
  isComplete,
}: GroupRankCardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const availableTeams = teams.filter(
    (t) => !selectedTeams.some((st) => st.id === t.id),
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = selectedTeams.findIndex((t) => t.id === active.id)
      const newIndex = selectedTeams.findIndex((t) => t.id === over.id)

      if (oldIndex === -1 || newIndex === -1) return

      const newTeams = [...selectedTeams]
      const [moved] = newTeams.splice(oldIndex, 1)
      newTeams.splice(newIndex, 0, moved)

      const reindexed = newTeams.map((t, i) => ({ ...t, rank: i + 1 }))
      onReorder(groupLetter, reindexed)
    },
    [selectedTeams, onReorder, groupLetter],
  )

  return (
    <Card className="group-card">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-bold text-fifa-blue">
          Grupo {groupLetter}
        </h3>
        {isComplete && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            Completado
          </span>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={selectedTeams.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-1">
            {selectedTeams.map((team, index) => (
              <SortableTeamSlot
                key={team.id}
                team={team}
                rank={index + 1}
                rankLabel={RANK_LABELS[index]}
                onRemove={() => onSelectTeam(groupLetter, index, '')}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {availableTeams.length > 0 && (
        <div className="mt-2">
          <p className="mb-1 text-xs font-medium text-text-secondary">
            Equipos disponibles
          </p>
          <div className="flex flex-wrap gap-1">
            {availableTeams.map((team) => (
              <button
                key={team.id}
                onClick={() => {
                  const firstEmptyIndex = selectedTeams.findIndex((t) => t.rank === null)
                  if (firstEmptyIndex !== -1) {
                    onSelectTeam(groupLetter, firstEmptyIndex, team.id)
                  } else {
                    onSelectTeam(groupLetter, selectedTeams.length, team.id)
                  }
                }}
                className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs transition-colors hover:border-fifa-blue hover:bg-blue-50"
              >
                <span>{getFlagEmoji(team.name)}</span>
                <span>{team.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
