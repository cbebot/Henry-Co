/**
 * OwnerDashboardSkeleton — the route-loading UI for the owner command center.
 *
 * Replaces the full-screen brand splash (GlobalLoader) with a modern skeleton
 * that mirrors the real shell — fixed 288px sidebar, offset main, sticky
 * topbar, a metrics row and panel grid — so a route change reads as the page
 * materializing in place, not a blocking overlay (the studio-app standard).
 *
 * Server component, zero client JS: the shimmer + reduced-motion guard are pure
 * CSS, so it paints instantly. Every colour derives from the --acct-* tokens
 * (defined in both the light and dark blocks), so it is theme-correct by
 * construction — no hardcoded surface/ink.
 */
export default function OwnerDashboardSkeleton({ label }: { label: string }) {
  return (
    <div
      className="owner-command-root min-h-screen bg-[var(--acct-bg)] text-[var(--acct-ink)]"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="owner-skel-sr">{label}</span>

      {/* Sidebar (lg+) — brand tile, search, grouped nav rows. */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[var(--owner-sidebar-width)] border-r border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4 lg:block">
        <div className="flex items-center gap-3">
          <div className="owner-skel h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-1.5">
            <div className="owner-skel h-3 w-24 rounded" />
            <div className="owner-skel h-2.5 w-16 rounded" />
          </div>
        </div>
        <div className="owner-skel mt-5 h-9 w-full rounded-lg" />
        <div className="mt-6 space-y-6">
          {[5, 4, 3].map((count, group) => (
            <div key={group} className="space-y-2.5">
              <div className="owner-skel h-2.5 w-20 rounded" />
              {Array.from({ length: count }).map((_, row) => (
                <div key={row} className="flex items-center gap-3 px-1">
                  <div className="owner-skel h-4 w-4 rounded" />
                  <div
                    className="owner-skel h-3 rounded"
                    style={{ width: `${58 + ((row * 11 + group * 7) % 34)}%` }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </aside>

      <main className="min-h-screen pt-14 lg:pt-0 lg:pl-[var(--owner-sidebar-width)]">
        {/* Sticky topbar — search + trailing controls. */}
        <div className="sticky top-0 z-20 hidden items-center gap-3 border-b border-[var(--acct-line)] bg-[var(--hc-shell-topbar-bg)] px-6 py-2 backdrop-blur-md lg:flex">
          <div className="owner-skel h-9 w-full max-w-md rounded-lg" />
          <div className="ml-auto flex items-center gap-2">
            <div className="owner-skel h-4 w-14 rounded" />
            <div className="owner-skel h-4 w-16 rounded" />
            <div className="owner-skel h-9 w-16 rounded-lg" />
          </div>
        </div>

        <div className="relative mx-auto max-w-[1680px] px-4 py-6 sm:px-6 lg:px-10 lg:py-7">
          {/* Page heading. */}
          <div className="space-y-2.5">
            <div className="owner-skel h-3 w-28 rounded" />
            <div className="owner-skel h-7 w-72 max-w-full rounded-lg" />
            <div className="owner-skel h-3 w-96 max-w-full rounded" />
          </div>

          {/* Metric row. */}
          <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-5"
              >
                <div className="owner-skel h-2.5 w-20 rounded" />
                <div className="owner-skel mt-4 h-7 w-24 rounded-lg" />
                <div className="owner-skel mt-3 h-2.5 w-28 rounded" />
              </div>
            ))}
          </div>

          {/* Panel grid — a wide primary panel + a narrower aside. */}
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-6 lg:col-span-2">
              <div className="owner-skel h-4 w-40 rounded" />
              <div className="mt-5 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="owner-skel h-9 w-9 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                      <div
                        className="owner-skel h-3 rounded"
                        style={{ width: `${64 + ((i * 13) % 30)}%` }}
                      />
                      <div className="owner-skel h-2.5 w-1/3 rounded" />
                    </div>
                    <div className="owner-skel h-5 w-14 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-6">
              <div className="owner-skel h-4 w-32 rounded" />
              <div className="mt-5 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="owner-skel h-3 w-full rounded" />
                    <div className="owner-skel h-2.5 w-2/3 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .owner-skel-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
        .owner-skel{
          --skel-base: color-mix(in srgb, var(--acct-ink) 9%, var(--acct-bg));
          --skel-hi: color-mix(in srgb, var(--acct-ink) 16%, var(--acct-bg));
          background: linear-gradient(100deg, var(--skel-base) 30%, var(--skel-hi) 50%, var(--skel-base) 70%);
          background-size: 200% 100%;
          animation: owner-skel-sweep 1.4s ease-in-out infinite;
        }
        @keyframes owner-skel-sweep{
          0%{background-position:200% 0}
          100%{background-position:-200% 0}
        }
        @media (prefers-reduced-motion: reduce){
          .owner-skel{animation:none;background:var(--skel-base)}
        }
      `}</style>
    </div>
  );
}
