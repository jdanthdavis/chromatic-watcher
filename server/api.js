// Read-only API for the dashboard: serves whatever check-chromatic-jobs.js
// last wrote to Redis. It never talks to Ashby itself and never writes —
// the cron job is the only thing that mutates this data.
const isRender = Boolean(process.env.RENDER || process.env.RENDER_SERVICE_ID);
if (!isRender) {
  require('dotenv').config();
}

const http = require('http');
const { createClient } = require('redis');
const cronParser = require('cron-parser');

const REDIS_KEY = 'chromatic-jobs';
const META_KEY = 'chromatic-jobs:meta';
const HISTORY_KEY = 'chromatic-jobs:history';

const {
  REDIS_URL,
  PORT = '8787',
  // How long a successful check is considered current before the dashboard
  // shows "stale" instead of "connected". Render's cron schedule isn't
  // visible to this process, so this is a generous default, not a promise.
  STALE_AFTER_MINUTES = '120',
  // Optional: the cron job's actual schedule (standard 5-field cron syntax,
  // e.g. "0 13,21 * * *"), used to compute a real next-run time. Must be
  // kept in sync with the cron job's schedule in Render by hand — there's
  // no API linkage between the two services. Leave unset to omit nextRunAt.
  CRON_SCHEDULE,
} = process.env;

if (!REDIS_URL) {
  throw new Error('REDIS_URL is required.');
}

function timeStamp() {
  return new Date().toISOString();
}

function logInfo(message) {
  console.log(`[INFO] ${timeStamp()} ${message}`);
}

function logError(message, error) {
  console.error(`[ERROR] ${timeStamp()} ${message}`);
  if (error) {
    console.error(error.stack || error);
  }
}

const redis = createClient({ url: REDIS_URL });
redis.on('error', (err) => logError('Redis connection error', err));

redis
  .connect()
  .then(() => logInfo('Connected to Redis successfully.'))
  .catch((err) => logError('Initial Redis connection failed', err));

function computeStatus(meta) {
  if (!meta) return 'error';

  const lastCheckedAt = meta.lastCheckedAt ? new Date(meta.lastCheckedAt) : null;
  const lastErrorAt = meta.lastErrorAt ? new Date(meta.lastErrorAt) : null;

  // The most recent attempt failed and no successful run has happened since.
  if (lastErrorAt && (!lastCheckedAt || lastErrorAt > lastCheckedAt)) {
    return 'error';
  }

  if (!lastCheckedAt || Number.isNaN(lastCheckedAt.getTime())) {
    return 'error';
  }

  const staleAfterMs = Number(STALE_AFTER_MINUTES) * 60_000;
  if (Date.now() - lastCheckedAt.getTime() > staleAfterMs) {
    return 'stale';
  }

  return 'connected';
}

function computeNextRunAt() {
  if (!CRON_SCHEDULE) return null;
  try {
    const interval = cronParser.parseExpression(CRON_SCHEDULE, { utc: true });
    return interval.next().toISOString();
  } catch (err) {
    logError(`Invalid CRON_SCHEDULE "${CRON_SCHEDULE}"`, err);
    return null;
  }
}

async function getWatcherState() {
  const [jobsRaw, metaRaw, historyRaw] = await Promise.all([
    redis.get(REDIS_KEY),
    redis.get(META_KEY),
    redis.lRange(HISTORY_KEY, 0, -1),
  ]);

  const jobs = jobsRaw ? JSON.parse(jobsRaw) : [];
  const meta = metaRaw ? JSON.parse(metaRaw) : null;
  const history = historyRaw.map((entry) => JSON.parse(entry));

  return {
    status: computeStatus(meta),
    lastCheckedAt: meta?.lastCheckedAt ?? null,
    nextRunAt: computeNextRunAt(),
    jobs,
    newJobIds: meta?.newJobIds ?? [],
    removedCount: meta?.removedCount ?? 0,
    history,
  };
}

function sendJson(res, statusCode, body) {
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    // Job postings are public information, so a permissive origin is fine
    // here and lets the dashboard be hosted as a separate static site.
    'Access-Control-Allow-Origin': '*',
  });
  res.end(payload);
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const { pathname } = new URL(req.url, `http://${req.headers.host}`);

  if (pathname === '/healthz') {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (pathname === '/api/watcher-state') {
    getWatcherState()
      .then((state) => sendJson(res, 200, state))
      .catch((error) => {
        logError('Failed to read watcher state from Redis', error);
        sendJson(res, 503, { error: 'Could not reach Redis.' });
      });
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
});

server.listen(Number(PORT), () => {
  logInfo(`Chromatic watcher API listening on port ${PORT}`);
});

process.on('SIGTERM', () => {
  logInfo('SIGTERM received, shutting down.');
  server.close(() => process.exit(0));
});
