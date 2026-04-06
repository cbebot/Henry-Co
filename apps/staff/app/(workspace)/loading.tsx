export default function WorkspaceLoading() {
  return (
    <div className="staff-fade-in">
      <div className="mb-8">
        <div className="mb-2 h-3 w-20 animate-pulse rounded-md bg-[var(--staff-surface)]" />
        <div className="h-8 w-64 animate-pulse rounded-lg bg-[var(--staff-surface)]" />
        <div className="mt-2 h-4 w-96 animate-pulse rounded-md bg-[var(--staff-surface)]" />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-4 rounded-3xl border border-[var(--staff-line)] bg-[var(--staff-bg-elevated)] p-5"
          >
            <div className="h-11 w-11 animate-pulse rounded-xl bg-[var(--staff-surface)]" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-20 animate-pulse rounded bg-[var(--staff-surface)]" />
              <div className="h-7 w-12 animate-pulse rounded bg-[var(--staff-surface)]" />
              <div className="h-3 w-28 animate-pulse rounded bg-[var(--staff-surface)]" />
            </div>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <div className="mb-4 h-3 w-28 animate-pulse rounded bg-[var(--staff-surface)]" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] p-4"
            >
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 animate-pulse rounded-xl bg-[var(--staff-line)]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 animate-pulse rounded bg-[var(--staff-line)]" />
                  <div className="h-3 w-36 animate-pulse rounded bg-[var(--staff-line)]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-[var(--staff-line)] bg-[var(--staff-bg-elevated)] p-6">
        <div className="mb-4 h-4 w-32 animate-pulse rounded bg-[var(--staff-surface)]" />
        <div className="flex items-center justify-center py-12">
          <div className="h-4 w-64 animate-pulse rounded bg-[var(--staff-surface)]" />
        </div>
      </div>
    </div>
  );
}
