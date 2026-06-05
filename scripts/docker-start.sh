#!/bin/sh
set -e

# Fallback: allow DB_* vars as alternative to MYSQL_*
MYSQL_HOST="${MYSQL_HOST:-$DB_HOST}"
MYSQL_PORT="${MYSQL_PORT:-$DB_PORT}"
MYSQL_USER="${MYSQL_USER:-$DB_USER}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-$DB_PASSWORD}"
MYSQL_DATABASE="${MYSQL_DATABASE:-$DB_NAME}"

# Safe startup diagnostics (no secrets printed)
echo "DB_HOST=$MYSQL_HOST"
echo "DB_NAME=$MYSQL_DATABASE"
echo "DB_USER=$MYSQL_USER"
echo "MYSQL_HOST=$MYSQL_HOST"
echo "MYSQL_USER=$MYSQL_USER"
echo "MYSQL_PASSWORD set? $( [ -n "$MYSQL_PASSWORD" ] && echo yes || echo no )"
echo "DB_PASSWORD set? $( [ -n "$DB_PASSWORD" ] && echo yes || echo no )"

# Fail-fast: validate required environment variables
if [ -z "$MYSQL_PASSWORD" ]; then
  echo "FATAL: MYSQL_PASSWORD and DB_PASSWORD are both empty. Check .env.production and docker compose --env-file .env.production"
  exit 1
fi

if [ -z "$MYSQL_HOST" ]; then
  echo "FATAL: MYSQL_HOST is not set. It should be 'mysql' inside Docker."
  exit 1
fi

echo "Waiting for MySQL at $MYSQL_HOST:$MYSQL_PORT as $MYSQL_USER..."
while ! node -e "
  const p = process.env;
  require('mysql2/promise').createConnection({
    host: p.MYSQL_HOST || p.DB_HOST || 'mysql',
    user: p.MYSQL_USER || p.DB_USER || 'root',
    password: p.MYSQL_PASSWORD || p.DB_PASSWORD || '',
    database: p.MYSQL_DATABASE || p.DB_NAME || 'fwc26'
  }).then(c => { c.end(); process.exit(0) }).catch(e => { console.error('MySQL connection failed:', e.message); process.exit(1) })
"; do
  sleep 2
done

echo "MySQL is ready. Running migrations..."
node scripts/migrate.js

echo "Running seed..."
node scripts/seed.js

echo "Starting Next.js..."
exec node server.js
