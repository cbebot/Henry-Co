import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n/server";
import {
  DisplayHeading,
  Eyebrow,
  Lede,
  PublicCTA,
  PublicProofRail,
  Section,
} from "@henryco/ui/public-design";
import {
  MARKETPLACE_ROLE_VOCAB,
  resolveChromePlan,
  standingFromRoles,
} from "@henryco/aware";
import { getMarketplaceViewer } from "@/lib/marketplace/auth";
import { sellerPlanRows, sellerTrustTierRules } from "@/lib/marketplace/policy";
import { buildSharedAccountLoginUrl } from "@/lib/marketplace/shared-account";
import { getMarketplacePublicLocale } from "@/lib/locale-server";
import { getMarketplacePublicCopy } from "@/lib/public-copy";

export const dynamic = "force-dynamic";

/**
 * Sell — the seller landing on the locked --home-* public design system.
 * Marketplace personality: calm-premium commerce, bronze accent as the focal
 * mark. Hook → How to apply (step titles, sunken) → Invite. The trust-tier
 * ladder and fees live on /sell/pricing. Server component on the same copy/data
 * it already sourced — re-presented, not refetched.
 *
 * i18n: copy.sell.* arrives pre-translated from getMarketplacePublicCopy;
 * connective surface labels run through translateSurfaceLabel. Proof numbers
 * are real counts (null → the rail self-suppresses). No hardcoded domains.
 */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getMarketplacePublicLocale();
  const copy = getMarketplacePublicCopy(locale);
  return {
    title: copy.sell.metadata.title,
    description: copy.sell.metadata.description,
  };
}

export default async function SellPage() {
  const locale = await getMarketplacePublicLocale();
  const copy = getMarketplacePublicCopy(locale);
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const sell = copy.sell;
  const proof = (n: number) => (n > 0 ? String(n) : null);

  // AWARE-SP1: never recruit someone who is already in. A VENDOR's hero action
  // is their workspace; a VENDOR_APPLICANT tracks their application; only
  // visitors/customers see the apply CTA (the tested matrix in @henryco/aware).
  const viewer = await getMarketplaceViewer();
  const standing = standingFromRoles(
    { signedIn: Boolean(viewer.user), roles: viewer.roles },
    MARKETPLACE_ROLE_VOCAB,
  );
  const plan = resolveChromePlan("marketplace", standing);
  const isBaselineRecruit = standing.kind === "visitor" || standing.kind === "customer";
  const heroCtaLabel = isBaselineRecruit ? sell.hero.primaryCta : t(plan.recruit.label);

  return (
    <>
      {/* ── HOOK — selective by design; the bar, stated plainly ── */}
      <Section rhythm="hero">
        <Eyebrow>{sell.hero.kicker}</Eyebrow>
        <div className="mt-5 grid gap-x-12 gap-y-10 lg:grid-cols-[1.5fr_1fr] lg:items-end">
          <div>
            <DisplayHeading level={1} size="xl" className="max-w-3xl">
              {t("Selective by design.")}{" "}
              <span className="italic text-[color:var(--home-accent-text)]">
                {t("Built for sellers who lead on trust.")}
              </span>
            </DisplayHeading>
            <Lede className="mt-6 max-w-xl">{sell.hero.body}</Lede>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <PublicCTA
                href={plan.recruit.href}
                variant="primary"
                size="lg"
                trailingIcon={<ArrowRight aria-hidden className="h-4 w-4" />}
              >
                {heroCtaLabel}
              </PublicCTA>
              <PublicCTA href="/sell/pricing" variant="secondary" size="lg">
                {sell.hero.secondaryCta}
              </PublicCTA>
              {!viewer.user ? (
                <PublicCTA
                  href={buildSharedAccountLoginUrl("/account/seller-application")}
                  variant="ghost"
                >
                  {sell.hero.signInCta}
                </PublicCTA>
              ) : null}
            </div>
          </div>
          <PublicProofRail
            label={t("The bar")}
            items={[
              { value: proof(sellerPlanRows.length), label: t("Plan tiers") },
              { value: proof(sellerTrustTierRules.length), label: t("Trust tiers") },
              { value: t("Reviewed"), label: t("Selection") },
            ]}
          />
        </div>
      </Section>

      {/* ── HOW TO APPLY — the steps, titles only ── */}
      <Section rhythm="hero" tone="sunken">
        <div className="grid gap-x-12 gap-y-10 lg:grid-cols-[1fr_0.92fr] lg:items-center">
          <div>
            <DisplayHeading level={2} size="display" className="max-w-lg">
              {sell.onboarding.kicker}
            </DisplayHeading>
          </div>
          <ol className="divide-y divide-[color:var(--home-line)] border-t border-[color:var(--home-line)]">
            {sell.onboarding.steps.map((item) => (
              <li key={item.step} className="flex items-baseline gap-4 py-5">
                <span className="home-num shrink-0 text-sm text-[color:var(--home-accent-text)]">
                  {item.step}
                </span>
                <div className="min-w-0">
                  <p className="home-title">{item.title}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* ── INVITATION — one dominant primary ── */}
      <Section>
        <div className="flex flex-col gap-6 rounded-[var(--home-radius-lg)] border border-[color:var(--home-line-12)] bg-[color:var(--home-surface-02)] p-8 sm:flex-row sm:items-center sm:justify-between sm:p-12">
          <div className="max-w-xl">
            <DisplayHeading level={2} size="headline">
              {sell.closing.title}
            </DisplayHeading>
          </div>
          <PublicCTA
            href={plan.recruit.href}
            variant="primary"
            size="lg"
            trailingIcon={<ArrowRight aria-hidden className="h-4 w-4" />}
          >
            {isBaselineRecruit ? sell.closing.primaryCta : t(plan.recruit.label)}
          </PublicCTA>
        </div>
      </Section>
    </>
  );
}
