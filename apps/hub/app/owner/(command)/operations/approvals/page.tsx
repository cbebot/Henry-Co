import Link from "next/link";
import { AlertCircle, AlertTriangle, ArrowRight, CheckCircle, ClipboardCheck, ExternalLink, Info } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { OwnerPageHeader, OwnerPanel, OwnerNotice } from "@/components/owner/OwnerPrimitives";
import DivisionBadge from "@/components/owner/DivisionBadge";
import { isOwnerDivisionExternalHref, OWNER_APPROVAL_CENTER_LINKS } from "@/lib/owner-division-external";
import { getApprovalQueueData } from "@/lib/owner-data";
import { getHubPublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export default async function OwnerApprovalsPage() {
  const [queue, locale] = await Promise.all([getApprovalQueueData(), getHubPublicLocale()]);
  const t = (s: string) => translateSurfaceLabel(locale, s);

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow={t("Operations")}
        title={t("Approval center")}
        description={t("Live owner decision queue — items that need a human judgement call before they proceed. Sensitive payouts, vendor reviews, disputes, and access decisions route here.")}
      />

      {queue.total === 0 ? (
        <OwnerNotice
          tone="good"
          title={t("Queue is clear")}
          body={t("No pending approvals, disputes, or urgent actions at this time. The live queue updates on every page load.")}
        />
      ) : (
        <OwnerPanel
          title={`${queue.total} ${t("items need a decision")}`}
          description={t("Critical and warning items first. Each card shows the count, context, and the fastest path to resolve it.")}
        >
          <div className="space-y-3">
            {queue.items.map((item) => (
              <div
                key={item.id}
                className={`rounded-[1.25rem] border p-4 ${
                  item.severity === "critical"
                    ? "border-[var(--acct-red-text)]/20 bg-[var(--acct-red-soft)]"
                    : item.severity === "warning"
                      ? "border-[var(--acct-orange-text)]/20 bg-[var(--acct-bg-soft)]"
                      : "border-[var(--acct-line)] bg-[var(--acct-bg-soft)]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <SeverityIcon severity={item.severity} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[var(--acct-ink)]">{item.label}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
                            item.severity === "critical"
                              ? "bg-[var(--acct-red-text)] text-white"
                              : item.severity === "warning"
                                ? "bg-[var(--acct-orange-text)] text-white"
                                : "bg-[var(--acct-line)] text-[var(--acct-muted)]"
                          }`}
                        >
                          {item.count}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-[var(--acct-muted)]">{item.description}</p>
                    </div>
                  </div>
                  <DivisionBadge division={item.division} />
                </div>
                <div className="mt-3 flex items-center gap-4">
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--owner-accent)]"
                  >
                    {t("Review now")}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                  <span className="text-[10px] uppercase tracking-wider text-[var(--acct-muted)]">
                    {item.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </OwnerPanel>
      )}

      <OwnerPanel
        title={t("Review surfaces")}
        description={t("All primary oversight destinations — HQ paths stay here, subdomain paths open the live app.")}
      >
        <ul className="grid gap-3 md:grid-cols-2">
          {OWNER_APPROVAL_CENTER_LINKS.map((item) => {
            const offSite = isOwnerDivisionExternalHref(item.href);
            return (
              <li
                key={`${item.division}-${item.label}`}
                className="rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4"
              >
                <div className="flex items-start gap-3">
                  <ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--acct-gold)]" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--acct-ink)]">{item.label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--acct-muted)]">{item.description}</p>
                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--acct-muted)]">
                      {item.division}
                      {!offSite ? " · HQ" : ""}
                    </p>
                    <Link
                      href={item.href}
                      {...(offSite ? { target: "_blank", rel: "noreferrer" } : {})}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--owner-accent)]"
                    >
                      {offSite ? (
                        <>
                          {t("Open live division app")}
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        </>
                      ) : (
                        <>
                          {t("Open in HQ")}
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                        </>
                      )}
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </OwnerPanel>

      <OwnerPanel title={t("HQ follow-ups")} description={t("Stay inside HQ for coordination.")}>
        <div className="flex flex-wrap gap-3">
          <Link href="/owner/messaging/team" className="acct-button-primary">
            {t("Internal team chat")}
          </Link>
          <Link href="/owner/operations/alerts" className="acct-button-secondary">
            {t("Operational alerts")}
          </Link>
          <Link href="/owner/finance" className="acct-button-secondary">
            {t("Finance center")}
          </Link>
        </div>
      </OwnerPanel>
    </div>
  );
}

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === "critical")
    return <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--acct-red-text)]" aria-hidden />;
  if (severity === "warning")
    return <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--acct-orange-text)]" aria-hidden />;
  if (severity === "good")
    return <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--acct-green-text)]" aria-hidden />;
  return <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--acct-muted)]" aria-hidden />;
}
