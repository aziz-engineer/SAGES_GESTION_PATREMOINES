# Deployment

This repository contains a React/Vite frontend and a Laravel API. Deploy them as separate services:

- Import the repository root into Vercel. The root `vercel.json` defines the `frontend` Vite service from `react/` and routes public `/api/*` requests to the Render API.
- Deploy the Laravel API as a Docker web service on Render using the repository's `render.yaml` blueprint. It explicitly requests Render's Free instance plan. Laravel runs on Render; it is not a Vercel service.
- Use Neon PostgreSQL for the Laravel database.

## Free-tier limitations

The Render API service is configured with `plan: free`. In Render's Blueprint setup, choose the Free instance option if prompted and verify the service overview shows the Free plan before deploying; do not upgrade it. The Free service itself has no compute charge. Render documents that if you have no payment method and exceed included bandwidth or build minutes, it suspends the service or disables new builds instead of charging overages. A Free web service may sleep after 15 minutes without traffic, causing the first request after sleep to take about a minute, and its local filesystem is temporary. Use external persistent storage for user uploads; do not rely on files in the service container surviving restarts or deploys.

The database is separate from the Render web-service plan. This configuration expects PostgreSQL credentials such as a Neon database; check that provider's current free-tier limits and avoid putting database credentials in Git. Render's own Free Postgres has its own storage and expiration limitations, so it is not configured by this Blueprint.

## Deployment order

1. Push the repository to GitHub and import it into Render as a Blueprint. Set the required `sync: false` environment values in Render, including the Neon connection details, a production `APP_KEY`, the Render API URL for `APP_URL`, and the Vercel site URL for `CORS_ALLOWED_ORIGINS`.
2. Deploy the Render API and run `php artisan migrate --force` once the production database is configured. Do not run `migrate:fresh` against a production database.
3. The root `vercel.json` proxies `/api/*` to `https://sages-api.onrender.com`, the Render service URL. Import the repository root into Vercel as a single project and deploy it. Vercel builds the `frontend` service from `react/`; all other paths go to the React SPA.

The React app uses the same-origin `/api` path, so it needs no `VITE_API_BASE_URL` setting on Vercel. The Vite dev server proxies `/api` to a local Laravel server at `http://127.0.0.1:8000`.

The Laravel API is an external Render service, not a Vercel service. Therefore this configuration has no Vercel service binding: browser requests use the public `/api/*` rewrite, while bindings are for server-side calls between Vercel services.

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
