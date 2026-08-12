import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatRow } from './StatRow';

const meta = {
  title: 'Dashboard/StatRow',
  component: StatRow,
} satisfies Meta<typeof StatRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    stats: [
      { label: 'Open roles', value: 14 },
      { label: 'New today', value: 0 },
      { label: 'Departments', value: 6 },
      { label: 'Removed', value: 0 },
    ],
  },
};

export const NewJobsHighlighted: Story = {
  args: {
    stats: [
      { label: 'Open roles', value: 14 },
      { label: 'New today', value: 2, tone: 'highlight' },
      { label: 'Departments', value: 6 },
      { label: 'Removed', value: 0 },
    ],
  },
};

export const BuildStats: Story = {
  args: {
    stats: [
      { label: 'Builds tracked', value: 9 },
      { label: 'Passed', value: 7, tone: 'good' },
      { label: 'Failed', value: 2, tone: 'bad' },
      { label: 'Changes flagged', value: 3, tone: 'highlight' },
    ],
  },
};

export const CheckStatsWithSuffix: Story = {
  args: {
    stats: [
      { label: 'Checks tracked', value: 24 },
      { label: 'Errors', value: 1, tone: 'bad' },
      { label: 'Error rate', value: 4, suffix: '%', tone: 'bad' },
      { label: 'Total changes', value: 11, tone: 'highlight' },
    ],
  },
};

export const ZeroState: Story = {
  args: {
    stats: [
      { label: 'Open roles', value: 0 },
      { label: 'New today', value: 0 },
      { label: 'Departments', value: 0 },
      { label: 'Removed', value: 0 },
    ],
  },
};
