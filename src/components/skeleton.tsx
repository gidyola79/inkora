export function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="aspect-[16/9] w-full animate-pulse bg-border" />
      <div className="flex flex-col gap-3 p-6">
        <div className="h-3 w-1/3 animate-pulse rounded bg-border" />
        <div className="h-5 w-4/5 animate-pulse rounded bg-border" />
        <div className="h-3 w-full animate-pulse rounded bg-border" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}