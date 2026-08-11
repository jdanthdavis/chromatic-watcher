const isRender = Boolean(process.env.RENDER || process.env.RENDER_SERVICE_ID);
if (!isRender) {
  require('dotenv').config();
}

const https = require('https');
const { createClient } = require('redis');
const nodemailer = require('nodemailer');

const ASHBY_API_URL = 'https://api.ashbyhq.com/posting-api/job-board/chromatic';
const REDIS_KEY = 'chromatic-jobs';
const args = process.argv.slice(2);
const {
  REDIS_URL,
  SMTP_HOST,
  SMTP_PORT = '587',
  SMTP_SECURE = 'false',
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM,
  EMAIL_TO,
  TEST_EMAIL,
} = process.env;
const TEST_EMAIL_MODE = TEST_EMAIL === 'true' || args.includes('--test-email');

function timeStamp() {
  return new Date().toISOString();
}

function logInfo(message) {
  console.log(`[INFO] ${timeStamp()} ${message}`);
}

function logSuccess(message) {
  console.log(`[SUCCESS] ${timeStamp()} ${message}`);
}

function logError(message, error) {
  console.error(`[ERROR] ${timeStamp()} ${message}`);
  if (error) {
    console.error(error.stack || error);
  }
}

process.on('uncaughtException', (error) => {
  logError('Uncaught exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logError('Unhandled rejection', reason instanceof Error ? reason : new Error(String(reason)));
  process.exit(1);
});

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            return reject(new Error(`Failed to fetch ${url}: HTTP ${res.statusCode}`));
          }

          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(err);
          }
        });
      })
      .on('error', reject);
  });
}

function normalizeJob(raw) {
  return {
    id: raw.id,
    title: raw.title,
    department: raw.department,
    team: raw.team,
    location: raw.location,
    publishedAt: raw.publishedAt,
    jobUrl: raw.jobUrl,
    employmentType: raw.employmentType,
    isListed: raw.isListed,
  };
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatPublishedAt(publishedAt) {
  if (!publishedAt) return 'Unknown posting date';
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) return publishedAt;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatJobText(job) {
  const dateText = formatPublishedAt(job.publishedAt);
  return `- ${job.title} (${job.department || 'No department'})\n  ${job.location || 'No location'}\n  Posted: ${dateText}\n  ${job.jobUrl}`;
}

function formatJobHtml(job, highlight = false) {
  const title = highlight ? `<strong>New Job: ${escapeHtml(job.title)}</strong>` : escapeHtml(job.title);
  const dateText = escapeHtml(formatPublishedAt(job.publishedAt));
  return `<li>${title}<br>${escapeHtml(job.department || 'No department')}<br>${escapeHtml(job.location || 'No location')}<br>Posted: ${dateText}<br><a href="${escapeHtml(job.jobUrl)}">${escapeHtml(job.jobUrl)}</a></li>`;
}

function buildJobEmail(currentJobs, newJobs) {
  const newIds = new Set(newJobs.map((job) => job.id));

  const newJobsText = newJobs.length
    ? `New job(s):\n${newJobs.map((job) => formatJobText(job)).join('\n\n')}\n\n`
    : 'No new jobs detected.\n\n';

  const allJobsText = `All current jobs:\n${currentJobs.map((job) => formatJobText(job)).join('\n\n')}\n\n`;
  const footerText = `Check the job board: ${ASHBY_API_URL}`;

  const newJobsHtml = newJobs.length
    ? `<p><strong>New job(s):</strong></p><ul>${newJobs.map((job) => formatJobHtml(job, true)).join('')}</ul>`
    : `<p><strong>No new jobs detected.</strong></p>`;

  const allJobsHtml = `<p><strong>All current jobs:</strong></p><ul>${currentJobs.map((job) => formatJobHtml(job, newIds.has(job.id))).join('')}</ul>`;
  const footerHtml = `<p>Check the job board: <a href="${ASHBY_API_URL}">${ASHBY_API_URL}</a></p>`;

  return {
    text: `Chromatic Job Watcher status:\n\n${newJobsText}${allJobsText}${footerText}`,
    html: `<html><body><p>Chromatic Job Watcher status:</p>${newJobsHtml}${allJobsHtml}${footerHtml}</body></html>`,
  };
}

async function sendEmail(subject, text, html) {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !EMAIL_FROM || !EMAIL_TO) {
    throw new Error('Missing SMTP or email environment variables. Set SMTP_HOST, SMTP_USER, SMTP_PASS, EMAIL_FROM, and EMAIL_TO.');
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE.toLowerCase() === 'true',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: EMAIL_FROM,
    to: EMAIL_TO,
    subject,
    text,
    html,
  });

  logSuccess(`Email sent: ${info.messageId || '(no messageId)'}`);
}

async function sendJobsEmail(currentJobs, newJobs) {
  const subject = newJobs.length
    ? `Chromatic Watcher Report: ${newJobs.length} new job(s)`
    : 'Chromatic Watcher Report';
  const { text, html } = buildJobEmail(currentJobs, newJobs);
  await sendEmail(subject, text, html);
}

async function sendTestEmail() {
  const payload = await fetchJson(ASHBY_API_URL);
  if (!payload || !Array.isArray(payload.jobs)) {
    throw new Error('Unexpected API response while building test email.');
  }

  const currentJobs = payload.jobs.map(normalizeJob);
  const sampleNewJobs = currentJobs.length ? [currentJobs[0]] : [];
  const subject = 'Chromatic job watcher: test email';
  await sendJobsEmail(currentJobs, sampleNewJobs);
}

async function run() {
  logInfo(`Starting Chromatic watcher on ${isRender ? 'Render' : 'local'} environment`);
  if (TEST_EMAIL_MODE) {
    logInfo('TEST_EMAIL_MODE enabled; sending a single test email.');
    await sendTestEmail();
    logSuccess('Test email completed successfully.');
    return;
  }

  if (!REDIS_URL) {
    throw new Error('REDIS_URL is required.');
  }

  const redis = createClient({ url: REDIS_URL });
  redis.on('error', (err) => logError('Redis connection error', err));

  await redis.connect();
  logInfo('Connected to Redis successfully.');

  try {
    const payload = await fetchJson(ASHBY_API_URL);
    if (!payload || !Array.isArray(payload.jobs)) {
      throw new Error('Unexpected API response: missing jobs array');
    }

    const currentJobs = payload.jobs.map(normalizeJob);
    const previousRaw = await redis.get(REDIS_KEY);
    const previousJobs = previousRaw ? JSON.parse(previousRaw) : null;

    if (!previousJobs) {
      logInfo('No previous state found; storing current job board as baseline.');
      const newJobs = [];
      await sendJobsEmail(currentJobs, newJobs);
      await redis.set(REDIS_KEY, JSON.stringify(currentJobs, null, 2));
      logSuccess(`Saved ${currentJobs.length} jobs to Redis under ${REDIS_KEY}.`);
      return;
    }

    const previousIds = new Set(previousJobs.map((job) => job.id));
    const currentIds = new Set(currentJobs.map((job) => job.id));

    const newJobs = currentJobs.filter((job) => !previousIds.has(job.id));
    const removedJobs = previousJobs.filter((job) => !currentIds.has(job.id));

    if (removedJobs.length) {
      logInfo(`Removed jobs detected (${removedJobs.length}):`);
      removedJobs.forEach((job) => {
        console.log(`- ${job.title} (${job.id})`);
      });
    }

    if (newJobs.length > 0) {
      logInfo(`Detected ${newJobs.length} new job(s).`);
    } else {
      logInfo('No new jobs detected.');
    }

    await sendJobsEmail(currentJobs, newJobs);
    await redis.set(REDIS_KEY, JSON.stringify(currentJobs, null, 2));
    logSuccess('Current job state saved to Redis.');
  } finally {
    await redis.disconnect();
  }
}

run().catch((error) => {
  logError('Job watcher failed:', error);
  process.exit(1);
});
