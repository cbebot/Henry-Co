import Link from "next/link";
import { getAccountUrl } from "@henryco/config";
import { AlertCircle } from "lucide-react";
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
import { isMarketplaceCardCheckoutReady } from "@/lib/checkout/card-rail";

export const dynamic = "force-dynamic";

const CHECKOUT_ERROR_COPY: Record<string, { title: string; body: string }> = {
  "wallet-unavailable": {
    title: "Wallet isn't ready for marketplace debits yet",
    body: "Your Henry Onyx wallet isn't activated for direct payments. Pay by card, or top up your wallet first.",
  },
  "insufficient-balance": {
    title: "Wallet balance didn't cover the order",
    body: "Top up the shortfall, pay by card, or use cash on delivery if the order is eligible.",
  },
  "missing-bank-reference": {
    title: "Bank reference missing",
    body: "Add the bank receipt or reference number from your transfer so finance can match it cleanly.",
  },
  "missing-payment-proof": {
    title: "Payment proof missing",
    body: "Attach a screenshot or PDF of your transfer receipt — finance can't verify a transfer without evidence.",
  },
  "payment-proof-upload-failed": {
    title: "Proof didn't upload",
    body: "Try a smaller file (under 10 MB) or a different image format. PNG, JPG, WebP, and PDF are accepted.",
  },
  "wallet-changed": {
    title: "Wallet balance shifted mid-checkout",
    body: "Your wallet was updated while we were placing the order. Reload the page to confirm the latest balance, then submit again.",
  },
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const search = (await searchParams) ?? {};
  const errorKey = typeof search.error === "string" ? search.error : null;
  const errorCopy = errorKey ? CHECKOUT_ERROR_COPY[errorKey] ?? null : null;

  const [viewer, cart, shell] = await Promise.all([
    getMarketplaceViewer(),
    getCartPreview(),
    getMarketplaceShellState(),
  ]);

  if (!cart.items.length) {
    return (
      <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8">
        <EmptyState
          titleAs="h1"
          title="There is nothing to check out yet."
          body="Add products to your cart, or restore something you saved earlier."
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
          title="Sign in with your Henry Onyx account to continue."
        />
        <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
          <EmptyState
            title="Sign in required"
            body="Your cart is intact and waiting."
            ctaHref={buildSharedAccountLoginUrl("/checkout")}
            ctaLabel="Sign in to continue"
          />
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
        <div className="mx-auto max-w-[1480px] px-4 pt-8 sm:px-6 xl:px-8">
          <div
            role="alert"
            aria-live="polite"
            className="flex items-start gap-3 rounded-[1.4rem] border border-amber-400/30 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200/90">
                Order not placed
              </p>
              <p className="mt-1 text-sm font-semibold text-amber-50">{errorCopy.title}</p>
              <p className="mt-1 text-sm leading-6 text-amber-100/85">{errorCopy.body}</p>
            </div>
          </div>
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
        cardEnabled={isMarketplaceCardCheckoutReady()}
      />
    </>
  );
}
