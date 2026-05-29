import type { Metadata } from "next";
import Link from "next/link";
import { LifeBuoy } from "lucide-react";
import { getMarketplacePublicLocale } from "@/lib/locale-server";
import { translateMarketplacePublicLabel } from "@/lib/public-copy";
import { TrackLookupForm } from "@/components/marketplace/track-lookup-form";

export const dynamic = "force-dynamic";

/**
 * Public `/track` index — order-number lookup.
 *
 * V3-06 (S4 dead-link fix): the marketplace public nav and the buyer account
 * "Track an order" CTA both linked to `/track`, but only `/track/[orderNo]`
 * existed, leaving every bare link DEAD. This index provides the lookup entry
 * that routes into the existing detail page, matching the care + logistics
 * divisions which already ship a `/track` index.
 *
 * Strings use `translateMarketplacePublicLabel` (Pattern B runtime DeepL) so
 * all 12 locales resolve without duplicating typed-copy blocks. ZERO hardcoded
 * user-facing copy.
 */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getMarketplacePublicLocale();
  return {
    title: translateMarketplacePublicLabel(locale, "Track an order"),
    description: translateMarketplacePublicLabel(
      locale,
      "Look up a marketplace order by its reference code to see fulfillment, payment, and payout status.",
    ),
  };
}

export default async function TrackIndexPage() {
  const locale = await getMarketplacePublicLocale();
  const t = (label: string) => translateMarketplacePublicLabel(locale, label);

  return (
    <main className="mx-auto max-w-7xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
      <section>
        <p className="market-kicker text-[10.5px] uppercase tracking-[0.32em]">
          {t("Order tracking")}
        </p>
        <h1 className="mt-4 text-balance text-[2rem] font-semibold leading-[1.08] tracking-[-0.02em] text-[var(--market-ink)] sm:text-[2.4rem] md:text-[2.8rem]">
          {t("Track an order")}
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--market-muted)]">
          {t(
            "Enter your order reference to see fulfillment, payment, and payout status. You can find the reference in your order confirmation or in your account.",
          )}
        </p>

        <TrackLookupForm
          labels={{
            inputLabel: t("Order reference"),
            placeholder: t("e.g. MKT-2026-0001"),
            submit: t("Track order"),
            emptyError: t("Enter an order reference to continue."),
          }}
        />
      </section>

      <section
        aria-label={t("Need help finding your order?")}
        className="rounded-[1.5rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.03)] p-6"
      >
        <p className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
          <LifeBuoy className="h-4 w-4 text-[var(--market-brass)]" aria-hidden />
          {t("Need help finding your order?")}
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-[1.7] text-[var(--market-muted)]">
          {t(
            "Signed in? Open your orders to track everything in one place. Otherwise, our help centre can point you to the right reference.",
          )}
        </p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <Link
            href="/account/orders"
            className="market-button-secondary inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
          >
            {t("View your orders")}
          </Link>
          <Link
            href="/help"
            className="market-button-secondary inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
          >
            {t("Visit help centre")}
          </Link>
        </div>
      </section>
    </main>
  );
}
