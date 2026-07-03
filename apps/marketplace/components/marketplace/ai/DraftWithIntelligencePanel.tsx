"use client";

import { useState } from "react";
import { formatSurfaceTemplate } from "@henryco/i18n";
import { aiTierBrandName } from "@henryco/ai-gateway";
import { draftListingAction, type ListingDraft } from "@/lib/ai/draft-listing-action";

export interface DraftPanelCopy {
  heading: string;
  intro: string;
  ideaLabel: string;
  notesLabel: string;
  draftButton: string;
  drafting: string;
  useDraft: string;
  errorFallback: string;
  priceTemplate: string;
  advisory: string;
}

function naira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fillField(name: string, value: string, onlyIfEmpty = false): void {
  const el = document.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLTextAreaElement | null;
  if (!el || !value) return;
  if (onlyIfEmpty && el.value) return;
  // Set through the native prototype setter so React-controlled inputs update their state
  // too (a direct .value assignment is invisible to React's synthetic change tracking).
  const proto =
    el instanceof HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (setter) {
    setter.call(el, value);
  } else {
    el.value = value;
  }
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

/** The description plus the drafted key specs — the form has no separate specifications
 *  field, so the specs the model grounded in the seller's words ride in the description
 *  (previously they were silently discarded). */
function buildDescription(draft: ListingDraft): string {
  if (!draft.specifications) return draft.description;
  if (!draft.description) return draft.specifications;
  return `${draft.description}\n\n${draft.specifications}`;
}

function fillCategory(value: string): void {
  if (!value) return;
  const sel = document.querySelector('[name="category_slug"]') as HTMLSelectElement | null;
  if (!sel) return;
  const needle = value.toLowerCase();
  const match = Array.from(sel.options).find(
    (o) => o.value.toLowerCase().includes(needle) || o.text.toLowerCase().includes(needle),
  );
  if (match) {
    sel.value = match.value;
    sel.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

/**
 * Register-L "Draft with Henry Onyx Intelligence" panel. Mounted (behind a flag) above the
 * vendor listing form. It calls the governed gateway server action and fills the form the
 * human still reviews and submits — it never writes the listing itself. The client only
 * ever sees a redacted receipt: a kobo total + VAT + a capability tier label, NEVER a
 * provider, model, cost, or margin.
 *
 * When `onApply` is provided, "Use this draft" hands the draft (plus the seller's idea,
 * the title fallback) to the state-owning form through the typed callback — no DOM
 * queries. The legacy querySelector path remains only for mounts that don't pass it.
 */
export function DraftWithIntelligencePanel({
  copy,
  onApply,
}: {
  copy: DraftPanelCopy;
  onApply?: (draft: ListingDraft, idea: string) => void;
}) {
  const [idea, setIdea] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);
  const [draft, setDraft] = useState<ListingDraft | null>(null);
  const [receiptLabel, setReceiptLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onDraft() {
    setPending(true);
    setError(null);
    setDraft(null);
    setReceiptLabel(null);
    try {
      const res = await draftListingAction({
        title: idea,
        notes,
        idempotencyKey: crypto.randomUUID(),
      });
      if (!res.ok) {
        setError(res.message || copy.errorFallback);
        return;
      }
      setDraft(res.draft);
      if (res.receipt.billed) {
        setReceiptLabel(
          formatSurfaceTemplate(copy.priceTemplate, {
            price: naira(res.receipt.totalKobo),
            vat: naira(res.receipt.vatKobo),
            tier: aiTierBrandName(res.receipt.tier),
          }),
        );
      }
    } catch {
      setError(copy.errorFallback);
    } finally {
      setPending(false);
    }
  }

  function onUse() {
    if (!draft) return;
    // State-owned path: hand the draft (plus the idea, the title fallback) to the form.
    if (onApply) {
      onApply(draft, idea);
      return;
    }
    // Legacy DOM path for mounts without onApply. "Use this draft" means use it —
    // the seller reviews before submit.
    fillField("title", draft.title || idea);
    fillField("summary", draft.summary);
    fillField("description", buildDescription(draft));
    fillCategory(draft.category);
    // Factual attributes: fill only when the model grounded them in the seller's words,
    // and never overwrite something the seller already typed themselves.
    fillField("material", draft.material, true);
    fillField("warranty", draft.warranty, true);
    fillField("delivery_note", draft.deliveryNote, true);
    fillField("lead_time", draft.leadTime, true);
  }

  return (
    <section className="market-panel rounded-[1.75rem] p-5">
      <p className="market-kicker">{copy.heading}</p>
      <p className="mt-2 max-w-2xl text-sm text-[var(--market-paper-white)]">{copy.intro}</p>

      <div className="mt-4 grid gap-3">
        <input
          className="market-input rounded-2xl px-4 py-3"
          placeholder={copy.ideaLabel}
          aria-label={copy.ideaLabel}
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
        />
        <textarea
          className="market-textarea rounded-[1.5rem] px-4 py-3"
          rows={2}
          placeholder={copy.notesLabel}
          aria-label={copy.notesLabel}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onDraft}
            disabled={pending || idea.trim().length < 3}
            className="market-button-primary rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-wait disabled:opacity-70"
          >
            {pending ? copy.drafting : copy.draftButton}
          </button>
          {receiptLabel ? <span className="text-xs text-[var(--market-muted)]">{receiptLabel}</span> : null}
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-[var(--market-muted)]">{error}</p> : null}

      {draft ? (
        <div className="mt-4 grid gap-3 rounded-[1.5rem] border border-[var(--market-line)] bg-[var(--market-fill-faint)] p-4">
          {draft.summary ? <p className="text-sm font-semibold text-[var(--market-paper-white)]">{draft.summary}</p> : null}
          {draft.description ? <p className="whitespace-pre-line text-sm text-[var(--market-paper-white)]">{draft.description}</p> : null}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-[var(--market-muted)]">{copy.advisory}</span>
            <button type="button" onClick={onUse} className="market-button-secondary rounded-full px-4 py-2 text-sm font-semibold">
              {copy.useDraft}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
