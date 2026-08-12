import type { Job } from '../types';
import { JobCard } from './JobCard';

export interface NewJobsSectionProps {
  jobs: Job[];
}

export function NewJobsSection({ jobs }: NewJobsSectionProps) {
  if (jobs.length === 0) return null;

  return (
    <section>
      <p className="section-label">New since last check</p>
      <div className="new-jobs">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} isNew />
        ))}
      </div>
    </section>
  );
}
