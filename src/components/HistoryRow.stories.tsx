import type { Meta, StoryObj } from '@storybook/react-vite';
import { HistoryRow } from './HistoryRow';
import type { HistoryEntry } from '../types';

const meta = {
  title: 'Dashboard/HistoryRow',
  component: HistoryRow,
} satisfies Meta<typeof HistoryRow>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseEntry: HistoryEntry = {
  timestamp: '2026-08-11T21:00:00.000Z',
  status: 'no-change',
  jobCount: 14,
  newCount: 0,
  removedCount: 0,
  error: null,
};

export const Baseline: Story = {
  args: { entry: { ...baseEntry, status: 'baseline', jobCount: 12 } },
};

export const NewJobs: Story = {
  args: { entry: { ...baseEntry, status: 'new-jobs', newCount: 2 } },
};

export const RemovedJobs: Story = {
  args: { entry: { ...baseEntry, status: 'removed-jobs', removedCount: 1 } },
};

export const NoChange: Story = {
  args: { entry: baseEntry },
};

export const CheckFailed: Story = {
  args: {
    entry: {
      ...baseEntry,
      status: 'error',
      jobCount: 0,
      error: 'Failed to fetch https://api.ashbyhq.com/posting-api/job-board/chromatic: HTTP 503',
    },
  },
};
