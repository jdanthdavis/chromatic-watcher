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

export const NewJobsEmphasized: Story = {
  args: {
    stats: [
      { label: 'Open roles', value: 14 },
      { label: 'New today', value: 2, emphasize: true },
      { label: 'Departments', value: 6 },
      { label: 'Removed', value: 0 },
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
