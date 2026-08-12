import type { Meta, StoryObj } from '@storybook/react-vite';
import { NewJobsSection } from './NewJobsSection';
import { sampleJobs } from '../fixtures/jobs';

const meta = {
  title: 'Dashboard/NewJobsSection',
  component: NewJobsSection,
} satisfies Meta<typeof NewJobsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OneNew: Story = {
  args: { jobs: sampleJobs.slice(0, 1) },
};

export const ManyNew: Story = {
  args: { jobs: sampleJobs.slice(0, 3) },
};

export const None: Story = {
  args: { jobs: [] },
  parameters: {
    docs: {
      description: {
        story: 'Renders nothing when there are no new jobs — this canvas is intentionally blank.',
      },
    },
  },
};
