import { signUp } from '@/lib/auth/auth'
import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  try {
    const { email, password, displayName } = await request.json()

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rl = rateLimit(`register:${ip}`, 3, 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Demasiados registros desde esta IP. Intenta de nuevo más tarde.' }, { status: 429 })
    }

    if (!displayName || typeof displayName !== 'string' || displayName.trim().length === 0) {
      return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
    }
    if (displayName.trim().length > 100) {
      return NextResponse.json({ error: 'El nombre es demasiado largo (máx. 100 caracteres)' }, { status: 400 })
    }

    const { user, error } = await signUp(email, password, displayName)

    if (error) {
      return NextResponse.json({ error }, { status: 400 })
    }

    return NextResponse.json({ user })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
