export function PortalSkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`portal-skeleton ${className}`} aria-hidden="true" />;
}

export function PortalDashboardSkeleton() {
  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <PortalSkeletonBlock className="h-3 w-32" />
        <PortalSkeletonBlock className="h-7 w-72 max-w-full" />
        <PortalSkeletonBlock className="h-4 w-full max-w-xl" />
      </div>

      <div className="portal-card-elev space-y-4 p-6 sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <PortalSkeletonBlock className="h-3 w-24" />
            <PortalSkeletonBlock className="h-7 w-64 max-w-full" />
            <PortalSkeletonBlock className="h-4 w-full max-w-md" />
          </div>
          <PortalSkeletonBlock className="h-7 w-24" />
        </div>
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <PortalSkeletonBlock key={index} className="h-20" />
          ))}
        </div>
        <div className="flex gap-2">
          <PortalSkeletonBlock className="h-11 w-32" />
          <PortalSkeletonBlock className="h-11 w-40" />
        </div>
      </div>

      <div className="space-y-3">
        <PortalSkeletonBlock className="h-5 w-48" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <PortalSkeletonBlock key={index} className="h-32" />
          ))}
        </div>
      </div>

      <div className="space-y-3 pl-7">
        {Array.from({ length: 3 }).map((_, index) => (
          <PortalSkeletonBlock key={index} className="h-20" />
        ))}
      </div>
    </div>
  );
}

export function PortalListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <PortalSkeletonBlock className="h-3 w-28" />
        <PortalSkeletonBlock className="h-7 w-48" />
        <PortalSkeletonBlock className="h-4 w-full max-w-xl" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <PortalSkeletonBlock key={index} className="h-40" />
        ))}
      </div>
    </div>
  );
}

export function PortalDetailSkeleton() {
  return (
    <div className="space-y-6">
      <PortalSkeletonBlock className="h-4 w-32" />
      <div className="space-y-3">
        <PortalSkeletonBlock className="h-3 w-24" />
        <PortalSkeletonBlock className="h-8 w-72 max-w-full" />
        <PortalSkeletonBlock className="h-4 w-full max-w-xl" />
      </div>
      <PortalSkeletonBlock className="h-12 w-full" />
      <PortalSkeletonBlock className="h-64" />
      <PortalSkeletonBlock className="h-32" />
    </div>
  );
}
