"use client";

/**
 * TrackLookupForm — order-number lookup entry for the public `/track` index.
 *
 * V3-06 (S4): the marketplace advertised `/track` (public nav + the buyer
 * account "Track an order" CTA) but only `/track/[orderNo]` existed, so every
 * bare `/track` link was DEAD. This form is the missing index: enter an order
 * reference and navigate to the existing `/track/{orderNo}` detail route.
 *
 * All user-facing strings arrive pre-resolved from the server via
 * `translateMarketplacePublicLabel` (Pattern B runtime DeepL) — no hardcoded
 * copy lives here.
 */

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Search } from "lucide-react";

export type TrackLookupLabels = {
  inputLabel: string;
  placeholder: string;
  submit: string;
  emptyError: string;
};

export function TrackLookupForm({ labels }: { labels: TrackLookupLabels }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const orderNo = value.trim();
    if (!orderNo) {
      setError(labels.emptyError);
      return;
    }
    setError(null);
    router.push(`/track/${encodeURIComponent(orderNo)}`);
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 max-w-xl space-y-3" noValidate>
      <label
        htmlFor="market-track-orderno"
        className="block text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]"
      >
        {labels.inputLabel}
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--market-muted)]"
            aria-hidden
          />
          <input
            id="market-track-orderno"
            name="orderNo"
            type="text"
            inputMode="text"
            autoComplete="off"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={labels.placeholder}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={error ? "market-track-error" : undefined}
            className="w-full rounded-full border border-[var(--market-line)] bg-[color:var(--home-surface-02)] py-3 pl-11 pr-4 text-sm text-[var(--market-ink)] outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--market-brass)]/55"
          />
        </div>
        <button
          type="submit"
          className="market-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--market-brass)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--home-canvas)] active:translate-y-[0.5px]"
        >
          {labels.submit}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
      {error ? (
        <p id="market-track-error" role="alert" className="text-sm text-[var(--market-danger,#e2725b)]">
          {error}
        </p>
      ) : null}
    </form>
  );
}
