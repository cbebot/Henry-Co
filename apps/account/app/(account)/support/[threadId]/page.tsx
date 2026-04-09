import { ArrowLeft, Bot, Headphones, User } from "lucide-react";
import Link from "next/link";
import { requireAccountUser } from "@/lib/auth";
import { getSupportMessages, getSupportThreadById, markNotificationsReadByActionUrl, markNotificationsReadByReference } from "@/lib/account-data";
import { formatDateTime } from "@/lib/format";
import PageHeader from "@/components/layout/PageHeader";
import SupportReplyForm from "@/components/support/SupportReplyForm";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ threadId: string }> };

export default async function SupportThreadPage({ params }: Props) {
  const { threadId } = await params;
  const user = await requireAccountUser();
  const thread = await getSupportThreadById(user.id, threadId);
  if (!thread) {
    return <div className="acct-empty py-20"><p className="text-sm text-[var(--acct-muted)]">Thread not found.</p><Link href="/support" className="acct-button-secondary mt-4 rounded-xl">Back to support</Link></div>;
  }
  await Promise.all([
    markNotificationsReadByReference(user.id, "support_thread", threadId),
    markNotificationsReadByActionUrl(user.id, `/support/${threadId}`),
  ]);
  const messages = await getSupportMessages(threadId);
  const senderIcon = { customer: User, agent: Headphones, system: Bot };
  return (
    <div className="space-y-6 acct-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/support" className="acct-button-ghost rounded-xl"><ArrowLeft size={16} /></Link>
        <div><h1 className="acct-display text-lg">{thread.subject}</h1><p className="text-xs text-[var(--acct-muted)]">{thread.category} · {thread.status}</p></div>
      </div>
      <PageHeader title="Conversation" description="Opening a support thread now clears matching unread notification state. True thread unread state still needs support-schema work because the current thread/message tables do not store read markers." />
      <div className="space-y-4">
        {messages.map((message: Record<string, string>) => {
          const SenderIcon = senderIcon[message.sender_type as keyof typeof senderIcon] || User;
          const isCustomer = message.sender_type === "customer";
          return (
            <div key={message.id} className={`flex gap-3 ${isCustomer ? "flex-row-reverse" : ""}`}>
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isCustomer ? "bg-[var(--acct-gold-soft)] text-[var(--acct-gold)]" : "bg-[var(--acct-blue-soft)] text-[var(--acct-blue)]"}`}><SenderIcon size={14} /></div>
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${isCustomer ? "bg-[var(--acct-gold)] text-white" : "bg-[var(--acct-surface)] text-[var(--acct-ink)]"}`}>
                <p className="text-sm">{message.body}</p>
                <p className={`mt-1 text-[0.65rem] ${isCustomer ? "text-white/60" : "text-[var(--acct-muted)]"}`}>{formatDateTime(message.created_at)}</p>
              </div>
            </div>
          );
        })}
      </div>
      {thread.status !== "closed" ? <SupportReplyForm threadId={threadId} /> : null}
    </div>
  );
}
