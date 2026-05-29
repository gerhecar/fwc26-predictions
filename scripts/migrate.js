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

  await connection.end()
  console.log('Migration complete')
}

main().catch(console.error)
