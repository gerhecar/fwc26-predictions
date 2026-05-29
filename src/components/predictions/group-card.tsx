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
import { SortableTeamRow } from './sortable-team-row'
import { GROUP_TEAMS, GROUP_LETTERS } from '@/lib/predictions/constants'

interface GroupCardProps {
  letter: string
  orderedTeams: string[]
  onReorder: (letter: string, teams: string[]) => void
}

const groupTotal = GROUP_LETTERS.length

export function GroupCard({ letter, orderedTeams, onReorder }: GroupCardProps) {
  const defaultTeams = GROUP_TEAMS[letter]
  const teams = orderedTeams.length === 4 ? orderedTeams : defaultTeams

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = teams.indexOf(active.id as string)
      const newIndex = teams.indexOf(over.id as string)
      if (oldIndex === -1 || newIndex === -1) return

      const updated = [...teams]
      const [moved] = updated.splice(oldIndex, 1)
      updated.splice(newIndex, 0, moved)
      onReorder(letter, updated)
    },
    [teams, onReorder, letter],
  )

  const isComplete = orderedTeams.length === 4
  const letterIndex = GROUP_LETTERS.indexOf(letter as typeof GROUP_LETTERS[number]) + 1

  return (
    <div
      className="group/card rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg backdrop-blur-md transition-all duration-200 hover:border-white/20 hover:shadow-[0_0_30px_rgba(0,230,118,0.08)]"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3
          className="font-[family-name:var(--font-bebas)] text-xl tracking-wider text-white"
          style={{ letterSpacing: '0.08em' }}
        >
          GRUPO {letter}
        </h3>
        {isComplete ? (
          <span className="rounded-full border border-accent-green/30 bg-accent-green/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent-green">
            Listo
          </span>
        ) : (
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-text-secondary">
            {letterIndex}/{groupTotal}
          </span>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={teams}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-1.5">
            {teams.map((teamName, index) => (
              <SortableTeamRow
                key={teamName}
                id={teamName}
                teamName={teamName}
                rank={index + 1}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
