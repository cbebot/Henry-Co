import Link from "next/link";
import { requireStudioRoles } from "@/lib/studio/auth";
import { supportNav } from "@/lib/studio/navigation";
import { getStudioSnapshot } from "@/lib/studio/store";
import {
  StudioEmptyState,
  StudioMetricCard,
  StudioWorkspaceShell,
} from "@/components/studio/workspace/shell";

export default async function SupportInboxPage() {
  await requireStudioRoles(["studio_owner", "client_success"], "/support");
  const snapshot = await getStudioSnapshot();
  const threads = snapshot.supportThreads ?? [];

  return (
    <StudioWorkspaceShell
      kicker="Support inbox"
      title="Handle Studio support threads, escalation notes, and reply pressure."
      description="Support is where client confidence is protected once the project is already moving."
      nav={supportNav("/support")}
    >
      <section className="grid gap-4 md:grid-cols-3">
        <StudioMetricCard label="Open" value={String(threads.filter((thread) => thread.status === "open").length)} hint="Threads not yet picked up by the support lane." />
        <StudioMetricCard label="Awaiting reply" value={String(threads.filter((thread) => thread.status === "awaiting_reply").length)} hint="Client messages waiting on an internal response." />
        <StudioMetricCard label="Urgent" value={String(threads.filter((thread) => thread.priority === "urgent").length)} hint="Support items needing immediate owner or PM visibility." />
      </section>

      {threads.length === 0 ? (
        <StudioEmptyState
          title="No support threads yet"
          body="Support threads created from Studio projects and account activity will appear here as they are opened."
        />
      ) : (
        <section className="studio-panel rounded-[1.75rem] p-6">
          <div className="studio-kicker">Conversation queue</div>
          <div className="mt-5 space-y-4">
            {threads.map((thread) => (
              <article key={thread.id} className="rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-[var(--studio-ink)]">{thread.subject}</h3>
                    <p className="mt-2 text-sm text-[var(--studio-ink-soft)]">
                      {thread.category} · {thread.referenceType || "general"} · {thread.referenceId || "no reference"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="rounded-full border border-[var(--studio-line)] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">
                      {thread.priority}
                    </span>
                    <span className="rounded-full border border-[var(--studio-line)] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[var(--studio-ink-soft)]">
                      {thread.status}
                    </span>
                  </div>
                </div>
                <div className="mt-5">
                  <Link href={`/support/${thread.id}`} className="studio-button-secondary rounded-full px-5 py-3 text-sm font-semibold">
                    Open thread
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </StudioWorkspaceShell>
  );
}
