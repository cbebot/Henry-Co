import Link from "next/link";
import { ArrowRight, CreditCard, FileCheck2, MessageSquare } from "lucide-react";
import { formatKobo, relativeTime, shortDate } from "@/lib/portal/helpers";
import type { AttentionItem } from "@/types/portal";

export function AttentionStrip({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) return null;

  return (
    <section aria-label="Items needing attention" className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold tracking-[-0.01em] text-[var(--studio-ink)]">
          Needs your attention
        </h2>
        <span className="text-[11.5px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
          {items.length} open
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <AttentionCard key={`${item.kind}-${index}`} item={item} />
        ))}
      </div>
    </section>
  );
}

function AttentionCard({ item }: { item: AttentionItem }) {
  if (item.kind === "invoice") {
    const invoice = item.invoice;
    const tone = invoice.status === "overdue" ? "danger" : "warn";
    const href = invoice.invoiceToken
      ? `/payment?invoice=${invoice.invoiceToken}`
      : `/client/payment/${invoice.id}`;

    return (
      <article className="portal-attention-card" data-tone={tone}>
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
          <CreditCard className="h-3.5 w-3.5" />
          Outstanding invoice
        </div>
        <div className="mt-2 text-base font-semibold tracking-[-0.01em] text-[var(--studio-ink)]">
          {formatKobo(invoice.amountKobo, invoice.currency)}
        </div>
        <div className="mt-1 text-[12.5px] text-[var(--studio-ink-soft)]">
          {invoice.description || item.projectTitle}
          {invoice.dueDate ? ` · Due ${shortDate(invoice.dueDate)}` : null}
        </div>
        <Link
          href={href}
          className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--studio-signal)] hover:underline"
        >
          Pay now
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </article>
    );
  }

  if (item.kind === "deliverable") {
    return (
      <article className="portal-attention-card">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
          <FileCheck2 className="h-3.5 w-3.5" />
          Awaiting your review
        </div>
        <div className="mt-2 text-base font-semibold tracking-[-0.01em] text-[var(--studio-ink)]">
          {item.deliverable.title}
        </div>
        <div className="mt-1 text-[12.5px] text-[var(--studio-ink-soft)]">
          {item.projectTitle} · shared {relativeTime(item.deliverable.sharedAt || item.deliverable.createdAt)}
        </div>
        <Link
          href={`/client/projects/${item.deliverable.projectId}?tab=files`}
          className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--studio-signal)] hover:underline"
        >
          Review and approve
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </article>
    );
  }

  return (
    <article className="portal-attention-card">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
        <MessageSquare className="h-3.5 w-3.5" />
        Unread message
      </div>
      <div className="mt-2 text-base font-semibold tracking-[-0.01em] text-[var(--studio-ink)]">
        {item.message.senderName}
      </div>
      <div className="mt-1 line-clamp-2 text-[12.5px] leading-5 text-[var(--studio-ink-soft)]">
        {item.message.body}
      </div>
      <Link
        href={`/client/projects/${item.message.projectId}?tab=messages`}
        className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--studio-signal)] hover:underline"
      >
        Reply
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </article>
  );
}
