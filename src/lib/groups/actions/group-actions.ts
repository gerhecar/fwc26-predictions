'use server'

import { getCurrentUser } from '@/lib/auth/auth'
import { getPool } from '@/lib/db/pool'
import crypto from 'crypto'

function generateInviteCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase()
}

function generateUUID(): string {
  return crypto.randomUUID()
}

export async function createGroup(name: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const pool = getPool()
  const inviteCode = generateInviteCode()
  const groupId = generateUUID()

  await pool.execute(
    'INSERT INTO user_groups (id, name, invite_code, created_by) VALUES (?, ?, ?, ?)',
    [groupId, name, inviteCode, user.id],
  )

  await pool.execute(
    'INSERT INTO user_group_members (id, group_id, user_id) VALUES (?, ?, ?)',
    [generateUUID(), groupId, user.id],
  )

  return { success: true, group: { id: groupId, name, invite_code: inviteCode }, inviteCode }
}

export async function joinGroup(inviteCode: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const pool = getPool()
  const [groupRows] = await pool.execute(
    'SELECT id FROM user_groups WHERE invite_code = ?',
    [inviteCode],
  )
  const groups = groupRows as any[]
  if (groups.length === 0) throw new Error('Código de invitación inválido')

  const group = groups[0]
  const [existingRows] = await pool.execute(
    'SELECT id FROM user_group_members WHERE group_id = ? AND user_id = ?',
    [group.id, user.id],
  )
  const existing = existingRows as any[]
  if (existing.length > 0) throw new Error('Ya eres miembro de este grupo')

  await pool.execute(
    'INSERT INTO user_group_members (id, group_id, user_id) VALUES (?, ?, ?)',
    [generateUUID(), group.id, user.id],
  )

  return { success: true }
}

export async function leaveGroup(groupId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const pool = getPool()
  await pool.execute(
    'DELETE FROM user_group_members WHERE group_id = ? AND user_id = ?',
    [groupId, user.id],
  )

  return { success: true }
}

export async function getUserGroups() {
  const user = await getCurrentUser()
  if (!user) return []

  const pool = getPool()
  const [memberRows] = await pool.execute(
    'SELECT group_id FROM user_group_members WHERE user_id = ?',
    [user.id],
  )
  const memberships = memberRows as any[]
  if (memberships.length === 0) return []

  const groupIds = memberships.map((m: any) => m.group_id)
  const placeholders = groupIds.map(() => '?').join(',')
  const [groupRows] = await pool.execute(
    `SELECT * FROM user_groups WHERE id IN (${placeholders}) ORDER BY created_at DESC`,
    groupIds,
  )
  const groups = groupRows as any[]

  const result: UserGroupItem[] = []
  for (const g of groups) {
    const [countRows] = await pool.execute(
      'SELECT COUNT(*) as count FROM user_group_members WHERE group_id = ?',
      [g.id],
    )
    const count = (countRows as any[])[0]?.count || 0

    result.push({
      id: g.id,
      name: g.name,
      invite_code: g.invite_code,
      created_by: g.created_by,
      created_at: g.created_at,
      memberCount: count,
    })
  }

  return result
}

interface UserGroupItem {
  id: string
  name: string
  invite_code: string
  created_by: string
  created_at: string
  memberCount: number
}

export async function getGroupMembers(groupId: string) {
  const pool = getPool()

  const [rows] = await pool.execute(
    `SELECT m.*, u.display_name, u.avatar_url
     FROM user_group_members m
     JOIN users u ON u.id = m.user_id
     WHERE m.group_id = ?`,
    [groupId],
  )

  return rows as any[]
}

export async function getGroupStandings(groupId: string, tournamentId: string) {
  const pool = getPool()

  const [rows] = await pool.execute(
    `SELECT s.*, u.display_name, u.avatar_url
     FROM standings s
     JOIN users u ON u.id = s.user_id
     WHERE s.user_group_id = ? AND s.tournament_id = ?
     ORDER BY s.total_points DESC`,
    [groupId, tournamentId],
  )

  return rows as any[]
}
