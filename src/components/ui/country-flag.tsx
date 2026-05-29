'use client'

import { getFlagUrl, getCountryName } from '@/lib/mini-flags'

interface CountryFlagProps {
  code?: string
  name?: string
  alt?: string
  className?: string
  width?: number
}

export function CountryFlag({ code, name, alt, className = '', width = 22 }: CountryFlagProps) {
  const identifier = code || name || ''
  const flagUrl = getFlagUrl(identifier)

  if (!flagUrl) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded bg-white/10 text-xs leading-none ${className}`}
        style={{ width, height: Math.round(width * 0.75) }}
        title={alt || name || code}
        role="img"
        aria-label={alt || name || code || 'flag'}
      >
        🏳️
      </span>
    )
  }

  const countryName = getCountryName(identifier)
  const imgAlt = alt || countryName || name || code || 'flag'

  return (
    <img
      src={flagUrl}
      alt={imgAlt}
      width={width}
      height={Math.round(width * 0.75)}
      className={`inline-block rounded-sm object-cover ${className}`}
      loading="lazy"
      title={countryName || name || code}
    />
  )
}
