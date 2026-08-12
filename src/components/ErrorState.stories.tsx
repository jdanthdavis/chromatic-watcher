import type { Meta, StoryObj } from '@storybook/react-vite';
import { ErrorState } from './ErrorState';

const meta = {
  title: 'Dashboard/ErrorState',
  component: ErrorState,
} satisfies Meta<typeof ErrorState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithRetry: Story = {
  args: {
    message: 'The Ashby job board request timed out. Try again in a moment.',
    onRetry: () => {},
  },
};

export const WithoutRetry: Story = {
  args: {
    message: 'Redis connection failed during the last scheduled run.',
  },
};
