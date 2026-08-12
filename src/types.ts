// Mirrors the shape produced by normalizeJob() in check-chromatic-jobs.js,
// so fixtures here and the cron job's Redis payload stay interchangeable.
export interface Job {
  id: string;
  title: string;
  department: string | null;
  team: string | null;
  location: string | null;
  publishedAt: string | null;
  jobUrl: string;
  employmentType: string | null;
  isListed: boolean;
}

export type WatcherStatus = 'connected' | 'stale' | 'error';

export type HistoryStatus = 'baseline' | 'new-jobs' | 'removed-jobs' | 'no-change' | 'error';

export interface HistoryEntry {
  timestamp: string;
  status: HistoryStatus;
  jobCount: number;
  newCount: number;
  removedCount: number;
  error: string | null;
}

export interface WatcherState {
  status: WatcherStatus;
  lastCheckedAt: string | null;
  nextRunAt: string | null;
  jobs: Job[];
  newJobIds: string[];
  removedCount: number;
  history: HistoryEntry[];
}

// Pushed by Chromatic's own custom webhook on build status changes — the
// exact set of `status`/`result` values isn't fully documented, so these
// stay as plain strings rather than a closed union; components fall back
// gracefully for anything unrecognized.
export interface ChromaticBuild {
  receivedAt: string;
  number: number | null;
  branch: string | null;
  commit: string | null;
  status: string | null;
  result: string | null;
  changeCount: number;
  componentCount: number;
  specCount: number;
  storybookUrl: string | null;
  webUrl: string | null;
}
