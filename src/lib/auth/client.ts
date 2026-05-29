export interface AuthUser {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
  role: 'user' | 'admin'
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const res = await fetch('/api/auth/me')
    const data = await res.json()
    return data.user || null
  } catch {
    return null
  }
}

export async function signIn(
  email: string,
  password: string,
): Promise<{ user: AuthUser | null; error: string | null }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) return { user: null, error: data.error }
    return { user: data.user, error: null }
  } catch {
    return { user: null, error: 'Error de conexión' }
  }
}

export async function signUp(
  email: string,
  password: string,
  displayName: string,
): Promise<{ user: AuthUser | null; error: string | null }> {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName }),
    })
    const data = await res.json()
    if (!res.ok) return { user: null, error: data.error }
    return { user: data.user, error: null }
  } catch {
    return { user: null, error: 'Error de conexión' }
  }
}

export async function signOut(): Promise<void> {
  try {
    await fetch('/api/auth/logout', { method: 'POST' })
  } catch {
    // ignore
  }
}
