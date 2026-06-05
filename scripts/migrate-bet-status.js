/**
 * Migration: Add bet status 'valid', 'deleted' and validation metadata columns
 * Usage: node scripts/migrate-bet-status.js
 */
const mysql = require('mysql2/promise')

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'fwc26',
    multipleStatements: true,
  })

  console.log('Connected to MySQL')

  const migrations = [
    // Add validated_at column if it doesn't exist
    `ALTER TABLE bet_submissions
     ADD COLUMN validated_at TIMESTAMP NULL DEFAULT NULL AFTER status`,
    // Add validated_by column if it doesn't exist
    `ALTER TABLE bet_submissions
     ADD COLUMN validated_by VARCHAR(36) DEFAULT NULL AFTER validated_at`,
    // Update the status ENUM to include 'valid' and 'deleted'
    `ALTER TABLE bet_submissions
     MODIFY COLUMN status ENUM('submitted', 'valid', 'deleted') NOT NULL DEFAULT 'submitted'`,
  ]

  for (const stmt of migrations) {
    try {
      await connection.execute(stmt)
      console.log(`✓ ${stmt.substring(0, 80)}...`)
    } catch (err) {
      // Column already exists or other benign error
      console.log(`- ${err.message}`)
    }
  }

  await connection.end()
  console.log('Migration complete')
}

main().catch(console.error)
