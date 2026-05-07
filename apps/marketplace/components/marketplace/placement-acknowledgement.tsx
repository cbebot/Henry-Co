import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  ClipboardList,
  LifeBuoy,
  ShieldCheck,
  Truck,
  Wallet,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type Method = "wallet_balance" | "bank_transfer" | "cod";

type PaymentRecordShape = {
  method: Method;
  reference: string;
  status: string;
  proofName?: string | null;
  proofUrl?: string | null;
} | null;

const METHOD_VOICE: Record<
  Method,
  {
    kicker: string;
    title: string;
    body: string;
    next: Array<{ icon: typeof Wallet; label: string; detail: string }>;
  }
> = {
  wallet_balance: {
    kicker: "Wallet debited",
    title: "Order placed. Balance cleared.",
    body: "Your HenryCo balance is debited and the order is held in escrow until the vendor accepts and dispatches. No further action from you.",
    next: [
      {
        icon: ShieldCheck,
        label: "Escrow held",
        detail: "Funds stay protected until delivery is confirmed.",
      },
      {
        icon: ClipboardList,
        label: "Vendor acceptance",
        detail: "Each vendor segment gets its own dispatch decision.",
      },
      {
        icon: Truck,
        label: "Dispatch + tracking",
        detail: "The timeline updates the moment a courier picks up.",
      },
    ],
  },
  bank_transfer: {
    kicker: "Transfer received",
    title: "Order placed. Proof routed to finance.",
    body: "Your transfer evidence is with the HenryCo finance team. Verification typically completes within a few business hours; the order timeline updates the moment it does.",
    next: [
      {
        icon: Banknote,
        label: "Finance review",
        detail: "Bank reference and proof are matched against the rail.",
      },
      {
        icon: ClipboardList,
        label: "Vendor acceptance",
        detail: "Vendors are notified to accept once payment verifies.",
      },
      {
        icon: Truck,
        label: "Dispatch + tracking",
        detail: "Each vendor segment ships independently with its own ETA.",
      },
    ],
  },
  cod: {
    kicker: "Cash on delivery",
    title: "Order placed. Pay on delivery.",
    body: "Vendor acceptance comes first. Once accepted, the rider collects payment when the order arrives — keep the exact amount or rider-supported transfer ready.",
    next: [
      {
        icon: ClipboardList,
        label: "Vendor acceptance",
        detail: "Eligibility and stock are reconciled before dispatch.",
      },
      {
        icon: Truck,
        label: "Dispatch + tracking",
        detail: "You'll see the rider, route, and ETA on this page.",
      },
      {
        icon: Wallet,
        label: "Pay on arrival",
        detail: "Payment closes only after delivery is reconciled.",
      },
    ],
  },
};

export function PlacementAcknowledgement({
  orderNo,
  total,
  currency,
  buyerEmail,
  paymentRecord,
}: {
  orderNo: string;
  total: number;
  currency: string;
  buyerEmail: string | null;
  paymentRecord: PaymentRecordShape;
}) {
  const method: Method = paymentRecord?.method ?? "bank_transfer";
  const voice = METHOD_VOICE[method];

  return (
    <section
      role="status"
      aria-live="polite"
      className="market-paper relative overflow-hidden rounded-[2rem] p-6 sm:p-8"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[var(--market-brass)] to-transparent"
      />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="market-kicker inline-flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-[var(--market-brass)]" aria-hidden />
            {voice.kicker}
          </p>
          <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--market-paper-white)] sm:text-[1.85rem]">
            {voice.title}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--market-muted)]">
            {voice.body}
          </p>
        </div>

        <dl className="grid w-full max-w-md gap-3 text-sm sm:grid-cols-3 lg:max-w-[460px]">
          <SummaryCell label="Order" value={orderNo} mono />
          <SummaryCell label="Total" value={formatCurrency(total, currency)} />
          <SummaryCell
            label="Confirmation"
            value={buyerEmail || "Saved to your account"}
            small
          />
        </dl>
      </div>

      <ol className="mt-7 grid gap-3 border-t border-[var(--market-line)] pt-6 sm:grid-cols-3">
        {voice.next.map((step, index) => {
          const Icon = step.icon;
          return (
            <li
              key={step.label}
              className="rounded-[1.4rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.03)] p-4"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.05)] text-[var(--market-brass)]">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--market-brass)]">
                  Step {index + 1}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-[var(--market-paper-white)]">
                {step.label}
              </p>
              <p className="mt-1 text-xs leading-6 text-[var(--market-muted)]">
                {step.detail}
              </p>
            </li>
          );
        })}
      </ol>

      <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-[var(--market-line)] pt-6">
        <Link
          href="/account/orders"
          className="market-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
        >
          View all orders
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        <Link
          href="/search"
          className="market-button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
        >
          Continue browsing
        </Link>
        <Link
          href={`/help?order=${encodeURIComponent(orderNo)}`}
          className="ml-auto inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)] hover:text-[var(--market-paper-white)]"
        >
          <LifeBuoy className="h-3.5 w-3.5" aria-hidden />
          Open support thread
        </Link>
      </div>
    </section>
  );
}

function SummaryCell({
  label,
  value,
  mono,
  small,
}: {
  label: string;
  value: string;
  mono?: boolean;
  small?: boolean;
}) {
  return (
    <div className="rounded-[1.2rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] p-4">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
        {label}
      </dt>
      <dd
        className={`mt-1 truncate font-semibold text-[var(--market-paper-white)] ${
          mono ? "font-mono text-sm" : small ? "text-xs leading-5" : "text-sm"
        }`}
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}
