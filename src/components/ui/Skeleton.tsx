export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-hairline/60 ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-[var(--radius-card)] border border-hairline bg-surface p-6">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-4 h-8 w-2/3" />
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-4/5" />
    </div>
  );
}

export function SkeletonPage({ rows = 2 }: { rows?: number }) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-6 py-12" aria-busy="true" aria-label="Memuat halaman">
      <div className="rounded-[var(--radius-card)] border border-hairline bg-surface p-8">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-4 h-10 w-1/2" />
        <div className="mt-6 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
