# Deployment

This repository contains a React/Vite frontend and a Laravel API. Deploy them as separate services:

- Deploy `react/` to Vercel as a Vite project. Set the Vercel project Root Directory to `react`, Build Command to `npm run build`, and Output Directory to `dist`.
- Deploy the Laravel API as a Docker web service on a PHP-capable host (for example Render). Vercel is configured here for the static React SPA; it is not configured to run this Laravel application.
- Use Neon PostgreSQL for the Laravel database.

## Vercel frontend

Set this Vercel environment variable for Production (and Preview if needed):

```text
VITE_API_BASE_URL=https://YOUR-LARAVEL-API-HOST/api
```

The Vercel rewrite in `react/vercel.json` sends React Router paths back to the SPA entry page.

## Laravel API environment

Configure these environment variables in the PHP host. Copy the PostgreSQL values from the Neon Console's Connect dialog; do not commit credentials.

```text
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:GENERATE_A_UNIQUE_KEY
APP_URL=https://YOUR-LARAVEL-API-HOST
DB_CONNECTION=pgsql
DB_HOST=YOUR_NEON_HOST
DB_PORT=5432
DB_DATABASE=YOUR_NEON_DATABASE
DB_USERNAME=YOUR_NEON_USER
DB_PASSWORD=YOUR_NEON_PASSWORD
DB_SSLMODE=require
CORS_ALLOWED_ORIGINS=https://YOUR-VERCEL-DOMAIN
```

If Neon gives you a PostgreSQL connection URL, Laravel's PostgreSQL connection also reads `DATABASE_URL`; use it instead of separate host credentials if preferred.

Generate a unique application key locally with:

```powershell
& "C:\xamppp\php\php.exe" artisan key:generate --show
```

Set the resulting key as `APP_KEY` in the backend host. Never use a development key in production.

Set the backend host's build command to install PHP dependencies using the repository Dockerfile, then run this once per deployment after configuring the production environment:

```sh
php artisan migrate --force
```

Do not run `migrate:fresh` against a production database. The default database seeder intentionally does not create a production admin unless `ADMIN_PASSWORD` is explicitly configured. Create the first admin with a strong unique password, and remove that environment variable after the one-time seed.

## GitHub

Before pushing, confirm `.env` is ignored and only example environment files are included. Do not commit Neon credentials, `APP_KEY`, access tokens, uploaded files, `vendor/`, or `node_modules/`.
