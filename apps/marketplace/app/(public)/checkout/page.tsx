import Link from "next/link";
import { EmptyState, PageIntro } from "@/components/marketplace/shell";
import { getMarketplaceViewer } from "@/lib/marketplace/auth";
import { getCartPreview } from "@/lib/marketplace/data";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [viewer, cart] = await Promise.all([getMarketplaceViewer(), getCartPreview()]);

  if (!cart.items.length) {
    return (
      <div className="mx-auto max-w-[1480px] px-4 py-8 sm:px-6 xl:px-8">
        <EmptyState
          title="There is nothing to check out yet."
          body="Add products to the cart first, then return to the premium checkout flow with split-order clarity and payment-state visibility intact."
          ctaHref="/search"
          ctaLabel="Browse products"
        />
      </div>
    );
  }

  if (!viewer.user) {
    return (
      <div className="mx-auto max-w-[1280px] space-y-8 px-4 py-8 sm:px-6 xl:px-8">
        <PageIntro
          kicker="Checkout"
          title="Sign in to protect the order history, payment evidence, and dispute trail."
          description="Guest browsing stays open, but checkout is account-based so orders, payments, disputes, saved addresses, and notifications can flow into HenryCo’s future unified account layer."
        />
        <EmptyState
          title="Account sign-in required"
          body="Your cart is still waiting. Sign in and return here to keep the basket, payment trail, and future order tracking connected to the same HenryCo identity."
          ctaHref="/login?next=/checkout"
          ctaLabel="Sign in to continue"
        />
      </div>
    );
  }

  const estimatedShipping = cart.subtotal > 350000 ? 0 : 18000;

  return (
    <div className="mx-auto max-w-[1480px] space-y-8 px-4 py-8 sm:px-6 xl:px-8">
      <PageIntro
        kicker="Checkout"
        title="A clearer path from basket to confirmed order."
        description="Address, delivery, payment, and post-order traceability are separated into a cleaner flow so trust and clarity improve at the exact moment buyers decide to pay."
      />

      <section className="grid gap-6 xl:grid-cols-[1fr,380px]">
        <form action="/api/marketplace" method="POST" className="space-y-5">
          <input type="hidden" name="intent" value="checkout_submit" />
          <input type="hidden" name="return_to" value="/checkout" />
          <input type="hidden" name="cart_token" value={cart.token || ""} />

          <article className="rounded-[2rem] border border-[var(--market-line-strong)] bg-[var(--market-paper-white)] p-6 shadow-[0_20px_52px_rgba(28,24,18,0.06)] sm:p-8">
            <p className="market-kicker">Step 1</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--market-ink)]">Delivery details</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[var(--market-ink)]">Buyer name</span>
                <input
                  name="buyer_name"
                  defaultValue={viewer.user.fullName || ""}
                  className="market-input rounded-[1.2rem] px-4 py-3"
                  required
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[var(--market-ink)]">Phone</span>
                <input name="buyer_phone" className="market-input rounded-[1.2rem] px-4 py-3" required />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[var(--market-ink)]">City</span>
                <input name="shipping_city" className="market-input rounded-[1.2rem] px-4 py-3" required />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[var(--market-ink)]">Region / state</span>
                <input name="shipping_region" className="market-input rounded-[1.2rem] px-4 py-3" required />
              </label>
            </div>
          </article>

          <article className="rounded-[2rem] border border-[var(--market-line-strong)] bg-[var(--market-paper-white)] p-6 shadow-[0_20px_52px_rgba(28,24,18,0.06)] sm:p-8">
            <p className="market-kicker">Step 2</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--market-ink)]">Payment method</h2>
            <div className="mt-5 space-y-3">
              <label className="flex items-start gap-3 rounded-[1.5rem] border border-[var(--market-line)] bg-[var(--market-bg-elevated)] px-4 py-4">
                <input type="radio" name="payment_method" value="bank_transfer" defaultChecked />
                <span className="space-y-1">
                  <span className="block text-sm font-semibold text-[var(--market-ink)]">
                    Bank transfer with finance verification
                  </span>
                  <span className="block text-sm leading-7 text-[var(--market-muted)]">
                    Submit proof after transfer. Finance marks the order verified and notifications update the timeline.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-[1.5rem] border border-[var(--market-line)] bg-[var(--market-bg-elevated)] px-4 py-4">
                <input type="radio" name="payment_method" value="cod" />
                <span className="space-y-1">
                  <span className="block text-sm font-semibold text-[var(--market-ink)]">
                    Cash on delivery
                  </span>
                  <span className="block text-sm leading-7 text-[var(--market-muted)]">
                    Available where the vendor and inventory policy allow it. Acceptance still follows the same trust workflow.
                  </span>
                </span>
              </label>
            </div>
          </article>

          <article className="rounded-[2rem] border border-[var(--market-line-strong)] bg-[var(--market-paper-white)] p-6 shadow-[0_20px_52px_rgba(28,24,18,0.06)] sm:p-8">
            <p className="market-kicker">Step 3</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--market-ink)]">Confirm order</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">
              Place the order when delivery details and payment method look right. The tracking page will show payment state, split fulfillment, and the future dispute trail from the same order record.
            </p>
            <button className="market-button-primary mt-6 rounded-full px-5 py-3 text-sm font-semibold">
              Place order
            </button>
          </article>
        </form>

        <aside className="sticky top-28 h-fit rounded-[2rem] border border-[var(--market-line-strong)] bg-[var(--market-paper-white)] p-6 shadow-[0_20px_52px_rgba(28,24,18,0.06)]">
          <p className="market-kicker">Order review</p>
          <div className="mt-5 space-y-4">
            {cart.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-4 text-sm">
                <div>
                  <p className="font-semibold text-[var(--market-ink)]">{item.productSlug.replace(/-/g, " ")}</p>
                  <p className="mt-1 text-[var(--market-muted)]">Qty {item.quantity}</p>
                </div>
                <p className="font-semibold text-[var(--market-ink)]">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-3 border-t border-[var(--market-line)] pt-5 text-sm text-[var(--market-muted)]">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-[var(--market-ink)]">{formatCurrency(cart.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Shipping</span>
              <span className="font-semibold text-[var(--market-ink)]">
                {estimatedShipping ? formatCurrency(estimatedShipping) : "Free"}
              </span>
            </div>
            <div className="flex items-center justify-between text-base">
              <span className="font-semibold text-[var(--market-ink)]">Estimated total</span>
              <span className="font-semibold text-[var(--market-ink)]">
                {formatCurrency(cart.subtotal + estimatedShipping)}
              </span>
            </div>
          </div>
          <div className="mt-6 rounded-[1.5rem] border border-[var(--market-line)] bg-[var(--market-bg-elevated)] p-4 text-sm leading-7 text-[var(--market-muted)]">
            Payment reminders, verification updates, shipping notices, and dispute visibility all write back into the same order record.
          </div>
          <Link href="/trust" className="mt-6 inline-block text-sm font-semibold text-[var(--market-brass)]">
            Review trust and moderation standards
          </Link>
        </aside>
      </section>
    </div>
  );
}
