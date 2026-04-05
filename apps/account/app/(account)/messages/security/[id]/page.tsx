import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Shield } from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import { getSecurityMessageBoard } from "@/lib/message-center";
import { formatDateTime } from "@/lib/format";
import PageHeader from "@/components/layout/PageHeader";

export default async function SecurityMessageBoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireAccountUser();
  const data = await getSecurityMessageBoard(user.id, id);

  if (!data) {
    notFound();
  }

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title="Security event"
        description="A deeper drill-down into one account-safety event."
        icon={Shield}
        actions={
          <Link href={data.record.relatedUrl} className="acct-button-primary rounded-xl">
            {data.record.relatedLabel} <ChevronRight size={14} />
          </Link>
        }
      />

      <section className="rounded-[2rem] border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em]"
            style={{
              backgroundColor: `${data.source.accent}18`,
              color: data.source.accent,
            }}
          >
            {data.source.label}
          </span>
          <span className="rounded-full bg-[var(--acct-red-soft)] px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-red)]">
            {data.record.riskLevel} risk
          </span>
          <span className="rounded-full bg-[var(--acct-surface)] px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">
            {data.record.category}
          </span>
        </div>

        <h2 className="mt-4 text-xl font-semibold text-[var(--acct-ink)]">{data.record.title}</h2>
        <p className="mt-2 text-sm text-[var(--acct-muted)]">
          {formatDateTime(data.record.createdAt)}
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.5rem] bg-[var(--acct-bg)] p-5">
            <p className="acct-kicker">Device summary</p>
            <p className="mt-3 text-sm leading-7 text-[var(--acct-ink)]">
              {data.record.deviceSummary}
            </p>
          </div>
          <div className="rounded-[1.5rem] bg-[var(--acct-bg)] p-5">
            <p className="acct-kicker">Location summary</p>
            <p className="mt-3 text-sm leading-7 text-[var(--acct-ink)]">
              {data.record.locationSummary}
            </p>
          </div>
          <div className="rounded-[1.5rem] bg-[var(--acct-surface)] p-5">
            <p className="acct-kicker">IP address</p>
            <p className="mt-3 text-sm leading-7 text-[var(--acct-ink)]">
              {data.record.ipAddress || "Not captured"}
            </p>
          </div>
          <div className="rounded-[1.5rem] bg-[var(--acct-surface)] p-5">
            <p className="acct-kicker">Browser string</p>
            <p className="mt-3 break-words text-sm leading-7 text-[var(--acct-ink)]">
              {data.record.userAgent || "Not captured"}
            </p>
          </div>
        </div>
      </section>

      <section className="acct-card p-5">
        <p className="acct-kicker">Related alerts</p>
        {data.history.length === 0 ? (
          <p className="mt-4 rounded-[1.3rem] bg-[var(--acct-surface)] px-4 py-5 text-sm text-[var(--acct-muted)]">
            No related security notices are attached yet.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {data.history.map((item) => (
              <Link
                key={`${item.kind}-${item.id}`}
                href={item.href}
                className="block rounded-[1.35rem] border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] px-4 py-4 transition hover:border-[var(--acct-gold)]/30 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--acct-ink)]">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--acct-muted)]">{item.body}</p>
                  </div>
                  <span className="text-[0.72rem] text-[var(--acct-muted)]">
                    {formatDateTime(item.createdAt)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
