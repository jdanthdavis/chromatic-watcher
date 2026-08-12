import type { Job } from '../types';
import { JobCard } from './JobCard';

export interface DepartmentGroupProps {
  department: string;
  jobs: Job[];
  newJobIds?: Set<string>;
}

export function DepartmentGroup({ department, jobs, newJobIds }: DepartmentGroupProps) {
  return (
    <section className="department-group">
      <h2 className="department-group__heading">{department}</h2>
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} isNew={newJobIds?.has(job.id)} />
      ))}
    </section>
  );
}
