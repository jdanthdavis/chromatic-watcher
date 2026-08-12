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

A read-only view of the same job data, built with React + Vite + TypeScript. It currently renders from fixtures in `src/fixtures/jobs.ts` rather than live Redis data.

```bash
npm run dev       # dashboard at http://localhost:5183
npm run build     # production build to dist/
```

## Storybook & Chromatic

Every dashboard component has stories covering its states in `src/components/*.stories.tsx`.

```bash
npm run storybook         # Storybook at http://localhost:6006
npm run build-storybook   # static build to storybook-static/
npm run chromatic         # publish the current build to Chromatic
```

[`.github/workflows/chromatic.yml`](.github/workflows/chromatic.yml) publishes the Storybook build to Chromatic on every push to `main` and every pull request, and reports the visual-diff result as a PR check. It needs a `CHROMATIC_PROJECT_TOKEN` repository secret (Settings → Secrets and variables → Actions), generated when the repo is linked at [chromatic.com](https://www.chromatic.com).

## Files

- `check-chromatic-jobs.js` — fetches the Ashby Chromatic job board, diffs against Redis state, logs removed jobs, and emails on new jobs.
- `src/` — the dashboard: `App.tsx` and `components/` (with their stories), `fixtures/jobs.ts` for sample data, `types.ts`, `styles.css`.
- `.storybook/` — Storybook configuration.
- `.github/workflows/chromatic.yml` — CI pipeline that publishes to Chromatic.
- `package.json` — Node.js metadata and dependencies for both the cron job and the dashboard.
- `.gitignore` — ignores `node_modules`, build output, and local secrets.
