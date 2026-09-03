import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { getHubUrl } from "@henryco/config";
import { translateSurfaceLabel } from "@henryco/i18n/server";
import {
  Body,
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
import { sellerPlanRows, sellerTrustTierRules } from "@/lib/marketplace/policy";
import { getMarketplacePublicLocale } from "@/lib/locale-server";
import { getMarketplacePublicCopy } from "@/lib/public-copy";

export const dynamic = "force-dynamic";

function planCtaHref(planId: string) {
  if (planId === "partner") {
    return getHubUrl("/contact?reason=partnerships&plan=partner");
  }
  return `/account/seller-application/start?plan=${planId}`;
}

/**
 * Seller pricing — the economics page on the locked --home-* public design
 * system. Marketplace personality: calm-premium commerce, fees stated in the
 * open. Narrative arc, one climax: Hook → Plans (the climax, a hairline list
 * where the monthly price is the bronze focal value, NOT a wall of plan cards)
 * → How it's deducted → Trust-tier payout timing → Invite. Server component on
 * the same copy/data it already sourced — re-presented, not refetched.
 *
 * i18n: copy.sellPricing.* arrives pre-translated; connective labels via
 * translateSurfaceLabel. Plan/tier ROW values are policy-derived data. Proof
 * numbers are real counts (null → the rail self-suppresses). No hardcoded
 * domains (plan CTA routing preserved via planCtaHref / getHubUrl).
 */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getMarketplacePublicLocale();
  const copy = getMarketplacePublicCopy(locale);
  return {
    title: copy.sellPricing.metadata.title,
    description: copy.sellPricing.metadata.description,
  };
}

export default async function SellerPricingPage() {
  const locale = await getMarketplacePublicLocale();
  const copy = getMarketplacePublicCopy(locale);
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const sp = copy.sellPricing;
  const proof = (n: number) => (n > 0 ? String(n) : null);

  return (
    <>
      {/* ── HOOK — clear economics, stated up front ── */}
      <Section rhythm="hero">
        <Eyebrow>{sp.hero.kicker}</Eyebrow>
        <DisplayHeading level={1} size="xl" className="mt-5 max-w-3xl">
          {t("Clear economics.")}{" "}
          <span className="italic text-[color:var(--home-accent-text)]">{t("No hidden fees.")}</span>
        </DisplayHeading>
        <Lede className="mt-6 max-w-2xl">{sp.hero.body}</Lede>
        <PublicProofRail
          className="mt-10"
          items={[
            { value: proof(sellerPlanRows.length), label: sp.hero.statsLabels.planTiers },
            { value: proof(sellerTrustTierRules.length), label: sp.hero.statsLabels.trustTiers },
            { value: sp.hero.featuredSlotsValue, label: sp.hero.statsLabels.featuredSlots },
          ]}
        />
      </Section>

      {/* ── THE PLANS — the climax: a hairline ladder, price as the bronze line ── */}
      <Section rhythm="tight" tone="sunken">
        <SectionHeader
          level={2}
          size="display"
          eyebrow={sp.plans.kicker}
          title={t("Pick a plan. The price is the headline.")}
        />
        <EditorialList className="mt-10">
          {sellerPlanRows.map((plan, i) => (
            <EditorialRow
              key={plan.id}
              index={String(i + 1).padStart(2, "0")}
              href={planCtaHref(plan.id)}
              title={plan.name}
              body={`${plan.summary} · ${plan.marketplaceFeeLabel} · ${plan.payoutFeeLabel} · ${plan.includedListings} ${sp.plans.includedSuffix}`}
              trailing={
                <span className="home-num text-right text-sm font-semibold text-[color:var(--home-accent-text)] sm:text-base">
                  {plan.monthlyLabel}
                </span>
              }
            />
          ))}
        </EditorialList>
      </Section>

      {/* ── HOW IT'S DEDUCTED — tight, in the open ── */}
      <Section rhythm="tight">
        <SectionHeader level={2} size="headline" eyebrow={sp.economics.kicker} title={sp.economics.title} />
        <ol className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {sp.economics.items.map((item, index) => (
            <li key={item} className="flex flex-col gap-3">
              <span className="home-num text-sm font-semibold text-[color:var(--home-accent-text)]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span aria-hidden className="h-px w-full bg-[color:var(--home-line)]" />
              <Body size="sm" className="text-[color:var(--home-ink-65)]">
                {item}
              </Body>
            </li>
          ))}
        </ol>
      </Section>

      {/* ── PAYOUT TIMING — better behaviour, shorter holds ── */}
      <Section>
        <SectionHeader
          level={2}
          size="display"
          eyebrow={sp.trustTiers.kicker}
          title={sp.trustTiers.title}
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
      </Section>

      {/* ── INVITATION — one dominant primary ── */}
      <Section>
        <div className="flex flex-col gap-6 rounded-[var(--home-radius-lg)] border border-[color:var(--home-line-12)] bg-[color:var(--home-surface-02)] p-8 sm:flex-row sm:items-center sm:justify-between sm:p-12">
          <div className="max-w-xl">
            <DisplayHeading level={2} size="headline">
              {sp.closing.title}
            </DisplayHeading>
            <Lede className="mt-2">{sp.closing.body}</Lede>
          </div>
          <PublicCTA
            href="/account/seller-application"
            variant="primary"
            size="lg"
            trailingIcon={<ArrowRight aria-hidden className="h-4 w-4" />}
          >
            {sp.closing.primaryCta}
          </PublicCTA>
        </div>
      </Section>
    </>
  );
}
