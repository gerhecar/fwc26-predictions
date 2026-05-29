'use server'

import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

function generateInviteCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase()
}

export async function createGroup(name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const inviteCode = generateInviteCode()

  const { data: group, error } = await supabase
    .from('user_groups')
    .insert({
      name,
      invite_code: inviteCode,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  await supabase
    .from('user_group_members')
    .insert({
      group_id: group.id,
      user_id: user.id,
    })

  return { success: true, group, inviteCode }
}

export async function joinGroup(inviteCode: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: group } = await supabase
    .from('user_groups')
    .select('id')
    .eq('invite_code', inviteCode)
    .single()

  if (!group) throw new Error('Código de invitación inválido')

  const { data: existing } = await supabase
    .from('user_group_members')
    .select('id')
    .eq('group_id', group.id)
    .eq('user_id', user.id)
    .single()

  if (existing) throw new Error('Ya eres miembro de este grupo')

  const { error } = await supabase
    .from('user_group_members')
    .insert({
      group_id: group.id,
      user_id: user.id,
    })

  if (error) throw new Error(error.message)
  return { success: true }
}

export async function leaveGroup(groupId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('user_group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  return { success: true }
}

export async function getUserGroups() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: memberships } = await supabase
    .from('user_group_members')
    .select('group_id')
    .eq('user_id', user.id)

  if (!memberships || memberships.length === 0) return []

  const groupIds = memberships.map(m => m.group_id)

  const { data: groups } = await supabase
    .from('user_groups')
    .select('*')
    .in('id', groupIds)
    .order('created_at', { ascending: false })

  const result: (UserGroupItem)[] = []
  for (const g of groups || []) {
    const { count } = await supabase
      .from('user_group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', g.id)

    result.push({
      id: g.id,
      name: g.name,
      invite_code: g.invite_code,
      created_by: g.created_by,
      created_at: g.created_at,
      memberCount: count || 0,
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
  const supabase = await createClient()

  const { data: members } = await supabase
    .from('user_group_members')
    .select('*, profiles(*)')
    .eq('group_id', groupId)

  return members || []
}

export async function getGroupStandings(groupId: string, tournamentId: string) {
  const supabase = await createClient()

  const { data: standings } = await supabase
    .from('standings')
    .select('*, profiles(*)')
    .eq('user_group_id', groupId)
    .eq('tournament_id', tournamentId)
    .order('total_points', { ascending: false })

  return standings || []
}
