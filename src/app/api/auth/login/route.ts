import { signIn } from '@/lib/auth/auth'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    const { user, error } = await signIn(email, password)

    if (error) {
      return NextResponse.json({ error }, { status: 401 })
    }

    return NextResponse.json({ user })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
