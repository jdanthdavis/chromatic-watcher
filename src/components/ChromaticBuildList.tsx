import type { ChromaticBuild } from '../types';
import { ChromaticBuildRow } from './ChromaticBuildRow';

export interface ChromaticBuildListProps {
  builds: ChromaticBuild[];
  limit?: number;
}

export function ChromaticBuildList({ builds, limit = 8 }: ChromaticBuildListProps) {
  if (builds.length === 0) {
    return <p className="history-row__timestamp">No builds recorded yet.</p>;
  }

  return (
    <div className="build-list">
      {builds.slice(0, limit).map((build) => (
        <ChromaticBuildRow key={`${build.number}-${build.receivedAt}`} build={build} />
      ))}
    </div>
  );
}
