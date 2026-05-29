'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { getFlag } from '@/lib/predictions/constants'

interface SortableTeamRowProps {
  id: string
  teamName: string
  rank: number
}

const ACCENT_CLASSES = [
  'border-l-accent-green bg-accent-green/5',
  'border-l-accent-green bg-accent-green/5',
  'border-l-accent-gold bg-accent-gold/5',
  'border-l-accent-muted bg-white/5',
]

const BADGE_CLASSES = [
  'bg-accent-green text-black',
  'bg-accent-green text-black',
  'bg-accent-gold text-black',
  'bg-accent-muted text-white',
]

export function SortableTeamRow({ id, teamName, rank }: SortableTeamRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border-l-4 px-3 py-2.5 transition-all
        ${isDragging
          ? 'z-50 scale-[1.02] border-white/20 bg-white/10 shadow-2xl opacity-90'
          : 'border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/[0.07] hover:shadow-[0_0_12px_rgba(255,255,255,0.06)]'
        }
        ${ACCENT_CLASSES[rank - 1] || ACCENT_CLASSES[3]}
      `}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${BADGE_CLASSES[rank - 1] || BADGE_CLASSES[3]}`}
      >
        {rank}
      </span>

      <span className="text-xl leading-none">{getFlag(teamName)}</span>

      <span className="flex-1 text-sm font-medium text-white">
        {teamName}
      </span>

      <button
        className="flex h-8 w-8 cursor-grab items-center justify-center rounded text-text-secondary opacity-50 transition-opacity hover:bg-white/10 hover:opacity-100 active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label="Arrastrar para reordenar"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" className="opacity-60">
          <circle cx="5" cy="3" r="1.5" />
          <circle cx="13" cy="3" r="1.5" />
          <circle cx="5" cy="9" r="1.5" />
          <circle cx="13" cy="9" r="1.5" />
          <circle cx="5" cy="15" r="1.5" />
          <circle cx="13" cy="15" r="1.5" />
        </svg>
      </button>
    </div>
  )
}
