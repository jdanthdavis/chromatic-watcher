import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatusPill } from './StatusPill';

const meta = {
  title: 'Dashboard/StatusPill',
  component: StatusPill,
} satisfies Meta<typeof StatusPill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Connected: Story = {
  args: { status: 'connected' },
};

export const Stale: Story = {
  args: { status: 'stale' },
};

export const Error: Story = {
  args: { status: 'error' },
};
