"use client";

import { useState } from "react";
import { formatSurfaceTemplate } from "@henryco/i18n";
import { verifyListingAction, type VerifyListingResult } from "@/lib/ai/verify-listing-action";

export interface VerifyListingCopy {
  heading: string;
  intro: string;
  request: string;
  reviewing: string;
  verifiedBadge: string;
  readyForReview: string;
  needsWork: string;
  augmentsNote: string;
  errorFallback: string;
  priceTemplate: string;
}

function naira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function titleCase(tier: string): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

function fieldValue(name: string): string {
  const el = document.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLTextAreaElement | null;
  return el?.value?.trim() ?? "";
}

/**
 * property.listing.verify panel (Register-L, property tokens). Runs the deep-tier, METERED
 * trust review on the listing the owner is drafting. Shows only the outcome + reasons + a
 * redacted receipt — never provider/model/cost. AUGMENTS property's trust review; never publishes.
 */
export function VerifyListingPanel({ copy }: { copy: VerifyListingCopy }) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<VerifyListingResult | null>(null);
  const [receiptLabel, setReceiptLabel] = useState<string | null>(null);

  async function onRequest() {
    setPending(true);
    setResult(null);
    setReceiptLabel(null);
    try {
      const res = await verifyListingAction({
        title: fieldValue("title"),
        summary: fieldValue("summary"),
        description: fieldValue("description"),
        idempotencyKey: crypto.randomUUID(),
      });
      setResult(res);
      if (res.ok && res.receipt.billed) {
        setReceiptLabel(
          formatSurfaceTemplate(copy.priceTemplate, {
            price: naira(res.receipt.totalKobo),
            vat: naira(res.receipt.vatKobo),
            tier: titleCase(res.receipt.tier),
          }),
        );
      }
    } catch {
      setResult({ ok: false, code: "provider_error", message: copy.errorFallback });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="property-panel rounded-2xl p-5">
      <p className="text-sm font-semibold text-[var(--property-ink)]">{copy.heading}</p>
      <p className="mt-1 text-sm text-[var(--property-ink)] opacity-80">{copy.intro}</p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" onClick={onRequest} disabled={pending} className="property-button-secondary rounded-full px-5 py-2.5 text-sm font-semibold disabled:cursor-wait disabled:opacity-70">
          {pending ? copy.reviewing : copy.request}
        </button>
        {receiptLabel ? <span className="text-xs text-[var(--property-ink)] opacity-70">{receiptLabel}</span> : null}
      </div>

      {result && !result.ok ? <p className="mt-2 text-sm text-[var(--property-ink)] opacity-80">{result.message}</p> : null}

      {result && result.ok ? (
        <div className="mt-3 grid gap-2 rounded-xl border border-[var(--property-line)] p-4">
          {result.outcome === "verified" ? (
            <p className="text-sm font-semibold text-[var(--property-accent-strong)]">✓ {copy.verifiedBadge}</p>
          ) : (
            <p className="text-sm font-semibold text-[var(--property-ink)]">{result.outcome === "review" ? copy.readyForReview : copy.needsWork}</p>
          )}
          {result.reasons.length ? (
            <ul className="grid gap-1 text-sm text-[var(--property-ink)] opacity-80">
              {result.reasons.map((r, i) => (
                <li key={i}>• {r}</li>
              ))}
            </ul>
          ) : null}
          <span className="text-xs text-[var(--property-ink)] opacity-70">{copy.augmentsNote}</span>
        </div>
      ) : null}
    </div>
  );
}
