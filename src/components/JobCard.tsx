import type { Job } from '../types';
import { formatPublishedAt } from '../utils';

export interface JobCardProps {
  job: Job;
  isNew?: boolean;
}

export function JobCard({ job, isNew }: JobCardProps) {
  return (
    <article className={`job-card${isNew ? ' job-card--new' : ''}`}>
      <p className="job-card__posted">Posted {formatPublishedAt(job.publishedAt)}</p>
      <div className="job-card__row">
        <a className="job-card__title" href={job.jobUrl} target="_blank" rel="noreferrer">
          {job.title}
        </a>
        {isNew && <span className="job-card__badge">NEW</span>}
      </div>
      <div className="job-card__tags">
        <span className="tag">{job.department ?? job.team ?? 'General'}</span>
        <span className="tag tag--location">{job.location ?? 'Remote'}</span>
      </div>
    </article>
  );
}
