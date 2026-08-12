import type { ChromaticBuild, HistoryEntry } from './types';

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

export function summarizeHistoryEntry(entry: HistoryEntry): string {
  switch (entry.status) {
    case 'baseline':
      return `Baseline saved — ${plural(entry.jobCount, 'job')}`;
    case 'new-jobs':
      return entry.removedCount > 0
        ? `${plural(entry.newCount, 'new job')}, ${plural(entry.removedCount, 'removed')}`
        : plural(entry.newCount, 'new job');
    case 'removed-jobs':
      return `${plural(entry.removedCount, 'job')} removed`;
    case 'no-change':
      return `No changes — ${plural(entry.jobCount, 'job')}`;
    case 'error':
      return `Check failed — ${entry.error ?? 'Unknown error'}`;
    default:
      return 'Check completed';
  }
}

// Chromatic's webhook fires once per status change (PUBLISHED, PREPARED,
// IN_PROGRESS, ACCEPTED, ...), so one build shows up as several list
// entries with the same `number`. The list is newest-first, so the first
// entry seen for a given number is its latest known status — this keeps
// just that one, so counts and the build list reflect distinct builds.
export function dedupeBuildsByNumber(builds: ChromaticBuild[]): ChromaticBuild[] {
  const seen = new Set<number | string>();
  const deduped: ChromaticBuild[] = [];
  for (const build of builds) {
    const key = build.number ?? build.receivedAt;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(build);
  }
  return deduped;
}

export function formatPublishedAt(publishedAt: string | null): string {
  if (!publishedAt) return 'Unknown posting date';
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) return publishedAt;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Handles both directions, since it's used for "last checked" (past) and
// "next run" (future) — a plain "X minutes ago" would misreport future times.
export function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return 'never';
  const then = new Date(isoString).getTime();
  if (Number.isNaN(then)) return 'unknown';

  const diffMs = Date.now() - then;
  const isPast = diffMs >= 0;
  const diffMin = Math.round(Math.abs(diffMs) / 60000);

  if (diffMin < 1) return 'just now';

  const [amount, unit] =
    diffMin < 60 ? [diffMin, 'minute'] : [Math.round(diffMin / 60), 'hour'];
  const phrase = `${amount} ${unit}${amount === 1 ? '' : 's'}`;

  return isPast ? `${phrase} ago` : `in ${phrase}`;
}
