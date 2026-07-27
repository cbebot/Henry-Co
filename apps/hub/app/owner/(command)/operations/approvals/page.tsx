import Link from "next/link";
import { AlertCircle, AlertTriangle, ArrowRight, CheckCircle, ClipboardCheck, ExternalLink, Info } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { OwnerPageHeader, OwnerPanel, OwnerNotice } from "@/components/owner/OwnerPrimitives";
import DivisionBadge from "@/components/owner/DivisionBadge";
import { SensitiveActionProviderBridge } from "@/components/auth/SensitiveActionProviderBridge";
import { isOwnerDivisionExternalHref, OWNER_APPROVAL_CENTER_LINKS } from "@/lib/owner-division-external";
import { getApprovalQueueData } from "@/lib/owner-data";
import { getOwnerControlQueues } from "@/lib/owner-control/queues";
import { requireOwner } from "@/lib/owner-auth";
import { getHubPublicLocale } from "@/lib/locale-server";
import { OwnerApprovalsConsole } from "./approvals-console";

export const dynamic = "force-dynamic";

/**
 * V3-OWNER-CONTROL-01 — the approval centre, rebuilt from a noticeboard into a
 * console.
 *
 * What it was: severity-tagged COUNTS, each with a link out. What that produced:
 * two seller registrations approved by hand in the SQL editor, because the link
 * on the seller card went to a Marketplace admin route gated by a role table the
 * owner is not in, and silently redirected him to /account.
 *
 * What it is now: the pending rows themselves, each with the buttons that decide
 * them, posting to one governed endpoint that re-verifies the owner in SQL,
 * re-reads live state, demands a password on the consequential verdicts, and
 * writes an audit row before anything moves.
 *
 * The counts panel survives underneath, demoted to what it is — pressure the
 * console does not yet act on, pointing only at HQ routes that exist.
 */
export default async function OwnerApprovalsPage() {
  // The (command) layout gates this group, but the control queues read through
  // the service-role client, so ownership is re-asserted here before any of it
  // is fetched. This is also where the session email for the reauth modal comes
  // from — never from the client.
  const owner = await requireOwner();
  const [control, queue, locale] = await Promise.all([
    getOwnerControlQueues(),
    getApprovalQueueData(),
    getHubPublicLocale(),
  ]);
  const t = (s: string) => translateSurfaceLabel(locale, s);

  // Signals the console now answers directly are dropped from the counts panel:
  // showing "3 vendor applications pending" above a queue listing those same
  // three, each with an Approve button, is the noticeboard reasserting itself.
  const residualSignals = queue.items.filter((item) => item.id !== "vendor-applications");

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow={t("Operations")}
        title={t("Approval center")}
        description={t("Every decision waiting on you, with the controls to make it. Approvals take one tap; suspensions, removals, and rejected listings ask for your password first. Each action is recorded against your name before anything changes.")}
      />

      {control.totalPending === 0 ? (
        <OwnerNotice
          tone="good"
          title={t("Nothing is waiting on you")}
          body={t("No registrations, identity checks, listings, or reports need a decision right now. Live stores stay listed below so you can act on one at any time.")}
        />
      ) : (
        <OwnerNotice
          tone="warning"
          title={`${control.totalPending} ${t("decisions are waiting on you")}`}
          body={t("Each one is shown with the evidence needed to decide it. A reason is required for anything other than a straight approval, and it is stored with the decision.")}
        />
      )}

      <SensitiveActionProviderBridge email={owner.email ?? null}>
        <OwnerApprovalsConsole queues={control.queues} />
      </SensitiveActionProviderBridge>

      {control.openDisputes > 0 ? (
        <OwnerNotice
          tone="warning"
          title={`${control.openDisputes} ${t("open buyer-seller disputes")}`}
          body={t("Resolving a dispute moves money — it either refunds the buyer or releases the seller's payout. That runs through the guarded payment path and is deliberately not decided from this console, so the payout state machine keeps exactly one writer.")}
        />
      ) : null}

      {residualSignals.length > 0 ? (
        <OwnerPanel
          title={t("Other pressure")}
          description={t("Signals this console does not act on yet. Each one opens the HQ surface that handles it.")}
        >
          <div className="space-y-3">
            {residualSignals.map((item) => (
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
                          className={`rounded-full bg-[var(--acct-bg-elevated)] px-2 py-0.5 text-[11px] font-bold tabular-nums ${
                            item.severity === "critical"
                              ? "text-[var(--acct-red-text)]"
                              : item.severity === "warning"
                                ? "text-[var(--acct-orange-text)]"
                                : "text-[var(--acct-muted)]"
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
                  {isOwnerDivisionExternalHref(item.href) ? (
                    <Link
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--owner-accent)]"
                    >
                      {t("Review and decide")}
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  ) : (
                    <Link
                      href={item.href}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--owner-accent)]"
                    >
                      {t("Review now")}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  )}
                  <span className="text-[10px] uppercase tracking-wider text-[var(--acct-muted)]">
                    {item.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </OwnerPanel>
      ) : null}

      <OwnerPanel
        title={t("Review surfaces")}
        description={t("Oversight destinations. Every one of these is an HQ route that exists — the retired subdomain staff shells are deliberately not linked.")}
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
                    <p className="text-sm font-semibold text-[var(--acct-ink)]">{t(item.label)}</p>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--acct-muted)]">{t(item.description)}</p>
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
          <Link href="/owner/operations/decisions" className="acct-button-primary">
            {t("Operator decisions")}
          </Link>
          <Link href="/owner/messaging/team" className="acct-button-secondary">
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
