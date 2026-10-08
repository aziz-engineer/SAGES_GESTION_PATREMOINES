# Deployment

This repository contains a React/Vite frontend and a Laravel API. Deploy them as separate services:

- Deploy `react/` to Vercel as a Vite project. Set the Vercel project Root Directory to `react`, Build Command to `npm run build`, and Output Directory to `dist`.
- Deploy the Laravel API as a Docker web service on Render using the repository's `render.yaml` blueprint. Vercel is configured here for the static React SPA; it is not configured to run this Laravel application.
- Use Neon PostgreSQL for the Laravel database.

## Deployment order

1. Push the repository to GitHub and import it into Render as a Blueprint. Set the required `sync: false` environment values in Render, including the Neon connection details, a production `APP_KEY`, the Render API URL for `APP_URL`, and the Vercel site URL for `CORS_ALLOWED_ORIGINS`.
2. Deploy the Render API and run `php artisan migrate --force` once the production database is configured. Do not run `migrate:fresh` against a production database.
3. Import the same GitHub repository into Vercel, set its Root Directory to `react`, and configure the frontend environment variable below with the deployed API URL, including `/api`.

## Vercel frontend

Set this Vercel environment variable for Production (and Preview if needed):

```text
VITE_API_BASE_URL=https://YOUR-LARAVEL-API-HOST/api
```

The Vercel rewrite in `react/vercel.json` sends React Router paths back to the SPA entry page. Redeploy the frontend after changing its environment variables.

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

Generate a unique application key locally from the repository root with:

```sh
php artisan key:generate --show
```

Set the resulting key as `APP_KEY` in the backend host. Never use a development key in production.

Render builds the API image from the repository Dockerfile. After configuring the production environment and database, run this once to create the database schema:

```sh
php artisan migrate --force
```

Do not run `migrate:fresh` against a production database. The default database seeder intentionally does not create a production admin unless `ADMIN_PASSWORD` is explicitly configured. Create the first admin with a strong unique password, and remove that environment variable after the one-time seed.

## GitHub

Before pushing, confirm `.env` is ignored and only example environment files are included. Do not commit Neon credentials, `APP_KEY`, access tokens, uploaded files, `vendor/`, or `node_modules/`.

The Jenkins pipeline only builds the Laravel dependencies and React frontend; it does not deploy them. Render and Vercel deploy from their GitHub integrations.
