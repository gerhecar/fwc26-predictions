'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getDashboardRoute } from '@/lib/auth/routes'

const navItems = [
  { href: '/predictions', label: 'Grupos', icon: '📋' },
  { href: '/bracket', label: 'Knockout', icon: '🏆' },
  { href: '/rankings', label: 'Tabla', icon: '📊' },
  { href: '/profile', label: 'Perfil', icon: '👤' },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(u => setUserRole(u?.role || null))
      .catch(() => {})
  }, [])

  const isAuthPage = pathname?.startsWith('/auth/')

  if (isAuthPage) {
    return <>{children}</>
  }

  const isAdminPage = pathname?.startsWith('/admin/')
  const homeHref = getDashboardRoute(userRole)

  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      {isAdminPage && (
        <header className="sticky top-0 z-40 border-b border-border bg-surface px-4 py-3">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <Link href="/admin" className="text-sm font-semibold text-fifa-blue">
              Panel Admin
            </Link>
            <Link href="/admin" className="text-sm text-text-secondary hover:text-text-primary">
              Volver al inicio
            </Link>
          </div>
        </header>
      )}

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface md:relative md:border-t-0">
        <div className="mx-auto flex max-w-6xl items-center justify-around md:justify-start md:gap-6 md:px-4 md:py-3">
          <Link
            href={homeHref}
            className={`flex flex-col items-center gap-0.5 px-3 py-2 text-xs transition-colors md:flex-row md:gap-2 md:text-sm ${
              pathname === homeHref
                ? 'text-fifa-blue'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <span className="text-lg md:text-base">🏠</span>
            <span>Inicio</span>
          </Link>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 text-xs transition-colors md:flex-row md:gap-2 md:text-sm ${
                  isActive
                    ? 'text-fifa-blue'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <span className="text-lg md:text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
