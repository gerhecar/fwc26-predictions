'use server'

import { getCurrentUser } from '@/lib/auth/auth'
import { getPool } from '@/lib/db/pool'
import { revalidatePath } from 'next/cache'

async function assertAdmin(): Promise<string> {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    throw new Error('Not authorized')
  }
  return user.id
}

export async function toggleUserStatus(
  userId: string,
  isActive: boolean,
): Promise<{ success: boolean; message: string }> {
  try {
    const adminId = await assertAdmin()
    if (userId === adminId) {
      return { success: false, message: 'You cannot disable your own account' }
    }

    const pool = getPool()
    await pool.execute('UPDATE users SET is_active = ? WHERE id = ?', [isActive, userId])
    revalidatePath('/admin/users')
    return {
      success: true,
      message: isActive ? 'User enabled successfully' : 'User disabled successfully',
    }
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : 'Error updating user' }
  }
}

export async function changeUserRole(
  userId: string,
  newRole: 'user' | 'admin',
): Promise<{ success: boolean; message: string }> {
  try {
    const adminId = await assertAdmin()
    if (userId === adminId && newRole !== 'admin') {
      return { success: false, message: 'You cannot remove your own admin role' }
    }

    const pool = getPool()
    await pool.execute("UPDATE users SET role = ? WHERE id = ?", [newRole, userId])
    revalidatePath('/admin/users')
    return {
      success: true,
      message: newRole === 'admin' ? 'User promoted to admin' : 'User demoted to regular user',
    }
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : 'Error changing role' }
  }
}

export async function deleteUser(
  userId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const adminId = await assertAdmin()
    if (userId === adminId) {
      return { success: false, message: 'You cannot delete your own account' }
    }

    const pool = getPool()
    await pool.execute('DELETE FROM predictions WHERE user_id = ?', [userId])
    await pool.execute('DELETE FROM bet_submissions WHERE user_id = ?', [userId])
    await pool.execute('DELETE FROM standings WHERE user_id = ?', [userId])
    await pool.execute('DELETE FROM user_group_members WHERE user_id = ?', [userId])
    await pool.execute('UPDATE user_groups SET created_by = NULL WHERE created_by = ?', [userId])
    await pool.execute('DELETE FROM users WHERE id = ?', [userId])
    revalidatePath('/admin/users')
    return { success: true, message: 'User deleted successfully' }
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : 'Error deleting user' }
  }
}

export async function validateBet(
  betId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    await assertAdmin()
    const pool = getPool()

    const [existing] = await pool.execute(
      'SELECT id, status FROM bet_submissions WHERE id = ?',
      [betId],
    )
    const bets = existing as any[]
    if (bets.length === 0) {
      return { success: false, message: 'Bet not found' }
    }
    if (bets[0].status !== 'submitted') {
      return { success: false, message: 'Only bets with submitted status can be validated' }
    }

    const admin = await getCurrentUser()
    await pool.execute(
      "UPDATE bet_submissions SET status = 'valid', validated_at = NOW(), validated_by = ? WHERE id = ?",
      [admin!.id, betId],
    )

    revalidatePath('/admin/bets')
    return { success: true, message: 'Bet validated successfully' }
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : 'Error validating bet' }
  }
}

export async function deleteBet(
  betId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    await assertAdmin()
    const pool = getPool()

    const [existing] = await pool.execute(
      'SELECT id, status FROM bet_submissions WHERE id = ?',
      [betId],
    )
    const bets = existing as any[]
    if (bets.length === 0) {
      return { success: false, message: 'Bet not found' }
    }
    if (bets[0].status === 'deleted') {
      return { success: false, message: 'This bet has already been deleted' }
    }

    await pool.execute(
      "UPDATE bet_submissions SET status = 'deleted' WHERE id = ?",
      [betId],
    )

    revalidatePath('/admin/bets')
    return { success: true, message: 'Bet deleted successfully' }
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : 'Error deleting bet' }
  }
}
