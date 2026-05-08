import { cn } from "../../../lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("skeleton-shimmer rounded-lg", className)} />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-surface-700/60 bg-surface-900/50 p-6">
      <Skeleton className="mb-4 h-5 w-32" />
      <Skeleton className="mb-2 h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-surface-700/60 bg-surface-900/50 p-3.5">
      <Skeleton className="h-16 w-24 rounded-lg" />
      <div className="flex-1">
        <Skeleton className="mb-2 h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="text-right">
        <Skeleton className="mb-1 h-4 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}

export function PageSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4 animate-fade-in">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <ListItemSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
