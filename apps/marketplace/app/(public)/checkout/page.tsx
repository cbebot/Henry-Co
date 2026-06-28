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
import { getMarketplacePublicLocale } from "@/lib/locale-server";
import { getMarketplaceCheckoutCopy } from "@henryco/i18n";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getMarketplacePublicLocale();
  const copy = getMarketplaceCheckoutCopy(locale);

  const errorCopyMap: Record<string, { title: string; body: string }> = {
    "wallet-unavailable": copy.checkoutPage.errors.walletUnavailable,
    "insufficient-balance": copy.checkoutPage.errors.insufficientBalance,
    "missing-bank-reference": copy.checkoutPage.errors.missingBankReference,
    "missing-payment-proof": copy.checkoutPage.errors.missingPaymentProof,
    "payment-proof-upload-failed": copy.checkoutPage.errors.proofUploadFailed,
    "wallet-changed": copy.checkoutPage.errors.walletChanged,
  };

  const search = (await searchParams) ?? {};
  const errorKey = typeof search.error === "string" ? search.error : null;
  const errorCopy = errorKey ? errorCopyMap[errorKey] ?? null : null;

  const [viewer, cart, shell] = await Promise.all([
    getMarketplaceViewer(),
    getCartPreview(),
    getMarketplaceShellState(),
  ]);

  if (!cart.items.length) {
    return (
      <div className="mx-auto max-w-[1480px] px-4 py-8 sm:px-6 xl:px-8">
        <EmptyState
          title={copy.checkoutPage.emptyCart.title}
          body={copy.checkoutPage.emptyCart.body}
          ctaHref="/search"
          ctaLabel={copy.checkoutPage.emptyCart.ctaLabel}
        />
        <div className="mx-auto mt-6 max-w-[640px] text-center text-sm text-[var(--market-muted)]">
          <Link
            href="/account/saved"
            className="inline-flex items-center gap-1 font-semibold text-[var(--market-brass)]"
          >
            {copy.checkoutPage.emptyCart.viewSaved}
          </Link>
        </div>
      </div>
    );
  }

  if (!viewer.user) {
    return (
      <div className="mx-auto max-w-[1280px] space-y-8 px-4 py-8 sm:px-6 xl:px-8">
        <PageIntro
          kicker={copy.checkoutPage.signIn.kicker}
          title={copy.checkoutPage.signIn.title}
          description={copy.checkoutPage.signIn.description}
        />
        <div className="grid gap-6 lg:grid-cols-[1.02fr,0.98fr]">
          <EmptyState
            title={copy.checkoutPage.signIn.emptyTitle}
            body={copy.checkoutPage.signIn.emptyBody}
            ctaHref={buildSharedAccountLoginUrl("/checkout")}
            ctaLabel={copy.checkoutPage.signIn.emptyCta}
          />
          <section className="market-paper rounded-[2rem] p-6 sm:p-8">
            <p className="market-kicker">{copy.checkoutPage.signIn.whyTitle}</p>
            <div className="mt-5 space-y-4">
              {[
                {
                  icon: LockKeyhole,
                  title: copy.checkoutPage.signIn.accountProtected.title,
                  body: copy.checkoutPage.signIn.accountProtected.body,
                },
                {
                  icon: ShieldCheck,
                  title: copy.checkoutPage.signIn.receipts.title,
                  body: copy.checkoutPage.signIn.receipts.body,
                },
                {
                  icon: WalletCards,
                  title: copy.checkoutPage.signIn.oneBasket.title,
                  body: copy.checkoutPage.signIn.oneBasket.body,
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
        <div className="mx-auto max-w-[1480px] px-4 pt-8 sm:px-6 xl:px-8">
          <div
            role="alert"
            aria-live="polite"
            className="flex items-start gap-3 rounded-[1.4rem] border border-amber-400/30 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200/90">
                {copy.checkoutPage.errors.orderNotPlaced}
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
      />
    </>
  );
}
