import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import { getPool } from '@/lib/db/pool'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { SESSION_COOKIE, getJWTSecret } from './config'

import { redirect } from 'next/navigation'
import type { AdminUser, AdminUserListParams, AdminUserListResponse } from '@/types'

export interface AuthUser {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
  role: 'user' | 'admin'
}

export interface JWTPayload {
  userId: string
  role: string
}

function generateUUID(): string {
  return crypto.randomUUID()
}

export async function signUp(
  email: string,
  password: string,
  displayName: string,
): Promise<{ user: AuthUser | null; error: string | null }> {
  const pool = getPool()

  const [existing] = await pool.execute(
    'SELECT id FROM users WHERE email = ?',
    [email],
  )

  if ((existing as any[]).length > 0) {
    return { user: null, error: 'This email is already registered' }
  }

  if (password.length < 6) {
    return { user: null, error: 'Password must be at least 6 characters' }
  }

  const id = generateUUID()
  const passwordHash = await bcrypt.hash(password, 10)

  try {
    await pool.execute(
      'INSERT INTO users (id, email, display_name, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [id, email, displayName, passwordHash, 'user'],
    )

    await setSessionCookie(id, 'user')

    return {
      user: { id, email, display_name: displayName, avatar_url: null, role: 'user' },
      error: null,
    }
  } catch {
    return { user: null, error: 'Error registering user' }
  }
}

export async function signIn(
  email: string,
  password: string,
): Promise<{ user: AuthUser | null; error: string | null }> {
  const pool = getPool()

  const [rows] = await pool.execute(
    'SELECT id, email, display_name, password_hash, avatar_url, role, is_active FROM users WHERE email = ? OR display_name = ?',
    [email, email],
  )

  const users = rows as any[]
  if (users.length === 0) {
    return { user: null, error: 'Incorrect email or username' }
  }

  const user = users[0]

  if (!user.is_active) {
    return { user: null, error: 'Account disabled. Contact an administrator.' }
  }

  const valid = await bcrypt.compare(password, user.password_hash)

  if (!valid) {
    return { user: null, error: 'Incorrect email or username' }
  }

  await pool.execute('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id])
  await setSessionCookie(user.id, user.role)

  return {
    user: {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      role: user.role,
    },
    error: null,
  }
}

export async function signOut(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const payload = await verifySession()

    if (!payload) return null

    const pool = getPool()
    const [rows] = await pool.execute(
      'SELECT id, email, display_name, avatar_url, role FROM users WHERE id = ?',
      [payload.userId],
    )

    const users = rows as any[]
    if (users.length === 0) return null

    const user = users[0]
    return {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      role: user.role,
    }
  } catch {
    return null
  }
}

export async function verifySession(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value

    if (!token) return null

    const { payload } = await jwtVerify(token, getJWTSecret())
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

async function setSessionCookie(userId: string, role: string): Promise<void> {
  const token = await new SignJWT({ userId, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(getJWTSecret())

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}

export async function getUserById(id: string): Promise<AuthUser | null> {
  try {
    const pool = getPool()
    const [rows] = await pool.execute(
      'SELECT id, email, display_name, avatar_url, role FROM users WHERE id = ?',
      [id],
    )
    const users = rows as any[]
    return users.length > 0 ? (users[0] as AuthUser) : null
  } catch {
    return null
  }
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')
  if (user.role !== 'admin') redirect('/dashboard')
  return user
}

export async function getAllUsers(params: AdminUserListParams = {}): Promise<AdminUserListResponse> {
  const pool = getPool()
  const {
    page = 1,
    limit = 25,
    search = '',
    sortBy = 'created_at',
    sortOrder = 'desc',
    roleFilter = 'all',
    statusFilter = 'all',
  } = params

  const conditions: string[] = []
  const queryParams: any[] = []

  if (search) {
    conditions.push('(u.display_name LIKE ? OR u.email LIKE ?)')
    queryParams.push(`%${search}%`, `%${search}%`)
  }

  if (roleFilter !== 'all') {
    conditions.push('u.role = ?')
    queryParams.push(roleFilter)
  }

  if (statusFilter === 'active') {
    conditions.push('u.is_active = TRUE')
  } else if (statusFilter === 'inactive') {
    conditions.push('u.is_active = FALSE')
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const allowedSorts = ['created_at', 'display_name', 'email', 'role']
  const sortColumn = allowedSorts.includes(sortBy) ? sortBy : 'created_at'
  const order = sortOrder === 'asc' ? 'ASC' : 'DESC'

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) as total FROM users u ${where}`,
    queryParams,
  )
  const total = (countRows as any[])[0]?.total || 0

  const offset = (page - 1) * limit
  queryParams.push(limit.toString())
  queryParams.push(offset.toString())

  const [userRows] = await pool.execute(
    `SELECT u.id, u.email, u.display_name, u.avatar_url, u.role, u.is_active, u.created_at, u.last_login_at,
            (SELECT COUNT(*) FROM predictions p WHERE p.user_id = u.id) as prediction_count
     FROM users u ${where}
     ORDER BY u.${sortColumn} ${order}
     LIMIT ? OFFSET ?`,
    queryParams,
  )

  const users = (userRows as any[]).map((row: any) => ({
    id: row.id,
    email: row.email,
    display_name: row.display_name,
    avatar_url: row.avatar_url,
    role: row.role as 'user' | 'admin',
    is_active: !!row.is_active,
    created_at: row.created_at,
    last_login_at: row.last_login_at,
    prediction_count: row.prediction_count || 0,
  }))

  return {
    users,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}
