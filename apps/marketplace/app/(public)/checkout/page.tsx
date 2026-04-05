import Link from "next/link";
import { LockKeyhole, ShieldCheck, WalletCards } from "lucide-react";
import { EmptyState, PageIntro } from "@/components/marketplace/shell";
import { getMarketplaceViewer } from "@/lib/marketplace/auth";
import { getCartPreview } from "@/lib/marketplace/data";
import { buildSharedAccountLoginUrl } from "@/lib/marketplace/shared-account";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [viewer, cart] = await Promise.all([getMarketplaceViewer(), getCartPreview()]);

  if (!cart.items.length) {
    return (
      <div className="mx-auto max-w-[1480px] px-4 py-8 sm:px-6 xl:px-8">
        <EmptyState
          title="There is nothing to check out yet."
          body="Add products to your cart first, then return here to complete checkout with delivery and payment details in one place."
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
          title="Sign in with your HenryCo account to protect your order history and payment record."
          description="Browsing stays open, but checkout uses your HenryCo account so orders, payments, addresses, notifications, and support updates stay together."
        />
        <div className="grid gap-6 lg:grid-cols-[1.02fr,0.98fr]">
          <EmptyState
            title="Sign in required"
            body="Your cart is still waiting. Sign in once and return here with the same HenryCo account that will hold your order timeline, payment updates, and support history."
            ctaHref={buildSharedAccountLoginUrl("/checkout")}
            ctaLabel="Sign in to continue"
          />
          <section className="market-paper rounded-[2rem] p-6 sm:p-8">
            <p className="market-kicker">Why checkout stays account-based</p>
            <div className="mt-5 space-y-4">
              {[
                {
                  icon: LockKeyhole,
                title: "Account-based security",
                  body: "Checkout uses your HenryCo account so your order stays protected from sign-in to delivery.",
                },
                {
                  icon: ShieldCheck,
                title: "Payment and support history",
                  body: "Payment instructions, reminders, disputes, and support replies stay tied to the same order record.",
                },
                {
                  icon: WalletCards,
                title: "One place to return to",
                  body: "Orders, payments, addresses, notifications, wishlist, and followed stores stay together in one account.",
                },
              ].map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="rounded-[1.5rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] p-4"
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.05)] text-[var(--market-brass)]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="mt-3 text-base font-semibold text-[var(--market-paper-white)]">{title}</p>
                  <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">{body}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  const estimatedShipping = cart.subtotal > 350000 ? 0 : 18000;

  return (
    <div className="mx-auto max-w-[1480px] space-y-8 px-4 py-8 sm:px-6 xl:px-8">
      <PageIntro
        kicker="Checkout"
        title="A clearer path from basket to confirmed order."
        description="Address, delivery, payment, and post-order traceability are separated into a cleaner dark-glass flow so confidence rises exactly when buyers decide to pay."
      />

      <section className="grid gap-6 xl:grid-cols-[1fr,400px]">
        <form action="/api/marketplace" method="POST" className="space-y-5">
          <input type="hidden" name="intent" value="checkout_submit" />
          <input type="hidden" name="return_to" value="/checkout" />
          <input type="hidden" name="cart_token" value={cart.token || ""} />

          <article className="market-panel rounded-[2rem] p-6 sm:p-8">
            <p className="market-kicker">Step 1</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--market-paper-white)]">
              Delivery details
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[var(--market-paper-white)]">Buyer name</span>
                <input
                  name="buyer_name"
                  defaultValue={viewer.user.fullName || ""}
                  className="market-input rounded-[1.2rem] px-4 py-3"
                  required
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[var(--market-paper-white)]">Phone</span>
                <input name="buyer_phone" className="market-input rounded-[1.2rem] px-4 py-3" required />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[var(--market-paper-white)]">City</span>
                <input name="shipping_city" className="market-input rounded-[1.2rem] px-4 py-3" required />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[var(--market-paper-white)]">Region / state</span>
                <input name="shipping_region" className="market-input rounded-[1.2rem] px-4 py-3" required />
              </label>
            </div>
          </article>

          <article className="market-paper rounded-[2rem] p-6 sm:p-8">
            <p className="market-kicker">Step 2</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--market-paper-white)]">
              Payment method
            </h2>
            <div className="mt-5 space-y-3">
              <label className="flex items-start gap-3 rounded-[1.5rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-4 py-4">
                <input type="radio" name="payment_method" value="bank_transfer" defaultChecked />
                <span className="space-y-1">
                  <span className="block text-sm font-semibold text-[var(--market-paper-white)]">
                    Bank transfer
                  </span>
                  <span className="block text-sm leading-7 text-[var(--market-muted)]">
                    Upload your receipt after transfer. The payment team reviews it and your order timeline updates across notifications and tracking.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-[1.5rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-4 py-4">
                <input type="radio" name="payment_method" value="cod" />
                <span className="space-y-1">
                  <span className="block text-sm font-semibold text-[var(--market-paper-white)]">
                    Cash on delivery
                  </span>
                  <span className="block text-sm leading-7 text-[var(--market-muted)]">
                    Available on eligible orders only. Seller acceptance and delivery updates will still appear in the same order timeline.
                  </span>
                </span>
              </label>
            </div>
          </article>

          <article className="market-paper rounded-[2rem] p-6 sm:p-8">
            <p className="market-kicker">Step 3</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--market-paper-white)]">
              Confirm order
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">
              Place the order once your delivery details and payment method look right. Tracking will show payment updates, split fulfillment, reminders, and support history from the same order record.
            </p>
            <button className="market-button-primary mt-6 rounded-full px-5 py-3 text-sm font-semibold">
              Place order
            </button>
          </article>
        </form>

        <aside className="market-panel sticky top-28 h-fit rounded-[2rem] p-6">
          <p className="market-kicker">Order review</p>
          <div className="mt-5 space-y-4">
            {cart.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-4 text-sm">
                <div>
                  <p className="font-semibold text-[var(--market-paper-white)]">
                    {item.productSlug.replace(/-/g, " ")}
                  </p>
                  <p className="mt-1 text-[var(--market-muted)]">Qty {item.quantity}</p>
                </div>
                <p className="font-semibold text-[var(--market-paper-white)]">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-3 border-t border-[var(--market-line)] pt-5 text-sm text-[var(--market-muted)]">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-[var(--market-paper-white)]">{formatCurrency(cart.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Shipping</span>
              <span className="font-semibold text-[var(--market-paper-white)]">
                {estimatedShipping ? formatCurrency(estimatedShipping) : "Free"}
              </span>
            </div>
            <div className="flex items-center justify-between text-base">
              <span className="font-semibold text-[var(--market-paper-white)]">Estimated total</span>
              <span className="font-semibold text-[var(--market-paper-white)]">
                {formatCurrency(cart.subtotal + estimatedShipping)}
              </span>
            </div>
          </div>
          <div className="mt-6 rounded-[1.5rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] p-4 text-sm leading-7 text-[var(--market-muted)]">
            Payment reminders, review updates, shipping notices, and support history all stay in the same order timeline.
          </div>
          <Link href="/trust" className="mt-6 inline-block text-sm font-semibold text-[var(--market-brass)]">
            Review trust and moderation standards
          </Link>
        </aside>
      </section>
    </div>
  );
}
