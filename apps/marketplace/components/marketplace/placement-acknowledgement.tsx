import Link from "next/link";
import { ArrowRight, Banknote, Check, Clock3, Mail, ShieldCheck, Truck, Wallet } from "lucide-react";
import { getMarketplaceCheckoutCopy, type MarketplaceCheckoutCopy } from "@henryco/i18n";
import { getMarketplacePublicLocale } from "@/lib/locale-server";
import { formatCurrency } from "@/lib/utils";

type PaymentMethod = "wallet_balance" | "bank_transfer" | "cod" | string;

type Step = {
  icon: typeof ShieldCheck;
  title: string;
  body: string;
};

function copyForMethod(
  method: PaymentMethod | null,
  copy: MarketplaceCheckoutCopy["placement"],
): {
  kicker: string;
  headline: string;
  lead: string;
  steps: Step[];
} {
  if (method === "wallet_balance") {
    return {
      kicker: copy.wallet.kicker,
      headline: copy.wallet.headline,
      lead: copy.wallet.lead,
      steps: [
        {
          icon: ShieldCheck,
          title: copy.wallet.escrowProtection.title,
          body: copy.wallet.escrowProtection.body,
        },
        {
          icon: Truck,
          title: copy.wallet.vendorSegments.title,
          body: copy.wallet.vendorSegments.body,
        },
        {
          icon: Mail,
          title: copy.wallet.receipts.title,
          body: copy.wallet.receipts.body,
        },
      ],
    };
  }

  if (method === "bank_transfer") {
    return {
      kicker: copy.bankTransfer.kicker,
      headline: copy.bankTransfer.headline,
      lead: copy.bankTransfer.lead,
      steps: [
        {
          icon: Clock3,
          title: copy.bankTransfer.verificationHours.title,
          body: copy.bankTransfer.verificationHours.body,
        },
        {
          icon: ShieldCheck,
          title: copy.bankTransfer.escrowLifts.title,
          body: copy.bankTransfer.escrowLifts.body,
        },
        {
          icon: Mail,
          title: copy.bankTransfer.reachOut.title,
          body: copy.bankTransfer.reachOut.body,
        },
      ],
    };
  }

  if (method === "cod") {
    return {
      kicker: copy.cod.kicker,
      headline: copy.cod.headline,
      lead: copy.cod.lead,
      steps: [
        {
          icon: Check,
          title: copy.cod.vendorAccepts.title,
          body: copy.cod.vendorAccepts.body,
        },
        {
          icon: Truck,
          title: copy.cod.payOnArrival.title,
          body: copy.cod.payOnArrival.body,
        },
        {
          icon: Mail,
          title: copy.cod.updates.title,
          body: copy.cod.updates.body,
        },
      ],
    };
  }

  return {
    kicker: copy.fallback.kicker,
    headline: copy.fallback.headline,
    lead: copy.fallback.lead,
    steps: [
      {
        icon: ShieldCheck,
        title: copy.fallback.escrowStaysOn.title,
        body: copy.fallback.escrowStaysOn.body,
      },
      {
        icon: Truck,
        title: copy.fallback.vendorsDispatch.title,
        body: copy.fallback.vendorsDispatch.body,
      },
      {
        icon: Mail,
        title: copy.fallback.notifications.title,
        body: copy.fallback.notifications.body,
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

export async function PlacementAcknowledgement({
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
  const locale = await getMarketplacePublicLocale();
  const copy = getMarketplaceCheckoutCopy(locale).placement;
  const { kicker, headline, lead, steps } = copyForMethod(paymentMethod, copy);

  return (
    <section
      aria-labelledby="placement-ack-heading"
      className="market-paper rounded-[2rem] p-6 sm:p-8"
    >
      <div className="grid gap-8 lg:grid-cols-[1.05fr,0.95fr] lg:items-start">
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
          <p className="mt-4 max-w-2xl text-pretty text-sm leading-7 text-[var(--market-muted)] sm:text-[15px]">
            {lead}
          </p>

          <dl className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.15rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.03)] p-4">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
                {copy.orderNumber}
              </dt>
              <dd className="mt-1 text-sm font-semibold tracking-tight text-[var(--market-ink)]">
                {orderNo}
              </dd>
            </div>
            <div className="rounded-[1.15rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.03)] p-4">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
                {copy.total}
              </dt>
              <dd className="mt-1 text-sm font-semibold tracking-tight text-[var(--market-ink)]">
                {formatCurrency(grandTotal, currency)}
              </dd>
            </div>
            <div className="rounded-[1.15rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.03)] p-4">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
                {copy.confirmationTo}
              </dt>
              <dd className="mt-1 truncate text-sm font-semibold tracking-tight text-[var(--market-ink)]">
                {buyerEmail || copy.confirmationFallback}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/account/orders"
              className="market-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
            >
              {copy.viewAllOrders}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/search"
              className="market-button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
            >
              {copy.continueBrowsing}
            </Link>
            <Link
              href={`/help?order=${orderNo}`}
              className="inline-flex items-center gap-2 self-center text-sm font-semibold text-[var(--market-brass)] hover:underline"
            >
              {copy.needHelp}
            </Link>
          </div>
        </div>

        <div>
          <p className="market-kicker text-[10.5px] uppercase tracking-[0.28em]">{copy.whatHappensNext}</p>
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
