import { signIn } from '@/lib/auth/auth'
import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // Rate limit by IP + email
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rl = rateLimit(`login:${ip}:${(email || '').toLowerCase()}`, 5, 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Demasiados intentos. Intenta de nuevo en 1 minuto.' }, { status: 429 })
    }

    const { user, error } = await signIn(email, password)

    if (error) {
      return NextResponse.json({ error }, { status: 401 })
    }

    return NextResponse.json({ user })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
