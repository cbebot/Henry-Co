import Link from "next/link";
import { getAccountUrl } from "@henryco/config";
import { AlertCircle, LockKeyhole, ShieldCheck, WalletCards } from "lucide-react";
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

const CHECKOUT_ERROR_COPY: Record<string, { title: string; body: string }> = {
  "wallet-unavailable": {
    title: "Wallet didn't respond cleanly.",
    body: "Switch to bank transfer to keep moving, or try again — your cart and progress are intact.",
  },
  "insufficient-balance": {
    title: "Wallet balance is short of the order total.",
    body: "Top up the difference, or switch to bank transfer. Your delivery details are still saved.",
  },
  "wallet-changed": {
    title: "Wallet balance shifted mid-submission.",
    body: "A debit landed between your review and our charge. Refresh and try again, or switch payment method.",
  },
  "missing-bank-reference": {
    title: "We need the bank reference number.",
    body: "Enter the reference from your bank receipt so finance can match the transfer to this order.",
  },
  "missing-payment-proof": {
    title: "We need the transfer proof attached.",
    body: "Attach the screenshot or PDF — finance matches it against the bank rail before the order moves.",
  },
  "payment-proof-upload-failed": {
    title: "Upload didn't complete.",
    body: "Reattach the file. PNG, JPG, WebP, or PDF, under 10 MB.",
  },
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const query = (await (searchParams ?? Promise.resolve({}))) as { error?: string };
  const errorCopy = query.error ? CHECKOUT_ERROR_COPY[query.error] : null;
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
    <>
      {errorCopy ? (
        <div className="mx-auto max-w-[1480px] px-4 pt-6 sm:px-6 xl:px-8">
          <CheckoutErrorNotice title={errorCopy.title} body={errorCopy.body} />
        </div>
      ) : null}
      <CheckoutExperience
        cart={shell.cart}
        cartToken={cart.token ?? null}
        addresses={addresses}
        paymentRail={paymentRail}
        wallet={wallet}
        paymentReference={makeMarketplacePaymentReference()}
        walletTopUpHref={getAccountUrl("/wallet/funding")}
        buyer={{
          fullName: viewer.user.fullName ?? null,
          email: viewer.user.email ?? null,
        }}
      />
    </>
  );
}

function CheckoutErrorNotice({ title, body }: { title: string; body: string }) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex items-start gap-3 rounded-[1.4rem] border border-amber-400/30 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div>
        <p className="font-semibold text-[var(--market-paper-white)]">{title}</p>
        <p className="mt-1 text-amber-100/90">{body}</p>
      </div>
    </div>
  );
}
