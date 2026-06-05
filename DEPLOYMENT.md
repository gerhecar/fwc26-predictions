# FWC26 Predictions — Deployment Guide

## Prerequisites

- Docker and Docker Compose installed on the server
- Domain `fwc26.bullresearch.eu` pointing to the server
- Reverse proxy (nginx, Caddy, Traefik) configured for HTTPS

---

## Local Development

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your MySQL credentials

# Run database migrations
npm run db:migrate

# Seed initial data (admin user, tournament, teams)
npm run db:seed

# Start dev server
npm run dev
```

App runs at **http://localhost:3000** (or port 80 when deployed via Docker)

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_APP_URL` | Yes | `http://localhost:3000` | Public URL for link generation |
| `PORT` | No | `3000` | App listen port (set `80` in Docker) |
| `APP_URL` | Yes | `http://localhost:3000` | Internal app URL |
| `DB_HOST` | Yes | `mysql` | MySQL host (use `mysql` inside Docker) |
| `DB_PORT` | Yes | `3306` | MySQL port |
| `DB_USER` | Yes | `root` | MySQL user |
| `DB_PASSWORD` | Yes | — | MySQL password |
| `DB_NAME` | Yes | `fwc26` | MySQL database name |
| `MYSQL_ROOT_PASSWORD` | Yes | — | MySQL root password (consumed by MySQL container) |
| `MYSQL_DATABASE` | Yes | `fwc26` | MySQL database name (consumed by MySQL container) |
| `MYSQL_HOST` | Yes | `mysql` | Legacy — kept for backward compat |
| `MYSQL_PORT` | Yes | `3306` | Legacy — kept for backward compat |
| `MYSQL_USER` | Yes | `root` | Legacy — kept for backward compat |
| `MYSQL_PASSWORD` | Yes | — | Legacy — must equal `DB_PASSWORD` |
| `JWT_SECRET` | Yes | — | Secret key for JWT tokens |
| `SMTP_HOST` | No | — | SMTP server for email notifications |
| `SMTP_PORT` | No | `587` | SMTP port |
| `SMTP_USER` | No | — | SMTP username |
| `SMTP_PASS` | No | — | SMTP password |
| `ADMIN_PASSWORD` | No | `Florendiversion` | Default admin password on seed |

---

## Production Deployment with Docker

### 1. Prepare environment

```bash
cp .env.example .env.production
# Edit .env.production with production values
# IMPORTANT: Set DB_HOST=mysql (Docker service name)
# Set DB_PASSWORD and JWT_SECRET to strong random values
# Set NEXT_PUBLIC_APP_URL=https://fwc26.bullresearch.eu
```

### 2. Build and start

```bash
# IMPORTANT: Use --env-file to load variables for compose substitution
docker compose --env-file .env.production up -d --build
```

### 3. Check status

```bash
docker compose ps
docker compose logs app
docker compose logs mysql
```

### 4. Run migrations manually (if needed)

```bash
docker compose exec app node scripts/migrate.js
docker compose exec app node scripts/seed.js
```

---

## Deployment Validation

### Validate Compose configuration

```bash
docker compose --env-file .env.production config
```

This shows the fully resolved configuration. Verify:
- `MYSQL_ROOT_PASSWORD` is present in the mysql service environment
- `DB_PASSWORD` / `MYSQL_PASSWORD` is present in the app service environment
- `DB_HOST=mysql`
- `NEXT_PUBLIC_APP_URL=https://fwc26.bullresearch.eu`

### Validate container environment

```bash
# Check that required env vars exist inside containers
docker exec fwc26-app printenv | grep -E "^(DB_|MYSQL_|JWT|NEXT_PUBLIC_APP)"
docker exec fwc26-mysql printenv | grep -E "^(MYSQL_ROOT_PASSWORD|MYSQL_DATABASE)"
```

(These commands only verify variable *names* exist, not their values.)

---

## Troubleshooting

### App stuck at "Waiting for MySQL..."

This means the app container cannot connect to MySQL. Common causes:

**1. MYSQL_PASSWORD is empty or mismatched**

The app's `docker-start.sh` validates that `MYSQL_PASSWORD` is set and non-empty on startup. If it fails, run:

```bash
docker compose logs app
```

Look for:
```
FATAL: MYSQL_PASSWORD is not set or is empty
```

Fix: Ensure `.env.production` has `MYSQL_ROOT_PASSWORD=...` and `MYSQL_PASSWORD=...` set to the same value. Then rebuild:

```bash
docker compose --env-file .env.production up -d --build
```

**2. MySQL healthcheck is failing**

```bash
docker compose logs mysql
```

If MySQL fails to start, check the error. Common cause: MySQL data directory was initialized with a different password. Reset with:

```bash
docker compose down -v   # WARNING: deletes MySQL data volume
docker compose --env-file .env.production up -d --build
```

**3. Compose variable substitution not working**

If you see this warning:
```
The "MYSQL_ROOT_PASSWORD" variable is not set. Defaulting to a blank string.
```

It means Docker Compose cannot resolve `${MYSQL_ROOT_PASSWORD}`. The fix is to either:
- Always use `--env-file .env.production` with `docker compose` commands
- Or create a `.env` file (gitignored) with the required variables

The docker-compose.yml now uses `env_file: .env.production` for both services, so MySQL gets its password directly from the file at runtime. The healthcheck uses `CMD-SHELL` to read `$MYSQL_ROOT_PASSWORD` from the container's own environment (no compose substitution needed).

**4. Verify resolved config**

```bash
docker compose --env-file .env.production config
```

This prints the full config with all variables resolved.

---

## Database Management

### Backup

```bash
docker compose exec mysql mysqldump -u root -p"${MYSQL_ROOT_PASSWORD}" fwc26 > backup-$(date +%F).sql
```

### Restore

```bash
cat backup-2026-06-02.sql | docker compose exec -T mysql mysql -u root -p"${MYSQL_ROOT_PASSWORD}" fwc26
```

### Access MySQL CLI

```bash
docker compose exec mysql mysql -u root -p"${MYSQL_ROOT_PASSWORD}" fwc26
```

---

## Building Docker Image Manually

```bash
docker build -t fwc26-predictions:latest .
docker run --rm -p 80:80 --env-file .env.production fwc26-predictions:latest
```

---

## Production Domain

The domain **https://fwc26.bullresearch.eu** must be configured by the infrastructure team:

1. DNS A record pointing to the server IP
2. TLS/SSL certificate (Let's Encrypt or similar)
3. Reverse proxy forwarding to `localhost:80`

### Reverse proxy headers required

```nginx
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-Host $host;
proxy_set_header X-Real-IP $remote_addr;
```

---

## Verification Checklist

- [ ] `npm run build` passes
- [ ] `.env.production` has correct values
- [ ] `DB_HOST=mysql` / `MYSQL_HOST=mysql` in Docker environment
- [ ] `NEXT_PUBLIC_APP_URL` set to `https://fwc26.bullresearch.eu`
- [ ] `JWT_SECRET` is a strong random value
- [ ] `DB_PASSWORD` / `MYSQL_ROOT_PASSWORD` is a strong random value
- [ ] `docker compose --env-file .env.production config` shows resolved values
- [ ] `docker compose --env-file .env.production up -d --build` starts cleanly
- [ ] App does not get stuck at `Waiting for MySQL...`
- [ ] Invitation links use `https://fwc26.bullresearch.eu/invite/`
- [ ] Email links use production domain
- [ ] No secrets committed to Git
- [ ] Database backup works
- [ ] Docker containers restart on failure

---

## Architecture

```
Browser ──HTTPS──> Reverse Proxy ──> fwc26-app:80
                                        │
                                    depends_on
                                        │
                                    fwc26-mysql:3306
```
