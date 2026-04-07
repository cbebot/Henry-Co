import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { requireAccountUser } from "@/lib/auth";
import { getSupportMessages, getSupportThreads } from "@/lib/account-data";
import SupportThreadRoom from "@/components/support/SupportThreadRoom";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ threadId: string }> };

export default async function SupportThreadPage({ params }: Props) {
  const { threadId } = await params;
  const user = await requireAccountUser();
  const threads = await getSupportThreads(user.id);
  const thread = threads.find((t: Record<string, string>) => t.id === threadId);

  if (!thread) {
    return (
      <div className="acct-empty py-20">
        <p className="text-sm text-[var(--acct-muted)]">Thread not found.</p>
        <Link href="/support" className="acct-button-secondary mt-4 rounded-xl">
          Back to support
        </Link>
      </div>
    );
  }

  const messages = await getSupportMessages(threadId);
  const isOpen = thread.status !== "resolved" && thread.status !== "closed";
  return (
    <div className="space-y-6 acct-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/support" className="acct-button-ghost rounded-xl">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="acct-display text-lg">{thread.subject}</h1>
          <p className="text-xs text-[var(--acct-muted)]">
            {thread.category} &middot; {thread.status}
          </p>
        </div>
      </div>
      <div className="rounded-2xl border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] px-4 py-3">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--acct-muted)]">What happens next</p>
        <p className="mt-1 text-sm text-[var(--acct-muted)]">
          {isOpen
            ? "Your thread is active. New replies move this queue forward and staff triage handles urgency automatically."
            : "This thread is closed. If your issue returns, open a new request so it can be triaged and tracked cleanly."}
        </p>
      </div>
      <SupportThreadRoom threadId={threadId} messages={messages} threadStatus={String(thread.status)} />
    </div>
  );
}
