import miniFlags from './mini_flags.json'

const ISO2_TO_FLAG: Record<string, (typeof miniFlags)[number]> = {}
const NAME_EN_TO_ISO2: Record<string, string> = {}
const NAME_ES_TO_ISO2: Record<string, string> = {}

for (const entry of miniFlags) {
  ISO2_TO_FLAG[entry.iso2] = entry
  NAME_EN_TO_ISO2[entry.country.toLowerCase()] = entry.iso2
}

const SPANISH_TO_ENGLISH: Record<string, string> = {
  'méxico': 'Mexico',
  'sudáfrica': 'South Africa',
  'corea del sur': 'South Korea',
  'chequia': 'Czech Republic',
  'canadá': 'Canada',
  'bosnia y herzegovina': 'Bosnia and Herzegovina',
  'catar': 'Qatar',
  'suiza': 'Switzerland',
  'brasil': 'Brazil',
  'marruecos': 'Morocco',
  'haití': 'Haiti',
  'escocia': 'Scotland',
  'estados unidos': 'United States',
  'australia': 'Australia',
  'paraguay': 'Paraguay',
  'turquía': 'Turkey',
  'alemania': 'Germany',
  'ecuador': 'Ecuador',
  'costa de marfil': 'Ivory Coast',
  'curazao': 'Curaçao',
  'países bajos': 'Netherlands',
  'japón': 'Japan',
  'suecia': 'Sweden',
  'túnez': 'Tunisia',
  'bélgica': 'Belgium',
  'egipto': 'Egypt',
  'irán': 'Iran',
  'nueva zelanda': 'New Zealand',
  'españa': 'Spain',
  'uruguay': 'Uruguay',
  'arabia saudí': 'Saudi Arabia',
  'cabo verde': 'Cape Verde',
  'francia': 'France',
  'senegal': 'Senegal',
  'noruega': 'Norway',
  'irak': 'Iraq',
  'argentina': 'Argentina',
  'argelia': 'Algeria',
  'austria': 'Austria',
  'jordania': 'Jordan',
  'portugal': 'Portugal',
  'colombia': 'Colombia',
  'república democrática del congo': 'DR Congo',
  'uzbekistán': 'Uzbekistan',
  'inglaterra': 'England',
  'croacia': 'Croatia',
  'ghana': 'Ghana',
  'panamá': 'Panama',
}

for (const [spanish, english] of Object.entries(SPANISH_TO_ENGLISH)) {
  const iso2 = NAME_EN_TO_ISO2[english.toLowerCase()]
  if (iso2) NAME_ES_TO_ISO2[spanish] = iso2
}

const NAME_ALT_TO_ISO2: Record<string, string> = {
  'korea republic': 'kr',
  'usa': 'us',
  'dz': 'dz',
}

export function getIso2(identifier: string): string | undefined {
  if (!identifier) return undefined

  const lower = identifier.toLowerCase().trim()

  if (ISO2_TO_FLAG[lower]) return lower

  if (NAME_ALT_TO_ISO2[lower]) return NAME_ALT_TO_ISO2[lower]
  if (NAME_ES_TO_ISO2[lower]) return NAME_ES_TO_ISO2[lower]
  if (NAME_EN_TO_ISO2[lower]) return NAME_EN_TO_ISO2[lower]

  return undefined
}

export function getFlagUrl(identifier: string): string | undefined {
  const iso2 = getIso2(identifier)
  if (!iso2) return undefined
  return ISO2_TO_FLAG[iso2]?.flag_url
}

export function getCountryName(identifier: string): string | undefined {
  const iso2 = getIso2(identifier)
  if (!iso2) return undefined
  return ISO2_TO_FLAG[iso2]?.country
}

export function getFlagEmoji(identifier: string): string {
  const iso2 = getIso2(identifier)
  if (!iso2) return '🏳️'
  return ISO2_TO_FLAG[iso2]?.emoji || '🏳️'
}
