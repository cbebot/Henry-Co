import Link from "next/link";
import { ArrowLeft, ExternalLink, LifeBuoy, Receipt, RefreshCcw } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n/server";
import { requireAccountUser } from "@/lib/auth";
import { getSubscriptionContext } from "@/lib/account-data";
import { getSubscriptionWorkspaceHref } from "@/lib/account-links";
import { getAccountAppLocale } from "@/lib/locale-server";
import {
  divisionLabel,
  formatBillingInterval,
  formatCurrencyAmount,
  formatDate,
  formatDateTime,
  formatSubscriptionStatus,
} from "@/lib/format";
import PageHeader from "@/components/layout/PageHeader";

export const dynamic = "force-dynamic";
const statusChip: Record<string, string> = { active: "acct-chip-green", paused: "acct-chip-orange", cancelled: "acct-chip-red", expired: "acct-chip-red", past_due: "acct-chip-red" };

function humanizeToken(value: unknown, fallback = "—") {
  const normalized = String(value || "")
    .trim()
    .replace(/[_-]+/g, " ");

  if (!normalized) return fallback;
  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
}

function localizeHumanizedToken(
  t: (text: string) => string,
  value: unknown,
  fallback = "—",
) {
  const humanized = humanizeToken(value, fallback);
  if (humanized === fallback) return fallback;

  const translated = t(humanized);
  return translated !== humanized ? translated : humanized;
}

export default async function SubscriptionDetailPage({ params }: { params: Promise<{ subscriptionId: string }> }) {
  const { subscriptionId } = await params;
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const context = await getSubscriptionContext(user.id, subscriptionId);
  if (!context) {
    return <div className="space-y-4 acct-fade-in"><Link href="/subscriptions" className="acct-button-ghost w-fit rounded-xl"><ArrowLeft size={16} /> {t("Back to subscriptions")}</Link><div className="acct-empty py-20"><p className="text-sm text-[var(--acct-muted)]">{t("Subscription not found.")}</p></div></div>;
  }
  const { subscription, relatedInvoices, relatedSupportThreads, referenceKeys } = context;
  const workspaceHref = getSubscriptionWorkspaceHref(typeof subscription.division === "string" ? subscription.division : null);
  const subscriptionTitle = String(subscription.plan_name || t("Subscription"));
  const division = t(divisionLabel(String(subscription.division || "service")));
  const subscriptionStatus = t(formatSubscriptionStatus(String(subscription.status || "")));
  const billingCycle = t(formatBillingInterval(String(subscription.billing_cycle || "")));
  return (
    <div className="space-y-6 acct-fade-in">
      <Link href="/subscriptions" className="acct-button-ghost w-fit rounded-xl"><ArrowLeft size={16} /> {t("Back to subscriptions")}</Link>
      <PageHeader title={subscriptionTitle} description={t("Shared ledger view. Plan management still happens in the original division workspace when that workflow exists.")} icon={RefreshCcw} actions={workspaceHref ? <a href={workspaceHref} target="_blank" rel="noopener noreferrer" className="acct-button-primary rounded-xl">{t("Open division workspace")} <ExternalLink size={14} /></a> : undefined} />
      <div className="acct-card p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`acct-chip ${statusChip[String(subscription.status || "")] || "acct-chip-gold"}`}>{subscriptionStatus}</span>
          <span className="text-sm text-[var(--acct-muted)]">{division}</span>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-[var(--acct-surface)] p-4"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">{t("Amount")}</p><p className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">{formatCurrencyAmount(Number(subscription.amount_kobo || 0), String(subscription.currency || "NGN"), { unit: "kobo", locale })}</p></div>
          <div className="rounded-2xl bg-[var(--acct-surface)] p-4"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">{t("Billing cycle")}</p><p className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">{billingCycle}</p></div>
          <div className="rounded-2xl bg-[var(--acct-surface)] p-4"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">{t("Current period end")}</p><p className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">{subscription.current_period_end ? formatDate(String(subscription.current_period_end), { locale }) : "—"}</p></div>
          <div className="rounded-2xl bg-[var(--acct-surface)] p-4"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">{t("Started")}</p><p className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">{subscription.created_at ? formatDate(String(subscription.created_at), { locale }) : "—"}</p></div>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="acct-card p-5"><p className="acct-kicker">{t("Plan details")}</p><div className="mt-4 space-y-3 text-sm text-[var(--acct-ink)]"><div><span className="font-semibold">{t("Tier:")}</span> {localizeHumanizedToken(t, subscription.plan_tier)}</div><div><span className="font-semibold">{t("Reference type:")}</span> {localizeHumanizedToken(t, subscription.reference_type)}</div><div><span className="font-semibold">{t("Reference ID:")}</span> {String(subscription.reference_id || "—")}</div><div><span className="font-semibold">{t("Last synced:")}</span> {subscription.updated_at ? formatDateTime(String(subscription.updated_at), { locale }) : subscription.created_at ? formatDateTime(String(subscription.created_at), { locale }) : "—"}</div></div></div>
        <div className="acct-card p-5"><p className="acct-kicker">{t("Ledger truth")}</p><div className="mt-4 space-y-3 text-sm leading-7 text-[var(--acct-muted)]"><p>{t("This route is read-only. It only reflects subscription rows that a division has already written into `customer_subscriptions`.")}</p><p>{workspaceHref ? t("Management is still owned by the division workspace. The account hub can deep-link you there, but it does not mutate subscription state directly.") : t("No direct management route has been published for this division inside the account hub yet, so there is no manage action to expose here.")}</p><p>{referenceKeys.length > 0 ? t("Linked invoices and support threads below are shown only when the shared ledger uses one of this subscription's published reference keys.") : t("This subscription row has no published reference key beyond its own record, so invoice/support linkage depends entirely on future division-side sync quality.")}</p></div></div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="acct-card p-5"><div className="mb-4 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Receipt size={14} className="text-[var(--acct-muted)]" /><p className="acct-kicker">{t("Linked invoices & receipts")}</p></div><Link href="/invoices" className="text-xs font-medium text-[var(--acct-gold)] hover:underline">{t("All invoices")}</Link></div>{relatedInvoices.length === 0 ? <p className="text-sm text-[var(--acct-muted)]">{t("No invoice or receipt row is linked to this subscription in the shared ledger yet. If billing happened elsewhere, the missing piece is division-side invoice publishing or shared reference alignment.")}</p> : <div className="space-y-2">{relatedInvoices.map((invoice) => <Link key={String(invoice.id)} href={`/invoices/${invoice.id}`} className="flex items-center justify-between rounded-xl bg-[var(--acct-surface)] px-4 py-3 transition-colors hover:bg-[var(--acct-line)]"><div><p className="text-sm font-medium text-[var(--acct-ink)]">{String(invoice.description || invoice.invoice_no || t("Invoice"))}</p><p className="text-xs text-[var(--acct-muted)]">{invoice.status ? localizeHumanizedToken(t, invoice.status) : t("Status pending")}</p></div><div className="text-right"><p className="text-sm font-semibold text-[var(--acct-ink)]">{formatCurrencyAmount(Number(invoice.total_kobo || 0), String(invoice.currency || "NGN"), { unit: "kobo", locale })}</p><p className="text-[0.65rem] text-[var(--acct-muted)]">{invoice.created_at ? formatDate(String(invoice.created_at), { locale }) : t("Date pending")}</p></div></Link>)}</div>}</section>
        <section className="acct-card p-5"><div className="mb-4 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><LifeBuoy size={14} className="text-[var(--acct-muted)]" /><p className="acct-kicker">{t("Support context")}</p></div><div className="flex items-center gap-3"><Link href="/support" className="text-xs font-medium text-[var(--acct-gold)] hover:underline">{t("Support inbox")}</Link><Link href="/support/new" className="text-xs font-medium text-[var(--acct-gold)] hover:underline">{t("Create request")}</Link></div></div>{relatedSupportThreads.length === 0 ? <p className="text-sm text-[var(--acct-muted)]">{t("No support thread is linked directly to this subscription yet. Open a support request if billing, renewal, or cancellation needs manual attention.")}</p> : <div className="space-y-2">{relatedSupportThreads.map((thread) => { const localizedThreadStatus = localizeHumanizedToken(t, thread.status || "Open"); return <Link key={String(thread.id)} href={`/support/${thread.id}`} className="flex items-center justify-between rounded-xl bg-[var(--acct-surface)] px-4 py-3 transition-colors hover:bg-[var(--acct-line)]"><div><p className="text-sm font-medium text-[var(--acct-ink)]">{String(thread.subject || t("Support thread"))}</p><p className="text-xs text-[var(--acct-muted)]">{localizedThreadStatus}</p></div><span className={`acct-chip ${String(thread.status || "").toLowerCase() === "resolved" || String(thread.status || "").toLowerCase() === "closed" ? "acct-chip-green" : "acct-chip-blue"} text-[0.6rem]`}>{localizedThreadStatus}</span></Link>; })}</div>}</section>
      </div>
    </div>
  );
}
