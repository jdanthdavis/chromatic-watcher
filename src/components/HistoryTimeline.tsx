import type { HistoryEntry } from '../types';
import { HistoryRow } from './HistoryRow';

export interface HistoryTimelineProps {
  history: HistoryEntry[];
  limit?: number;
}

export function HistoryTimeline({ history, limit = 8 }: HistoryTimelineProps) {
  if (history.length === 0) {
    return <p className="history-row__timestamp">No checks recorded yet.</p>;
  }

  return (
    <div className="history-timeline">
      {history.slice(0, limit).map((entry) => (
        <HistoryRow key={entry.timestamp} entry={entry} />
      ))}
    </div>
  );
}
