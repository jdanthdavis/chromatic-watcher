# chromatic-watcher

A small Render Cron Job project that checks Chromatic's Ashby job board and emails when new roles appear.

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

## Files

- `check-chromatic-jobs.js` — fetches the Ashby Chromatic job board, diffs against Redis state, logs removed jobs, and emails on new jobs.
- `package.json` — Node.js metadata and dependencies.
- `.gitignore` — ignores `node_modules` and local secrets.
