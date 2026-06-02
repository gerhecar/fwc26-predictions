import Link from 'next/link'

export function BackToAdmin() {
  return (
    <Link
      href="/admin"
      className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-fifa-blue transition-colors"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 12L6 8L10 4" />
      </svg>
      Back to Admin Panel
    </Link>
  )
}
