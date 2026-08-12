import type { Meta, StoryObj } from '@storybook/react-vite';
import { JobCard } from './JobCard';
import type { Job } from '../types';

const meta = {
  title: 'Dashboard/JobCard',
  component: JobCard,
} satisfies Meta<typeof JobCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseJob: Job = {
  id: 'job-senior-fullstack-engineer',
  title: 'Senior Full-Stack Engineer',
  department: 'Engineering',
  team: 'Core Platform',
  location: 'Remote - Canada',
  publishedAt: '2026-07-29',
  jobUrl: 'https://jobs.ashbyhq.com/chromatic/senior-fullstack-engineer',
  employmentType: 'FullTime',
  isListed: true,
};

export const Default: Story = {
  args: { job: baseJob },
};

export const New: Story = {
  args: { job: baseJob, isNew: true },
};

export const LongTitle: Story = {
  args: {
    job: {
      ...baseJob,
      id: 'job-long-title',
      title: 'Staff Software Engineer, Cross-Platform Visual Testing Infrastructure',
    },
  },
};

export const NoLocation: Story = {
  args: {
    job: { ...baseJob, id: 'job-no-location', location: null },
  },
};

export const InternRole: Story = {
  args: {
    job: {
      ...baseJob,
      id: 'job-intern',
      title: 'Frontend Engineer Intern',
      employmentType: 'Intern',
      publishedAt: null,
    },
  },
};
