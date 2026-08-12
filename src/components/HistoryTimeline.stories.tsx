import type { Meta, StoryObj } from '@storybook/react-vite';
import { HistoryTimeline } from './HistoryTimeline';
import type { HistoryEntry } from '../types';

const meta = {
  title: 'Dashboard/HistoryTimeline',
  component: HistoryTimeline,
} satisfies Meta<typeof HistoryTimeline>;

export default meta;
type Story = StoryObj<typeof meta>;

const history: HistoryEntry[] = [
  { timestamp: '2026-08-11T21:00:00.000Z', status: 'new-jobs', jobCount: 14, newCount: 2, removedCount: 0, error: null },
  { timestamp: '2026-08-11T13:00:00.000Z', status: 'no-change', jobCount: 12, newCount: 0, removedCount: 0, error: null },
  { timestamp: '2026-08-10T21:00:00.000Z', status: 'error', jobCount: 0, newCount: 0, removedCount: 0, error: 'Redis connection timed out' },
  { timestamp: '2026-08-10T13:00:00.000Z', status: 'removed-jobs', jobCount: 12, newCount: 0, removedCount: 1, error: null },
  { timestamp: '2026-08-09T13:00:00.000Z', status: 'baseline', jobCount: 13, newCount: 0, removedCount: 0, error: null },
];

export const RecentChecks: Story = {
  args: { history },
};

export const Empty: Story = {
  args: { history: [] },
};
