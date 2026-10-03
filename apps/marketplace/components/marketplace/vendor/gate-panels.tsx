// V3-MKT-TRUST-01 — what a seller sees of the publish gate. Server components.
//
// Register-L: ink on paper, the workspace's own tokens; the one accent control
// is the existing primary button (dark ink on the accent, never white on gold).
// No string is written here — every word arrives from the typed copy.

import type { ReactNode } from "react";
import { formatMarketplaceTrustTemplate, type MarketplaceTrustCopy } from "@henryco/i18n/server";
import type { DescribedReason } from "@/lib/marketplace/publish-gate/messages";
import type { ProbationCaps, ProbationProgress } from "@/lib/marketplace/publish-gate/seller-state";
import type { ListingGateView, PayoutGateView } from "@/lib/marketplace/publish-gate/surfaces";

function ReasonList({ reasons }: { reasons: DescribedReason[] }) {
  if (reasons.length === 0) return null;
  return (
    <ul className="space-y-2">
      {reasons.map((reason) => (
        <li
          key={reason.code}
          className="rounded-[1.1rem] border border-[var(--market-line)] bg-[var(--market-bg-soft)] px-4 py-3"
        >
          <p className="text-sm font-semibold text-[var(--market-ink)]">{reason.label}</p>
          <p className="mt-1 text-sm leading-6 text-[var(--market-muted)]">{reason.fix}</p>
        </li>
      ))}
    </ul>
  );
}

/** One line under a listing on the products list. */
export function ListingGateLine({ view }: { view: ListingGateView }) {
  if (view.reasons.length === 0 && !view.hint) return null;
  return (
    <div className="space-y-2">
      {view.reasons.length > 0 ? (
        <p className="text-sm leading-6 text-[var(--market-ink)]">
          {view.reasons.map((reason) => reason.label).join(" · ")}
        </p>
      ) : null}
      {view.hint ? <p className="text-sm leading-6 text-[var(--market-muted)]">{view.hint}</p> : null}
    </div>
  );
}

/** The side panel on a listing's edit page. */
export function ListingGatePanel({ view, intro }: { view: ListingGateView; intro: string }) {
  return (
    <article className="market-paper rounded-[1.9rem] p-6">
      <p className="market-kicker">{view.label}</p>
      <div className="mt-4 space-y-4">
        {view.hint ? <p className="text-sm leading-7 text-[var(--market-ink)]">{view.hint}</p> : null}
        <ReasonList reasons={view.reasons} />
        {view.reasons.length === 0 && !view.hint ? (
          <p className="text-sm leading-7 text-[var(--market-muted)]">{intro}</p>
        ) : null}
      </div>
    </article>
  );
}

/** The limits a new store sells under, and what lifts them. */
export function ProbationPanel({
  copy,
  progress,
  caps,
  priceCeiling,
  verifyHref,
}: {
  copy: MarketplaceTrustCopy["probation"];
  progress: ProbationProgress;
  caps: ProbationCaps;
  /** Already formatted in the store's currency. */
  priceCeiling: string;
  verifyHref: string;
}) {
  const fill = (template: string, values: Record<string, string | number>) =>
    formatMarketplaceTrustTemplate(template, values);
  const limits = [
    fill(copy.liveListings, { used: progress.liveListings, cap: progress.liveListingsCap }),
    fill(copy.dailyListings, { cap: caps.maxNewListingsPerDay }),
    fill(copy.priceCeiling, { amount: priceCeiling }),
  ];
  const steps: Array<{ label: string; done: boolean }> = [
    {
      label: progress.identityVerified ? copy.stepIdentityDone : copy.stepIdentity,
      done: progress.identityVerified,
    },
    {
      label: fill(copy.stepOrders, {
        done: Math.min(progress.deliveredOrders, progress.deliveredOrdersNeeded),
        needed: progress.deliveredOrdersNeeded,
      }),
      done: progress.deliveredOrders >= progress.deliveredOrdersNeeded,
    },
    {
      label: fill(copy.stepDays, {
        done: Math.min(progress.ageDays, progress.ageDaysNeeded),
        needed: progress.ageDaysNeeded,
      }),
      done: progress.ageDays >= progress.ageDaysNeeded,
    },
  ];

  return (
    <article className="market-paper rounded-[1.9rem] p-6">
      <p className="market-kicker">{copy.kicker}</p>
      <h2 className="mt-3 text-xl font-semibold tracking-tight text-[var(--market-ink)]">{copy.title}</h2>
      <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">{copy.body}</p>

      <ul className="mt-5 space-y-2">
        {limits.map((limit) => (
          <li
            key={limit}
            className="rounded-[1.1rem] border border-[var(--market-line)] bg-[var(--market-bg-soft)] px-4 py-3 text-sm text-[var(--market-ink)]"
          >
            {limit}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm leading-6 text-[var(--market-muted)]">{copy.categoryNote}</p>

      <p className="market-kicker mt-6">{copy.graduationTitle}</p>
      <ul className="mt-3 space-y-2">
        {steps.map((step) => (
          <li key={step.label} className="flex items-start gap-3 text-sm leading-6 text-[var(--market-ink)]">
            <span
              aria-hidden="true"
              className={`mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full border border-[var(--market-ink)] ${
                step.done ? "bg-[var(--market-ink)]" : "bg-transparent"
              }`}
            />
            <span className={step.done ? "text-[var(--market-muted)] line-through" : undefined}>{step.label}</span>
          </li>
        ))}
      </ul>
      {progress.identityVerified ? null : (
        <a
          href={verifyHref}
          className="market-button-primary mt-5 inline-flex rounded-full px-5 py-3 text-sm font-semibold"
        >
          {copy.verifyCta}
        </a>
      )}
    </article>
  );
}

/** Shown above the payout form when the store cannot be paid yet. */
export function PayoutGatePanel({ view }: { view: PayoutGateView }) {
  return (
    <section role="status" className="market-paper rounded-[1.75rem] p-5">
      <p className="market-kicker">{view.title}</p>
      <p className="mt-3 text-sm leading-7 text-[var(--market-ink)]">{view.body}</p>
      {view.verifyHref ? (
        <a
          href={view.verifyHref}
          className="market-button-primary mt-4 inline-flex rounded-full px-5 py-3 text-sm font-semibold"
        >
          {view.verifyLabel}
        </a>
      ) : null}
    </section>
  );
}

/** A plain note block (the form intro, the finance refusal). */
export function GateNote({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "alert" }) {
  return (
    <div
      role={tone === "alert" ? "alert" : undefined}
      className="rounded-[1.35rem] border border-[var(--market-line)] bg-[var(--market-bg-soft)] px-4 py-4 text-sm leading-7 text-[var(--market-ink)]"
    >
      {children}
    </div>
  );
}
