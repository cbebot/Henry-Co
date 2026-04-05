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
      <SupportThreadRoom threadId={threadId} messages={messages} threadStatus={String(thread.status)} />
    </div>
  );
}
