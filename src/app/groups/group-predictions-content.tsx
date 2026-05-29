'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { GroupRankCard } from '@/components/groups/group-rank-card'
import { ThirdPlaceSelection } from '@/components/groups/third-place-selection'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { Group, Team, GroupLetter, GroupPrediction } from '@/types'

interface GroupWithTeams extends Group {
  teams: Team[]
}

export function GroupPredictionsContent() {
  const [groups, setGroups] = useState<GroupWithTeams[]>([])
  const [predictions, setPredictions] = useState<Record<string, (Team & { rank: number | null })[]>>({})
  const [savedPredictionRows, setSavedPredictionRows] = useState<Record<string, GroupPrediction>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: groupsData } = await supabase
        .from('groups')
        .select('*, teams(*)')
        .order('letter')
        .returns<GroupWithTeams[]>()

      if (!groupsData) {
        setLoading(false)
        return
      }

      const { data: predictionsData } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', user.id)

      setGroups(groupsData)

      const predictionMap: Record<string, GroupPrediction> = {}
      for (const p of predictionsData || []) {
        const group = groupsData.find((g) => g.id === p.group_id)
        if (group) {
          predictionMap[group.letter] = p
        }
      }
      setSavedPredictionRows(predictionMap)

      const initialPredictions: Record<string, (Team & { rank: number | null })[]> = {}

      for (const group of groupsData) {
        const saved = predictionMap[group.letter]
        if (saved) {
          const teams = group.teams
          const first = teams.find((t) => t.id === saved.first_place_team_id)
          const second = teams.find((t) => t.id === saved.second_place_team_id)
          const third = teams.find((t) => t.id === saved.third_place_team_id)
          const fourth = teams.find((t) => t.id === saved.fourth_place_team_id)

          initialPredictions[group.letter] = [
            ...(first ? [{ ...first, rank: 1 as number | null }] : []),
            ...(second ? [{ ...second, rank: 2 as number | null }] : []),
            ...(third ? [{ ...third, rank: 3 as number | null }] : []),
            ...(fourth ? [{ ...fourth, rank: 4 as number | null }] : []),
          ]
        } else {
          initialPredictions[group.letter] = []
        }
      }

      setPredictions(initialPredictions)
      setLoading(false)
    }

    loadData()
  }, [])

  const handleReorder = useCallback(
    (groupLetter: GroupLetter, teams: (Team & { rank: number | null })[]) => {
      setPredictions((prev) => ({
        ...prev,
        [groupLetter]: teams,
      }))
      setSaved(false)
    },
    [],
  )

  const handleSelectTeam = useCallback(
    (groupLetter: GroupLetter, rankIndex: number, teamId: string) => {
      setPredictions((prev) => {
        const current = [...(prev[groupLetter] || [])]

        if (teamId === '' && current[rankIndex]) {
          current.splice(rankIndex, 1)
          const reindexed = current.map((t, i) => ({ ...t, rank: i + 1 }))
          return { ...prev, [groupLetter]: reindexed }
        }

        if (teamId === '' && rankIndex >= current.length) {
          return prev
        }

        const group = groups.find((g) => g.letter === groupLetter)
        if (!group) return prev

        const alreadySelected = current.some((t) => t.id === teamId)
        if (alreadySelected) return prev

        if (rankIndex < current.length) {
          current.splice(rankIndex, 0, {
            ...group.teams.find((t) => t.id === teamId)!,
            rank: null,
          })
        } else {
          current.push({
            ...group.teams.find((t) => t.id === teamId)!,
            rank: null,
          })
        }

        const reindexed = current.map((t, i) => ({ ...t, rank: i + 1 }))
        return { ...prev, [groupLetter]: reindexed }
      })
      setSaved(false)
    },
    [groups],
  )

  async function handleSave() {
    setSaving(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Debes iniciar sesión')
        return
      }

      const tournamentId = groups[0]?.tournament_id
      if (!tournamentId) {
        setError('No se encontró el torneo')
        return
      }

      for (const group of groups) {
        const selected = predictions[group.letter]?.filter((t) => t.rank !== null) || []
        if (selected.length !== 4) continue

        const saved = savedPredictionRows[group.letter]

        const payload = {
          user_id: user.id,
          tournament_id: tournamentId,
          group_id: group.id,
          first_place_team_id: selected[0].id,
          second_place_team_id: selected[1].id,
          third_place_team_id: selected[2].id,
          fourth_place_team_id: selected[3].id,
        }

        if (saved) {
          const { error: updateError } = await supabase
            .from('predictions')
            .update(payload)
            .eq('id', saved.id)

          if (updateError) throw updateError
        } else {
          const { error: insertError } = await supabase
            .from('predictions')
            .insert(payload)

          if (insertError) throw insertError
        }
      }

      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-fifa-blue border-t-transparent" />
      </div>
    )
  }

  const completeCount = Object.values(predictions).filter(
    (teams) => teams.filter((t) => t.rank !== null).length === 4,
  ).length

  const allComplete = completeCount === groups.length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          {completeCount} de {groups.length} grupos completados
        </p>
        {saved && (
          <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
            Guardado ✓
          </span>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => {
          const selectedTeams = predictions[group.letter]?.filter((t) => t.rank !== null) || []
          const teams = group.teams
          const isComplete = selectedTeams.length === 4

          return (
            <GroupRankCard
              key={group.letter}
              groupLetter={group.letter as GroupLetter}
              groupName={group.name || `Grupo ${group.letter}`}
              teams={teams}
              selectedTeams={selectedTeams}
              onReorder={handleReorder}
              onSelectTeam={handleSelectTeam}
              isComplete={isComplete}
            />
          )
        })}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {allComplete && (
        <Card className="p-4">
          <h2 className="mb-3 text-lg font-bold text-fifa-navy">
            Terceros lugares clasificados
          </h2>
          <ThirdPlaceSelection
            groups={groups}
            tournamentId={groups[0]?.tournament_id || ''}
            predictions={predictions}
          />
        </Card>
      )}

      <div className="sticky bottom-20 flex justify-center border-t border-border bg-white py-4">
        <Button
          onClick={handleSave}
          disabled={!allComplete || saving}
          loading={saving}
          size="lg"
        >
          {saving ? 'Guardando...' : allComplete ? 'Guardar pronósticos' : `Completa todos los grupos (${completeCount}/${groups.length})`}
        </Button>
      </div>
    </div>
  )
}
