"use client";

import { useState } from "react";
import { formatSurfaceTemplate } from "@henryco/i18n";
import { draftPostingAction } from "@/lib/ai/draft-posting-action";

export interface DraftPostingCopy {
  heading: string;
  intro: string;
  draftButton: string;
  drafting: string;
  needTitle: string;
  errorFallback: string;
  priceTemplate: string;
}

function naira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function titleCase(tier: string): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

function field(name: string): (HTMLInputElement | HTMLTextAreaElement) | null {
  return document.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLTextAreaElement | null;
}

/**
 * jobs.posting.draft (Register-L). A metered, governed draft: reads the role title the
 * employer typed, asks Henry Onyx Intelligence for an honest starting draft, and fills the
 * summary + description fields. Shows only the redacted receipt — never a provider, model,
 * cost, or margin. The employer edits everything before publishing.
 */
export function DraftPostingPanel({ copy }: { copy: DraftPostingCopy }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receiptLabel, setReceiptLabel] = useState<string | null>(null);

  async function onDraft() {
    const title = field("title")?.value?.trim() ?? "";
    if (!title) {
      setError(copy.needTitle);
      return;
    }
    setPending(true);
    setError(null);
    setReceiptLabel(null);
    try {
      const notes = field("summary")?.value?.trim() || field("description")?.value?.trim() || "";
      const res = await draftPostingAction({ title, notes, idempotencyKey: crypto.randomUUID() });
      if (!res.ok || !res.draft) {
        setError(res.message || copy.errorFallback);
        return;
      }
      const summary = field("summary");
      const description = field("description");
      if (summary) summary.value = res.draft.summary;
      if (description) description.value = res.draft.description;
      if (res.receipt?.billed) {
        setReceiptLabel(
          formatSurfaceTemplate(copy.priceTemplate, {
            price: naira(res.receipt.totalKobo),
            vat: naira(res.receipt.vatKobo),
            tier: titleCase(res.receipt.tier),
          }),
        );
      }
    } catch {
      setError(copy.errorFallback);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="jobs-card rounded-2xl p-5">
      <p className="text-sm font-semibold">{copy.heading}</p>
      <p className="mt-1 text-sm text-[var(--jobs-muted,#6b7280)]">{copy.intro}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onDraft}
          disabled={pending}
          className="jobs-button-primary rounded-full px-5 py-2.5 text-sm font-semibold disabled:cursor-wait disabled:opacity-70"
        >
          {pending ? copy.drafting : copy.draftButton}
        </button>
        {receiptLabel ? <span className="text-xs text-[var(--jobs-muted,#6b7280)]">{receiptLabel}</span> : null}
      </div>
      {error ? <p className="mt-2 text-sm text-[var(--jobs-muted,#6b7280)]">{error}</p> : null}
    </section>
  );
}
