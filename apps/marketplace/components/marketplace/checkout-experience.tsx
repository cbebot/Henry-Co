"use client";

import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  Banknote,
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Lock,
  Truck,
  UploadCloud,
  Wallet,
} from "lucide-react";
import { HenryCoActivityIndicator } from "@henryco/ui";
import type { UserAddressRecord } from "@henryco/address-selector";
import { useMarketplaceCart } from "@/components/marketplace/runtime-provider";
import { formatCurrency } from "@/lib/utils";

type CheckoutStep = "delivery" | "payment" | "confirm";

const STEPS: Array<{ id: CheckoutStep; label: string; description: string }> = [
  {
    id: "delivery",
    label: "Delivery",
    description: "Where the order arrives",
  },
  {
    id: "payment",
    label: "Payment",
    description: "How you'll settle",
  },
  {
    id: "confirm",
    label: "Confirm",
    description: "Final review",
  },
];

const PAYMENT_METHODS = [
  {
    id: "wallet_balance",
    label: "HenryCo balance",
    description:
      "Use cleared HenryCo wallet funds immediately. The order is marked paid only after the balance debit succeeds.",
    icon: Wallet,
  },
  {
    id: "bank_transfer",
    label: "Bank transfer",
    description:
      "Pay by transfer, upload proof, and the payment team verifies. The order timeline updates in real time.",
    icon: Banknote,
  },
  {
    id: "cod",
    label: "Cash on delivery",
    description:
      "Available on eligible orders only. Pay the rider when the order arrives — seller acceptance still confirms first.",
    icon: Wallet,
  },
] as const;

type PaymentMethodId = (typeof PAYMENT_METHODS)[number]["id"];

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
  buyer,
}: {
  cart: CartShape;
  cartToken: string | null;
  addresses: UserAddressRecord[];
  paymentRail: PaymentRailShape;
  wallet: WalletShape;
  paymentReference: string;
  buyer: { fullName: string | null; email: string | null };
}) {
  const { moveCartItemToSaved, pendingSavedItemIds } = useMarketplaceCart();
  const [step, setStep] = useState<CheckoutStep>("delivery");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    addresses.find((a) => a.is_default)?.id ?? addresses[0]?.id ?? null
  );
  const [oneShot, setOneShot] = useState<{
    fullName: string;
    phone: string;
    city: string;
    region: string;
    line1: string;
  }>({
    fullName: buyer.fullName ?? "",
    phone: "",
    city: "",
    region: "",
    line1: "",
  });
  const [usingOneShot, setUsingOneShot] = useState<boolean>(addresses.length === 0);
  const [phoneOverride, setPhoneOverride] = useState<string>("");
  const subtotal = cart.subtotal;
  const shipping = subtotal > 350000 ? 0 : 18000;
  const total = subtotal + shipping;
  const currency = cart.items[0]?.currency || "NGN";
  const totalKobo = Math.max(0, Math.round(total * 100));
  const walletCanPay = wallet.isActive && Boolean(wallet.walletId) && wallet.availableKobo >= totalKobo;
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>(
    walletCanPay ? "wallet_balance" : "bank_transfer"
  );
  const [bankReference, setBankReference] = useState("");
  const [proofName, setProofName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(true);

  const formRef = useRef<HTMLFormElement>(null);

  // Persist progress (auto-save) — survives reload mid-checkout.
  useEffect(() => {
    try {
      const draft = localStorage.getItem("henryco:mp:checkoutDraft");
      if (draft) {
        const parsed = JSON.parse(draft) as {
          step?: CheckoutStep;
          paymentMethod?: PaymentMethodId;
          bankReference?: string;
          phoneOverride?: string;
          oneShot?: typeof oneShot;
          usingOneShot?: boolean;
          selectedAddressId?: string | null;
        };
        if (parsed.step) setStep(parsed.step);
        if (parsed.paymentMethod) setPaymentMethod(parsed.paymentMethod);
        if (typeof parsed.bankReference === "string") setBankReference(parsed.bankReference);
        if (typeof parsed.phoneOverride === "string") setPhoneOverride(parsed.phoneOverride);
        if (parsed.oneShot) setOneShot(parsed.oneShot);
        if (typeof parsed.usingOneShot === "boolean") setUsingOneShot(parsed.usingOneShot);
        if (parsed.selectedAddressId !== undefined && addresses.some((a) => a.id === parsed.selectedAddressId)) {
          setSelectedAddressId(parsed.selectedAddressId ?? null);
        }
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "henryco:mp:checkoutDraft",
        JSON.stringify({
          step,
          paymentMethod,
          bankReference,
          phoneOverride,
          oneShot,
          usingOneShot,
          selectedAddressId,
        })
      );
    } catch {
      // ignore quota
    }
  }, [step, paymentMethod, bankReference, phoneOverride, oneShot, usingOneShot, selectedAddressId]);

  useEffect(() => {
    if (paymentMethod === "wallet_balance" && !walletCanPay) {
      setPaymentMethod("bank_transfer");
    }
    if (paymentMethod === "bank_transfer" && !paymentRail.ready && walletCanPay) {
      setPaymentMethod("wallet_balance");
    }
  }, [paymentMethod, paymentRail.ready, walletCanPay]);

  const selectedAddress = useMemo(
    () => addresses.find((a) => a.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId]
  );

  const paymentReady =
    paymentMethod === "wallet_balance"
      ? walletCanPay
      : paymentMethod === "bank_transfer"
      ? paymentRail.ready && Boolean(bankReference.trim()) && Boolean(proofName)
      : true;

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
    setStep((current) =>
      current === "delivery" ? "payment" : current === "payment" ? "confirm" : current
    );
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function back() {
    setStep((current) =>
      current === "confirm" ? "payment" : current === "payment" ? "delivery" : current
    );
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function placeOrder() {
    if (submitting) return;
    if (!agreed) return;
    if (!paymentReady) {
      setStep("payment");
      return;
    }
    setSubmitting(true);
    // The form posts traditionally so we keep the existing api/marketplace
    // server contract — submitting=true just locks the UI for the duration.
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
          <p className="market-kicker">Checkout</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--market-paper-white)] sm:text-4xl">
            Three measured steps. No surprises.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--market-muted)]">
            Save items for later at any point — your basket waits, your prices hold,
            and the timeline updates the moment payment lands.
          </p>
        </div>
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 self-start rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)] hover:text-[var(--market-paper-white)] sm:self-auto"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Edit cart
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
          onSubmit={() => setSubmitting(true)}
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
              bankReference={bankReference}
              setBankReference={setBankReference}
              proofName={proofName}
              setProofName={setProofName}
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
                Back
              </button>
            ) : null}

            {step === "delivery" || step === "payment" ? (
              <button
                type="button"
                onClick={next}
                disabled={(step === "delivery" && !deliveryReady) || (step === "payment" && !paymentReady)}
                className="market-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : null}

            {step === "confirm" ? (
              <button
                type="button"
                onClick={() => void placeOrder()}
                disabled={submitting || !agreed || !paymentReady}
                aria-busy={submitting}
                className="market-button-primary inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold disabled:cursor-wait disabled:opacity-70"
              >
                {submitting ? (
                  <HenryCoActivityIndicator size="sm" label="Placing order" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                {submitting ? "Placing order..." : "Place order"}
              </button>
            ) : null}

            <p className="ml-auto inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[var(--market-muted)]">
              <Lock className="h-3 w-3" />
              Encrypted · session bound · audit-logged
            </p>
          </div>
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
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
  const progressPct = ((currentIndex + 0.5) / STEPS.length) * 100;

  return (
    <nav aria-label="Checkout progress" className="market-paper rounded-[2rem] p-5 sm:p-6">
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
          {STEPS.map((stepDef, index) => {
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
                    Step {index + 1}
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
  const phoneNeeded = !usingOneShot && !selectedAddress?.phone;

  return (
    <article className="market-panel rounded-[2rem] p-6 sm:p-8">
      <header className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--market-brass)] bg-[rgba(200,163,106,0.12)] text-[var(--market-brass)]">
          <Truck className="h-4 w-4" />
        </span>
        <div>
          <p className="market-kicker">Step 1 of 3</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--market-paper-white)] sm:text-3xl">
            Delivery details
          </h2>
        </div>
      </header>

      {addresses.length > 0 ? (
        <div className="mt-6 space-y-3">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--market-muted)]">
            Saved addresses
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
                        {address.is_default ? " · Default" : ""}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[var(--market-paper-white)]">
                        {address.full_name || buyer.fullName || "Recipient"}
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
                      KYC verified
                    </span>
                  ) : null}
                </label>
              );
            })}
          </div>

          {phoneNeeded ? (
            <label className="block">
              <span className="text-xs uppercase tracking-[0.18em] text-[var(--market-muted)]">
                Phone for the rider
              </span>
              <input
                type="tel"
                inputMode="tel"
                placeholder="e.g. +234 800 000 0000"
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
            {usingOneShot ? "Use a saved address instead" : "Use a different address this time"}
          </button>
        </div>
      ) : (
        <p className="mt-5 rounded-[1.4rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm leading-6 text-[var(--market-muted)]">
          You don&apos;t have any saved addresses yet. Enter delivery details below — we&apos;ll
          offer to save it to your address book after the order is placed.
        </p>
      )}

      {(usingOneShot || addresses.length === 0) ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 sm:col-span-2">
            <span className="text-xs uppercase tracking-[0.18em] text-[var(--market-muted)]">
              Recipient name
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
              Phone
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
              Region / state
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
              City
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
              Street address
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
  bankReference,
  setBankReference,
  proofName,
  setProofName,
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
  bankReference: string;
  setBankReference: (value: string) => void;
  proofName: string;
  setProofName: (value: string) => void;
}) {
  // COD eligibility is enforced server-side at /api/marketplace; the UI offers
  // both methods and the server rejects ineligible carts with a clear message.
  const codEligible = true;
  const [copied, setCopied] = useState<string | null>(null);
  const available = wallet.availableKobo / 100;
  const shortfall = Math.max(0, totalKobo - wallet.availableKobo) / 100;
  const bankDetails: Array<[string, string | null]> = [
    ["Bank", paymentRail.bankName],
    ["Account name", paymentRail.accountName],
    ["Account number", paymentRail.accountNumber],
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
          <p className="market-kicker">Step 2 of 3</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--market-paper-white)] sm:text-3xl">
            Payment method
          </h2>
        </div>
      </header>

      <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--market-muted)]">
        Use cleared HenryCo balance first when it covers the total, or transfer the
        exact amount and upload proof before the order enters finance review.
      </p>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {PAYMENT_METHODS.map((option) => {
          const Icon = option.icon;
          const active = method === option.id;
          const disabled =
            (option.id === "wallet_balance" && !walletCanPay) ||
            (option.id === "bank_transfer" && !paymentRail.ready) ||
            (option.id === "cod" && !codEligible);
          const detail =
            option.id === "wallet_balance"
              ? walletCanPay
                ? `${formatCurrency(available, wallet.currency)} available`
                : shortfall > 0
                ? `${formatCurrency(shortfall, wallet.currency)} short`
                : wallet.issue || "Wallet unavailable"
              : option.id === "bank_transfer"
              ? paymentRail.ready
                ? `${paymentRail.bankName} ready`
                : "Payment rail unavailable"
              : "Seller acceptance still applies";
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
            <Metric label="Available balance" value={formatCurrency(available, wallet.currency)} />
            <Metric label="Order total" value={formatCurrency(total, currency)} />
            <Metric
              label="After payment"
              value={formatCurrency(Math.max(0, wallet.availableKobo - totalKobo) / 100, wallet.currency)}
            />
          </div>
          {walletCanPay ? (
            <p className="mt-4 flex items-start gap-2 text-sm leading-7 text-[var(--market-muted)]">
              <Check className="mt-1 h-4 w-4 text-[var(--market-brass)]" />
              Balance payment will debit your wallet and create the order as paid-held for
              fulfillment and escrow controls.
            </p>
          ) : (
            <div className="mt-4 rounded-[1.2rem] border border-amber-400/30 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-1 h-4 w-4 shrink-0" />
                <p>
                  Balance cannot cover this checkout. Fund your wallet or use bank
                  transfer with proof.
                </p>
              </div>
              <Link
                href="https://account.henrycogroup.com/wallet/funding"
                className="mt-3 inline-flex font-semibold text-[var(--market-paper-white)]"
              >
                Top up wallet
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
                Transfer exactly
              </p>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-[var(--market-paper-white)]">
                {formatCurrency(total, currency)}
              </p>
            </div>
            <div className="rounded-[1.1rem] border border-[var(--market-line)] bg-[rgba(0,0,0,0.18)] px-4 py-3 text-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
                Payment reference
              </p>
              <div className="mt-1 flex items-center gap-2">
                <code className="text-base font-semibold text-[var(--market-paper-white)]">
                  {paymentReference}
                </code>
                <button
                  type="button"
                  onClick={() => void copyValue("reference", paymentReference)}
                  className="rounded-full border border-[var(--market-line)] p-2 text-[var(--market-brass)]"
                  aria-label="Copy payment reference"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              {copied === "reference" ? (
                <p className="mt-1 text-xs text-[var(--market-brass)]">Copied</p>
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
                      aria-label={`Copy ${label}`}
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="rounded-[1.2rem] border border-amber-400/30 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100">
              Bank transfer is temporarily unavailable because payment account settings are not configured.
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
                placeholder="Enter the bank receipt/reference number"
                required={method === "bank_transfer"}
              />
            </label>

            <label className="group flex cursor-pointer items-center gap-3 rounded-[1.2rem] border border-dashed border-[var(--market-line)] bg-[rgba(255,255,255,0.03)] p-4">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--market-line)] text-[var(--market-brass)]">
                <UploadCloud className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
                  Upload proof
                </span>
                <span className="mt-1 block truncate text-sm font-semibold text-[var(--market-paper-white)]">
                  {proofName || "PNG, JPG, WebP, or PDF under 10 MB"}
                </span>
              </span>
              <input
                type="file"
                name="proof"
                accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                className="sr-only"
                required={method === "bank_transfer"}
                onChange={(event) => setProofName(event.currentTarget.files?.[0]?.name ?? "")}
              />
            </label>
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
  const methodLabel = PAYMENT_METHODS.find((p) => p.id === paymentMethod)?.label ?? paymentMethod;

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
                    <Image src={item.image} alt={item.title} fill sizes="56px" className="object-cover" />
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
                  <Image src={item.image} alt={item.title} fill sizes="40px" className="object-cover" />
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
