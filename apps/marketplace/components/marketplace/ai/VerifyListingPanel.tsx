"use client";

import { useState } from "react";
import { formatSurfaceTemplate } from "@henryco/i18n";
import { verifyListingAction, type VerifyResult } from "@/lib/ai/verify-listing-action";

export interface VerifyPanelCopy {
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
  const el = document.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
  return el?.value?.trim() ?? "";
}

/**
 * The "Get Henry Onyx Verified" panel (Register-L). Runs the deep-tier, METERED trust
 * review on the listing the seller is editing. Shows only the outcome + constructive
 * reasons + a redacted receipt — never a provider, model, cost, or margin. The review
 * AUGMENTS human moderation; it never publishes.
 */
export function VerifyListingPanel({ copy }: { copy: VerifyPanelCopy }) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [receiptLabel, setReceiptLabel] = useState<string | null>(null);

  async function onRequest() {
    setPending(true);
    setResult(null);
    setReceiptLabel(null);
    try {
      const imageUrl = fieldValue("image_url");
      const res = await verifyListingAction({
        title: fieldValue("title"),
        summary: fieldValue("summary"),
        description: fieldValue("description"),
        category: fieldValue("category_slug"),
        images: imageUrl ? [imageUrl] : [],
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
    <section className="market-panel rounded-[1.75rem] p-5">
      <p className="market-kicker">{copy.heading}</p>
      <p className="mt-2 max-w-2xl text-sm text-[var(--market-paper-white)]">{copy.intro}</p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onRequest}
          disabled={pending}
          className="market-button-primary rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-wait disabled:opacity-70"
        >
          {pending ? copy.reviewing : copy.request}
        </button>
        {receiptLabel ? <span className="text-xs text-[var(--market-muted)]">{receiptLabel}</span> : null}
      </div>

      {result && !result.ok ? <p className="mt-3 text-sm text-[var(--market-muted)]">{result.message}</p> : null}

      {result && result.ok ? (
        <div className="mt-4 grid gap-3 rounded-[1.5rem] border border-[var(--market-line)] bg-[var(--market-fill-faint)] p-4">
          {result.outcome === "verified" ? (
            <p className="text-sm font-semibold text-[var(--market-brass)]">✓ {copy.verifiedBadge}</p>
          ) : (
            <p className="text-sm font-semibold text-[var(--market-paper-white)]">
              {result.outcome === "review" ? copy.readyForReview : copy.needsWork}
            </p>
          )}
          {result.reasons.length ? (
            <ul className="grid gap-1 text-sm text-[var(--market-muted)]">
              {result.reasons.map((r, i) => (
                <li key={i}>• {r}</li>
              ))}
            </ul>
          ) : null}
          <span className="text-xs text-[var(--market-muted)]">{copy.augmentsNote}</span>
        </div>
      ) : null}
    </section>
  );
}
