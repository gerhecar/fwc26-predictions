'use server'

import { getCurrentUser } from '@/lib/auth/auth'
import { getPool } from '@/lib/db/pool'
import { revalidatePath } from 'next/cache'

async function assertAdmin(): Promise<string> {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    throw new Error('No autorizado')
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
      return { success: false, message: 'No puedes deshabilitar tu propia cuenta' }
    }

    const pool = getPool()
    await pool.execute('UPDATE users SET is_active = ? WHERE id = ?', [isActive, userId])
    revalidatePath('/admin/users')
    return {
      success: true,
      message: isActive ? 'Usuario habilitado correctamente' : 'Usuario deshabilitado correctamente',
    }
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : 'Error al actualizar usuario' }
  }
}

export async function changeUserRole(
  userId: string,
  newRole: 'user' | 'admin',
): Promise<{ success: boolean; message: string }> {
  try {
    const adminId = await assertAdmin()
    if (userId === adminId && newRole !== 'admin') {
      return { success: false, message: 'No puedes quitarte el rol de administrador a ti mismo' }
    }

    const pool = getPool()
    await pool.execute("UPDATE users SET role = ? WHERE id = ?", [newRole, userId])
    revalidatePath('/admin/users')
    return {
      success: true,
      message: newRole === 'admin' ? 'Usuario promovido a administrador' : 'Usuario degradado a usuario regular',
    }
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : 'Error al cambiar rol' }
  }
}

export async function deleteUser(
  userId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const adminId = await assertAdmin()
    if (userId === adminId) {
      return { success: false, message: 'No puedes eliminar tu propia cuenta' }
    }

    const pool = getPool()
    await pool.execute('DELETE FROM predictions WHERE user_id = ?', [userId])
    await pool.execute('DELETE FROM standings WHERE user_id = ?', [userId])
    await pool.execute('DELETE FROM user_group_members WHERE user_id = ?', [userId])
    await pool.execute('UPDATE user_groups SET created_by = NULL WHERE created_by = ?', [userId])
    await pool.execute('DELETE FROM users WHERE id = ?', [userId])
    revalidatePath('/admin/users')
    return { success: true, message: 'Usuario eliminado correctamente' }
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : 'Error al eliminar usuario' }
  }
}
