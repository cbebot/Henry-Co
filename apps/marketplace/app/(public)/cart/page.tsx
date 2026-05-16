import type { Metadata } from "next";
import { CartExperience } from "@/components/marketplace/cart-experience";
import { EmptyState, PageIntro } from "@/components/marketplace/shell";
import { getCartPreview } from "@/lib/marketplace/data";
import { getMarketplacePublicLocale } from "@/lib/locale-server";
import { getMarketplacePublicCopy } from "@/lib/public-copy";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getMarketplacePublicLocale();
  const copy = getMarketplacePublicCopy(locale);
  return {
    title: copy.cart.pageIntro.title,
    description: copy.cart.pageIntro.description,
  };
}

export default async function CartPage() {
  const [locale, cart] = await Promise.all([
    getMarketplacePublicLocale(),
    getCartPreview(),
  ]);
  const copy = getMarketplacePublicCopy(locale);

  return (
    <div className="mx-auto max-w-[1480px] space-y-8 px-4 py-8 sm:px-6 xl:px-8">
      <PageIntro
        kicker={copy.cart.pageIntro.kicker}
        title={copy.cart.pageIntro.title}
        description={copy.cart.pageIntro.description}
      />

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
