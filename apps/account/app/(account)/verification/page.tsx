import Link from "next/link";
import { ArrowRight, FileCheck2, ShieldCheck, WalletCards } from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import { getDocuments, getProfile } from "@/lib/account-data";
import { getAccountTrustProfile, getTrustTierLabel } from "@/lib/trust";
import { resolveAccountRegionalContext } from "@/lib/regional-context";
import PageHeader from "@/components/layout/PageHeader";

export const dynamic = "force-dynamic";

export default async function VerificationPage() {
  const user = await requireAccountUser();
  const [trust, documents, profile] = await Promise.all([
    getAccountTrustProfile(user.id),
    getDocuments(user.id),
    getProfile(user.id),
  ]);
  const region = resolveAccountRegionalContext({
    country: profile?.country as string | null | undefined,
    currency: profile?.currency as string | null | undefined,
    timezone: profile?.timezone as string | null | undefined,
    language: profile?.language as string | null | undefined,
  });

  const identityDocs = documents.filter((document: Record<string, unknown>) =>
    ["id_document", "document"].includes(String(document.type || ""))
  );
  const payoutDocs = documents.filter((document: Record<string, unknown>) =>
    ["payment_proof", "document"].includes(String(document.type || ""))
  );
  const restrictedActions = [
    !trust.flags.marketplaceEligible ? "Marketplace seller approval and higher-trust listing actions stay gated." : null,
    !trust.flags.propertyPublishingEligible
      ? "Property publishing and owner-operating workflows stay in elevated review posture."
      : null,
    !trust.flags.payoutEligible ? "Sensitive payout and finance actions stay gated until identity proof is stronger." : null,
    !trust.flags.staffElevationEligible
      ? "Staff-sensitive escalation remains blocked until premium verified identity posture is reached."
      : null,
    trust.signals.suspiciousEvents > 0 ? "Sensitive payout and finance actions stay under review." : null,
    trust.tier === "basic" ? "Higher-risk submissions may require more documents before they can move forward." : null,
    trust.signals.duplicateEmailMatches > 0 || trust.signals.duplicatePhoneMatches > 0
      ? "Shared contact details keep higher-trust approvals under manual review until cleared."
      : null,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title="Verification"
        description="KYC posture, uploaded evidence, and trust-gated business actions across HenryCo."
        icon={ShieldCheck}
      />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <article className="acct-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="acct-kicker">Current trust lane</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--acct-ink)]">
                {getTrustTierLabel(trust.tier)}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--acct-muted)]">
                HenryCo uses verification state for seller onboarding, higher-risk submissions, sensitive financial
                actions, and moderation posture. This surface keeps those gates visible instead of leaving them hidden in errors.
              </p>
            </div>
            <div className="rounded-[1.4rem] bg-[var(--acct-blue-soft)] px-4 py-3 text-right">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--acct-blue)]">
                Trust score
              </p>
              <p className="mt-2 text-3xl font-semibold text-[var(--acct-ink)]">{trust.score}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Email verified", trust.signals.emailVerified ? "Confirmed" : "Needs action"],
              [
                "Identity verification",
                trust.signals.verificationStatus === "verified"
                  ? "Verified"
                  : trust.signals.verificationStatus === "pending"
                    ? "Under review"
                    : trust.signals.verificationStatus === "rejected"
                      ? "Needs resubmission"
                      : "Not submitted",
              ],
              ["Phone on file", trust.signals.phonePresent ? "Present" : "Missing"],
              ["Profile completion", `${trust.signals.profileCompletion}%`],
              ["Clean security posture", trust.signals.suspiciousEvents === 0 ? "Clear" : "Needs review"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[1.4rem] border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-4">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--acct-muted)]">
                  {label}
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--acct-ink)]">{value}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="acct-card p-5">
          <p className="acct-kicker">Verification evidence</p>
          <div className="mt-4 space-y-3">
            {[
              ["Identity and KYC documents", String(identityDocs.length)],
              ["Payout and proof records", String(payoutDocs.length)],
              ["Settled transactions", String(trust.signals.settledTransactions)],
              [
                "Contact review",
                trust.signals.duplicateEmailMatches > 0 || trust.signals.duplicatePhoneMatches > 0
                  ? "Manual review"
                  : "Clear",
              ],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[1.3rem] bg-[var(--acct-surface)] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--acct-muted)]">{label}</p>
                <p className="mt-2 text-xl font-semibold text-[var(--acct-ink)]">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/documents" className="acct-button-primary rounded-2xl">
              Review documents
            </Link>
            <Link href="/security" className="acct-button-secondary rounded-2xl">
              Open security
            </Link>
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="acct-card p-5">
          <div className="flex items-center gap-2">
            <FileCheck2 size={16} className="text-[var(--acct-gold)]" />
            <p className="text-sm font-semibold text-[var(--acct-ink)]">What unlocks next</p>
          </div>
          <div className="mt-3 space-y-2">
            {(trust.requirements.length > 0
              ? trust.requirements
              : ["You are already inside the current highest trust lane exposed by the shared dashboard."]).map(
              (item) => (
                <p key={item} className="text-sm leading-7 text-[var(--acct-muted)]">
                  {item}
                </p>
              )
            )}
          </div>
        </article>

        <article className="acct-card p-5">
          <div className="flex items-center gap-2">
            <WalletCards size={16} className="text-[var(--acct-blue)]" />
            <p className="text-sm font-semibold text-[var(--acct-ink)]">Sensitive action gating</p>
          </div>
          <div className="mt-3 space-y-2">
            {restrictedActions.length > 0 ? (
              restrictedActions.map((item) => (
                <p key={item} className="text-sm leading-7 text-[var(--acct-muted)]">
                  {item}
                </p>
              ))
            ) : (
              <p className="text-sm leading-7 text-[var(--acct-muted)]">
                No trust-based restrictions are currently blocking your account’s core business actions.
              </p>
            )}
          </div>
        </article>

        <article className="acct-card p-5">
          <p className="text-sm font-semibold text-[var(--acct-ink)]">Next strongest move</p>
          <p className="mt-3 text-sm leading-7 text-[var(--acct-muted)]">
            If you want stronger seller, payout, or higher-risk submission eligibility, keep identity records clean,
            maintain a longer transaction history, and avoid unresolved security events.
          </p>
          <p className="mt-3 text-xs leading-6 text-[var(--acct-muted)]">
            Regional context: {region.countryName} · {region.locale} · {region.timezone}. {region.settlementNote}
          </p>
          <Link href="/marketplace" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--acct-gold)]">
            Review marketplace gating <ArrowRight size={16} />
          </Link>
        </article>
      </section>
    </div>
  );
}
