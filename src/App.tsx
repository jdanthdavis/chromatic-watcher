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
import { dedupeBuildsByNumber, formatRelativeTime } from './utils';
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

type TabKey = 'jobs' | 'builds' | 'checks';

const TAB_LABELS: Record<TabKey, string> = {
  jobs: 'Jobs',
  builds: 'Chromatic Builds',
  checks: 'Checks',
};

interface TabBarProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
  counts: Record<TabKey, number>;
}

function TabBar({ active, onChange, counts }: TabBarProps) {
  const keys: TabKey[] = ['jobs', 'builds', 'checks'];

  return (
    <div className="tabs">
      {keys.map((key) => (
        <button
          key={key}
          type="button"
          className={`tab${active === key ? ' tab--active' : ''}`}
          onClick={() => onChange(key)}
        >
          {TAB_LABELS[key]}
          <span className="tab__count">{counts[key]}</span>
        </button>
      ))}
    </div>
  );
}

export function App() {
  const [state, setState] = useState<WatcherState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [builds, setBuilds] = useState<ChromaticBuild[]>([]);
  const [buildsError, setBuildsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('jobs');

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
    { label: 'New today', value: newJobs.length, tone: newJobs.length > 0 ? 'highlight' : undefined },
    { label: 'Departments', value: departmentCount },
    { label: 'Removed', value: state?.removedCount ?? 0 },
  ];

  // One build fires several webhook events as it progresses through
  // statuses, so raw entries overcount — dedupe to one row per build
  // before showing counts or the list itself.
  const dedupedBuilds = useMemo(() => dedupeBuildsByNumber(builds), [builds]);
  const passedBuilds = useMemo(() => dedupedBuilds.filter((build) => build.result === 'SUCCESS'), [dedupedBuilds]);
  const failedBuilds = useMemo(() => dedupedBuilds.filter((build) => build.result === 'FAILURE'), [dedupedBuilds]);
  const changedBuilds = useMemo(() => dedupedBuilds.filter((build) => build.changeCount > 0), [dedupedBuilds]);

  const buildStats: Stat[] = [
    { label: 'Builds tracked', value: dedupedBuilds.length },
    { label: 'Passed', value: passedBuilds.length, tone: passedBuilds.length > 0 ? 'good' : undefined },
    { label: 'Failed', value: failedBuilds.length, tone: failedBuilds.length > 0 ? 'bad' : undefined },
    { label: 'Changes flagged', value: changedBuilds.length, tone: changedBuilds.length > 0 ? 'highlight' : undefined },
  ];

  const historyEntries = state?.history ?? [];
  const errorChecks = useMemo(() => historyEntries.filter((entry) => entry.status === 'error'), [historyEntries]);
  const errorRate =
    historyEntries.length > 0 ? Math.round((errorChecks.length / historyEntries.length) * 100) : 0;
  const totalChangesAcrossChecks = useMemo(
    () => historyEntries.reduce((sum, entry) => sum + entry.newCount + entry.removedCount, 0),
    [historyEntries],
  );

  const checksStats: Stat[] = [
    { label: 'Checks tracked', value: historyEntries.length },
    { label: 'Errors', value: errorChecks.length, tone: errorChecks.length > 0 ? 'bad' : undefined },
    { label: 'Error rate', value: errorRate, suffix: '%', tone: errorRate > 0 ? 'bad' : 'good' },
    { label: 'Total changes', value: totalChangesAcrossChecks, tone: totalChangesAcrossChecks > 0 ? 'highlight' : undefined },
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

      <TabBar
        active={activeTab}
        onChange={setActiveTab}
        counts={{ jobs: jobs.length, builds: dedupedBuilds.length, checks: state.history.length }}
      />

      {activeTab === 'jobs' && (
        <>
          <StatRow stats={stats} />
          <NewJobsSection jobs={newJobs} />
          {jobs.length === 0 ? (
            <EmptyState />
          ) : (
            [...remainingByDepartment.entries()].map(([department, deptJobs]) => (
              <DepartmentGroup key={department} department={department} jobs={deptJobs} />
            ))
          )}
        </>
      )}

      {activeTab === 'builds' &&
        (buildsError ? (
          <p className="history-row__timestamp">Couldn't load recent Chromatic builds.</p>
        ) : (
          <>
            <StatRow stats={buildStats} />
            <ChromaticBuildList builds={dedupedBuilds} limit={20} />
          </>
        ))}

      {activeTab === 'checks' && (
        <>
          <StatRow stats={checksStats} />
          <HistoryTimeline history={state.history} limit={20} />
        </>
      )}
    </div>
  );
}
