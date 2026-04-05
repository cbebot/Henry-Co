import type { StudioProjectUpdate } from "@/lib/studio/types";
import { formatWorkspaceDate, friendlyUpdateKind } from "@/lib/studio/project-workspace-copy";

export function ProjectProgressTimeline({ updates }: { updates: StudioProjectUpdate[] }) {
  const sorted = [...updates].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  return (
    <div className="mt-8">
      {sorted.length > 0 ? (
        <ol className="relative ms-2 border-s border-[var(--studio-line)] ps-8">
          {sorted.map((update) => (
            <li key={update.id} className="relative pb-10 last:pb-2">
              <span
                className="absolute -start-[5px] top-1.5 flex h-2.5 w-2.5 rounded-full border-2 border-[var(--studio-signal)] bg-[var(--studio-bg)]"
                aria-hidden
              />
              <div className="flex flex-wrap items-center gap-2 gap-y-1">
                <time className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--studio-ink-soft)]">
                  {formatWorkspaceDate(update.createdAt)}
                </time>
                <span className="rounded-full border border-[rgba(151,244,243,0.25)] bg-[rgba(151,244,243,0.08)] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--studio-signal)]">
                  {friendlyUpdateKind(update.kind)}
                </span>
              </div>
              <h3 className="mt-2 text-base font-semibold leading-snug text-[var(--studio-ink)]">{update.title}</h3>
              {update.summary ? (
                <p className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)] whitespace-pre-wrap">{update.summary}</p>
              ) : null}
            </li>
          ))}
        </ol>
      ) : (
        <div className="rounded-[1.5rem] border border-dashed border-[var(--studio-line)] bg-black/5 px-6 py-12 text-center">
          <p className="text-sm font-medium text-[var(--studio-ink)]">No updates yet</p>
          <p className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">
            Your project timeline will appear here once work begins. Each update includes a clear headline, timestamp, and context so you always know what moved.
          </p>
        </div>
      )}
    </div>
  );
}
