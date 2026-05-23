"use client";

import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DivisionImage, ActionButton } from "@henryco/dashboard-shell/components";
import Link from "next/link";
import {
  AlertCircle,
  Banknote,
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Loader2,
  Lock,
  RefreshCw,
  Truck,
  UploadCloud,
  Wallet,
} from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { useFormDraft } from "@henryco/lifecycle/drafts";
import { useKeyboardAvoidance } from "@henryco/ui/mobile";
import type { UserAddressRecord } from "@henryco/address-selector";
import { useMarketplaceCart } from "@/components/marketplace/runtime-provider";
import { formatCurrency } from "@/lib/utils";

type CheckoutStep = "delivery" | "payment" | "confirm";

const STEP_IDS: CheckoutStep[] = ["delivery", "payment", "confirm"];

/**
 * Persisted user-input shape for the checkout draft.
 *
 * Captures only what the user explicitly typed or selected — the cart
 * contents, addresses book, payment-rail config, wallet snapshot, and
 * `buyer` identity are all server-fetched runtime data and stay out of
 * the draft. The `proofName` (display-only filename for the upload
 * field) is also excluded because the underlying `File` object is lost
 * on reload — restoring just the name would mislead the user into
 * thinking proof was still attached. Card-sensitive data NEVER enters
 * the DOM in this flow (bank transfer + wallet + COD only), so
 * `paymentMethod` here is a method id, never card data.
 *
 * Schema versioned at 1; bump if shape changes.
 */
type CheckoutDraft = {
  step: CheckoutStep;
  selectedAddressId: string | null;
  oneShot: { fullName: string; phone: string; city: string; region: string; line1: string };
  usingOneShot: boolean;
  phoneOverride: string;
  paymentMethod: PaymentMethodId;
  bankReference: string;
};

function buildSteps(t: (s: string) => string): Array<{ id: CheckoutStep; label: string; description: string }> {
  return [
    {
      id: "delivery",
      label: t("Delivery"),
      description: t("Where the order arrives"),
    },
    {
      id: "payment",
      label: t("Payment"),
      description: t("How you'll settle"),
    },
    {
      id: "confirm",
      label: t("Confirm"),
      description: t("Final review"),
    },
  ];
}

type PaymentMethodId = "wallet_balance" | "bank_transfer" | "cod";

/**
 * RELIABILITY-01 — payment-proof upload state machine.
 *
 * - `idle`: no file picked yet
 * - `validating`: client-side size/MIME check in flight (sync, mostly
 *   instantaneous, but expressed as a state to keep the UI honest)
 * - `uploading`: fetch to /api/checkout/payment-proof is open
 * - `uploaded`: server returned `{ ok, url, public_id, name }` —
 *   `paymentReady` is satisfied for bank_transfer once we hit this
 * - `error`: server returned a structured envelope (or fetch threw);
 *   `code` distinguishes user-action failures from transient
 *   Cloudinary outages so the UI can offer a retry hint
 */
export type ProofUploaded = { url: string; publicId: string; name: string };
export type ProofStatus =
  | { status: "idle" }
  | { status: "validating" }
  | { status: "uploading" }
  | { status: "uploaded"; data: ProofUploaded }
  | {
      status: "error";
      message: string;
      code:
        | "missing_file"
        | "invalid_type"
        | "too_large"
        | "cloudinary_unavailable"
        | "internal_error"
        | "network";
    };

function buildPaymentMethods(t: (s: string) => string): Array<{
  id: PaymentMethodId;
  label: string;
  description: string;
  icon: typeof Wallet;
}> {
  return [
    {
      id: "wallet_balance",
      label: t("HenryCo balance"),
      description: t(
        "Use cleared HenryCo wallet funds immediately. The order is marked paid only after the balance debit succeeds.",
      ),
      icon: Wallet,
    },
    {
      id: "bank_transfer",
      label: t("Bank transfer"),
      description: t(
        "Pay by transfer, upload proof, and the payment team verifies. The order timeline updates in real time.",
      ),
      icon: Banknote,
    },
    {
      id: "cod",
      label: t("Cash on delivery"),
      description: t(
        "Available on eligible orders only. Pay the rider when the order arrives — seller acceptance still confirms first.",
      ),
      icon: Wallet,
    },
  ];
}

type PaymentRailShape = {
  bankName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  currency: string;
  instructions: string;
  supportEmail: string | null;
  supportWhatsApp: string | null;
  ready: boolean;
  source: string;
};

type WalletShape = {
  walletId: string | null;
  balanceKobo: number;
  pendingWithdrawalKobo: number;
  availableKobo: number;
  currency: string;
  isActive: boolean;
  issue: string | null;
};

type CartShape = {
  count: number;
  subtotal: number;
  items: Array<{
    id: string;
    productSlug: string;
    title: string;
    quantity: number;
    price: number;
    compareAtPrice: number | null;
    currency: string;
    image: string | null;
    vendorName: string | null;
    inventoryOwnerType: "company" | "vendor";
    deliveryNote: string;
  }>;
};

export function CheckoutExperience({
  cart,
  cartToken,
  addresses,
  paymentRail,
  wallet,
  paymentReference,
  walletTopUpHref,
  buyer,
}: {
  cart: CartShape;
  cartToken: string | null;
  addresses: UserAddressRecord[];
  paymentRail: PaymentRailShape;
  wallet: WalletShape;
  paymentReference: string;
  walletTopUpHref: string;
  buyer: { fullName: string | null; email: string | null };
}) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const { moveCartItemToSaved, pendingSavedItemIds } = useMarketplaceCart();
  // V3-09(S2) — Keyboard avoidance for the mobile checkout flow.
  // Telemetry surface label is shared across all three steps so the
  // event cardinality stays one label per checkout (not three).
  useKeyboardAvoidance({ surface: "marketplace_checkout" });
  const subtotal = cart.subtotal;
  const shipping = subtotal > 350000 ? 0 : 18000;
  const total = subtotal + shipping;
  const currency = cart.items[0]?.currency || "NGN";
  const totalKobo = Math.max(0, Math.round(total * 100));
  const walletCanPay = wallet.isActive && Boolean(wallet.walletId) && wallet.availableKobo >= totalKobo;

  // V3-01 form-draft envelope — survives refresh + reauth round-trip.
  // Initial values mirror the prior useState defaults (so first-paint
  // behaviour is identical when no draft exists). On mount, the hook
  // restores the persisted envelope if one is found.
  const initialDraft = useMemo<CheckoutDraft>(
    () => ({
      step: "delivery",
      selectedAddressId: addresses.find((a) => a.is_default)?.id ?? addresses[0]?.id ?? null,
      oneShot: {
        fullName: buyer.fullName ?? "",
        phone: "",
        city: "",
        region: "",
        line1: "",
      },
      usingOneShot: addresses.length === 0,
      phoneOverride: "",
      paymentMethod: walletCanPay ? "wallet_balance" : "bank_transfer",
      bankReference: "",
    }),
    // Initial value is captured once on mount; subsequent prop changes
    // (cart total flipping walletCanPay, addresses arriving) are
    // handled by the live useEffect below — they should NOT re-seed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const draft = useFormDraft<CheckoutDraft>("marketplace-checkout", initialDraft);
  const {
    step,
    selectedAddressId,
    oneShot,
    usingOneShot,
    phoneOverride,
    paymentMethod,
    bankReference,
  } = draft.value;

  // Per-field setters that update the single draft envelope. Each
  // matches the signature the existing child-component props expect
  // (no functional setters needed — DeliveryStep's `setUsingOneShot`
  // is the one exception and gets the React.Dispatch shape below).
  const setStep = useCallback(
    (next: CheckoutStep) =>
      draft.setValue((prev) => (prev.step === next ? prev : { ...prev, step: next })),
    [draft],
  );
  const setSelectedAddressId = useCallback(
    (next: string | null) =>
      draft.setValue((prev) =>
        prev.selectedAddressId === next ? prev : { ...prev, selectedAddressId: next },
      ),
    [draft],
  );
  const setOneShot = useCallback(
    (next: CheckoutDraft["oneShot"]) =>
      draft.setValue((prev) => ({ ...prev, oneShot: next })),
    [draft],
  );
  const setUsingOneShot = useCallback<React.Dispatch<React.SetStateAction<boolean>>>(
    (next) =>
      draft.setValue((prev) => {
        const resolved = typeof next === "function" ? next(prev.usingOneShot) : next;
        return prev.usingOneShot === resolved ? prev : { ...prev, usingOneShot: resolved };
      }),
    [draft],
  );
  const setPhoneOverride = useCallback(
    (next: string) =>
      draft.setValue((prev) =>
        prev.phoneOverride === next ? prev : { ...prev, phoneOverride: next },
      ),
    [draft],
  );
  const setPaymentMethod = useCallback(
    (next: PaymentMethodId) =>
      draft.setValue((prev) =>
        prev.paymentMethod === next ? prev : { ...prev, paymentMethod: next },
      ),
    [draft],
  );
  const setBankReference = useCallback(
    (next: string) =>
      draft.setValue((prev) =>
        prev.bankReference === next ? prev : { ...prev, bankReference: next },
      ),
    [draft],
  );

  // `proofName` is the display name of the bank-transfer proof upload.
  // We deliberately KEEP this out of the persisted draft — the
  // underlying File object is lost on reload, so restoring just the
  // name would mislead the user into thinking proof was still
  // attached. Plain useState here.
  const [proofName, setProofName] = useState("");

  // RELIABILITY-01 — proof upload state machine. Until the upload
  // settles to `uploaded`, the payment step is NOT considered ready;
  // this prevents the prior bug where the user submitted with only a
  // filename (no File) reaching the server. The `uploaded` payload
  // mirrors the JSON the new /api/checkout/payment-proof route returns
  // and is forwarded into the order-submit form as hidden fields, so
  // the marketplace route can persist the Cloudinary URL directly
  // without re-uploading. ProofStatus / ProofUploaded are declared at
  // module scope so the PaymentStep child can reference them too.
  const [proofState, setProofState] = useState<ProofStatus>({ status: "idle" });

  // Stable ref so the upload helper can be cancelled if the user picks
  // a new file mid-flight. AbortController is created per attempt and
  // the previous one is aborted before a new upload starts.
  const proofAbortRef = useRef<AbortController | null>(null);

  // UI lock during submit; not user-input — plain useState.
  const [submitting, setSubmitting] = useState(false);
  // Marketplace policy consent; reset each session, not persisted —
  // matches the prior behaviour (the previous manual draft also did
  // not store this field).
  const [agreed, setAgreed] = useState(true);

  const formRef = useRef<HTMLFormElement>(null);

  // When the wallet/payment-rail availability changes (e.g. cart total
  // moves the user across the wallet-can-pay threshold), nudge the
  // selected method into a valid choice. Preserved verbatim from the
  // pre-draft version of this component.
  useEffect(() => {
    if (paymentMethod === "wallet_balance" && !walletCanPay) {
      setPaymentMethod("bank_transfer");
    }
    if (paymentMethod === "bank_transfer" && !paymentRail.ready && walletCanPay) {
      setPaymentMethod("wallet_balance");
    }
  }, [paymentMethod, paymentRail.ready, walletCanPay, setPaymentMethod]);

  // If the saved address from a restored draft is no longer in the
  // user's address book (deleted on another device, list refreshed
  // from server), drop the stale id. Preserves the prior guard that
  // only restored a known address.
  useEffect(() => {
    if (
      selectedAddressId !== null &&
      !addresses.some((a) => a.id === selectedAddressId)
    ) {
      setSelectedAddressId(null);
    }
  }, [addresses, selectedAddressId, setSelectedAddressId]);

  const selectedAddress = useMemo(
    () => addresses.find((a) => a.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId]
  );

  const proofUploaded = proofState.status === "uploaded" ? proofState.data : null;
  const proofUploading =
    proofState.status === "uploading" || proofState.status === "validating";

  const paymentReady =
    paymentMethod === "wallet_balance"
      ? walletCanPay
      : paymentMethod === "bank_transfer"
      ? paymentRail.ready && Boolean(bankReference.trim()) && Boolean(proofUploaded)
      : true;

  // RELIABILITY-01 — client-side proof upload. Triggered the moment the
  // user picks a file: validates size + MIME inline, then POSTs the
  // file to /api/checkout/payment-proof which uploads to Cloudinary and
  // returns `{ ok, url, public_id, name }`. The result is held in
  // `proofState` until the user clicks "Place order", at which point
  // the URL is forwarded to /api/marketplace via hidden form fields
  // (proof_url / proof_public_id / proof_name) — the server skips its
  // own Cloudinary round-trip when those are present.
  //
  // Failure path: surface the structured error (with retriable hint
  // when the route returned the `degraded: ['cloudinary_unavailable']`
  // envelope) so the user can decide whether to retry or pick a
  // different file. Never silently swallow — every failure flips
  // `proofState` into the `error` branch with a visible message.
  // `t` is recreated every render but closes over the stable `locale`,
  // so depending on `locale` here gives us identical semantics with a
  // stable callback identity (one re-bind per locale switch, not per
  // render). See note on the existing `initialDraft` useMemo above —
  // same pattern is used elsewhere in this file.
  const uploadProof = useCallback(async (file: File) => {
    // Inline client-side validation — kept identical to the server
    // contract so the user can fix violations without a round-trip.
    const ALLOWED = new Set([
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ]);
    const MAX = 10 * 1024 * 1024;

    setProofState({ status: "validating" });
    setProofName(file.name);

    if (!ALLOWED.has((file.type || "").toLowerCase())) {
      setProofState({
        status: "error",
        code: "invalid_type",
        message: "Upload a PNG, JPG, WebP, or PDF file.",
      });
      return;
    }
    if (file.size > MAX) {
      setProofState({
        status: "error",
        code: "too_large",
        message: "File is larger than 10 MB.",
      });
      return;
    }

    // Abort any prior in-flight upload before starting a new one — the
    // user picked a different file, so the old upload's result is no
    // longer interesting.
    proofAbortRef.current?.abort();
    const controller = new AbortController();
    proofAbortRef.current = controller;

    setProofState({ status: "uploading" });

    const body = new FormData();
    body.set("proof", file, file.name);

    try {
      const response = await fetch("/api/checkout/payment-proof", {
        method: "POST",
        body,
        signal: controller.signal,
        credentials: "include",
      });

      const json: unknown = await response.json().catch(() => null);

      if (!response.ok || !json || typeof json !== "object") {
        const errPayload = (json ?? {}) as {
          error?: string;
          code?:
            | "missing_file"
            | "invalid_type"
            | "too_large"
            | "cloudinary_unavailable"
            | "internal_error";
        };
        setProofState({
          status: "error",
          code: errPayload.code ?? "internal_error",
          message:
            errPayload.error ??
            (response.status === 503
              ? t("Proof upload is temporarily unavailable. Please retry.")
              : t("Could not upload proof. Please try again.")),
        });
        return;
      }

      const ok = json as {
        ok?: boolean;
        url?: string;
        public_id?: string;
        name?: string;
        error?: string;
        code?:
          | "missing_file"
          | "invalid_type"
          | "too_large"
          | "cloudinary_unavailable"
          | "internal_error";
      };

      if (!ok.ok || !ok.url || !ok.public_id) {
        setProofState({
          status: "error",
          code: ok.code ?? "internal_error",
          message: ok.error ?? t("Proof upload did not complete. Please retry."),
        });
        return;
      }

      setProofState({
        status: "uploaded",
        data: { url: ok.url, publicId: ok.public_id, name: ok.name ?? file.name },
      });
    } catch (err) {
      // AbortError is a signal that a NEW upload is in flight — the
      // newer upload will set its own state; do nothing here so we
      // don't clobber an in-flight "uploading" state.
      if (err instanceof DOMException && err.name === "AbortError") return;
      setProofState({
        status: "error",
        code: "network",
        message: t("Could not reach proof upload. Check your connection and retry."),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  // If the user changes payment method away from bank_transfer, clear
  // the proof state so a stale upload doesn't leak into a subsequent
  // bank-transfer attempt with a different cart total.
  useEffect(() => {
    if (paymentMethod !== "bank_transfer" && proofState.status !== "idle") {
      proofAbortRef.current?.abort();
      setProofState({ status: "idle" });
      setProofName("");
    }
  }, [paymentMethod, proofState.status]);

  // Cleanup on unmount — abort any in-flight upload so the fetch
  // doesn't resolve into a setState on a torn-down component.
  useEffect(() => {
    return () => {
      proofAbortRef.current?.abort();
    };
  }, []);

  const deliveryReady = useMemo(() => {
    if (usingOneShot) {
      return Boolean(
        oneShot.fullName.trim() &&
          oneShot.phone.trim() &&
          oneShot.city.trim() &&
          oneShot.region.trim() &&
          oneShot.line1.trim()
      );
    }
    return Boolean(selectedAddress);
  }, [usingOneShot, oneShot, selectedAddress]);

  function next() {
    if (step === "delivery" && !deliveryReady) return;
    if (step === "payment" && !paymentReady) return;
    setStep(step === "delivery" ? "payment" : step === "payment" ? "confirm" : step);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function back() {
    setStep(step === "confirm" ? "payment" : step === "payment" ? "delivery" : step);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function placeOrder() {
    if (submitting) return;
    if (!agreed) return;
    // RELIABILITY-01 — bank transfer requires a SUCCESSFUL proof upload
    // (status === "uploaded"), not merely a selected file. The
    // `paymentReady` check already gates on this, but we keep the
    // method-specific guard explicit so a future refactor doesn't
    // accidentally drop the precondition.
    if (paymentMethod === "bank_transfer" && proofState.status !== "uploaded") {
      setStep("payment");
      return;
    }
    if (!paymentReady) {
      setStep("payment");
      return;
    }
    setSubmitting(true);
    // The form posts traditionally so we keep the existing api/marketplace
    // server contract — submitting=true just locks the UI for the duration.
    // For bank_transfer, the proof_url / proof_public_id / proof_name
    // hidden fields below carry the pre-uploaded result so the
    // marketplace route doesn't have to re-upload.
    formRef.current?.requestSubmit();
  }

  const buyerName = usingOneShot ? oneShot.fullName : selectedAddress?.full_name || buyer.fullName || "";
  const phone = usingOneShot ? oneShot.phone : selectedAddress?.phone || phoneOverride;
  const shippingCity = usingOneShot ? oneShot.city : selectedAddress?.city || "";
  const shippingRegion = usingOneShot ? oneShot.region : selectedAddress?.state || "";
  const shippingLine1 = usingOneShot ? oneShot.line1 : selectedAddress?.street || "";

  return (
    <div className="mx-auto max-w-[1480px] space-y-8 px-4 py-8 sm:px-6 xl:px-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="market-kicker">{t("Checkout")}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--market-paper-white)] sm:text-4xl">
            {t("Three measured steps. No surprises.")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--market-muted)]">
            {t("Save items for later at any point — your basket waits, your prices hold, and the timeline updates the moment payment lands.")}
          </p>
        </div>
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 self-start rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)] hover:text-[var(--market-paper-white)] sm:self-auto"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {t("Edit cart")}
        </Link>
      </header>

      {/* Stepper — bespoke HenryCo brass-on-noir, motion-aware */}
      <CheckoutStepper currentStep={step} />

      <section className="grid gap-6 xl:grid-cols-[1fr,420px]">
        <form
          ref={formRef}
          action="/api/marketplace"
          method="POST"
          encType="multipart/form-data"
          className="space-y-5"
          onSubmit={() => {
            setSubmitting(true);
            // V3-01: the form posts natively to /api/marketplace which
            // either redirects to /track/{orderNo}?placed=1 on success
            // or back to /checkout?error=… on server-side rejection.
            // We have no JS-level success callback, so we synchronously
            // clear the draft at submit time — the localStorage write
            // completes before the navigation begins. The trade-off:
            // on a server-rejection round-trip the user lands back at
            // /checkout without the saved selections, which mirrors
            // the existing failure UX where the form re-renders
            // server-side anyway.
            draft.clear();
          }}
        >
          <input type="hidden" name="intent" value="checkout_submit" />
          <input type="hidden" name="return_to" value="/checkout" />
          <input type="hidden" name="cart_token" value={cartToken ?? ""} />
          <input type="hidden" name="payment_method" value={paymentMethod} />
          <input type="hidden" name="payment_reference" value={paymentReference} />
          <input type="hidden" name="buyer_name" value={buyerName} />
          <input type="hidden" name="buyer_phone" value={phone || ""} />
          <input type="hidden" name="shipping_city" value={shippingCity} />
          <input type="hidden" name="shipping_region" value={shippingRegion} />
          <input type="hidden" name="shipping_line1" value={shippingLine1} />
          {selectedAddress?.id ? (
            <input type="hidden" name="shipping_address_id" value={selectedAddress.id} />
          ) : null}
          {/*
            RELIABILITY-01 — pre-uploaded payment proof. When the user
            selected bank_transfer and the proof was uploaded ahead of
            submit via /api/checkout/payment-proof, these hidden fields
            carry the Cloudinary URL + public_id directly to the
            marketplace route, which persists them on
            `marketplace_payment_records` without performing its own
            upload. This is the load-bearing fix for the "file
            disappears at submit" failure mode.
          */}
          {proofUploaded ? (
            <>
              <input type="hidden" name="proof_url" value={proofUploaded.url} />
              <input type="hidden" name="proof_public_id" value={proofUploaded.publicId} />
              <input type="hidden" name="proof_name" value={proofUploaded.name} />
            </>
          ) : null}

          {step === "delivery" ? (
            <DeliveryStep
              addresses={addresses}
              selectedAddressId={selectedAddressId}
              onSelectAddress={(id) => {
                setSelectedAddressId(id);
                setUsingOneShot(false);
              }}
              usingOneShot={usingOneShot}
              setUsingOneShot={setUsingOneShot}
              oneShot={oneShot}
              setOneShot={setOneShot}
              phoneOverride={phoneOverride}
              setPhoneOverride={setPhoneOverride}
              selectedAddress={selectedAddress}
              buyer={buyer}
            />
          ) : null}

          <div className={step === "payment" ? "" : "hidden"}>
            <PaymentStep
              method={paymentMethod}
              onSelect={setPaymentMethod}
              cart={cart}
              shipping={shipping}
              total={total}
              currency={currency}
              paymentRail={paymentRail}
              wallet={wallet}
              totalKobo={totalKobo}
              walletCanPay={walletCanPay}
              paymentReference={paymentReference}
              walletTopUpHref={walletTopUpHref}
              bankReference={bankReference}
              setBankReference={setBankReference}
              proofName={proofName}
              proofState={proofState}
              onSelectProofFile={uploadProof}
              onResetProof={() => {
                proofAbortRef.current?.abort();
                setProofState({ status: "idle" });
                setProofName("");
              }}
            />
          </div>

          {step === "confirm" ? (
            <ConfirmStep
              cart={cart}
              shipping={shipping}
              subtotal={subtotal}
              total={total}
              currency={currency}
              paymentMethod={paymentMethod}
              paymentReference={paymentReference}
              bankReference={bankReference}
              proofName={proofName}
              wallet={wallet}
              selectedAddress={selectedAddress}
              oneShot={usingOneShot ? oneShot : null}
              agreed={agreed}
              setAgreed={setAgreed}
              onSaveItemForLater={(itemId) => void moveCartItemToSaved(itemId)}
              pendingSavedItemIds={pendingSavedItemIds}
            />
          ) : null}

          {/* Step nav */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {step !== "delivery" ? (
              <button
                type="button"
                onClick={back}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-5 py-3 text-sm font-semibold text-[var(--market-paper-white)] transition hover:bg-[rgba(255,255,255,0.07)]"
              >
                <ChevronLeft className="h-4 w-4" />
                {t("Back")}
              </button>
            ) : null}

            {step === "delivery" || step === "payment" ? (
              <ActionButton
                tone="primary"
                onClick={next}
                disabled={
                  (step === "delivery" && !deliveryReady) ||
                  (step === "payment" && (!paymentReady || proofUploading))
                }
                spinner={step === "payment" && proofUploading}
                icon={<ChevronRight className="h-4 w-4" />}
                iconPosition="trailing"
              >
                {step === "payment" && proofUploading ? t("Uploading proof...") : t("Continue")}
              </ActionButton>
            ) : null}

            {step === "confirm" ? (
              <ActionButton
                tone="primary"
                onClick={() => placeOrder()}
                disabled={submitting || !agreed || !paymentReady}
                spinner={submitting}
                icon={<Lock className="h-4 w-4" />}
              >
                {submitting ? t("Placing order...") : t("Place order")}
              </ActionButton>
            ) : null}

            <p className="ml-auto inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[var(--market-muted)]">
              <Lock className="h-3 w-3" />
              {t("Encrypted · session bound · audit-logged")}
            </p>
          </div>

          {step === "confirm" ? (
            <p className="border-l-2 border-[var(--market-brass)]/55 pl-4 text-xs leading-6 text-[var(--market-muted)]">
              {paymentMethod === "wallet_balance"
                ? t("On confirm, your wallet debits and the order is held in escrow until the vendor accepts and dispatches.")
                : paymentMethod === "bank_transfer"
                ? t("On confirm, your transfer proof routes to finance. Verification typically completes within a few business hours and the timeline updates the moment it does.")
                : t("On confirm, the order opens for vendor acceptance. The rider collects payment when the order arrives.")}
            </p>
          ) : null}
        </form>

        {/* Order rail — sticky summary */}
        <OrderSummaryRail
          cart={cart}
          subtotal={subtotal}
          shipping={shipping}
          total={total}
          currency={currency}
          onSaveItemForLater={(itemId) => void moveCartItemToSaved(itemId)}
          pendingSavedItemIds={pendingSavedItemIds}
        />
      </section>
    </div>
  );
}

function CheckoutStepper({ currentStep }: { currentStep: CheckoutStep }) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const steps = buildSteps(t);
  const currentIndex = steps.findIndex((s) => s.id === currentStep);
  const progressPct = ((currentIndex + 0.5) / steps.length) * 100;

  return (
    <nav aria-label={t("Checkout progress")} className="market-paper rounded-[2rem] p-5 sm:p-6">
      <div className="relative">
        {/* Progress rail */}
        <div className="absolute left-[2.5%] right-[2.5%] top-[1.25rem] hidden h-px sm:block">
          <div className="h-full w-full overflow-hidden rounded-full bg-[var(--market-line)]">
            <div
              className="h-full bg-gradient-to-r from-[#f7edd9] via-[var(--market-brass)] to-[var(--market-aurora)] transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <ol className="relative z-10 grid grid-cols-3 gap-3">
          {steps.map((stepDef, index) => {
            const status =
              index < currentIndex
                ? "done"
                : index === currentIndex
                ? "active"
                : "upcoming";
            return (
              <li
                key={stepDef.id}
                className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:gap-3 sm:text-left"
              >
                <span
                  aria-hidden="true"
                  className={`relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
                    status === "done"
                      ? "border-transparent bg-gradient-to-br from-[#f7edd9] via-[var(--market-brass)] to-[var(--market-aurora)] text-[#101114] shadow-[0_8px_22px_rgba(200,163,106,0.35)]"
                      : status === "active"
                      ? "border-[var(--market-brass)] bg-[rgba(200,163,106,0.16)] text-[var(--market-brass-soft)] shadow-[0_8px_22px_rgba(200,163,106,0.18)]"
                      : "border-[var(--market-line)] bg-[rgba(255,255,255,0.03)] text-[var(--market-muted)]"
                  }`}
                >
                  {status === "done" ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                <span className="mt-2 sm:mt-0">
                  <span
                    className={`block text-[10px] font-semibold uppercase tracking-[0.22em] ${
                      status === "upcoming" ? "text-[var(--market-muted)]" : "text-[var(--market-brass)]"
                    }`}
                  >
                    {t("Step")} {index + 1}
                  </span>
                  <span className="mt-1 block text-sm font-semibold text-[var(--market-paper-white)] sm:text-base">
                    {stepDef.label}
                  </span>
                  <span className="hidden text-xs text-[var(--market-muted)] sm:block">
                    {stepDef.description}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

function DeliveryStep({
  addresses,
  selectedAddressId,
  onSelectAddress,
  usingOneShot,
  setUsingOneShot,
  oneShot,
  setOneShot,
  phoneOverride,
  setPhoneOverride,
  selectedAddress,
  buyer,
}: {
  addresses: UserAddressRecord[];
  selectedAddressId: string | null;
  onSelectAddress: (id: string) => void;
  usingOneShot: boolean;
  setUsingOneShot: React.Dispatch<React.SetStateAction<boolean>>;
  oneShot: { fullName: string; phone: string; city: string; region: string; line1: string };
  setOneShot: (next: { fullName: string; phone: string; city: string; region: string; line1: string }) => void;
  phoneOverride: string;
  setPhoneOverride: (v: string) => void;
  selectedAddress: UserAddressRecord | null;
  buyer: { fullName: string | null; email: string | null };
}) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const phoneNeeded = !usingOneShot && !selectedAddress?.phone;

  return (
    <article className="market-panel rounded-[2rem] p-6 sm:p-8">
      <header className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--market-brass)] bg-[rgba(200,163,106,0.12)] text-[var(--market-brass)]">
          <Truck className="h-4 w-4" />
        </span>
        <div>
          <p className="market-kicker">{t("Step 1 of 3")}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--market-paper-white)] sm:text-3xl">
            {t("Delivery details")}
          </h2>
        </div>
      </header>

      {addresses.length > 0 ? (
        <div className="mt-6 space-y-3">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--market-muted)]">
            {t("Saved addresses")}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {addresses.map((address) => {
              const active = !usingOneShot && selectedAddressId === address.id;
              return (
                <label
                  key={address.id}
                  className={`group relative flex cursor-pointer flex-col gap-2 rounded-[1.5rem] border p-4 transition ${
                    active
                      ? "border-[var(--market-brass)] bg-[rgba(200,163,106,0.08)] shadow-[0_18px_50px_rgba(200,163,106,0.18)]"
                      : "border-[var(--market-line)] bg-[rgba(255,255,255,0.03)] hover:border-[var(--market-line-strong)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="delivery_address"
                    className="peer sr-only"
                    checked={active}
                    onChange={() => onSelectAddress(address.id)}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--market-brass)]">
                        {address.label.replace(/_/g, " ")}
                        {address.is_default ? ` · ${t("Default")}` : ""}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[var(--market-paper-white)]">
                        {address.full_name || buyer.fullName || t("Recipient")}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[var(--market-muted)]">
                        {address.street}
                      </p>
                      <p className="text-sm leading-6 text-[var(--market-muted)]">
                        {[address.city, address.state, address.country].filter(Boolean).join(", ")}
                      </p>
                      {address.phone ? (
                        <p className="mt-1 text-xs text-[var(--market-muted)]">
                          {address.phone}
                        </p>
                      ) : null}
                    </div>
                    {active ? (
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--market-brass)] text-[#101114]">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    ) : null}
                  </div>
                  {address.kyc_verified ? (
                    <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[rgba(154,174,164,0.16)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--market-aurora)]">
                      {t("KYC verified")}
                    </span>
                  ) : null}
                </label>
              );
            })}
          </div>

          {phoneNeeded ? (
            <label className="block">
              <span className="text-xs uppercase tracking-[0.18em] text-[var(--market-muted)]">
                {t("Phone for the rider")}
              </span>
              <input
                type="tel"
                inputMode="tel"
                placeholder={t("e.g. +234 800 000 0000")}
                value={phoneOverride}
                onChange={(event) => setPhoneOverride(event.target.value)}
                className="market-input mt-2 rounded-[1.2rem] px-4 py-3"
                required={!usingOneShot}
              />
            </label>
          ) : null}

          <button
            type="button"
            onClick={() => setUsingOneShot((v) => !v)}
            className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--market-brass)]"
          >
            {usingOneShot ? t("Use a saved address instead") : t("Use a different address this time")}
          </button>
        </div>
      ) : (
        <p className="mt-5 rounded-[1.4rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm leading-6 text-[var(--market-muted)]">
          {t("You don't have any saved addresses yet. Enter delivery details below — we'll offer to save it to your address book after the order is placed.")}
        </p>
      )}

      {(usingOneShot || addresses.length === 0) ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 sm:col-span-2">
            <span className="text-xs uppercase tracking-[0.18em] text-[var(--market-muted)]">
              {t("Recipient name")}
            </span>
            <input
              className="market-input rounded-[1.2rem] px-4 py-3"
              value={oneShot.fullName}
              onChange={(event) => setOneShot({ ...oneShot, fullName: event.target.value })}
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.18em] text-[var(--market-muted)]">
              {t("Phone")}
            </span>
            <input
              type="tel"
              inputMode="tel"
              className="market-input rounded-[1.2rem] px-4 py-3"
              value={oneShot.phone}
              onChange={(event) => setOneShot({ ...oneShot, phone: event.target.value })}
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.18em] text-[var(--market-muted)]">
              {t("Region / state")}
            </span>
            <input
              className="market-input rounded-[1.2rem] px-4 py-3"
              value={oneShot.region}
              onChange={(event) => setOneShot({ ...oneShot, region: event.target.value })}
              required
            />
          </label>
          <label className="space-y-2 sm:col-span-2">
            <span className="text-xs uppercase tracking-[0.18em] text-[var(--market-muted)]">
              {t("City")}
            </span>
            <input
              className="market-input rounded-[1.2rem] px-4 py-3"
              value={oneShot.city}
              onChange={(event) => setOneShot({ ...oneShot, city: event.target.value })}
              required
            />
          </label>
          <label className="space-y-2 sm:col-span-2">
            <span className="text-xs uppercase tracking-[0.18em] text-[var(--market-muted)]">
              {t("Street address")}
            </span>
            <input
              className="market-input rounded-[1.2rem] px-4 py-3"
              value={oneShot.line1}
              onChange={(event) => setOneShot({ ...oneShot, line1: event.target.value })}
              required
            />
          </label>
        </div>
      ) : null}
    </article>
  );
}

function PaymentStep({
  method,
  onSelect,
  cart,
  total,
  currency,
  paymentRail,
  wallet,
  totalKobo,
  walletCanPay,
  paymentReference,
  walletTopUpHref,
  bankReference,
  setBankReference,
  proofName,
  proofState,
  onSelectProofFile,
  onResetProof,
}: {
  method: PaymentMethodId;
  onSelect: (id: PaymentMethodId) => void;
  cart: CartShape;
  shipping: number;
  total: number;
  currency: string;
  paymentRail: PaymentRailShape;
  wallet: WalletShape;
  totalKobo: number;
  walletCanPay: boolean;
  paymentReference: string;
  walletTopUpHref: string;
  bankReference: string;
  setBankReference: (value: string) => void;
  proofName: string;
  /** RELIABILITY-01 — drives the file input state + UI feedback. */
  proofState: ProofStatus;
  /** Triggered when the user picks a file in the upload field. */
  onSelectProofFile: (file: File) => void;
  /** Lets the user clear a failed/uploaded proof and re-pick. */
  onResetProof: () => void;
}) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  // COD eligibility is enforced server-side at /api/marketplace; the UI offers
  // both methods and the server rejects ineligible carts with a clear message.
  const codEligible = true;
  const [copied, setCopied] = useState<string | null>(null);
  const available = wallet.availableKobo / 100;
  const shortfall = Math.max(0, totalKobo - wallet.availableKobo) / 100;
  const bankDetails: Array<[string, string | null]> = [
    [t("Bank"), paymentRail.bankName],
    [t("Account name"), paymentRail.accountName],
    [t("Account number"), paymentRail.accountNumber],
  ];

  async function copyValue(label: string, value: string | null) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  }

  return (
    <article className="market-panel rounded-[2rem] p-6 sm:p-8">
      <header className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--market-brass)] bg-[rgba(200,163,106,0.12)] text-[var(--market-brass)]">
          <Wallet className="h-4 w-4" />
        </span>
        <div>
          <p className="market-kicker">{t("Step 2 of 3")}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--market-paper-white)] sm:text-3xl">
            {t("Payment method")}
          </h2>
        </div>
      </header>

      <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--market-muted)]">
        {t(
          "Use cleared HenryCo balance first when it covers the total, or transfer the exact amount and upload proof before the order enters finance review.",
        )}
      </p>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {buildPaymentMethods(t).map((option) => {
          const Icon = option.icon;
          const active = method === option.id;
          const disabled =
            (option.id === "wallet_balance" && !walletCanPay) ||
            (option.id === "bank_transfer" && !paymentRail.ready) ||
            (option.id === "cod" && !codEligible);
          const detail =
            option.id === "wallet_balance"
              ? walletCanPay
                ? `${formatCurrency(available, wallet.currency)} ${t("available")}`
                : shortfall > 0
                ? `${formatCurrency(shortfall, wallet.currency)} ${t("short")}`
                : wallet.issue || t("Wallet unavailable")
              : option.id === "bank_transfer"
              ? paymentRail.ready
                ? `${paymentRail.bankName} ${t("ready")}`
                : t("Payment rail unavailable")
              : t("Seller acceptance still applies");
          return (
            <label
              key={option.id}
              className={`relative flex cursor-pointer flex-col gap-3 rounded-[1.5rem] border p-5 transition ${
                disabled
                  ? "cursor-not-allowed border-dashed border-[var(--market-line)] opacity-50"
                  : active
                  ? "border-[var(--market-brass)] bg-[rgba(200,163,106,0.08)] shadow-[0_18px_50px_rgba(200,163,106,0.18)]"
                  : "border-[var(--market-line)] bg-[rgba(255,255,255,0.03)] hover:border-[var(--market-line-strong)]"
              }`}
            >
              <input
                type="radio"
                className="peer sr-only"
                checked={active}
                onChange={() => onSelect(option.id)}
                disabled={disabled}
              />
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.05)] text-[var(--market-brass)]">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-base font-semibold text-[var(--market-paper-white)]">
                  {option.label}
                </span>
                {active ? (
                  <span className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--market-brass)] text-[#101114]">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                ) : null}
              </div>
              <p className="text-sm leading-6 text-[var(--market-muted)]">
                {option.description}
              </p>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--market-brass)]">
                {detail}
              </span>
            </label>
          );
        })}
      </div>

      {method === "wallet_balance" ? (
        <section className="mt-5 rounded-[1.5rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.03)] p-5">
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <Metric label={t("Available balance")} value={formatCurrency(available, wallet.currency)} />
            <Metric label={t("Order total")} value={formatCurrency(total, currency)} />
            <Metric
              label={t("After payment")}
              value={formatCurrency(Math.max(0, wallet.availableKobo - totalKobo) / 100, wallet.currency)}
            />
          </div>
          {walletCanPay ? (
            <p className="mt-4 flex items-start gap-2 text-sm leading-7 text-[var(--market-muted)]">
              <Check className="mt-1 h-4 w-4 text-[var(--market-brass)]" />
              {t(
                "Balance payment will debit your wallet and create the order as paid-held for fulfillment and escrow controls.",
              )}
            </p>
          ) : (
            <div className="mt-4 rounded-[1.2rem] border border-amber-400/30 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-1 h-4 w-4 shrink-0" />
                <p>
                  {t("Balance cannot cover this checkout. Fund your wallet or use bank transfer with proof.")}
                </p>
              </div>
              <Link
                href={walletTopUpHref}
                className="mt-3 inline-flex font-semibold text-[var(--market-paper-white)]"
              >
                {t("Top up wallet")}
              </Link>
            </div>
          )}
        </section>
      ) : null}

      {method === "bank_transfer" ? (
        <section className="mt-5 space-y-5 rounded-[1.5rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.03)] p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--market-brass)]">
                {t("Transfer exactly")}
              </p>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-[var(--market-paper-white)]">
                {formatCurrency(total, currency)}
              </p>
            </div>
            <div className="rounded-[1.1rem] border border-[var(--market-line)] bg-[rgba(0,0,0,0.18)] px-4 py-3 text-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
                {t("Payment reference")}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <code className="text-base font-semibold text-[var(--market-paper-white)]">
                  {paymentReference}
                </code>
                <button
                  type="button"
                  onClick={() => void copyValue("reference", paymentReference)}
                  className="rounded-full border border-[var(--market-line)] p-2 text-[var(--market-brass)]"
                  aria-label={t("Copy payment reference")}
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              {copied === "reference" ? (
                <p className="mt-1 text-xs text-[var(--market-brass)]">{t("Copied")}</p>
              ) : null}
            </div>
          </div>

          {paymentRail.ready ? (
            <dl className="grid gap-3 sm:grid-cols-3">
              {bankDetails.map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-[1.15rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] p-4"
                >
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
                    {label}
                  </dt>
                  <dd className="mt-1 flex items-center justify-between gap-2 text-sm font-semibold text-[var(--market-paper-white)]">
                    <span>{value}</span>
                    <button
                      type="button"
                      onClick={() => void copyValue(label, value)}
                      className="rounded-full border border-[var(--market-line)] p-1.5 text-[var(--market-brass)]"
                      aria-label={`${t("Copy")} ${label}`}
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="rounded-[1.2rem] border border-amber-400/30 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100">
              {t("Bank transfer is temporarily unavailable because payment account settings are not configured.")}
            </p>
          )}

          <p className="text-sm leading-7 text-[var(--market-muted)]">{paymentRail.instructions}</p>

          <div className="grid gap-4 lg:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
                Bank/reference number
              </span>
              <input
                name="bank_reference"
                value={bankReference}
                onChange={(event) => setBankReference(event.target.value)}
                className="market-input rounded-[1.2rem] px-4 py-3"
                placeholder={t("Enter the bank receipt/reference number")}
                required={method === "bank_transfer"}
              />
            </label>

            <ProofUploadField
              proofName={proofName}
              proofState={proofState}
              required={method === "bank_transfer"}
              onSelectFile={onSelectProofFile}
              onReset={onResetProof}
            />
          </div>
        </section>
      ) : null}

      {method === "cod" ? (
        <aside className="mt-5 rounded-[1.5rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.03)] p-4 text-sm leading-7 text-[var(--market-muted)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--market-brass)]">
            Cash on delivery
          </p>
          <p className="mt-2">
            COD keeps payment pending for this {cart.count}-item order until delivery collection is
            reconciled. Wallet or transfer remains faster when available.
          </p>
        </aside>
      ) : null}
    </article>
  );
}

/**
 * RELIABILITY-01 — payment-proof upload control.
 *
 * Renders the file picker plus the status row beneath it. The status
 * row mirrors the four non-idle branches of `ProofStatus`:
 *
 *   - validating / uploading -> spinner + "Uploading proof..."
 *   - uploaded                -> green check + filename
 *   - error                   -> red text with the structured message
 *                                and a retry button (the retry triggers
 *                                a fresh file-picker open)
 *
 * The underlying `<input type="file">` is kept in the DOM (visually
 * hidden) so the label-click still opens the OS picker. We DO NOT bind
 * a controlled `value` — file inputs are uncontrolled by spec, so
 * `<input value={...}>` is forbidden. Resetting the input after a
 * failure uses the `key` prop to remount the input cleanly.
 */
function ProofUploadField({
  proofName,
  proofState,
  required,
  onSelectFile,
  onReset,
}: {
  proofName: string;
  proofState: ProofStatus;
  required: boolean;
  onSelectFile: (file: File) => void;
  onReset: () => void;
}) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  // We bump this counter on `onReset` so the file input remounts with
  // an empty value — otherwise the browser keeps the previously
  // selected file name attached to the input element, which would let
  // the user re-submit the same File without re-triggering onChange.
  const [inputKey, setInputKey] = useState(0);

  const isBusy =
    proofState.status === "uploading" || proofState.status === "validating";
  const isUploaded = proofState.status === "uploaded";
  const isError = proofState.status === "error";

  return (
    <div className="space-y-2">
      <label
        className={`group flex cursor-pointer items-center gap-3 rounded-[1.2rem] border p-4 transition ${
          isUploaded
            ? "border-[var(--market-aurora)]/60 bg-[rgba(154,174,164,0.10)]"
            : isError
            ? "border-red-400/40 bg-red-400/5"
            : isBusy
            ? "border-[var(--market-brass)]/60 bg-[rgba(200,163,106,0.06)]"
            : "border-dashed border-[var(--market-line)] bg-[rgba(255,255,255,0.03)]"
        }`}
      >
        <span
          className={`inline-flex h-11 w-11 items-center justify-center rounded-full border text-[var(--market-brass)] ${
            isUploaded
              ? "border-[var(--market-aurora)] bg-[rgba(154,174,164,0.18)] text-[var(--market-aurora)]"
              : "border-[var(--market-line)]"
          }`}
        >
          {isBusy ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : isUploaded ? (
            <Check className="h-5 w-5" aria-hidden="true" />
          ) : (
            <UploadCloud className="h-5 w-5" aria-hidden="true" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
            {isUploaded ? t("Proof uploaded") : t("Upload proof")}
          </span>
          <span className="mt-1 block truncate text-sm font-semibold text-[var(--market-paper-white)]">
            {proofName || t("PNG, JPG, WebP, or PDF under 10 MB")}
          </span>
        </span>
        <input
          key={`proof-input-${inputKey}`}
          type="file"
          name="proof_local"
          accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
          className="sr-only"
          disabled={isBusy}
          aria-invalid={isError}
          // `required` is dropped when we already have an uploaded
          // proof — otherwise the browser's native validation would
          // demand a fresh File pick at submit, even though the URL
          // is already attached via the hidden fields above.
          required={required && !isUploaded}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (file) onSelectFile(file);
          }}
        />
      </label>

      {isBusy ? (
        <p
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 px-2 text-xs text-[var(--market-brass)]"
        >
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
          {proofState.status === "validating"
            ? t("Checking file...")
            : t("Uploading proof...")}
        </p>
      ) : null}

      {isUploaded ? (
        <p
          role="status"
          aria-live="polite"
          className="flex items-center justify-between gap-2 px-2 text-xs"
        >
          <span className="flex items-center gap-2 text-[var(--market-aurora)]">
            <Check className="h-3 w-3" aria-hidden="true" />
            {t("Proof received. Finance will verify after submit.")}
          </span>
          <button
            type="button"
            onClick={() => {
              setInputKey((n) => n + 1);
              onReset();
            }}
            className="inline-flex items-center gap-1 text-[var(--market-muted)] hover:text-[var(--market-paper-white)]"
          >
            <RefreshCw className="h-3 w-3" aria-hidden="true" />
            {t("Replace")}
          </button>
        </p>
      ) : null}

      {isError ? (
        <div
          role="alert"
          className="space-y-2 rounded-[0.9rem] border border-red-400/30 bg-red-400/10 px-3 py-2"
        >
          <p className="flex items-start gap-2 text-xs leading-5 text-red-100">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              {proofState.message}
              {proofState.code === "cloudinary_unavailable" ? (
                <>
                  {" "}
                  <span className="opacity-80">
                    {t("(temporary — retry usually works)")}
                  </span>
                </>
              ) : null}
            </span>
          </p>
          <button
            type="button"
            onClick={() => {
              setInputKey((n) => n + 1);
              onReset();
            }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--market-paper-white)] hover:text-[var(--market-brass)]"
          >
            <RefreshCw className="h-3 w-3" aria-hidden="true" />
            {t("Try again")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.15rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold text-[var(--market-paper-white)]">{value}</p>
    </div>
  );
}

function ConfirmStep({
  cart,
  subtotal,
  shipping,
  total,
  currency,
  paymentMethod,
  paymentReference,
  bankReference,
  proofName,
  wallet,
  selectedAddress,
  oneShot,
  agreed,
  setAgreed,
  onSaveItemForLater,
  pendingSavedItemIds,
}: {
  cart: CartShape;
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  paymentMethod: PaymentMethodId;
  paymentReference: string;
  bankReference: string;
  proofName: string;
  wallet: WalletShape;
  selectedAddress: UserAddressRecord | null;
  oneShot: { fullName: string; phone: string; city: string; region: string; line1: string } | null;
  agreed: boolean;
  setAgreed: (v: boolean) => void;
  onSaveItemForLater: (itemId: string) => void;
  pendingSavedItemIds: string[];
}) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const methodLabel = buildPaymentMethods(t).find((p) => p.id === paymentMethod)?.label ?? paymentMethod;

  return (
    <article className="market-panel rounded-[2rem] p-6 sm:p-8">
      <header className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--market-brass)] bg-[rgba(200,163,106,0.12)] text-[var(--market-brass)]">
          <Lock className="h-4 w-4" />
        </span>
        <div>
          <p className="market-kicker">Step 3 of 3</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--market-paper-white)] sm:text-3xl">
            Final review
          </h2>
        </div>
      </header>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-[1.5rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.03)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--market-brass)]">
            Delivers to
          </p>
          {oneShot ? (
            <>
              <p className="mt-2 text-base font-semibold text-[var(--market-paper-white)]">
                {oneShot.fullName}
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--market-muted)]">
                {oneShot.line1}
                <br />
                {oneShot.city}, {oneShot.region}
              </p>
              <p className="mt-1 text-xs text-[var(--market-muted)]">{oneShot.phone}</p>
            </>
          ) : selectedAddress ? (
            <>
              <p className="mt-2 text-base font-semibold text-[var(--market-paper-white)]">
                {selectedAddress.full_name || ""}
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--market-muted)]">
                {selectedAddress.street}
                <br />
                {[selectedAddress.city, selectedAddress.state, selectedAddress.country]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              {selectedAddress.phone ? (
                <p className="mt-1 text-xs text-[var(--market-muted)]">{selectedAddress.phone}</p>
              ) : null}
            </>
          ) : null}
        </section>

        <section className="rounded-[1.5rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.03)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--market-brass)]">
            Payment method
          </p>
          <p className="mt-2 text-base font-semibold text-[var(--market-paper-white)]">
            {methodLabel}
          </p>
          <p className="mt-1 text-sm leading-6 text-[var(--market-muted)]">
            {paymentMethod === "bank_transfer"
              ? `Reference ${paymentReference}${bankReference ? ` · bank ref ${bankReference}` : ""}${
                  proofName ? ` · proof ${proofName}` : ""
                }`
              : paymentMethod === "wallet_balance"
              ? `Wallet debit from ${formatCurrency(wallet.availableKobo / 100, wallet.currency)} available balance.`
              : "Pay the rider on delivery — confirmation message after seller acceptance."}
          </p>
        </section>
      </div>

      <section className="mt-5 rounded-[1.5rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.03)] p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--market-brass)]">
            Items ({cart.count})
          </p>
        </div>
        <ul className="mt-3 space-y-3">
          {cart.items.map((item) => {
            const moving = pendingSavedItemIds.includes(item.id);
            return (
              <li
                key={item.id}
                className="grid grid-cols-[64px,1fr,auto] items-center gap-4 rounded-[1.2rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.03)] p-3"
              >
                <div className="relative h-14 w-14 overflow-hidden rounded-[0.9rem] bg-[var(--market-soft-wash)]">
                  {item.image ? (
                    <DivisionImage src={item.image} alt={item.title} fill sizes="56px" className="object-cover" radius="0" />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
                    {item.vendorName || "Trusted seller"} · qty {item.quantity}
                  </p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-[var(--market-paper-white)]">
                    {item.title}
                  </p>
                  <button
                    type="button"
                    onClick={() => onSaveItemForLater(item.id)}
                    disabled={moving}
                    className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--market-brass)] disabled:cursor-wait disabled:opacity-60"
                  >
                    {moving ? "Saving..." : (
                      <>
                        <Bookmark className="h-3 w-3" />
                        Save for later
                      </>
                    )}
                  </button>
                </div>
                <p className="text-sm font-semibold text-[var(--market-paper-white)]">
                  {formatCurrency(item.price * item.quantity, item.currency)}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-5 rounded-[1.5rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.03)] p-5 text-sm">
        <div className="flex items-center justify-between text-[var(--market-muted)]">
          <span>Subtotal</span>
          <span className="font-semibold text-[var(--market-paper-white)]">{formatCurrency(subtotal, currency)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[var(--market-muted)]">
          <span>Shipping</span>
          <span className="font-semibold text-[var(--market-paper-white)]">
            {shipping === 0 ? "Free" : formatCurrency(shipping, currency)}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-[var(--market-line)] pt-3 text-base">
          <span className="font-semibold text-[var(--market-paper-white)]">Total</span>
          <span className="text-2xl font-semibold tracking-tight text-[var(--market-paper-white)]">
            {formatCurrency(total, currency)}
          </span>
        </div>
      </section>

      <label className="mt-5 flex items-start gap-3 rounded-[1.4rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.03)] p-4 text-sm leading-7 text-[var(--market-muted)]">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(event) => setAgreed(event.target.checked)}
          className="mt-1.5 h-4 w-4 accent-[var(--market-brass)]"
        />
        <span>
          I agree to the{" "}
          <Link href="/policies" className="font-semibold text-[var(--market-brass)]">
            HenryCo marketplace policies
          </Link>{" "}
          and confirm the delivery address and payment method are correct.
        </span>
      </label>
    </article>
  );
}

function OrderSummaryRail({
  cart,
  subtotal,
  shipping,
  total,
  currency,
  onSaveItemForLater,
  pendingSavedItemIds,
}: {
  cart: CartShape;
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  onSaveItemForLater: (itemId: string) => void;
  pendingSavedItemIds: string[];
}) {
  return (
    <aside className="market-panel sticky top-28 h-fit rounded-[2rem] p-6">
      <p className="market-kicker">Order review</p>
      <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">
        {cart.count} item{cart.count === 1 ? "" : "s"} from {countVendors(cart)} vendor{countVendors(cart) === 1 ? "" : "s"}.
      </p>

      <div className="mt-5 space-y-3">
        {cart.items.slice(0, 4).map((item) => {
          const moving = pendingSavedItemIds.includes(item.id);
          return (
            <div key={item.id} className="grid grid-cols-[40px,1fr,auto] items-center gap-3 text-sm">
              <div className="relative h-10 w-10 overflow-hidden rounded-md bg-[var(--market-soft-wash)]">
                {item.image ? (
                  <DivisionImage src={item.image} alt={item.title} fill sizes="40px" className="object-cover" radius="0" />
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--market-paper-white)]">
                  {item.title}
                </p>
                <button
                  type="button"
                  onClick={() => onSaveItemForLater(item.id)}
                  disabled={moving}
                  className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--market-brass)] disabled:cursor-wait disabled:opacity-60"
                >
                  {moving ? "..." : "Save"}
                </button>
              </div>
              <p className="text-sm font-semibold text-[var(--market-paper-white)]">
                {formatCurrency(item.price * item.quantity, item.currency)}
              </p>
            </div>
          );
        })}
        {cart.items.length > 4 ? (
          <p className="text-xs text-[var(--market-muted)]">
            + {cart.items.length - 4} more item{cart.items.length - 4 === 1 ? "" : "s"}
          </p>
        ) : null}
      </div>

      <div className="mt-6 space-y-2 border-t border-[var(--market-line)] pt-5 text-sm text-[var(--market-muted)]">
        <div className="flex items-center justify-between">
          <span>Subtotal</span>
          <span className="font-semibold text-[var(--market-paper-white)]">
            {formatCurrency(subtotal, currency)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Shipping</span>
          <span className="font-semibold text-[var(--market-paper-white)]">
            {shipping === 0 ? "Free" : formatCurrency(shipping, currency)}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-[var(--market-line)] pt-3 text-base">
          <span className="font-semibold text-[var(--market-paper-white)]">Total</span>
          <span className="text-xl font-semibold text-[var(--market-paper-white)]">
            {formatCurrency(total, currency)}
          </span>
        </div>
      </div>

      <div className="mt-6 rounded-[1.4rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] p-4 text-xs leading-7 text-[var(--market-muted)]">
        <p className="font-semibold text-[var(--market-paper-white)]">
          Your basket waits for you
        </p>
        <p className="mt-1">
          Walk away from checkout — your cart and progress survive. Sign in on any
          device to continue.
        </p>
      </div>
    </aside>
  );
}

function countVendors(cart: CartShape) {
  return new Set(cart.items.map((item) => item.vendorName || "HenryCo")).size;
}
