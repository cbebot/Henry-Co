import Link from "next/link";
import { ArrowRight, Banknote, Check, ShieldCheck, Truck, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type PaymentMethod = "wallet_balance" | "bank_transfer" | "cod" | string;

type Step = {
  icon: typeof ShieldCheck;
  title: string;
  body: string;
};

function copyForMethod(method: PaymentMethod | null): {
  kicker: string;
  headline: string;
  steps: Step[];
} {
  if (method === "wallet_balance") {
    return {
      kicker: "Order placed · paid",
      headline: "Paid from your Henry Onyx balance. Held in escrow.",
      steps: [
        {
          icon: ShieldCheck,
          title: "Buyer protection on by default",
          body: "Your payment stays protected until delivery is confirmed. Raise an issue any time before then and it stays held.",
        },
      ],
    };
  }

  if (method === "bank_transfer") {
    return {
      kicker: "Order placed · confirming payment",
      headline: "Payment proof received — we're confirming it.",
      steps: [
        {
          icon: ShieldCheck,
          title: "Escrow lifts after fulfillment",
          body: "Seller payout only releases after delivery confirms. Disputes opened before then keep the funds frozen by default.",
        },
      ],
    };
  }

  if (method === "cod") {
    return {
      kicker: "Order placed · pay on delivery",
      headline: "Awaiting vendor acceptance. Pay the rider on delivery.",
      steps: [
        {
          icon: Check,
          title: "Vendor accepts before dispatch",
          body: "If the seller can't fulfil, the order is cancelled with no charge.",
        },
      ],
    };
  }

  return {
    kicker: "Order placed",
    headline: "We've recorded your order.",
    steps: [
      {
        icon: ShieldCheck,
        title: "Escrow stays on",
        body: "Seller payout only releases after fulfillment confirms. Disputes opened before that keep the funds frozen.",
      },
    ],
  };
}

function MethodIcon({ method, className }: { method: PaymentMethod | null; className?: string }) {
  if (method === "wallet_balance") return <Wallet className={className} aria-hidden />;
  if (method === "bank_transfer") return <Banknote className={className} aria-hidden />;
  if (method === "cod") return <Truck className={className} aria-hidden />;
  return <ShieldCheck className={className} aria-hidden />;
}

export function PlacementAcknowledgement({
  orderNo,
  paymentMethod,
  buyerEmail,
  grandTotal,
  currency,
}: {
  orderNo: string;
  paymentMethod: PaymentMethod | null;
  buyerEmail: string | null;
  grandTotal: number;
  currency: string;
}) {
  const { kicker, headline, steps } = copyForMethod(paymentMethod);

  return (
    <section
      aria-labelledby="placement-ack-heading"
      className="market-paper rounded-[2rem] p-6 sm:p-8"
    >
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <div>
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--market-brass)] bg-[rgba(200,163,106,0.12)] text-[var(--market-brass)]">
              <MethodIcon method={paymentMethod} className="h-4 w-4" />
            </span>
            <p className="market-kicker text-[10.5px] uppercase tracking-[0.28em]">{kicker}</p>
          </div>
          <h2
            id="placement-ack-heading"
            className="mt-4 text-balance text-[1.6rem] font-semibold leading-[1.12] tracking-[-0.02em] text-[var(--market-ink)] sm:text-[2rem]"
          >
            {headline}
          </h2>

          <dl className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.15rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.03)] p-4">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
                Order number
              </dt>
              <dd className="mt-1 text-sm font-semibold tracking-tight text-[var(--market-ink)]">
                {orderNo}
              </dd>
            </div>
            <div className="rounded-[1.15rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.03)] p-4">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
                Total
              </dt>
              <dd className="mt-1 text-sm font-semibold tracking-tight text-[var(--market-ink)]">
                {formatCurrency(grandTotal, currency)}
              </dd>
            </div>
            <div className="rounded-[1.15rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.03)] p-4">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
                Confirmation to
              </dt>
              <dd className="mt-1 truncate text-sm font-semibold tracking-tight text-[var(--market-ink)]">
                {buyerEmail || "Your Henry Onyx account"}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap gap-3">
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
              href={`/help?order=${orderNo}`}
              className="inline-flex items-center gap-2 self-center text-sm font-semibold text-[var(--market-brass)] hover:underline"
            >
              Need help with this order?
            </Link>
          </div>
        </div>

        <div>
          <p className="market-kicker text-[10.5px] uppercase tracking-[0.28em]">What happens next</p>
          <ol className="mt-3 space-y-3">
            {steps.map((step) => {
              const StepIcon = step.icon;
              return (
                <li
                  key={step.title}
                  className="flex items-start gap-3 rounded-[1.2rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.03)] p-4"
                >
                  <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.05)] text-[var(--market-brass)]">
                    <StepIcon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--market-ink)]">{step.title}</p>
                    <p className="mt-1 text-[13px] leading-6 text-[var(--market-muted)]">{step.body}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
