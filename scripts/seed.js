/**
 * Seed script - creates tournament, groups, teams, and admin user
 * Usage: node scripts/seed.js
 */
const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

function uuid() {
  return crypto.randomUUID()
}

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'fwc26',
  })

  console.log('Connected to MySQL')

  // Create admin user
  const adminId = uuid()
  const passwordHash = await bcrypt.hash('Florendiversion', 10)
  await connection.execute(
    'INSERT IGNORE INTO users (id, email, display_name, password_hash, role) VALUES (?, ?, ?, ?, ?)',
    [adminId, 'admin@fwc26.com', 'admin', passwordHash, 'admin'],
  )
  console.log('✓ Admin user created (admin@fwc26.com / Florendiversion)')

  // Check if tournament already exists
  const [existing] = await connection.execute(
    "SELECT id FROM tournaments WHERE slug = 'fifa-world-cup-2026'",
  )

  if (existing.length > 0) {
    console.log('✓ Tournament already seeded, skipping')
    await connection.end()
    return
  }

  // Create tournament
  const tournamentId = uuid()
  await connection.execute(
    `INSERT INTO tournaments (id, name, slug, status, starts_at, ends_at, scoring_config)
     VALUES (?, 'FIFA World Cup 2026', 'fifa-world-cup-2026', 'active',
             '2026-06-11 00:00:00', '2026-07-19 00:00:00', ?)`,
    [
      tournamentId,
      JSON.stringify({
        group_correct_1st: 5,
        group_correct_2nd: 3,
        group_correct_3rd: 1,
        third_place_correct: 5,
        knockout_correct: 10,
        champion_correct: 25,
      }),
    ],
  )
  console.log('✓ Tournament created')

  // Groups and teams
  const groupsData = [
    { letter: 'A', teams: ['Argentina', 'Spain', 'Saudi Arabia', 'Iran'] },
    { letter: 'B', teams: ['England', 'USA', 'Wales', 'Scotland'] },
    { letter: 'C', teams: ['France', 'Netherlands', 'Poland', 'Senegal'] },
    { letter: 'D', teams: ['Brazil', 'Portugal', 'Mexico', 'Morocco'] },
    { letter: 'E', teams: ['Germany', 'Italy', 'Denmark', 'Croatia'] },
    { letter: 'F', teams: ['Belgium', 'Ukraine', 'Japan', 'Canada'] },
    { letter: 'G', teams: ['Uruguay', 'Ecuador', 'Tunisia', 'Australia'] },
    { letter: 'H', teams: ['Switzerland', 'Austria', 'Sweden', 'New Zealand'] },
    { letter: 'I', teams: ['Turkey', 'Norway', 'Egypt', 'Cape Verde'] },
    { letter: 'J', teams: ['Nigeria', 'Czech Republic', 'Paraguay', 'Iraq'] },
    { letter: 'K', teams: ['Korea Republic', 'DR Congo', 'Qatar', 'Jordan'] },
    { letter: 'L', teams: ['Colombia', 'Ghana', 'Ivory Coast', 'Haiti'] },
  ]

  const flagMap = {
    'Argentina': 'https://flagcdn.com/w80/ar.png',
    'Spain': 'https://flagcdn.com/w80/es.png',
    'Saudi Arabia': 'https://flagcdn.com/w80/sa.png',
    'Iran': 'https://flagcdn.com/w80/ir.png',
    'England': 'https://flagcdn.com/w80/gb-eng.png',
    'USA': 'https://flagcdn.com/w80/us.png',
    'Wales': 'https://flagcdn.com/w80/gb-wls.png',
    'Scotland': 'https://flagcdn.com/w80/gb-sct.png',
    'France': 'https://flagcdn.com/w80/fr.png',
    'Netherlands': 'https://flagcdn.com/w80/nl.png',
    'Poland': 'https://flagcdn.com/w80/pl.png',
    'Senegal': 'https://flagcdn.com/w80/sn.png',
    'Brazil': 'https://flagcdn.com/w80/br.png',
    'Portugal': 'https://flagcdn.com/w80/pt.png',
    'Mexico': 'https://flagcdn.com/w80/mx.png',
    'Morocco': 'https://flagcdn.com/w80/ma.png',
    'Germany': 'https://flagcdn.com/w80/de.png',
    'Italy': 'https://flagcdn.com/w80/it.png',
    'Denmark': 'https://flagcdn.com/w80/dk.png',
    'Croatia': 'https://flagcdn.com/w80/hr.png',
    'Belgium': 'https://flagcdn.com/w80/be.png',
    'Ukraine': 'https://flagcdn.com/w80/ua.png',
    'Japan': 'https://flagcdn.com/w80/jp.png',
    'Canada': 'https://flagcdn.com/w80/ca.png',
    'Uruguay': 'https://flagcdn.com/w80/uy.png',
    'Ecuador': 'https://flagcdn.com/w80/ec.png',
    'Tunisia': 'https://flagcdn.com/w80/tn.png',
    'Australia': 'https://flagcdn.com/w80/au.png',
    'Switzerland': 'https://flagcdn.com/w80/ch.png',
    'Austria': 'https://flagcdn.com/w80/at.png',
    'Sweden': 'https://flagcdn.com/w80/se.png',
    'New Zealand': 'https://flagcdn.com/w80/nz.png',
    'Turkey': 'https://flagcdn.com/w80/tr.png',
    'Norway': 'https://flagcdn.com/w80/no.png',
    'Egypt': 'https://flagcdn.com/w80/eg.png',
    'Cape Verde': 'https://flagcdn.com/w80/cv.png',
    'Nigeria': 'https://flagcdn.com/w80/ng.png',
    'Czech Republic': 'https://flagcdn.com/w80/cz.png',
    'Paraguay': 'https://flagcdn.com/w80/py.png',
    'Iraq': 'https://flagcdn.com/w80/iq.png',
    'Korea Republic': 'https://flagcdn.com/w80/kr.png',
    'DR Congo': 'https://flagcdn.com/w80/cd.png',
    'Qatar': 'https://flagcdn.com/w80/qa.png',
    'Jordan': 'https://flagcdn.com/w80/jo.png',
    'Colombia': 'https://flagcdn.com/w80/co.png',
    'Ghana': 'https://flagcdn.com/w80/gh.png',
    'Ivory Coast': 'https://flagcdn.com/w80/ci.png',
    'Haiti': 'https://flagcdn.com/w80/ht.png',
  }

  for (const g of groupsData) {
    const groupId = uuid()
    await connection.execute(
      'INSERT INTO `groups` (id, tournament_id, letter, name) VALUES (?, ?, ?, ?)',
      [groupId, tournamentId, g.letter, `Group ${g.letter}`],
    )

    for (const teamName of g.teams) {
      const teamId = uuid()
      const flag = flagMap[teamName] || ''
      await connection.execute(
        'INSERT INTO teams (id, tournament_id, group_id, name, flag_url) VALUES (?, ?, ?, ?, ?)',
        [teamId, tournamentId, groupId, teamName, flag],
      )
    }
  }

  console.log('✓ Groups and teams seeded')
  await connection.end()
  console.log('Seed complete')
}

main().catch(console.error)
