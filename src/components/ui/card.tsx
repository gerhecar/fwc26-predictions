import { type ReactNode } from 'react'

interface CardProps {
  title?: string
  subtitle?: string
  className?: string
  children: ReactNode
}

export function Card({ title, subtitle, className = '', children }: CardProps) {
  return (
    <div className={`rounded-xl border border-border bg-surface p-4 shadow-sm ${className}`}>
      {(title || subtitle) && (
        <div className="mb-3">
          {title && <h3 className="text-lg font-semibold text-text-primary">{title}</h3>}
          {subtitle && <p className="text-sm text-text-secondary">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  )
}
