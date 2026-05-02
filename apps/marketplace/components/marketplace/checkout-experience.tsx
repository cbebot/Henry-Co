"use client";

import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Banknote,
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Lock,
  Truck,
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
  buyer,
}: {
  cart: CartShape;
  cartToken: string | null;
  addresses: UserAddressRecord[];
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>("bank_transfer");
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
          phoneOverride?: string;
          oneShot?: typeof oneShot;
          usingOneShot?: boolean;
          selectedAddressId?: string | null;
        };
        if (parsed.step) setStep(parsed.step);
        if (parsed.paymentMethod) setPaymentMethod(parsed.paymentMethod);
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
          phoneOverride,
          oneShot,
          usingOneShot,
          selectedAddressId,
        })
      );
    } catch {
      // ignore quota
    }
  }, [step, paymentMethod, phoneOverride, oneShot, usingOneShot, selectedAddressId]);

  const selectedAddress = useMemo(
    () => addresses.find((a) => a.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId]
  );

  const subtotal = cart.subtotal;
  const shipping = subtotal > 350000 ? 0 : 18000;
  const total = subtotal + shipping;
  const currency = cart.items[0]?.currency || "NGN";

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
          className="space-y-5"
          onSubmit={() => setSubmitting(true)}
        >
          <input type="hidden" name="intent" value="checkout_submit" />
          <input type="hidden" name="return_to" value="/checkout" />
          <input type="hidden" name="cart_token" value={cartToken ?? ""} />
          <input type="hidden" name="payment_method" value={paymentMethod} />
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

          {step === "payment" ? (
            <PaymentStep
              method={paymentMethod}
              onSelect={setPaymentMethod}
              cart={cart}
              shipping={shipping}
              total={total}
              currency={currency}
            />
          ) : null}

          {step === "confirm" ? (
            <ConfirmStep
              cart={cart}
              shipping={shipping}
              subtotal={subtotal}
              total={total}
              currency={currency}
              paymentMethod={paymentMethod}
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
                disabled={step === "delivery" && !deliveryReady}
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
                disabled={submitting || !agreed}
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
}: {
  method: PaymentMethodId;
  onSelect: (id: PaymentMethodId) => void;
  cart: CartShape;
  shipping: number;
  total: number;
  currency: string;
}) {
  // COD eligibility is enforced server-side at /api/marketplace; the UI offers
  // both methods and the server rejects ineligible carts with a clear message.
  const codEligible = true;
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
        Pay-on-receipt where eligible, or transfer and upload proof. Either way,
        the order timeline updates the moment the payment team verifies.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {PAYMENT_METHODS.map((option) => {
          const Icon = option.icon;
          const active = method === option.id;
          const disabled = option.id === "cod" && !codEligible;
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
            </label>
          );
        })}
      </div>

      <aside className="mt-5 rounded-[1.5rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.03)] p-4 text-sm leading-7 text-[var(--market-muted)]">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--market-brass)]">
          What you&apos;ll see after Place order
        </p>
        <ul className="mt-2 space-y-1.5">
          <li>· Bank transfer details (if you chose transfer)</li>
          <li>· Payment timeline you can return to anytime</li>
          <li>· Confirmation in your HenryCo account inbox</li>
        </ul>
      </aside>
    </article>
  );
}

function ConfirmStep({
  cart,
  subtotal,
  shipping,
  total,
  currency,
  paymentMethod,
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
              ? "Transfer instructions appear right after Place order."
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
