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
