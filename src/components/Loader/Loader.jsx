import { cn } from "../../utils/cn";

export default function Loader({ className, label = "Loading..." }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-16", className)} role="status">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-slate-200 border-t-brand-600" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-200/80", className)} />;
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 p-6 lg:p-8">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-80" />
    </div>
  );
}
