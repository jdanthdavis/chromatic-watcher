import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppHeader } from './components/AppHeader';
import { StatRow, type Stat } from './components/StatRow';
import { NewJobsSection } from './components/NewJobsSection';
import { DepartmentGroup } from './components/DepartmentGroup';
import { EmptyState } from './components/EmptyState';
import { ErrorState } from './components/ErrorState';
import { fetchWatcherState } from './api';
import { formatRelativeTime } from './utils';
import type { Job, WatcherState } from './types';

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
  const [state, setState] = useState<WatcherState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    setRefreshing(isRefresh);
    setError(null);
    try {
      setState(await fetchWatcherState());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the job board.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const jobs = state?.jobs ?? [];
  const newJobIds = useMemo(() => new Set(state?.newJobIds ?? []), [state]);
  const newJobs = useMemo(() => jobs.filter((job) => newJobIds.has(job.id)), [jobs, newJobIds]);
  const remainingJobs = useMemo(() => jobs.filter((job) => !newJobIds.has(job.id)), [jobs, newJobIds]);
  const remainingByDepartment = useMemo(() => groupByDepartment(remainingJobs), [remainingJobs]);
  const departmentCount = useMemo(() => groupByDepartment(jobs).size, [jobs]);

  const stats: Stat[] = [
    { label: 'Open roles', value: jobs.length },
    { label: 'New today', value: newJobs.length, emphasize: newJobs.length > 0 },
    { label: 'Departments', value: departmentCount },
    { label: 'Removed', value: state?.removedCount ?? 0 },
  ];

  if (loading) {
    return (
      <div className="app-shell">
        <div className="state-block">
          <p className="state-block__title">Loading the job board…</p>
        </div>
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="app-shell">
        <ErrorState message={error ?? 'Could not load the job board.'} onRetry={() => load()} />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <AppHeader
        status={state.status}
        lastCheckedLabel={`Last checked ${formatRelativeTime(state.lastCheckedAt)}`}
        nextRunLabel={state.nextRunAt ? `next run ${formatRelativeTime(state.nextRunAt)}` : ''}
        checking={refreshing}
        onCheckNow={() => load(true)}
      />

      <StatRow stats={stats} />

      <NewJobsSection jobs={newJobs} />

      {jobs.length === 0 ? (
        <EmptyState />
      ) : (
        [...remainingByDepartment.entries()].map(([department, deptJobs]) => (
          <DepartmentGroup key={department} department={department} jobs={deptJobs} />
        ))
      )}
    </div>
  );
}
