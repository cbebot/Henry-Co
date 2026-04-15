import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { RouteLiveRefresh } from "@henryco/ui";
import { requireAccountUser } from "@/lib/auth";
import {
  getSupportMessages,
  getSupportThreadById,
  markNotificationsReadByActionUrl,
  markNotificationsReadByReference,
  markSupportThreadRead,
} from "@/lib/account-data";
import PageHeader from "@/components/layout/PageHeader";
import SupportThreadRoom from "@/components/support/SupportThreadRoom";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ threadId: string }> };

export default async function SupportThreadPage({ params }: Props) {
  const { threadId } = await params;
  const user = await requireAccountUser();
  const thread = (await getSupportThreadById(user.id, threadId)) as Record<string, unknown> | null;

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
  await Promise.all([
    markNotificationsReadByReference(user.id, "support_thread", threadId),
    markNotificationsReadByActionUrl(user.id, `/support/${threadId}`),
    markSupportThreadRead(user.id, threadId),
  ]);
  const messages = await getSupportMessages(user.id, threadId);
  const status = String(thread.status || "open");
  const subject = String(thread.subject || "Support conversation");
  const category = String(thread.category || "general");
  const isOpen = status !== "resolved" && status !== "closed";

  return (
    <div className="space-y-6 acct-fade-in">
      <RouteLiveRefresh intervalMs={10000} />
      <div className="flex items-center gap-3">
        <Link href="/support" className="acct-button-ghost rounded-xl">
          <ArrowLeft size={16} />
        </Link>
        <PageHeader
          title={subject}
          description={`${category} · ${status.replaceAll("_", " ")}`}
        />
      </div>
      <div className="rounded-2xl border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] px-4 py-3">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--acct-muted)]">What happens next</p>
        <p className="mt-1 text-sm text-[var(--acct-muted)]">
          {isOpen
            ? "Your thread is active. New replies move this queue forward and staff triage handles urgency automatically."
            : "This thread is closed. If your issue returns, open a new request so it can be triaged and tracked cleanly."}
        </p>
      </div>
      <SupportThreadRoom threadId={threadId} messages={messages} threadStatus={status} />
    </div>
  );
}
