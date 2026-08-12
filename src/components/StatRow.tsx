export interface Stat {
  label: string;
  value: number;
  // Appended after the value as-is, e.g. suffix="%" for a rate stat.
  suffix?: string;
  // 'highlight' = eye-catching but not inherently bad (e.g. new jobs to review).
  // 'good' / 'bad' = actual semantic outcomes (e.g. passed/failed builds).
  tone?: 'highlight' | 'good' | 'bad';
}

export interface StatRowProps {
  stats: Stat[];
}

export function StatRow({ stats }: StatRowProps) {
  return (
    <div className="stat-row">
      {stats.map((stat) => (
        <div className="stat-card" key={stat.label}>
          <span className={`stat-card__value${stat.tone ? ` stat-card__value--${stat.tone}` : ''}`}>
            {stat.value}
            {stat.suffix ?? ''}
          </span>
          <span className="stat-card__label">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
