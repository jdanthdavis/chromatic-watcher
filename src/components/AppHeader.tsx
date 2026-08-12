import type { WatcherStatus } from '../types';
import { StatusPill } from './StatusPill';

export interface AppHeaderProps {
  status: WatcherStatus;
  lastCheckedLabel: string;
  nextRunLabel: string;
  checking?: boolean;
  onCheckNow?: () => void;
}

export function AppHeader({ status, lastCheckedLabel, nextRunLabel, checking, onCheckNow }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div>
        <h1 className="app-header__title">Chromatic Job Watcher</h1>
        <p className="app-header__meta">
          {lastCheckedLabel}
          {nextRunLabel ? ` · ${nextRunLabel}` : ''}
        </p>
      </div>
      <div className="app-header__actions">
        <StatusPill status={status} />
        <button className="btn" type="button" onClick={onCheckNow} disabled={checking}>
          {checking ? 'Checking…' : 'Check now'}
        </button>
      </div>
    </header>
  );
}
