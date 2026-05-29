import { signOut } from '@/lib/auth/auth'
import { NextResponse } from 'next/server'

export async function POST() {
  await signOut()
  return NextResponse.json({ success: true })
}
