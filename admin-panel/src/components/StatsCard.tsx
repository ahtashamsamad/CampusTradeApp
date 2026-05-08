interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  loading?: boolean;
}

export default function StatsCard({
  title,
  value,
  icon,
  trend,
  trendUp,
  loading,
}: StatsCardProps) {
  return (
    <div className="stats-card group">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-secondary mb-1">
            {title}
          </p>
          {loading ? (
            <div className="h-8 w-20 bg-border/30 rounded animate-pulse mt-1" />
          ) : (
            <p className="text-2xl font-bold text-white tracking-tight">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
          )}
          {trend && (
            <p
              className={`text-xs font-medium mt-1 ${
                trendUp ? "text-success" : "text-danger"
              }`}
            >
              {trendUp ? "↑" : "↓"} {trend}
            </p>
          )}
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary/25 transition-colors">
          {icon}
        </div>
      </div>
    </div>
  );
}
