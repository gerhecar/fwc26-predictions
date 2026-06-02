export function getDashboardRoute(role?: string | null): string {
  return role === 'admin' ? '/admin' : '/dashboard'
}
