interface Props {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className = "", style }: Props) {
  return <div className={`skeleton ${className}`} style={style} />;
}

export function CardSkeleton() {
  return (
    <div className="bg-card rounded-2xl p-5 border border-border space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-card rounded-2xl p-5 border border-border">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="h-72 flex items-end gap-2 px-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="flex-1" style={{ height: `${30 + Math.random() * 60}%` }} />
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-card rounded-2xl border border-border divide-y divide-border">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-5 w-20" />
        </div>
      ))}
    </div>
  );
}
