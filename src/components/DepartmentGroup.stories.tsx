import type { Meta, StoryObj } from '@storybook/react-vite';
import { DepartmentGroup } from './DepartmentGroup';
import { sampleJobs } from '../fixtures/jobs';

const meta = {
  title: 'Dashboard/DepartmentGroup',
  component: DepartmentGroup,
} satisfies Meta<typeof DepartmentGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

const engineeringJobs = sampleJobs.filter((job) => job.department === 'Engineering');
const salesJobs = sampleJobs.filter((job) => job.department === 'Sales');

export const MultipleJobs: Story = {
  args: {
    department: 'Engineering',
    jobs: engineeringJobs,
  },
};

export const SingleJob: Story = {
  args: {
    department: 'Sales',
    jobs: salesJobs,
  },
};
