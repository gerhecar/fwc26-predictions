/**
 * Database migration script
 * Usage: node scripts/migrate.js
 */
const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'fwc26',
    multipleStatements: true,
  })

  console.log('Connected to MySQL')

  const schemaSQL = fs.readFileSync(
    path.join(__dirname, 'schema.sql'),
    'utf8',
  )

  const statements = schemaSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)

  for (const stmt of statements) {
    try {
      await connection.execute(stmt + ';')
      console.log(`✓ Executed: ${stmt.substring(0, 60)}...`)
    } catch (err) {
      console.error(`✗ Error: ${err.message}`)
      console.error(`  Statement: ${stmt.substring(0, 100)}...`)
    }
  }

  // Run bet status migration
  const betStatusMigrations = [
    `ALTER TABLE bet_submissions ADD COLUMN validated_at TIMESTAMP NULL DEFAULT NULL AFTER status`,
    `ALTER TABLE bet_submissions ADD COLUMN validated_by VARCHAR(36) DEFAULT NULL AFTER validated_at`,
    `ALTER TABLE bet_submissions MODIFY COLUMN status ENUM('submitted', 'valid', 'deleted') NOT NULL DEFAULT 'submitted'`,
  ]

  for (const stmt of betStatusMigrations) {
    try {
      await connection.execute(stmt)
      console.log(`✓ ${stmt.substring(0, 60)}...`)
    } catch (err) {
      console.log(`- ${err.message}`)
    }
  }

  // Run scoring fields migration
  const scoringMigrations = [
    `ALTER TABLE bet_submissions ADD COLUMN total_score INT NOT NULL DEFAULT 0 AFTER validated_by`,
    `ALTER TABLE bet_submissions ADD COLUMN score_breakdown JSON NULL AFTER total_score`,
    `ALTER TABLE bet_submissions ADD COLUMN scored_at TIMESTAMP NULL DEFAULT NULL AFTER score_breakdown`,
  ]

  for (const stmt of scoringMigrations) {
    try {
      await connection.execute(stmt)
      console.log(`✓ ${stmt.substring(0, 60)}...`)
    } catch (err) {
      console.log(`- ${err.message}`)
    }
  }

  // Run bet invitation fields migration
  const invitationFieldMigrations = [
    `ALTER TABLE bet_submissions ADD COLUMN submitted_via_invitation BOOLEAN NOT NULL DEFAULT FALSE AFTER email_error`,
    `ALTER TABLE bet_submissions ADD COLUMN invitation_id VARCHAR(36) DEFAULT NULL AFTER submitted_via_invitation`,
  ]

  for (const stmt of invitationFieldMigrations) {
    try {
      await connection.execute(stmt)
      console.log(`✓ ${stmt.substring(0, 60)}...`)
    } catch (err) {
      console.log(`- ${err.message}`)
    }
  }

  // Run provisional/official score fields migration
  const scorePhaseMigrations = [
    `ALTER TABLE bet_submissions ADD COLUMN provisional_score INT NOT NULL DEFAULT 0 AFTER scored_at`,
    `ALTER TABLE bet_submissions ADD COLUMN provisional_score_breakdown JSON NULL AFTER provisional_score`,
    `ALTER TABLE bet_submissions ADD COLUMN provisional_scored_at TIMESTAMP NULL DEFAULT NULL AFTER provisional_score_breakdown`,
    `ALTER TABLE bet_submissions ADD COLUMN official_score INT NOT NULL DEFAULT 0 AFTER provisional_scored_at`,
    `ALTER TABLE bet_submissions ADD COLUMN official_score_breakdown JSON NULL AFTER official_score`,
    `ALTER TABLE bet_submissions ADD COLUMN official_scored_at TIMESTAMP NULL DEFAULT NULL AFTER official_score_breakdown`,
    `ALTER TABLE official_results ADD COLUMN phase_status JSON DEFAULT NULL AFTER results_json`,
  ]

  for (const stmt of scorePhaseMigrations) {
    try {
      await connection.execute(stmt)
      console.log(`✓ ${stmt.substring(0, 60)}...`)
    } catch (err) {
      console.log(`- ${err.message}`)
    }
  }

  // Run soft-delete columns migration
  const softDeleteMigrations = [
    `ALTER TABLE bet_submissions ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER knockout_score`,
    `ALTER TABLE bet_submissions ADD COLUMN deleted_by VARCHAR(36) DEFAULT NULL AFTER deleted_at`,
  ]

  for (const stmt of softDeleteMigrations) {
    try {
      await connection.execute(stmt)
      console.log(`✓ ${stmt.substring(0, 60)}...`)
    } catch (err) {
      console.log(`- ${err.message}`)
    }
  }

  // Run tie-breaker fields migration
  const tieBreakerMigrations = [
    `ALTER TABLE bet_submissions ADD COLUMN champion_correct BOOLEAN DEFAULT FALSE AFTER official_scored_at`,
    `ALTER TABLE bet_submissions ADD COLUMN finalists_correct INT DEFAULT 0 AFTER champion_correct`,
    `ALTER TABLE bet_submissions ADD COLUMN semifinalists_correct INT DEFAULT 0 AFTER finalists_correct`,
    `ALTER TABLE bet_submissions ADD COLUMN quarterfinalists_correct INT DEFAULT 0 AFTER semifinalists_correct`,
    `ALTER TABLE bet_submissions ADD COLUMN qualified_teams_correct INT DEFAULT 0 AFTER quarterfinalists_correct`,
    `ALTER TABLE bet_submissions ADD COLUMN knockout_score INT DEFAULT 0 AFTER qualified_teams_correct`,
  ]

  for (const stmt of tieBreakerMigrations) {
    try {
      await connection.execute(stmt)
      console.log(`✓ ${stmt.substring(0, 60)}...`)
    } catch (err) {
      console.log(`- ${err.message}`)
    }
  }

  await connection.end()
  console.log('Migration complete')
}

main().catch(console.error)
