import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { SESSION_COOKIE, getJWTSecret } from './config'

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request })
  const token = request.cookies.get(SESSION_COOKIE)?.value

  let userId: string | null = null
  let role: string | null = null

  if (token) {
    try {
      const { payload } = await jwtVerify(token, getJWTSecret())
      userId = payload.userId as string
      role = payload.role as string
    } catch {
      // Invalid token, treat as unauthenticated
    }
  }

  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth/')
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin/')
  const isProtectedRoute =
    !isAuthRoute &&
    !request.nextUrl.pathname.startsWith('/_next') &&
    request.nextUrl.pathname !== '/' &&
    !request.nextUrl.pathname.startsWith('/api/')

  if (!userId && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  if (userId && isAdminRoute && role !== 'admin') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  if (userId && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}
