import Link from "next/link";
import { LockKeyhole, ShieldCheck, WalletCards } from "lucide-react";
import {
  emitEngagementEvent,
  recordCartRecoveryState,
} from "@henryco/cart-saved-items/server";
import { EmptyState, PageIntro } from "@/components/marketplace/shell";
import { CheckoutExperience } from "@/components/marketplace/checkout-experience";
import { getMarketplaceViewer } from "@/lib/marketplace/auth";
import { getCartPreview, getMarketplaceShellState } from "@/lib/marketplace/data";
import {
  getMarketplacePaymentRail,
  getMarketplaceWalletSnapshot,
  makeMarketplacePaymentReference,
} from "@/lib/marketplace/payment";
import { getMarketplaceAddresses } from "@/lib/marketplace/addresses";
import { buildSharedAccountLoginUrl } from "@/lib/marketplace/shared-account";
import { createAdminSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [viewer, cart, shell] = await Promise.all([
    getMarketplaceViewer(),
    getCartPreview(),
    getMarketplaceShellState(),
  ]);

  if (!cart.items.length) {
    return (
      <div className="mx-auto max-w-[1480px] px-4 py-8 sm:px-6 xl:px-8">
        <EmptyState
          title="There is nothing to check out yet."
          body="Add products to your cart, or restore something you saved earlier — your saved items keep the price you locked in."
          ctaHref="/search"
          ctaLabel="Browse products"
        />
        <div className="mx-auto mt-6 max-w-[640px] text-center text-sm text-[var(--market-muted)]">
          <Link
            href="/account/saved"
            className="inline-flex items-center gap-1 font-semibold text-[var(--market-brass)]"
          >
            View saved items →
          </Link>
        </div>
      </div>
    );
  }

  if (!viewer.user) {
    return (
      <div className="mx-auto max-w-[1280px] space-y-8 px-4 py-8 sm:px-6 xl:px-8">
        <PageIntro
          kicker="Checkout"
          title="Sign in with your HenryCo account to continue."
          description="Browsing stays open, but checkout uses your HenryCo account so orders, payments, addresses, notifications, and support history stay together — across every device, every session."
        />
        <div className="grid gap-6 lg:grid-cols-[1.02fr,0.98fr]">
          <EmptyState
            title="Sign in required"
            body="Your cart is intact and waiting. Sign in once and we'll bring you back to this exact step."
            ctaHref={buildSharedAccountLoginUrl("/checkout")}
            ctaLabel="Sign in to continue"
          />
          <section className="market-paper rounded-[2rem] p-6 sm:p-8">
            <p className="market-kicker">Why HenryCo checkout</p>
            <div className="mt-5 space-y-4">
              {[
                {
                  icon: LockKeyhole,
                  title: "Account-protected",
                  body: "Your card, address, and order history live in one HenryCo account — never re-keyed across surfaces.",
                },
                {
                  icon: ShieldCheck,
                  title: "Receipts and disputes in one place",
                  body: "Payment proofs, delivery proof, returns, and seller messages stay tied to the same order record.",
                },
                {
                  icon: WalletCards,
                  title: "One basket, every session",
                  body: "Walk away mid-checkout — the cart waits for you. Across phone, tablet, and laptop.",
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

  const [addresses, paymentRail, wallet] = await Promise.all([
    getMarketplaceAddresses(viewer.user.id),
    getMarketplacePaymentRail(),
    getMarketplaceWalletSnapshot(viewer.user.id),
  ]);

  // V2-CART-01 — record recovery state + engagement signal so the user can
  // resume from any device / surface. Best-effort; never blocks the page.
  try {
    const admin = createAdminSupabase();
    await Promise.all([
      recordCartRecoveryState(admin, viewer.user.id, {
        division: "marketplace",
        surface: "/checkout",
        cartToken: cart.token ?? null,
        itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
        // marketplace stores prices in major units; persist kobo for cross-division formatters.
        subtotalKobo: Math.round(cart.subtotal * 100),
      }),
      emitEngagementEvent(admin, {
        userId: viewer.user.id,
        eventType: "checkout_started",
        division: "marketplace",
        subjectType: "cart",
        subjectId: cart.token ?? viewer.user.id,
        dedupeKey: `checkout_started:${viewer.user.id}`,
        payload: {
          itemCount: cart.items.length,
          subtotal: cart.subtotal,
        },
      }),
    ]);
  } catch {
    // engagement signals are non-blocking
  }

  return (
    <CheckoutExperience
      cart={shell.cart}
      cartToken={cart.token ?? null}
      addresses={addresses}
      paymentRail={paymentRail}
      wallet={wallet}
      paymentReference={makeMarketplacePaymentReference()}
      buyer={{
        fullName: viewer.user.fullName ?? null,
        email: viewer.user.email ?? null,
      }}
    />
  );
}
