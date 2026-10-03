import type { Metadata } from "next";
import { CartExperience } from "@/components/marketplace/cart-experience";
import { EmptyState, PageIntro } from "@/components/marketplace/shell";
import { getCartPreview } from "@/lib/marketplace/data";
import { getMarketplacePublicLocale } from "@/lib/locale-server";
import { getMarketplacePublicCopy } from "@/lib/public-copy";
import { getMarketplaceTrustCopy } from "@henryco/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getMarketplacePublicLocale();
  const copy = getMarketplacePublicCopy(locale);
  return {
    title: copy.cart.pageIntro.title,
    description: copy.cart.pageIntro.description,
  };
}

export default async function CartPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [locale, cart, params] = await Promise.all([
    getMarketplacePublicLocale(),
    getCartPreview(),
    searchParams ?? Promise.resolve({} as Record<string, string | string[] | undefined>),
  ]);
  const copy = getMarketplacePublicCopy(locale);
  // Checkout sends the buyer back here when a cart line was taken down after it was
  // added (V3-MKT-TRUST-01). Only that code is ever set by the gate.
  const itemUnavailable = params.error === "item-unavailable" ? getMarketplaceTrustCopy(locale).buyer : null;

  return (
    <div className="mx-auto max-w-[1480px] space-y-8 px-4 py-8 sm:px-6 xl:px-8">
      <PageIntro
        kicker={copy.cart.pageIntro.kicker}
        title={copy.cart.pageIntro.title}
        description={copy.cart.pageIntro.description}
      />

      {itemUnavailable ? (
        <div
          role="status"
          className="market-paper rounded-[1.5rem] border border-[var(--market-line)] px-5 py-4"
        >
          <p className="text-sm font-semibold text-[var(--market-ink)]">{itemUnavailable.itemUnavailableTitle}</p>
          <p className="mt-1 text-sm leading-6 text-[var(--market-muted)]">{itemUnavailable.itemUnavailableBody}</p>
        </div>
      ) : null}

      {cart.items.length ? (
        <CartExperience />
      ) : (
        <EmptyState
          title={copy.cart.emptyState.title}
          body={copy.cart.emptyState.body}
          ctaHref="/search"
          ctaLabel={copy.cart.emptyState.ctaLabel}
        />
      )}
    </div>
  );
}
