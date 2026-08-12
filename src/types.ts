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

export interface WatcherState {
  status: WatcherStatus;
  lastCheckedAt: string | null;
  nextRunAt: string | null;
  jobs: Job[];
  newJobIds: string[];
  removedCount: number;
}
