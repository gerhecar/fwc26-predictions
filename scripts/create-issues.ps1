$headers = @{
  Authorization = "Bearer $env:GITHUB_TOKEN"
  Accept = "application/vnd.github+json"
}

$repo = "gerhecar/fwc26-predictions"
$base = "https://api.github.com/repos/$repo/issues"

$issues = @()

$issues += @{
  title = "Migrar autenticacion de Supabase Auth a sistema propio con JWT"
  body = "## Descripcion`nReemplazar Supabase Auth por un sistema de autenticacion autocontenido usando JWT y MySQL.`n`n## Cambios realizados`n- src/lib/auth/auth.ts - Funciones: signUp, signIn, signOut, getCurrentUser, verifySession`n- src/lib/auth/config.ts - Constantes de configuracion`n- src/lib/auth/middleware.ts - Middleware JWT (Edge Runtime, sin BD)`n- src/lib/auth/client.ts - Cliente browser para auth via API`n- src/app/api/auth/ - API routes REST`n- Dependencias: bcryptjs, jose`n- Login acepta email o nombre de usuario`n- Sesiones JWT con expiracion a 30 dias"
  labels = @("enhancement", "auth")
}

$issues += @{
  title = "Migrar base de datos de Supabase PostgreSQL a MySQL local"
  body = "## Descripcion`nReemplazar Supabase PostgreSQL por MySQL corriendo en contenedor Docker local.`n`n## Cambios realizados`n- docker-compose.yml - Contenedor MySQL 8.0`n- scripts/schema.sql - Schema MySQL`n- scripts/migrate.js - Script de migracion`n- scripts/seed.js - Seed data: torneo, 48 equipos, 12 grupos`n- src/lib/db/pool.ts - Connection pool MySQL`n- .env.local - Configuracion MySQL`n`n## Notas`n- La tabla sessions se creo pero no se usa (reemplazada por JWT)`n- Los UUIDs se generan con crypto.randomUUID()`n- Los campos JSON se almacenan como TEXT y se parsean manualmente"
  labels = @("enhancement", "database")
}

$issues += @{
  title = "Migrar consultas de Supabase client a SQL directo con mysql2"
  body = "## Descripcion`nReemplazar todas las consultas supabase.from().select() por SQL directo con mysql2.`n`n## Archivos modificados`n- src/lib/groups/queries.ts`n- src/lib/groups/actions/group-actions.ts`n- src/lib/bracket/actions/save-picks.ts`n- src/lib/scoring/actions.ts`n- src/lib/predictions/actions.ts`n`n## Cambios clave`n- Joins con alias u.display_name en lugar de profiles(*)`n- Counts con SELECT COUNT(*)`n- JSON fields: JSON.parse al leer, JSON.stringify al escribir`n- UPDATE con pool.execute() parametrizado"
  labels = @("enhancement", "database")
}

$issues += @{
  title = "Migrar paginas servidor de Supabase a MySQL + Auth propio"
  body = "## Descripcion`nReemplazar createClient() de Supabase por getCurrentUser() + getPool() en paginas servidor.`n`n## Archivos modificados`n- src/app/dashboard/page.tsx`n- src/app/profile/page.tsx`n- src/app/admin/page.tsx`n- src/app/admin/results/page.tsx`n- src/app/bracket/page.tsx`n- src/app/rankings/page.tsx`n- src/app/groups/manage/page.tsx`n`n## Cambios clave`n- supabase.auth.getUser() - getCurrentUser() (JWT)`n- supabase.from().select() - pool.execute()`n- Middleware actualizado para usar JWT`n- Carpeta src/lib/supabase/ eliminada`n- Dependencias @supabase/ssr y @supabase/supabase-js eliminadas"
  labels = @("enhancement", "pages")
}

$issues += @{
  title = "Migrar componentes cliente de Supabase a server actions"
  body = "## Descripcion`nLos componentes cliente ya no pueden usar supabase directamente. Se crearon server actions.`n`n## Archivos modificados`n- src/app/groups/group-predictions-content.tsx`n- src/components/groups/third-place-selection.tsx`n- src/components/rankings/rankings-view.tsx`n`n## Cambios clave`n- Consultas a BD desde browser pasan por server actions`n- Auth desde browser usa @/lib/auth/client.ts`n- No mas supabase.auth.getUser() desde el cliente"
  labels = @("enhancement", "components")
}

$issues += @{
  title = "Configurar Docker y script de inicializacion de BD"
  body = "## Descripcion`nConfiguracion del entorno MySQL local con Docker.`n`n## Cambios realizados`n- docker-compose.yml - MySQL 8.0`n- npm run db:migrate - Crea tablas`n- npm run db:seed - Poblacion inicial`n- npm run db:setup - Ambos`n`n## Seed data`n- Admin user: admin@fwc26.com / Florendiversion`n- Torneo: FIFA World Cup 2026 (activo)`n- 48 equipos en 12 grupos (A-L)`n- Scoring config inicial"
  labels = @("enhancement", "devops")
}

foreach ($issue in $issues) {
  $bodyJson = $issue | ConvertTo-Json
  try {
    $result = Invoke-RestMethod -Uri $base -Method POST -Headers $headers -Body $bodyJson -ContentType "application/json"
    Write-Host "OK $($result.html_url) - $($result.title)"
  } catch {
    Write-Host "FAIL $($issue.title): $_"
  }
}
