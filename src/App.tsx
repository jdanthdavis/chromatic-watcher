import { useMemo, useState } from 'react';
import { AppHeader } from './components/AppHeader';
import { StatRow, type Stat } from './components/StatRow';
import { NewJobsSection } from './components/NewJobsSection';
import { DepartmentGroup } from './components/DepartmentGroup';
import { EmptyState } from './components/EmptyState';
import { sampleWatcherState } from './fixtures/jobs';
import { formatRelativeTime } from './utils';
import type { Job } from './types';

function groupByDepartment(jobs: Job[]): Map<string, Job[]> {
  const groups = new Map<string, Job[]>();
  for (const job of jobs) {
    const key = job.department ?? job.team ?? 'General';
    const existing = groups.get(key) ?? [];
    existing.push(job);
    groups.set(key, existing);
  }
  return new Map([...groups.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

export function App() {
  const [state] = useState(sampleWatcherState);
  const [checking, setChecking] = useState(false);

  const newJobIds = useMemo(() => new Set(state.newJobIds), [state.newJobIds]);
  const newJobs = useMemo(() => state.jobs.filter((job) => newJobIds.has(job.id)), [state.jobs, newJobIds]);
  const remainingJobs = useMemo(() => state.jobs.filter((job) => !newJobIds.has(job.id)), [state.jobs, newJobIds]);
  const remainingByDepartment = useMemo(() => groupByDepartment(remainingJobs), [remainingJobs]);

  const departmentCount = useMemo(() => groupByDepartment(state.jobs).size, [state.jobs]);

  const stats: Stat[] = [
    { label: 'Open roles', value: state.jobs.length },
    { label: 'New today', value: newJobs.length, emphasize: newJobs.length > 0 },
    { label: 'Departments', value: departmentCount },
    { label: 'Removed', value: state.removedCount },
  ];

  function handleCheckNow() {
    setChecking(true);
    // Phase 1: fixtures only — Phase 3 wires this to the live read API.
    window.setTimeout(() => setChecking(false), 900);
  }

  return (
    <div className="app-shell">
      <AppHeader
        status={state.status}
        lastCheckedLabel={`Last checked ${formatRelativeTime(state.lastCheckedAt)}`}
        nextRunLabel={state.nextRunAt ? `next run ${formatRelativeTime(state.nextRunAt)}` : ''}
        checking={checking}
        onCheckNow={handleCheckNow}
      />

      <StatRow stats={stats} />

      <NewJobsSection jobs={newJobs} />

      {state.jobs.length === 0 ? (
        <EmptyState />
      ) : (
        [...remainingByDepartment.entries()].map(([department, jobs]) => (
          <DepartmentGroup key={department} department={department} jobs={jobs} />
        ))
      )}
    </div>
  );
}
