import type { HistoryEntry } from '../types';
import { formatRelativeTime, summarizeHistoryEntry } from '../utils';

export interface HistoryRowProps {
  entry: HistoryEntry;
}

export function HistoryRow({ entry }: HistoryRowProps) {
  return (
    <div className={`history-row history-row--${entry.status}`}>
      <span className="history-row__dot" aria-hidden="true" />
      <div className="history-row__body">
        <p className="history-row__summary">{summarizeHistoryEntry(entry)}</p>
        <p className="history-row__timestamp">{formatRelativeTime(entry.timestamp)}</p>
      </div>
    </div>
  );
}
