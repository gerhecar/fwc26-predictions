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

App runs at **http://localhost:3000**

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_APP_URL` | Yes | `http://localhost:3000` | Public URL for link generation |
| `APP_URL` | Yes | `http://localhost:3000` | Internal app URL |
| `MYSQL_HOST` | Yes | `localhost` | MySQL host (use `mysql` inside Docker) |
| `MYSQL_PORT` | Yes | `3306` | MySQL port |
| `MYSQL_USER` | Yes | `root` | MySQL user |
| `MYSQL_PASSWORD` | Yes | — | MySQL root password |
| `MYSQL_DATABASE` | Yes | `fwc26` | MySQL database name |
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
# IMPORTANT: Set MYSQL_HOST=mysql (Docker service name)
# Set MYSQL_PASSWORD and JWT_SECRET to strong random values
# Set NEXT_PUBLIC_APP_URL=https://fwc26.bullresearch.eu
```

### 2. Build and start

```bash
docker compose up -d --build
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

## Database Management

### Backup

```bash
docker compose exec mysql mysqldump -u root -p"${MYSQL_PASSWORD}" fwc26 > backup-$(date +%F).sql
```

### Restore

```bash
cat backup-2026-06-02.sql | docker compose exec -T mysql mysql -u root -p"${MYSQL_PASSWORD}" fwc26
```

### Access MySQL CLI

```bash
docker compose exec mysql mysql -u root -p"${MYSQL_PASSWORD}" fwc26
```

---

## Building Docker Image Manually

```bash
docker build -t fwc26-predictions:latest .
docker run --rm -p 3000:3000 --env-file .env.production fwc26-predictions:latest
```

---

## Production Domain

The domain **https://fwc26.bullresearch.eu** must be configured by the infrastructure team:

1. DNS A record pointing to the server IP
2. TLS/SSL certificate (Let's Encrypt or similar)
3. Reverse proxy forwarding to `localhost:3000`

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
- [ ] `MYSQL_HOST=mysql` in Docker environment
- [ ] `NEXT_PUBLIC_APP_URL` set to `https://fwc26.bullresearch.eu`
- [ ] `JWT_SECRET` is a strong random value
- [ ] `MYSQL_PASSWORD` is a strong random value
- [ ] Invitation links use `https://fwc26.bullresearch.eu/invite/`
- [ ] Email links use production domain
- [ ] No secrets committed to Git
- [ ] Database backup works
- [ ] Docker containers restart on failure

---

## Architecture

```
Browser ──HTTPS──> Reverse Proxy ──> fwc26-app:3000
                                        │
                                    depends_on
                                        │
                                    fwc26-mysql:3306
```
