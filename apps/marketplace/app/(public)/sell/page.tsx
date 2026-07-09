import type { Metadata } from "next";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n/server";
import {
  DisplayHeading,
  EditorialList,
  EditorialRow,
  Eyebrow,
  Lede,
  PublicCTA,
  PublicProofRail,
  Section,
  SectionHeader,
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
 * mark. Narrative arc, one breath per section, one climax: Hook → Why stronger
 * sellers win (hairline list) → One record, application to publishing (the
 * climax, sunken) → Trust tiers (real ladder) → Invite. Server component on the
 * same copy/data it already sourced — re-presented, not refetched.
 *
 * i18n: copy.sell.* arrives pre-translated from getMarketplacePublicCopy;
 * connective surface labels run through translateSurfaceLabel. Policy ROW text
 * (trust-tier privileges/windows) is source-language data. Proof numbers are
 * real counts (null → the rail self-suppresses). No hardcoded domains.
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

      {/* ── WHY — what stronger sellers win, as a hairline list ── */}
      <Section rhythm="tight">
        <SectionHeader level={2} size="display" title={sell.advantages.kicker} />
        <EditorialList className="mt-10">
          {sell.advantages.items.map((item, i) => (
            <EditorialRow
              key={item.title}
              index={String(i + 1).padStart(2, "0")}
              title={item.title}
              body={item.body}
            />
          ))}
        </EditorialList>
      </Section>

      {/* ── THE ONE RECORD — the climax: application to publishing ── */}
      <Section rhythm="hero" tone="sunken">
        <div className="grid gap-x-12 gap-y-10 lg:grid-cols-[1fr_0.92fr] lg:items-center">
          <div>
            <Eyebrow>{sell.onboarding.kicker}</Eyebrow>
            <DisplayHeading level={2} size="display" className="mt-4 max-w-lg">
              {t("One record, from")}{" "}
              <span className="italic text-[color:var(--home-accent-text)]">
                {t("application to publishing.")}
              </span>
            </DisplayHeading>
            <Lede className="mt-5 max-w-md">{sell.onboarding.callout.body}</Lede>
          </div>
          <ol className="divide-y divide-[color:var(--home-line)] border-t border-[color:var(--home-line)]">
            {sell.onboarding.steps.map((item) => (
              <li key={item.step} className="flex items-baseline gap-4 py-5">
                <span className="home-num shrink-0 text-sm text-[color:var(--home-accent-text)]">
                  {item.step}
                </span>
                <div className="min-w-0">
                  <p className="home-title">{item.title}</p>
                  <p className="home-body-sm mt-1.5 text-[color:var(--home-ink-65)]">{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* ── TRUST LADDER — the real ladder, payout window as the focal line ── */}
      <Section>
        <SectionHeader
          level={2}
          size="display"
          eyebrow={sell.trustTiers.kicker}
          title={sell.trustTiers.title}
        />
        <EditorialList className="mt-10">
          {sellerTrustTierRules.map((tier, i) => (
            <EditorialRow
              key={tier.tier}
              index={String(i + 1).padStart(2, "0")}
              title={tier.tier}
              body={tier.privileges}
              trailing={
                <span className="home-num hidden max-w-[14rem] text-right text-sm font-medium text-[color:var(--home-accent-text)] sm:block">
                  {tier.payoutWindow}
                </span>
              }
            />
          ))}
        </EditorialList>
        <div className="mt-8">
          <PublicCTA
            href="/sell/pricing"
            variant="ghost"
            trailingIcon={<ArrowUpRight aria-hidden className="h-4 w-4" />}
          >
            {t("See plan economics")}
          </PublicCTA>
        </div>
      </Section>

      {/* ── INVITATION — one dominant primary ── */}
      <Section>
        <div className="flex flex-col gap-6 rounded-[var(--home-radius-lg)] border border-[color:var(--home-line-12)] bg-[color:var(--home-surface-02)] p-8 sm:flex-row sm:items-center sm:justify-between sm:p-12">
          <div className="max-w-xl">
            <DisplayHeading level={2} size="headline">
              {sell.closing.title}
            </DisplayHeading>
            <Lede className="mt-2">{sell.closing.body}</Lede>
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
