import { HenryCoMonogram } from "@henryco/ui/brand";

/**
 * AccountRouteLoader — THE dedicated account loading experience.
 *
 * Replaces the old generic `StructuredSkeleton` card-list (four grey
 * placeholder cards on every route) with one crafted Henry Onyx brand
 * moment that is HONEST by construction:
 *
 *   - It renders ONLY while a real navigation / Suspense boundary is
 *     pending (Next streams it in, swaps it out the instant the route is
 *     ready). It never runs on a timer and never shows a fake percentage.
 *   - Progressive disclosure (pure CSS): the calm gold rail appears at
 *     once, but the breathing H·Onyx mark fades up only after ~420ms — so
 *     fast navigations flash nothing but the hairline rail (feels instant)
 *     and only a genuinely slow load earns the full brand moment. No
 *     spinner, no "Loading…" copy, no warmup theater.
 *   - Theme-aware via the account `--acct-*` tokens (warm cream in light,
 *     deep onyx in dark) and fully reduced-motion-aware.
 *
 * The visual styles + timings live in `apps/account/app/globals.css`
 * (`.acct-route-loader*`). This component is pure markup — SSR-safe, no
 * JS, no layout thrash, CLS-safe.
 *
 * Props are accepted for backwards-compatibility with the dozens of
 * existing `<AccountRouteLoading title=… />` call sites but are ignored at
 * the visible layer — the loader is one uniform experience account-wide.
 */
export default function AccountRouteLoader({
  title,
}: {
  title?: string;
  description?: string;
} = {}) {
  // The visible layer carries no copy (no warmup theater); `title` only
  // sharpens the screen-reader announcement (e.g. "Loading Wallet").
  const srLabel = title ? `Loading ${title}` : "Loading your account";
  return (
    <div
      className="acct-route-loader"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">{srLabel}</span>

      {/* The calm, immediate signal: an indeterminate gold hairline rail. */}
      <span aria-hidden className="acct-route-loader__rail">
        <span className="acct-route-loader__rail-fill" />
      </span>

      {/* The brand moment — revealed only on genuinely slow loads. */}
      <span aria-hidden className="acct-route-loader__stage">
        <span className="acct-route-loader__aurora" />
        <span className="acct-route-loader__mark">
          <HenryCoMonogram
            size={68}
            accent="var(--acct-gold)"
            aria-hidden
            className="acct-route-loader__monogram"
          />
          <span className="acct-route-loader__sheen" />
        </span>
      </span>
    </div>
  );
}
