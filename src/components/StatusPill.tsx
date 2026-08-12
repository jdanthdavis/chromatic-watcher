import type { WatcherStatus } from '../types';

const LABELS: Record<WatcherStatus, string> = {
  connected: 'Connected',
  stale: 'Stale',
  error: 'Error',
};

export interface StatusPillProps {
  status: WatcherStatus;
  label?: string;
}

export function StatusPill({ status, label }: StatusPillProps) {
  return <span className={`status-pill status-pill--${status}`}>{label ?? LABELS[status]}</span>;
}
