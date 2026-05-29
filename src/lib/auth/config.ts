export const SESSION_COOKIE = 'session_token'

export function getJWTSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || 'fwc26-dev-secret-change-in-production-32chars'
  return new TextEncoder().encode(secret)
}
