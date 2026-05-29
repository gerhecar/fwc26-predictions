import { type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`rounded-lg border border-border bg-surface px-3 py-2 text-text-primary placeholder:text-text-secondary focus:border-fifa-blue focus:outline-none focus:ring-2 focus:ring-fifa-blue/20 disabled:cursor-not-allowed disabled:opacity-50 ${error ? 'border-fifa-red' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-fifa-red">{error}</span>}
    </div>
  )
}
