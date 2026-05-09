/* Skeleton suite — three variants matching the most common workspace
 * layouts. Hosts mount these from loading.tsx.
 *
 *   - Dashboard: greeting block, hero card, attention strip, activity rail
 *   - List:      header + grid of cards
 *   - Detail:    back-link, header, tab bar, content rail
 *
 * Pure server components — no client hooks. Animation comes from the
 * .ws-skeleton CSS class.
 */

export function WorkspaceSkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`ws-skeleton ${className}`} aria-hidden="true" />;
}

export function WorkspaceDashboardSkeleton() {
  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <WorkspaceSkeletonBlock className="h-3 w-32" />
        <WorkspaceSkeletonBlock className="h-7 w-72 max-w-full" />
        <WorkspaceSkeletonBlock className="h-4 w-full max-w-xl" />
      </div>

      <div className="ws-card-elev space-y-4 p-6 sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 min-w-0 flex-1">
            <WorkspaceSkeletonBlock className="h-3 w-24" />
            <WorkspaceSkeletonBlock className="h-6 w-2/3" />
            <WorkspaceSkeletonBlock className="h-4 w-full max-w-md" />
          </div>
          <WorkspaceSkeletonBlock className="h-6 w-20" />
        </div>
        <hr className="ws-divider" />
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <WorkspaceSkeletonBlock className="h-3 w-32" />
          <WorkspaceSkeletonBlock className="h-3 w-40" />
          <WorkspaceSkeletonBlock className="h-3 w-28" />
        </div>
        <div className="flex flex-wrap gap-2">
          <WorkspaceSkeletonBlock className="h-9 w-32" />
          <WorkspaceSkeletonBlock className="h-9 w-36" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="ws-card flex items-start gap-3 p-4">
          <WorkspaceSkeletonBlock className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <WorkspaceSkeletonBlock className="h-3 w-32" />
            <WorkspaceSkeletonBlock className="h-4 w-full max-w-xs" />
          </div>
        </div>
        <div className="ws-card flex items-start gap-3 p-4">
          <WorkspaceSkeletonBlock className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <WorkspaceSkeletonBlock className="h-3 w-24" />
            <WorkspaceSkeletonBlock className="h-4 w-full max-w-xs" />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <WorkspaceSkeletonBlock className="h-4 w-40" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="ws-card p-4">
            <WorkspaceSkeletonBlock className="h-3 w-1/3" />
            <WorkspaceSkeletonBlock className="mt-2 h-4 w-full max-w-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function WorkspaceListSkeleton() {
  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <WorkspaceSkeletonBlock className="h-3 w-32" />
        <WorkspaceSkeletonBlock className="h-7 w-56 max-w-full" />
        <WorkspaceSkeletonBlock className="h-4 w-full max-w-xl" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="ws-card flex flex-col gap-3 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5 min-w-0 flex-1">
                <WorkspaceSkeletonBlock className="h-4 w-3/4" />
                <WorkspaceSkeletonBlock className="h-3 w-full max-w-xs" />
              </div>
              <WorkspaceSkeletonBlock className="h-5 w-16" />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <WorkspaceSkeletonBlock className="h-3 w-24" />
              <WorkspaceSkeletonBlock className="h-3 w-20" />
              <WorkspaceSkeletonBlock className="h-3 w-28" />
            </div>
            <WorkspaceSkeletonBlock className="h-3 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function WorkspaceDetailSkeleton() {
  return (
    <div className="space-y-6">
      <WorkspaceSkeletonBlock className="h-3 w-24" />

      <div className="space-y-2">
        <WorkspaceSkeletonBlock className="h-3 w-32" />
        <WorkspaceSkeletonBlock className="h-7 w-2/3 max-w-full" />
        <WorkspaceSkeletonBlock className="h-4 w-full max-w-xl" />
      </div>

      <div className="flex flex-wrap gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <WorkspaceSkeletonBlock key={i} className="h-9 w-24" />
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <div className="ws-card-elev p-5 sm:p-7 space-y-3">
            <WorkspaceSkeletonBlock className="h-4 w-40" />
            <WorkspaceSkeletonBlock className="h-3 w-full" />
            <WorkspaceSkeletonBlock className="h-3 w-full" />
            <WorkspaceSkeletonBlock className="h-3 w-3/4" />
          </div>
          <div className="ws-card p-5 sm:p-6 space-y-3">
            <WorkspaceSkeletonBlock className="h-4 w-44" />
            <div className="flex gap-2">
              {[0, 1, 2, 3].map((i) => (
                <WorkspaceSkeletonBlock key={i} className="h-12 flex-1" />
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="ws-card p-5 space-y-3">
            <WorkspaceSkeletonBlock className="h-4 w-32" />
            {[0, 1, 2].map((i) => (
              <WorkspaceSkeletonBlock key={i} className="h-3 w-full" />
            ))}
          </div>
          <div className="ws-card p-5 space-y-2">
            <WorkspaceSkeletonBlock className="h-4 w-28" />
            {[0, 1, 2].map((i) => (
              <WorkspaceSkeletonBlock key={i} className="h-9 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
