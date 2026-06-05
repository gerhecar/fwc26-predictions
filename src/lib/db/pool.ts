import mysql from 'mysql2/promise'

let pool: mysql.Pool | null = null

function requireEnv(...names: string[]): string {
  for (const name of names) {
    const val = process.env[name]
    if (val) {
      return val
    }
  }
  const all = names.join(', ')
  throw new Error(
    `Missing required environment variable: ${all}. ` +
    `Check that .env.production contains one of ${all} and docker compose uses --env-file .env.production`
  )
}

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: requireEnv('MYSQL_HOST', 'DB_HOST'),
      port: parseInt(requireEnv('MYSQL_PORT', 'DB_PORT'), 10),
      user: requireEnv('MYSQL_USER', 'DB_USER'),
      password: requireEnv('MYSQL_PASSWORD', 'DB_PASSWORD'),
      database: requireEnv('MYSQL_DATABASE', 'DB_NAME'),
      waitForConnections: true,
      connectionLimit: 20,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    })
  }
  return pool
}
