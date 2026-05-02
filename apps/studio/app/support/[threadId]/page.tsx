import { notFound } from "next/navigation";
import { requireStudioRoles } from "@/lib/studio/auth";
import { supportNav } from "@/lib/studio/navigation";
import { getStudioSnapshot } from "@/lib/studio/store";
import { StudioWorkspaceShell } from "@/components/studio/workspace/shell";
import { StudioSupportReplyComposer } from "@/components/studio/support-reply-composer";

export default async function SupportThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  await requireStudioRoles(["studio_owner", "client_success"], "/support");
  const { threadId } = await params;
  const snapshot = await getStudioSnapshot();
  const thread = (snapshot.supportThreads ?? []).find((item) => item.id === threadId) ?? null;
  if (!thread) notFound();

  const messages = (snapshot.supportMessages ?? []).filter((item) => item.threadId === thread.id);

  return (
    <StudioWorkspaceShell
      kicker="Support thread"
      title={thread.subject}
      description="Reply, capture context, and move the thread back into a resolved state with a visible support history."
      nav={supportNav("/support")}
    >
      <section className="studio-panel rounded-[1.75rem] p-6">
        <div className="flex flex-wrap gap-3">
          <span className="rounded-full border border-[var(--studio-line)] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">
            {thread.priority}
          </span>
          <span className="rounded-full border border-[var(--studio-line)] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[var(--studio-ink-soft)]">
            {thread.status}
          </span>
        </div>
        <div className="mt-6 space-y-4">
          {messages.map((message) => (
            <article key={message.id} className="rounded-[1.4rem] border border-[var(--studio-line)] bg-black/10 p-4">
              <div className="text-sm font-semibold text-[var(--studio-ink)]">{message.senderType}</div>
              <p className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">{message.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="studio-panel rounded-[1.75rem] p-6">
        <div className="studio-kicker">Reply</div>
        <div className="mt-5">
          <StudioSupportReplyComposer
            threadId={thread.id}
            redirectTo={`/support/${thread.id}`}
          />
        </div>
      </section>
    </StudioWorkspaceShell>
  );
}
