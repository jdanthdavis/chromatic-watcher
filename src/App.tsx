import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppHeader } from './components/AppHeader';
import { StatRow, type Stat } from './components/StatRow';
import { NewJobsSection } from './components/NewJobsSection';
import { DepartmentGroup } from './components/DepartmentGroup';
import { EmptyState } from './components/EmptyState';
import { ErrorState } from './components/ErrorState';
import { HistoryTimeline } from './components/HistoryTimeline';
import { ChromaticBuildList } from './components/ChromaticBuildList';
import { fetchChromaticBuilds, fetchWatcherState } from './api';
import { formatRelativeTime } from './utils';
import type { ChromaticBuild, Job, WatcherState } from './types';

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
  const [builds, setBuilds] = useState<ChromaticBuild[]>([]);
  const [buildsError, setBuildsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // The two fetches are independent — a broken Chromatic builds panel
  // shouldn't take down the primary job-board view, and vice versa.
  const load = useCallback(async (isRefresh = false) => {
    setRefreshing(isRefresh);
    setError(null);
    setBuildsError(null);

    const [stateResult, buildsResult] = await Promise.allSettled([fetchWatcherState(), fetchChromaticBuilds()]);

    if (stateResult.status === 'fulfilled') {
      setState(stateResult.value);
    } else {
      setError(stateResult.reason instanceof Error ? stateResult.reason.message : 'Could not load the job board.');
    }

    if (buildsResult.status === 'fulfilled') {
      setBuilds(buildsResult.value);
    } else {
      setBuildsError(
        buildsResult.reason instanceof Error ? buildsResult.reason.message : 'Could not load recent Chromatic builds.',
      );
    }

    setLoading(false);
    setRefreshing(false);
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

      <p className="section-label">Recent Chromatic builds</p>
      {buildsError ? (
        <p className="history-row__timestamp">Couldn't load recent Chromatic builds.</p>
      ) : (
        <ChromaticBuildList builds={builds} />
      )}

      <p className="section-label">Recent checks</p>
      <HistoryTimeline history={state.history} />
    </div>
  );
}
