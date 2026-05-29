'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CountryFlag } from '@/components/ui/country-flag'
import type { Team } from '@/types'

interface SortableTeamSlotProps {
  team: Team & { rank: number | null }
  rank: number
  rankLabel: string
  onRemove: () => void
}

const RANK_COLORS = ['bg-gold text-white', 'bg-gray-300 text-gray-700', 'bg-orange-200 text-orange-800', 'bg-red-100 text-red-700']

export function SortableTeamSlot({ team, rank, rankLabel, onRemove }: SortableTeamSlotProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: team.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-lg border p-2.5 text-sm transition-shadow ${
        isDragging
          ? 'z-50 border-fifa-blue bg-blue-50 shadow-lg'
          : 'border-border bg-white'
      }`}
    >
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${RANK_COLORS[rank - 1] || RANK_COLORS[3]}`}
      >
        {rank}
      </div>

      <div className="flex flex-1 items-center gap-1.5">
        <CountryFlag name={team.name} width={20} className="shrink-0" />
        <span className="font-medium text-text-primary">{team.name}</span>
      </div>

      <button
        className="flex h-6 w-6 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-red-50 hover:text-red-500"
        onClick={onRemove}
        aria-label={`Quitar ${team.name}`}
      >
        ✕
      </button>

      <button
        className="flex h-6 w-6 cursor-grab items-center justify-center text-text-secondary active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label="Arrastrar para reordenar"
      >
        ⠿
      </button>
    </div>
  )
}
