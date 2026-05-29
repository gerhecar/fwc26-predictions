import { signUp } from '@/lib/auth/auth'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password, displayName } = await request.json()
    const { user, error } = await signUp(email, password, displayName)

    if (error) {
      return NextResponse.json({ error }, { status: 400 })
    }

    return NextResponse.json({ user })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
