"use client";

import { useState } from "react";
import { formatSurfaceTemplate } from "@henryco/i18n";
import { aiTierBrandName } from "@henryco/ai-gateway";
import { AiProse } from "@henryco/ui/prose";
import {
  quoteListingVerifyAction,
  verifyListingAction,
  type VerifyResult,
} from "@/lib/ai/verify-listing-action";

export interface VerifyPanelCopy {
  heading: string;
  intro: string;
  seePrice: string;
  quoting: string;
  quoteTemplate: string;
  confirmTemplate: string;
  cancel: string;
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
type Quote = { totalKobo: number; vatKobo: number };

export function VerifyListingPanel({ copy, productId }: { copy: VerifyPanelCopy; productId?: string }) {
  // A small state machine so the seller ALWAYS sees the price and confirms before any charge
  // (price-before-run): idle → quoting → quoted (confirm/cancel) → running → result.
  const [pending, setPending] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [receiptLabel, setReceiptLabel] = useState<string | null>(null);

  // Step 1 — fetch the price. No wallet touch; nothing runs yet.
  async function onSeePrice() {
    setPending(true);
    setResult(null);
    setError(null);
    setReceiptLabel(null);
    try {
      const res = await quoteListingVerifyAction({
        title: fieldValue("title"),
        summary: fieldValue("summary"),
        description: fieldValue("description"),
        category: fieldValue("category_slug"),
      });
      if (res.ok) setQuote({ totalKobo: res.totalKobo, vatKobo: res.vatKobo });
      else setError(res.message);
    } catch {
      setError(copy.errorFallback);
    } finally {
      setPending(false);
    }
  }

  function onCancel() {
    setQuote(null);
    setError(null);
  }

  // Step 2 — the seller confirmed the price; NOW run the metered review (charges the wallet,
  // hard-capped at the reservation, so never above the price just confirmed).
  async function onConfirmRun() {
    setPending(true);
    setError(null);
    try {
      const imageUrl = fieldValue("image_url");
      const res = await verifyListingAction({
        productId,
        title: fieldValue("title"),
        summary: fieldValue("summary"),
        description: fieldValue("description"),
        category: fieldValue("category_slug"),
        images: imageUrl ? [imageUrl] : [],
        idempotencyKey: crypto.randomUUID(),
      });
      setResult(res);
      setQuote(null);
      if (res.ok && res.receipt.billed) {
        setReceiptLabel(
          formatSurfaceTemplate(copy.priceTemplate, {
            price: naira(res.receipt.totalKobo),
            vat: naira(res.receipt.vatKobo),
            tier: aiTierBrandName(res.receipt.tier),
          }),
        );
      } else if (!res.ok) {
        setError(res.message);
      }
    } catch {
      setError(copy.errorFallback);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="market-panel rounded-[1.75rem] p-5">
      <p className="market-kicker">{copy.heading}</p>
      <p className="mt-2 max-w-2xl text-sm text-[var(--market-paper-white)]">{copy.intro}</p>

      {quote ? (
        <div className="mt-4 grid gap-3 rounded-[1.5rem] border border-[var(--market-line)] bg-[var(--market-fill-faint)] p-4">
          <p className="text-sm text-[var(--market-paper-white)]">
            {formatSurfaceTemplate(copy.quoteTemplate, {
              price: naira(quote.totalKobo),
              vat: naira(quote.vatKobo),
            })}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onConfirmRun}
              disabled={pending}
              className="market-button-primary rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-wait disabled:opacity-70"
            >
              {pending
                ? copy.reviewing
                : formatSurfaceTemplate(copy.confirmTemplate, { price: naira(quote.totalKobo) })}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={pending}
              className="market-button-secondary rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-70"
            >
              {copy.cancel}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onSeePrice}
            disabled={pending}
            className="market-button-primary rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-wait disabled:opacity-70"
          >
            {pending ? copy.quoting : copy.seePrice}
          </button>
          {receiptLabel ? <span className="text-xs text-[var(--market-muted)]">{receiptLabel}</span> : null}
        </div>
      )}

      {error ? <p className="mt-3 text-sm text-[var(--market-muted)]">{error}</p> : null}

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
            /* The AI's constructive review notes render in the brand editorial serif. */
            <AiProse size="chat" className="text-[var(--market-muted)]">
              <ul>
                {result.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </AiProse>
          ) : null}
          <span className="text-xs text-[var(--market-muted)]">{copy.augmentsNote}</span>
        </div>
      ) : null}
    </section>
  );
}
