export interface Stat {
  label: string;
  value: number;
  emphasize?: boolean;
}

export interface StatRowProps {
  stats: Stat[];
}

export function StatRow({ stats }: StatRowProps) {
  return (
    <div className="stat-row">
      {stats.map((stat) => (
        <div className="stat-card" key={stat.label}>
          <span className={`stat-card__value${stat.emphasize ? ' stat-card__value--new' : ''}`}>{stat.value}</span>
          <span className="stat-card__label">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
