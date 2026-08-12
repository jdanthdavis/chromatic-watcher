import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppHeader } from './AppHeader';

const meta = {
  title: 'Dashboard/AppHeader',
  component: AppHeader,
} satisfies Meta<typeof AppHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Connected: Story = {
  args: {
    status: 'connected',
    lastCheckedLabel: 'Last checked 6 minutes ago',
    nextRunLabel: 'next run in 54 minutes',
  },
};

export const Checking: Story = {
  args: {
    ...Connected.args,
    checking: true,
  },
};

export const Stale: Story = {
  args: {
    status: 'stale',
    lastCheckedLabel: 'Last checked 3 hours ago',
    nextRunLabel: 'next run overdue',
  },
};

export const ErrorState: Story = {
  args: {
    status: 'error',
    lastCheckedLabel: 'Last checked 9 hours ago',
    nextRunLabel: '',
  },
};
