'use client'

import { useCallback, useEffect, useState } from 'react'
import { getCurrentUser } from '@/lib/auth/client'
import { loadUserPredictions, saveThirdPlacePicks } from '@/lib/predictions/actions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { Group, Team, GroupLetter } from '@/types'

interface GroupWithTeams extends Group {
  teams: Team[]
}

interface Props {
  groups: GroupWithTeams[]
  tournamentId: string
  predictions: Record<string, (Team & { rank: number | null })[]>
}

const MAX_SELECTION = 8

export function ThirdPlaceSelection({ groups, tournamentId, predictions }: Props) {
  const [selected, setSelected] = useState<GroupLetter[]>([])
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadSaved() {
      const user = await getCurrentUser()
      if (!user) return

      const data = await loadUserPredictions()

      const pred = data.find((p: any) => p.third_place_qualified && p.third_place_qualified.length > 0)
      if (pred?.third_place_qualified) {
        setSelected(pred.third_place_qualified as GroupLetter[])
        setSaved(true)
      }
    }
    loadSaved()
  }, [])

  const handleToggle = useCallback((letter: GroupLetter) => {
    setSelected((prev) => {
      if (prev.includes(letter)) {
        return prev.filter((l) => l !== letter)
      }
      if (prev.length >= MAX_SELECTION) return prev
      return [...prev, letter]
    })
    setSaved(false)
  }, [])

  async function handleSave() {
    if (selected.length !== MAX_SELECTION) return
    setSaving(true)

    try {
      const user = await getCurrentUser()
      if (!user) return

      await saveThirdPlacePicks(selected as string[])
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  const getThirdPlaceTeam = (group: GroupWithTeams): Team | null => {
    const ranked = predictions[group.letter]?.filter((t) => t.rank !== null) || []
    if (ranked.length === 4) return ranked[2]
    return null
  }

  const incompleteGroups = groups.filter(
    (g) => (predictions[g.letter]?.filter((t) => t.rank !== null)?.length || 0) !== 4,
  )

  if (incompleteGroups.length > 0) {
    return (
      <Card className="p-4 text-center text-sm text-text-secondary">
        Completa la predicción de todos los grupos primero ({incompleteGroups.length} grupos pendientes)
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          Selecciona {MAX_SELECTION} grupos cuyos terceros lugares avanzarán a octavos de final
        </p>
        <span className={`text-sm font-medium ${selected.length === MAX_SELECTION ? 'text-fifa-blue' : 'text-text-secondary'}`}>
          {selected.length}/{MAX_SELECTION}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
        {groups.map((group) => {
          const thirdTeam = getThirdPlaceTeam(group)
          const isSelected = selected.includes(group.letter as GroupLetter)

          return (
            <button
              key={group.letter}
              onClick={() => handleToggle(group.letter as GroupLetter)}
              disabled={!isSelected && selected.length >= MAX_SELECTION}
              className={`flex flex-col items-center gap-1 rounded-lg border-2 p-3 text-center transition-all ${
                isSelected
                  ? 'border-fifa-blue bg-blue-50 shadow-sm'
                  : 'border-border bg-white opacity-60 hover:opacity-100'
              }`}
            >
              <span className="text-xs font-bold text-fifa-navy">
                Grupo {group.letter}
              </span>
              {thirdTeam && (
                <span className="text-sm font-medium text-text-primary">
                  {thirdTeam.name}
                </span>
              )}
              {isSelected && (
                <span className="text-xs text-fifa-blue">✓ Avanza</span>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex justify-center">
        <Button
          onClick={handleSave}
          disabled={selected.length !== MAX_SELECTION || saving}
          loading={saving}
        >
          {saved ? 'Guardado ✓' : 'Guardar selección'}
        </Button>
      </div>

      {selected.length === MAX_SELECTION && (
        <Card className="p-3 text-sm text-text-secondary">
          <p className="font-medium text-fifa-blue">Resumen de clasificados:</p>
          <p>
            Los {MAX_SELECTION} mejores terceros lugares de los grupos:{' '}
            {selected.sort().join(', ')}
          </p>
        </Card>
      )}
    </div>
  )
}
