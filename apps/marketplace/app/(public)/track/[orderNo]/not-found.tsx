import Link from "next/link";
import { LifeBuoy, SearchX } from "lucide-react";
import { getMarketplacePublicLocale } from "@/lib/locale-server";
import { translateMarketplacePublicLabel } from "@/lib/public-copy";
import { TrackLookupForm } from "@/components/marketplace/track-lookup-form";
import { TrackAttemptedCode } from "@/components/marketplace/track-attempted-code";

/**
 * Graceful, track-scoped not-found boundary.
 *
 * `/track/[orderNo]` calls `notFound()` when the reference doesn't match an
 * order (a typo, an old link, a wrong code). Without this segment-level
 * not-found, that rendered the generic full-page 404 ("That page isn't here"),
 * which reads as a dead end after someone just tried to find their order.
 *
 * Instead we keep the correct 404 status but render a calm, on-brand recovery:
 * echo the code they tried, explain it plainly, and put the lookup form right
 * there so they can retry without losing their place — plus the same help/
 * account routes as the /track index. Scoped to the track route only, so the
 * rest of the marketplace keeps the shared 404. Pattern B i18n (runtime DeepL);
 * zero hardcoded user-facing copy.
 */
export default async function TrackOrderNotFound() {
  const locale = await getMarketplacePublicLocale();
  const t = (label: string) => translateMarketplacePublicLabel(locale, label);

  return (
    <main className="mx-auto max-w-7xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
      <section className="max-w-2xl">
        <p className="market-kicker flex items-center gap-2 text-[10.5px] uppercase tracking-[0.32em]">
          <SearchX className="h-4 w-4 text-[var(--market-brass)]" aria-hidden />
          {t("Order tracking")}
        </p>
        <h1 className="mt-4 text-balance text-[2rem] font-semibold leading-[1.08] tracking-[-0.02em] text-[var(--market-ink)] sm:text-[2.4rem] md:text-[2.8rem]">
          {t("We couldn't find that order")}
        </h1>
        <p className="mt-5 text-pretty text-base leading-[1.7] text-[var(--market-muted)]">
          {t(
            "That reference didn't match any order on record. A small typo in the code is easy to miss — check it against your order confirmation and try again below.",
          )}
        </p>

        <TrackAttemptedCode label={t("You searched for")} />

        <TrackLookupForm
          labels={{
            inputLabel: t("Order reference"),
            placeholder: t("e.g. MKT-2026-0001"),
            submit: t("Try again"),
            emptyError: t("Enter an order reference to continue."),
          }}
        />
      </section>

      <section
        aria-label={t("Need help finding your order?")}
        className="rounded-[1.5rem] border border-[var(--market-line)] bg-[var(--home-surface-02)] p-6"
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
