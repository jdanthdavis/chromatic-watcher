const isRender = Boolean(process.env.RENDER || process.env.RENDER_SERVICE_ID);
if (!isRender) {
  require('dotenv').config();
}

const https = require('https');
const { createClient } = require('redis');
const nodemailer = require('nodemailer');

const ASHBY_API_URL = 'https://api.ashbyhq.com/posting-api/job-board/chromatic';
const REDIS_KEY = 'chromatic-jobs';
// Run metadata (last-checked time, what changed, last error) — read by the
// dashboard API (server/api.js) to show live status alongside the job list.
const META_KEY = 'chromatic-jobs:meta';
// Rolling log of past runs, newest first — powers the dashboard's history timeline.
const HISTORY_KEY = 'chromatic-jobs:history';
const HISTORY_LIMIT = 20;
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
const TEST_EMAIL_NO_NEW_MODE = args.includes('--test-email-no-new');

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

function buildEmailHtml(currentJobs, newJobs) {
  const newCount = newJobs.length;
  const headerText = newCount
    ? `${newCount} new role${newCount === 1 ? '' : 's'} at Chromatic!`
    : 'No new jobs today';
  const newIds = new Set(newJobs.map((job) => job.id));

  const groupedJobs = currentJobs.reduce((groups, job) => {
    const category = job.department || job.team || 'General';
    const key = String(category);

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(job);
    return groups;
  }, {});

  const sortedCategories = Object.keys(groupedJobs).sort((a, b) => a.localeCompare(b));

  const renderCard = (job, isNew) => {
    const title = escapeHtml(job.title || 'Untitled role');
    const url = escapeHtml(job.jobUrl || '#');
    const department = escapeHtml(job.department || job.team || 'General');
    const location = escapeHtml(job.location || 'Remote');
    const titleColor = isNew ? '#dc2626' : '#4f46e5';
    const postedDate = escapeHtml(formatPublishedAt(job.publishedAt));

    return `
            <tr>
              <td style="background:#ffffff;border:1px solid #d9dbe0;border-radius:8px;padding:20px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;color:#9ca3af;font-size:12px;line-height:16px;padding-bottom:4px;">
                      Posted ${postedDate}
                    </td>
                  </tr>
                  <tr>
                    <td style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                      <a href="${url}" style="color:${titleColor};font-size:17px;font-weight:600;text-decoration:none;">${title}</a>
                      ${isNew ? '<span style="display:inline-block;background:#ede9fe;color:#dc2626;border-radius:999px;font-size:12px;line-height:16px;padding:4px 8px;margin-left:8px;vertical-align:middle;">NEW</span>' : ''}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top:12px;">
                      <span style="display:inline-block;background:#eef2ff;color:#3730a3;border-radius:999px;font-size:12px;line-height:16px;padding:5px 10px;margin-right:8px;">${department}</span>
                      <span style="display:inline-block;background:#dcfce7;color:#166534;border-radius:999px;font-size:12px;line-height:16px;padding:5px 10px;">${location}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="line-height:16px;height:16px;font-size:16px;">&nbsp;</td>
            </tr>`;
  };

  const newJobCardsHtml = newJobs.length
    ? newJobs.map((job) => renderCard(job, true)).join('')
    : '';

  const remainingJobs = currentJobs.filter((job) => !newIds.has(job.id));
  const groupedRemainingJobs = remainingJobs.reduce((groups, job) => {
    const category = job.department || job.team || 'General';
    const key = String(category);

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(job);
    return groups;
  }, {});

  const sortedRemainingCategories = Object.keys(groupedRemainingJobs).sort((a, b) => a.localeCompare(b));

  const groupedJobsHtml = remainingJobs.length
    ? sortedRemainingCategories
        .map((category) => {
          const groupJobs = groupedRemainingJobs[category];
          const jobsHtml = groupJobs.map((job) => renderCard(job, false)).join('');

          return `
            <tr>
              <td style="padding-top:24px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <h2 style="margin:0 0 12px;font-size:16px;line-height:24px;font-weight:700;color:#0f172a;">${escapeHtml(category)}</h2>
              </td>
            </tr>
            ${jobsHtml}`;
        })
        .join('')
    : '';

  const noJobsHtml = !currentJobs.length
    ? `
            <tr>
              <td style="padding:20px 0;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;color:#64748b;font-size:14px;line-height:20px;">No current jobs are listed at this time.</td>
            </tr>`
    : '';

  const jobCardsHtml = newJobCardsHtml + groupedJobsHtml + noJobsHtml;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(headerText)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f2f4f6;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f2f4f6;width:100%;min-width:100%;">
      <tr>
        <td align="center" style="padding:20px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">
            <tr>
              <td style="padding:24px 0 12px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;text-align:left;">
                <h1 style="margin:0;font-size:20px;line-height:28px;font-weight:700;color:#0f172a;">${escapeHtml(headerText)}</h1>
                <p style="margin:8px 0 0;font-size:14px;line-height:20px;color:#64748b;">Current job opportunities at Chromatic.</p>
              </td>
            </tr>
            <tr>
              <td style="padding-top:8px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  ${jobCardsHtml}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding-top:20px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;font-size:13px;line-height:20px;color:#64748b;">
                Automated check via your Chromatic job monitor.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildJobEmail(currentJobs, newJobs) {
  const newIds = new Set(newJobs.map((job) => job.id));

  const newJobsText = newJobs.length
    ? `New job(s):\n${newJobs.map((job) => formatJobText(job)).join('\n\n')}\n\n`
    : 'No new jobs detected.\n\n';

  const allJobsText = `All current jobs:\n${currentJobs.map((job) => formatJobText(job)).join('\n\n')}\n\n`;
  const footerText = `Check the job board: ${ASHBY_API_URL}`;

  return {
    text: `Chromatic Job Watcher status:\n\n${newJobsText}${allJobsText}${footerText}`,
    html: buildEmailHtml(currentJobs, newJobs),
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

async function sendTestEmailNoNew() {
  const payload = await fetchJson(ASHBY_API_URL);
  if (!payload || !Array.isArray(payload.jobs)) {
    throw new Error('Unexpected API response while building no-new test email.');
  }

  const currentJobs = payload.jobs.map(normalizeJob);
  const sampleNewJobs = [];
  const subject = 'Chromatic job watcher: test email (no new postings)';
  await sendJobsEmail(currentJobs, sampleNewJobs);
}

async function writeMeta(redis, { newJobIds, removedCount }) {
  const meta = {
    lastCheckedAt: timeStamp(),
    newJobIds,
    removedCount,
    lastError: null,
    lastErrorAt: null,
  };
  await redis.set(META_KEY, JSON.stringify(meta));
}

async function writeErrorMeta(redis, error) {
  try {
    const existingRaw = await redis.get(META_KEY);
    const existing = existingRaw ? JSON.parse(existingRaw) : {};
    const meta = {
      ...existing,
      lastError: error instanceof Error ? error.message : String(error),
      lastErrorAt: timeStamp(),
    };
    await redis.set(META_KEY, JSON.stringify(meta));
  } catch (metaError) {
    // Best-effort only — if Redis is unreachable this write will also fail,
    // and the original error is what actually matters for the exit code.
    logError('Could not record failure metadata to Redis', metaError);
  }
}

async function pushHistory(redis, entry) {
  try {
    await redis.lPush(HISTORY_KEY, JSON.stringify({ timestamp: timeStamp(), ...entry }));
    await redis.lTrim(HISTORY_KEY, 0, HISTORY_LIMIT - 1);
  } catch (historyError) {
    // Best-effort, same reasoning as writeErrorMeta above.
    logError('Could not record run history to Redis', historyError);
  }
}

async function run() {
  logInfo(`Starting Chromatic watcher on ${isRender ? 'Render' : 'local'} environment`);
  if (TEST_EMAIL_NO_NEW_MODE) {
    logInfo('TEST_EMAIL_NO_NEW_MODE enabled; sending a single no-new test email.');
    await sendTestEmailNoNew();
    logSuccess('No-new test email completed successfully.');
    return;
  }

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
      await writeMeta(redis, { newJobIds: [], removedCount: 0 });
      await pushHistory(redis, { status: 'baseline', jobCount: currentJobs.length, newCount: 0, removedCount: 0, error: null });
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
    await writeMeta(redis, { newJobIds: newJobs.map((job) => job.id), removedCount: removedJobs.length });
    await pushHistory(redis, {
      status: newJobs.length > 0 ? 'new-jobs' : removedJobs.length > 0 ? 'removed-jobs' : 'no-change',
      jobCount: currentJobs.length,
      newCount: newJobs.length,
      removedCount: removedJobs.length,
      error: null,
    });
    logSuccess('Current job state saved to Redis.');
  } catch (error) {
    await writeErrorMeta(redis, error);
    await pushHistory(redis, {
      status: 'error',
      jobCount: 0,
      newCount: 0,
      removedCount: 0,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  } finally {
    await redis.disconnect();
  }
}

run().catch((error) => {
  logError('Job watcher failed:', error);
  process.exit(1);
});
