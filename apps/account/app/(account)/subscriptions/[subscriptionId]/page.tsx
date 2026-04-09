import Link from "next/link";
import { ArrowLeft, ExternalLink, RefreshCcw } from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import { getSubscriptionById } from "@/lib/account-data";
import { getSubscriptionWorkspaceHref } from "@/lib/account-links";
import { divisionLabel, formatDate, formatNaira } from "@/lib/format";
import PageHeader from "@/components/layout/PageHeader";

export const dynamic = "force-dynamic";
const statusChip: Record<string, string> = { active: "acct-chip-green", paused: "acct-chip-orange", cancelled: "acct-chip-red", expired: "acct-chip-red", past_due: "acct-chip-red" };

export default async function SubscriptionDetailPage({ params }: { params: Promise<{ subscriptionId: string }> }) {
  const { subscriptionId } = await params;
  const user = await requireAccountUser();
  const subscription = (await getSubscriptionById(user.id, subscriptionId)) as Record<string, unknown> | null;
  if (!subscription) {
    return <div className="space-y-4 acct-fade-in"><Link href="/subscriptions" className="acct-button-ghost w-fit rounded-xl"><ArrowLeft size={16} /> Back to subscriptions</Link><div className="acct-empty py-20"><p className="text-sm text-[var(--acct-muted)]">Subscription not found.</p></div></div>;
  }
  const workspaceHref = getSubscriptionWorkspaceHref(typeof subscription.division === "string" ? subscription.division : null);
  return (
    <div className="space-y-6 acct-fade-in">
      <Link href="/subscriptions" className="acct-button-ghost w-fit rounded-xl"><ArrowLeft size={16} /> Back to subscriptions</Link>
      <PageHeader title={String(subscription.plan_name || "Subscription")} description="Shared ledger view. Plan management still happens in the original division workspace when that workflow exists." icon={RefreshCcw} actions={workspaceHref ? <a href={workspaceHref} target="_blank" rel="noopener noreferrer" className="acct-button-primary rounded-xl">Open division workspace <ExternalLink size={14} /></a> : undefined} />
      <div className="acct-card p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`acct-chip ${statusChip[String(subscription.status || "")] || "acct-chip-gold"}`}>{String(subscription.status || "Unknown")}</span>
          <span className="text-sm text-[var(--acct-muted)]">{divisionLabel(String(subscription.division || "service"))}</span>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-[var(--acct-surface)] p-4"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">Amount</p><p className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">{formatNaira(Number(subscription.amount_kobo || 0))}</p></div>
          <div className="rounded-2xl bg-[var(--acct-surface)] p-4"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">Billing cycle</p><p className="mt-2 text-lg font-semibold capitalize text-[var(--acct-ink)]">{String(subscription.billing_cycle || "Not set")}</p></div>
          <div className="rounded-2xl bg-[var(--acct-surface)] p-4"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">Current period end</p><p className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">{subscription.current_period_end ? formatDate(String(subscription.current_period_end)) : "—"}</p></div>
          <div className="rounded-2xl bg-[var(--acct-surface)] p-4"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">Started</p><p className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">{subscription.created_at ? formatDate(String(subscription.created_at)) : "—"}</p></div>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="acct-card p-5"><p className="acct-kicker">Plan details</p><div className="mt-4 space-y-3 text-sm text-[var(--acct-ink)]"><div><span className="font-semibold">Tier:</span> {String(subscription.plan_tier || "—")}</div><div><span className="font-semibold">Reference type:</span> {String(subscription.reference_type || "—")}</div><div><span className="font-semibold">Reference ID:</span> {String(subscription.reference_id || "—")}</div></div></div>
        <div className="acct-card p-5"><p className="acct-kicker">Ledger truth</p><p className="mt-4 text-sm leading-7 text-[var(--acct-muted)]">This page only reflects records that a division has already synced into the shared account ledger. If a live plan exists elsewhere but nothing appears here, the missing piece is division-to-account subscription sync rather than your account session.</p></div>
      </div>
    </div>
  );
}
