# chromatic-watcher

[![Tested with Chromatic](https://img.shields.io/badge/Tested%20with-Chromatic-fc521f?logo=chromatic)](https://www.chromatic.com/builds?appId=6a7bb9300c0960c8b410b57a)

A small Render Cron Job that checks Chromatic's Ashby job board and emails when new roles appear — plus a dashboard UI for that same data, built as a Storybook component library and visually tested with Chromatic on every PR.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment variables (Render Key Value should provide `REDIS_URL`):

   - `REDIS_URL`
   - `SMTP_HOST`
   - `SMTP_PORT` (optional, default: `587`)
   - `SMTP_SECURE` (optional, default: `false`)
   - `SMTP_USER`
   - `SMTP_PASS`
   - `EMAIL_FROM`
   - `EMAIL_TO`

   > Note: Local `.env` loading is only enabled when not running on Render. Render will use only its configured environment variables.

3. Run once locally:

   ```bash
   npm start
   ```

4. Optional SMTP test email:

   ```bash
   TEST_EMAIL=true npm start
   ```

   or:

   ```bash
   npm start -- --test-email
   ```

   This sends a single test email without requiring a new job posting.

## Render Cron Job

In Render, use the `npm start` command for the cron job and provide the same environment variables.

## Dashboard

A read-only view of the same job data, built with React + Vite + TypeScript. It fetches from the watcher API below (`GET /api/watcher-state`) rather than talking to Redis directly.

```bash
npm run dev       # dashboard at http://localhost:5183, proxies /api to the watcher API
npm run build     # production build to dist/
```

For a production build, point it at the deployed API with `VITE_API_BASE_URL` (e.g. in Render's static site environment variables). Left unset, requests go to the same origin the dashboard is served from.

## Watcher API

A read-only HTTP API (`server/api.js`) that serves whatever `check-chromatic-jobs.js` last wrote to Redis — it never talks to Ashby and never writes. Deploy it as a second Render Web Service alongside the cron job, pointed at the same `REDIS_URL`.

```bash
npm run api       # API at http://localhost:8787
```

- `GET /api/watcher-state` — current jobs, what's new/removed since the last check, and a `connected` / `stale` / `error` status
- `GET /healthz` — for Render's health check

Extra environment variables (all optional):

- `PORT` (default `8787`)
- `STALE_AFTER_MINUTES` (default `120`) — how long since the last successful check before the dashboard shows "stale" instead of "connected"
- `CRON_SCHEDULE` — the cron job's actual schedule, in standard 5-field cron syntax (e.g. `0 13,21 * * *`), used to compute a real `nextRunAt`. This process can't read the cron job's schedule from Render directly, so keep it in sync by hand if the schedule ever changes. Omitted otherwise.

## Storybook & Chromatic

Every dashboard component has stories covering its states in `src/components/*.stories.tsx`.

```bash
npm run storybook         # Storybook at http://localhost:6006
npm run build-storybook   # static build to storybook-static/
npm run chromatic         # publish the current build to Chromatic
```

[`.github/workflows/chromatic.yml`](.github/workflows/chromatic.yml) publishes the Storybook build to Chromatic on every push to `main` and every pull request, and reports the visual-diff result as a PR check. It needs a `CHROMATIC_PROJECT_TOKEN` repository secret (Settings → Secrets and variables → Actions), generated when the repo is linked at [chromatic.com](https://www.chromatic.com).

## Files

- `check-chromatic-jobs.js` — fetches the Ashby Chromatic job board, diffs against Redis state, logs removed jobs, emails on new jobs, and records run metadata (`chromatic-jobs:meta`) for the API.
- `server/api.js` — read-only API that serves that Redis state to the dashboard.
- `src/` — the dashboard: `App.tsx` and `components/` (with their stories), `api.ts` for the fetch, `fixtures/jobs.ts` for Storybook-only sample data, `types.ts`, `styles.css`.
- `.storybook/` — Storybook configuration.
- `.github/workflows/chromatic.yml` — CI pipeline that publishes to Chromatic.
- `package.json` — Node.js metadata and dependencies for both the cron job and the dashboard.
- `.gitignore` — ignores `node_modules`, build output, and local secrets.
