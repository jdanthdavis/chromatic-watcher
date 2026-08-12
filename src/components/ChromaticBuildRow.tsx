import type { ChromaticBuild } from '../types';
import { formatRelativeTime } from '../utils';

export interface ChromaticBuildRowProps {
  build: ChromaticBuild;
}

function resultVariant(result: string | null): 'success' | 'failure' | 'neutral' {
  if (result === 'SUCCESS') return 'success';
  if (result === 'FAILURE') return 'failure';
  return 'neutral';
}

export function ChromaticBuildRow({ build }: ChromaticBuildRowProps) {
  const variant = resultVariant(build.result);
  const label = build.result ?? build.status ?? 'Unknown';

  return (
    <article className="build-card">
      <div className="build-card__row1">
        <span className={`build-badge build-badge--${variant}`}>{label}</span>
        {build.webUrl ? (
          <a className="build-card__title" href={build.webUrl} target="_blank" rel="noreferrer">
            Build #{build.number ?? '?'}
          </a>
        ) : (
          <span className="build-card__title">Build #{build.number ?? '?'}</span>
        )}
        {build.branch && <span className="tag">{build.branch}</span>}
      </div>
      <p className="build-card__stats">
        {build.changeCount} change{build.changeCount === 1 ? '' : 's'} · {build.componentCount} component
        {build.componentCount === 1 ? '' : 's'} · {build.specCount} snapshot{build.specCount === 1 ? '' : 's'}
      </p>
      <p className="history-row__timestamp">{formatRelativeTime(build.receivedAt)}</p>
    </article>
  );
}
