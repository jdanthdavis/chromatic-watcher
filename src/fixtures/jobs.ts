import type { HistoryEntry, Job, WatcherState } from '../types';

const sampleHistory: HistoryEntry[] = [
  { timestamp: '2026-08-11T14:32:00.000Z', status: 'new-jobs', jobCount: 8, newCount: 2, removedCount: 0, error: null },
  { timestamp: '2026-08-11T06:32:00.000Z', status: 'no-change', jobCount: 6, newCount: 0, removedCount: 0, error: null },
  { timestamp: '2026-08-10T14:32:00.000Z', status: 'no-change', jobCount: 6, newCount: 0, removedCount: 0, error: null },
  { timestamp: '2026-08-10T06:32:00.000Z', status: 'baseline', jobCount: 6, newCount: 0, removedCount: 0, error: null },
];

// Sample data only — shaped like the real Ashby payload normalizeJob() produces,
// so the dashboard can be built and Chromatic-tested without a live Redis connection.
export const sampleJobs: Job[] = [
  {
    id: 'job-staff-product-designer',
    title: 'Staff Product Designer',
    department: 'Design',
    team: 'Product Design',
    location: 'Remote - US',
    publishedAt: '2026-08-11',
    jobUrl: 'https://jobs.ashbyhq.com/chromatic/staff-product-designer',
    employmentType: 'FullTime',
    isListed: true,
  },
  {
    id: 'job-developer-advocate',
    title: 'Developer Advocate',
    department: 'Marketing',
    team: 'Developer Relations',
    location: 'Remote - North America',
    publishedAt: '2026-08-10',
    jobUrl: 'https://jobs.ashbyhq.com/chromatic/developer-advocate',
    employmentType: 'FullTime',
    isListed: true,
  },
  {
    id: 'job-senior-fullstack-engineer',
    title: 'Senior Full-Stack Engineer',
    department: 'Engineering',
    team: 'Core Platform',
    location: 'Remote - Canada',
    publishedAt: '2026-07-29',
    jobUrl: 'https://jobs.ashbyhq.com/chromatic/senior-fullstack-engineer',
    employmentType: 'FullTime',
    isListed: true,
  },
  {
    id: 'job-infra-engineer',
    title: 'Infrastructure Engineer',
    department: 'Engineering',
    team: 'Core Platform',
    location: 'Remote - US',
    publishedAt: '2026-07-22',
    jobUrl: 'https://jobs.ashbyhq.com/chromatic/infrastructure-engineer',
    employmentType: 'FullTime',
    isListed: true,
  },
  {
    id: 'job-support-engineer',
    title: 'Support Engineer',
    department: 'Customer Success',
    team: 'Support',
    location: 'Remote - Europe',
    publishedAt: '2026-07-18',
    jobUrl: 'https://jobs.ashbyhq.com/chromatic/support-engineer',
    employmentType: 'FullTime',
    isListed: true,
  },
  {
    id: 'job-product-manager',
    title: 'Product Manager, Visual Testing',
    department: 'Product',
    team: null,
    location: 'Remote - US',
    publishedAt: '2026-07-14',
    jobUrl: 'https://jobs.ashbyhq.com/chromatic/product-manager-visual-testing',
    employmentType: 'FullTime',
    isListed: true,
  },
  {
    id: 'job-account-executive',
    title: 'Account Executive',
    department: 'Sales',
    team: null,
    location: 'Remote - US',
    publishedAt: '2026-06-30',
    jobUrl: 'https://jobs.ashbyhq.com/chromatic/account-executive',
    employmentType: 'FullTime',
    isListed: true,
  },
  {
    id: 'job-frontend-engineer-intern',
    title: 'Frontend Engineer Intern',
    department: 'Engineering',
    team: 'Core Platform',
    location: 'Remote - US',
    publishedAt: '2026-06-21',
    jobUrl: 'https://jobs.ashbyhq.com/chromatic/frontend-engineer-intern',
    employmentType: 'Intern',
    isListed: true,
  },
];

export const sampleWatcherState: WatcherState = {
  status: 'connected',
  lastCheckedAt: '2026-08-11T14:32:00.000Z',
  nextRunAt: '2026-08-11T15:32:00.000Z',
  jobs: sampleJobs,
  newJobIds: ['job-staff-product-designer', 'job-developer-advocate'],
  removedCount: 0,
  history: sampleHistory,
};

export const emptyWatcherState: WatcherState = {
  status: 'connected',
  lastCheckedAt: '2026-08-11T14:32:00.000Z',
  nextRunAt: '2026-08-11T15:32:00.000Z',
  jobs: [],
  newJobIds: [],
  removedCount: 0,
  history: [],
};

export const erroredWatcherState: WatcherState = {
  status: 'error',
  lastCheckedAt: '2026-08-11T09:02:00.000Z',
  nextRunAt: null,
  jobs: [],
  newJobIds: [],
  removedCount: 0,
  history: [
    { timestamp: '2026-08-11T09:02:00.000Z', status: 'error', jobCount: 0, newCount: 0, removedCount: 0, error: 'Redis connection timed out' },
  ],
};
