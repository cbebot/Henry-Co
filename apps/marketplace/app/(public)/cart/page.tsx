import { CartExperience } from "@/components/marketplace/cart-experience";
import { EmptyState, PageIntro } from "@/components/marketplace/shell";
import { getCartPreview } from "@/lib/marketplace/data";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const cart = await getCartPreview();

  return (
    <div className="mx-auto max-w-[1480px] space-y-8 px-4 py-8 sm:px-6 xl:px-8">
      <PageIntro
        kicker="Cart"
        title="A premium basket with faster edits and cleaner split-order clarity."
        description="The cart now keeps vendor grouping visible, updates quantity quickly, and stays connected to the mini-cart drawer so buyers never lose context when they are close to checkout."
      />

      {cart.items.length ? (
        <CartExperience />
      ) : (
        <EmptyState
          title="Your cart is still empty."
          body="Quick-add from product cards, save items for later, and the basket will stay updated in the mini-cart drawer and the full cart without a hard refresh."
          ctaHref="/search"
          ctaLabel="Browse products"
        />
      )}
    </div>
  );
}
