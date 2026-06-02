'use client'

import { RULES, SCORING_TABLE } from '@/content/rules'

const sectionIcons: Record<string, string> = {
  objective: '🎯',
  participation: '📋',
  phases: '📅',
  scoring: '🏆',
  'scores-table': '📊',
  leaderboard: '📈',
  tiebreakers: '⚖️',
  fairplay: '🤝',
  goodluck: '🍀',
}

export function RulesView() {
  const sections = RULES.filter(s => s.id !== 'scores-table')

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-white">
          Rules & Scoring
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          FIFA World Cup 2026 &mdash; Prediction Game
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {sections.map((section) => (
          <section key={section.id} id={section.id}>
            <div className="mb-4 flex items-center gap-3">
              <span className="text-2xl">{sectionIcons[section.id] || '📄'}</span>
              <h2 className="font-[family-name:var(--font-bebas)] text-2xl tracking-wide text-white">
                {section.title}
              </h2>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
              {section.content.map((line, i) => {
                if (line === '') {
                  return <div key={i} className="h-2" />
                }
                const isHeader = line.endsWith(':') && line === line.toUpperCase()
                if (isHeader) {
                  return (
                    <p key={i} className="mb-2 mt-3 text-sm font-bold tracking-wide text-fifa-gold first:mt-0">
                      {line}
                    </p>
                  )
                }
                const isBullet = line.startsWith('•') || line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') || line.startsWith('4.') || line.startsWith('5.') || line.startsWith('6.') || line.startsWith('7.')
                if (isBullet) {
                  return (
                    <p key={i} className="mb-1.5 pl-4 text-sm leading-relaxed text-text-secondary">
                      {line}
                    </p>
                  )
                }
                return (
                  <p key={i} className="mb-2 text-sm leading-relaxed text-text-secondary last:mb-0">
                    {line}
                  </p>
                )
              })}
            </div>

            {/* Scoring table rendered inline after the scoring section */}
            {section.id === 'scoring' && (
              <div className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.02]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="px-4 py-3 text-left text-xs font-bold tracking-wide text-text-secondary uppercase">
                        Phase / Concept
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold tracking-wide text-text-secondary uppercase">
                        Points
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {SCORING_TABLE.map((row, i) => (
                      <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                        <td className="px-4 py-2.5 text-text-secondary">{row.phase}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-accent-green font-bold">
                          {row.points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
