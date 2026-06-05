import { getPool } from '@/lib/db/pool'
import { buildBracket } from './bracket-engine'
import { GROUP_LETTERS } from '@/lib/predictions/constants'
import type { GroupLetter } from '@/types'
import type { Team } from '@/types'
import type { BracketMatchNode } from './bracket-engine'

async function getGroupTeamMap(
  tournamentId: string,
): Promise<Map<string, Team[]>> {
  const pool = getPool()
  const map = new Map<string, Team[]>()

  const [rows] = await pool.execute(
    `SELECT g.letter, t.id, t.name, t.flag_url, t.tournament_id, t.group_id
     FROM teams t
     JOIN \`groups\` g ON t.group_id = g.id
     WHERE g.tournament_id = ?
     ORDER BY g.letter, t.name`,
    [tournamentId],
  )
  const all = rows as Array<Team & { letter: string }>
  for (const row of all) {
    const letter = row.letter
    if (!map.has(letter)) map.set(letter, [])
    map.get(letter)!.push({
      id: row.id,
      name: row.name,
      flag_url: row.flag_url,
      tournament_id: row.tournament_id,
      group_id: row.group_id,
    })
  }
  return map
}

export async function generateBracketFromResults(
  tournamentId: string,
  groupStage: Record<string, string[]>,
  bestThirdPlaced: string[],
): Promise<BracketMatchNode[]> {
  const teamMap = await getGroupTeamMap(tournamentId)

  const groupResults = GROUP_LETTERS.map((letter) => {
    const orderedNames = groupStage[letter] || []
    const groupTeams = teamMap.get(letter) || []

    function findTeam(name: string): Team | null {
      return groupTeams.find((t) => t.name === name) || null
    }

    return {
      letter: letter as string,
      first: orderedNames[0] ? findTeam(orderedNames[0]) : null,
      second: orderedNames[1] ? findTeam(orderedNames[1]) : null,
      third: orderedNames[2] ? findTeam(orderedNames[2]) : null,
      fourth: orderedNames[3] ? findTeam(orderedNames[3]) : null,
    }
  })

  const advancingThirdGroups = bestThirdPlaced.filter((l) =>
    GROUP_LETTERS.includes(l as GroupLetter),
  ) as GroupLetter[]

  return buildBracket(groupResults as any, advancingThirdGroups)
}

export async function persistBracket(
  tournamentId: string,
  matches: BracketMatchNode[],
  officialResultsId: string,
): Promise<void> {
  const pool = getPool()

  // Delete existing matches for this tournament (only if no winners have been set)
  await pool.execute(
    `DELETE FROM matches WHERE tournament_id = ? AND winner_id IS NULL`,
    [tournamentId],
  )

  // Check if any matches already have winners — if so, do NOT regenerate
  const [existingWithWinners] = await pool.execute(
    `SELECT COUNT(*) as cnt FROM matches WHERE tournament_id = ? AND winner_id IS NOT NULL`,
    [tournamentId],
  )
  if ((existingWithWinners as any[])[0].cnt > 0) {
    return // don't overwrite matches that have results
  }

  for (const match of matches) {
    await pool.execute(
      `INSERT INTO matches (id, tournament_id, match_number, stage, home_team_id, away_team_id)
       VALUES (UUID(), ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE home_team_id = VALUES(home_team_id), away_team_id = VALUES(away_team_id)`,
      [
        tournamentId,
        match.matchNumber,
        match.stage,
        match.home.teamId || null,
        match.away.teamId || null,
      ],
    )
  }
}

export async function updateMatchWinner(
  tournamentId: string,
  matchNumber: number,
  winnerId: string | null,
): Promise<void> {
  const pool = getPool()
  if (winnerId) {
    await pool.execute(
      `UPDATE matches SET winner_id = ? WHERE tournament_id = ? AND match_number = ?`,
      [winnerId, tournamentId, matchNumber],
    )
  } else {
    await pool.execute(
      `UPDATE matches SET winner_id = NULL WHERE tournament_id = ? AND match_number = ?`,
      [tournamentId, matchNumber],
    )
  }
}

export async function getTournamentId(): Promise<string | null> {
  const pool = getPool()
  const [rows] = await pool.execute(
    `SELECT id FROM tournaments WHERE slug = 'fifa-world-cup-2026' LIMIT 1`,
  )
  const tRows = rows as Array<{ id: string }>
  return tRows.length > 0 ? tRows[0].id : null
}
