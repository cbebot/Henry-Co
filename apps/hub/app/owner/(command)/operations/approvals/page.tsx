import Link from "next/link";
import { ArrowRight, ClipboardCheck, ExternalLink } from "lucide-react";
import { OwnerPageHeader, OwnerPanel, OwnerNotice } from "@/components/owner/OwnerPrimitives";
import { isOwnerDivisionExternalHref, OWNER_APPROVAL_CENTER_LINKS } from "@/lib/owner-division-external";

export const dynamic = "force-dynamic";

export default function OwnerApprovalsPage() {
  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow="Operations"
        title="Approval center"
        description="Cross-division gates that should not ship without owner or delegated staff review. Subdomain links only go to live consoles; Property, Jobs, and Studio owner/moderation routes on those subdomains are retired — those flows stay in HQ until rebuilt."
      />

      <OwnerNotice
        tone="info"
        title="Governance"
        body="Sensitive payouts, automation overrides, and irreversible account actions should route through documented approval paths. This page links the primary review surfaces; deeper workflow automation can attach here later."
      />

      <OwnerPanel
        title="Review surfaces"
        description="External links open the live subdomain app in a new tab. HQ paths stay in this command center — used where the division subdomain still shows a retired staff placeholder."
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
                          Open live division app
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        </>
                      ) : (
                        <>
                          Open in HQ
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

      <OwnerPanel title="HQ follow-ups" description="Stay inside HQ for coordination.">
        <div className="flex flex-wrap gap-3">
          <Link href="/owner/messaging/team" className="acct-button-primary">
            Internal team chat
          </Link>
          <Link href="/owner/operations/alerts" className="acct-button-secondary">
            Operational alerts
          </Link>
          <Link href="/owner/finance" className="acct-button-secondary">
            Finance center
          </Link>
        </div>
      </OwnerPanel>
    </div>
  );
}
