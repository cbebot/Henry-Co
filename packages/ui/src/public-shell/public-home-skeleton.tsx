import { cn } from "../lib/cn";

/**
 * Canonical platform-wide loading skeleton for public surfaces.
 *
 * Design intent (2026-05-03):
 *   - Replaces the previous theatrical "Loading the public Care experience"
 *     splash and the variant of `<PublicRouteLoader />` (thin top progress
 *     bar) shipped on most app loading.tsx files. Owner pivot: every loading
 *     state should render a content-shaped placeholder matching the actual
 *     editorial column of the page that is about to mount, the same shape
 *     used by the hub homepage skeleton (`apps/hub/app/loading.tsx`).
 *   - Pure CSS, no spinners, no animation that thrashes the GPU on low-end
 *     devices. The cards have a fixed height matching real card dimensions
 *     so the layout does not shift (CLS = 0) when real content streams in.
 *   - Works on every dark surface (Hub, Care, Logistics, Marketplace, Jobs,
 *     Learn, Studio, Property) because every app sets `--accent` to the
 *     division accent and sits on a dark layout body. Light surfaces fall
 *     back to neutral whites/blacks via `tone="onLight"`.
 *
 * Variants:
 *   - "home"   ▸ taller hero stack, 4-card grid (matches hub /, division
 *               homepages, marketplace /, learn /)
 *   - "site"   ▸ shorter hero stack, 6-card grid (matches hub /about,
 *               /contact, marketplace /deals, /collections/*)
 *   - "detail" ▸ slim hero, no grid, longer body-line stack (matches
 *               product/[slug], post detail)
 *
 * Use directly inside `loading.tsx` files — no wrapper layout needed; the
 * app's `app/layout.tsx` already provides the chrome around the loader.
 */
export function PublicHomeSkeleton({
  variant = "home",
  cards,
  columns,
  tone = "onDark",
  className,
}: {
  variant?: "home" | "site" | "detail";
  /** Override card count. Defaults: home=4, site=6, detail=0 */
  cards?: number;
  /** Override grid columns at xl. Defaults: home=4, site=3 */
  columns?: 2 | 3 | 4;
  tone?: "onDark" | "onLight";
  className?: string;
}) {
  const isLight = tone === "onLight";
  const cardCount = cards ?? (variant === "home" ? 4 : variant === "site" ? 6 : 0);
  const xlCols =
    columns ?? (variant === "home" ? 4 : 3);
  const colClass =
    xlCols === 4
      ? "xl:grid-cols-4"
      : xlCols === 2
        ? "xl:grid-cols-2"
        : "xl:grid-cols-3";

  const eyebrowBar = isLight ? "bg-zinc-900/10" : "bg-white/10";
  const heroPrimary = isLight ? "bg-zinc-900/[0.07]" : "bg-white/[0.07]";
  const heroSecondary = isLight ? "bg-zinc-900/[0.06]" : "bg-white/[0.06]";
  const lineMuted = isLight ? "bg-zinc-900/[0.05]" : "bg-white/[0.05]";
  const lineSubtle = isLight ? "bg-zinc-900/[0.04]" : "bg-white/[0.04]";
  const cardSurface = isLight
    ? "border-zinc-900/10 bg-zinc-900/[0.03]"
    : "border-white/10 bg-white/[0.04]";

  const heroSizes = variant === "home"
    ? { primary: "h-12 sm:h-14", primaryWidth: "max-w-3xl", secondary: "h-12", secondaryWidth: "w-2/3 max-w-2xl" }
    : variant === "site"
      ? { primary: "h-10 sm:h-12", primaryWidth: "max-w-2xl", secondary: "h-10", secondaryWidth: "w-3/4 max-w-xl" }
      : { primary: "h-9 sm:h-11", primaryWidth: "max-w-2xl", secondary: "h-9", secondaryWidth: "w-2/3 max-w-xl" };

  const cardHeight = variant === "home" ? "h-44" : "h-40";

  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className={cn("px-5 py-10 sm:px-8 lg:px-10", className)}
    >
      <div className="mx-auto max-w-[88rem] space-y-10">
        <div className="space-y-5">
          <div aria-hidden className={cn("h-3 w-28 rounded-full", eyebrowBar)} />
          <div
            aria-hidden
            className={cn(
              "w-full rounded-xl",
              heroSizes.primary,
              heroSizes.primaryWidth,
              heroPrimary,
            )}
          />
          <div
            aria-hidden
            className={cn(
              "rounded-xl",
              heroSizes.secondary,
              heroSizes.secondaryWidth,
              heroSecondary,
            )}
          />
          <div aria-hidden className={cn("h-4 w-full max-w-lg rounded-full", lineMuted)} />
          {variant !== "home" ? (
            <div aria-hidden className={cn("h-4 w-4/5 max-w-md rounded-full", lineSubtle)} />
          ) : null}
        </div>
        {cardCount > 0 ? (
          <div className={cn("grid gap-4 sm:grid-cols-2", colClass)}>
            {Array.from({ length: cardCount }).map((_, i) => (
              <div
                key={i}
                aria-hidden
                className={cn(
                  "rounded-[28px] border",
                  cardHeight,
                  cardSurface,
                )}
              />
            ))}
          </div>
        ) : null}
        {variant === "detail" ? (
          <div className="space-y-3">
            <div aria-hidden className={cn("h-4 w-full max-w-2xl rounded-full", lineMuted)} />
            <div aria-hidden className={cn("h-4 w-4/5 max-w-xl rounded-full", lineSubtle)} />
            <div aria-hidden className={cn("h-4 w-2/3 max-w-md rounded-full", lineMuted)} />
            <div aria-hidden className={cn("h-4 w-3/4 max-w-lg rounded-full", lineSubtle)} />
          </div>
        ) : null}
        <span className="sr-only">Loading content.</span>
      </div>
    </main>
  );
}
