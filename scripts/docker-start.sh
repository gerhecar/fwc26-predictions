#!/bin/sh
set -e

echo "Waiting for MySQL..."
while ! node -e "
  require('mysql2/promise').createConnection({
    host: process.env.MYSQL_HOST || 'mysql',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE || 'fwc26'
  }).then(c => { c.end(); process.exit(0) }).catch(() => process.exit(1))
" 2>/dev/null; do
  sleep 2
done

echo "Running migrations..."
node scripts/migrate.js

echo "Running seed..."
node scripts/seed.js

echo "Starting Next.js..."
exec node server.js
