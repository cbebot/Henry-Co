import { fraunces, STUDIO_PUBLIC_THEME_STYLE } from "./studio-public-theme";

/**
 * V3-STUDIO-LOADING-POLISH — the light, on-brand loading state for the
 * Studio PUBLIC surface.
 *
 * Why this exists
 * ---------------
 * The Studio public surface was rebuilt to LIGHT-PRIMARY (warm paper) +
 * Fraunces + a config TEAL accent, wrapped in `.studio-public` (see
 * studio-public-theme.ts). But the route fallbacks rendered the shared
 * `PublicHomeSkeleton` with its default `tone="onDark"` — white bars on a
 * dark assumption — and the root `app/loading.tsx` lives OUTSIDE the
 * `.studio-public` wrapper, so it painted the dashboard's dark
 * `--studio-bg` body. The net effect was a sharp DARK flash before the new
 * light page streamed in.
 *
 * This component is self-contained and flash-proof:
 *  • It carries its OWN `.studio-public` wrapper + `STUDIO_PUBLIC_THEME_STYLE`
 *    + the Fraunces variable, so it resolves the SAME warm-paper `--home-*`
 *    canvas and teal accent as the real pages — even when mounted at the
 *    root boundary (which is otherwise dark). No dependence on an ancestor
 *    theme wrapper.
 *  • It paints a full-viewport `--home-canvas` background immediately, so
 *    there is never a frame of dark body bleeding through.
 *  • Pure CSS placeholders on warm ink tints (no GPU-thrashing animation),
 *    sized to match the real editorial column → CLS ≈ 0 when content streams.
 *  • One quiet teal focal mark (the accent eyebrow + a soft accent wash)
 *    echoes the rebuilt pages' "one confident teal moment" rhythm.
 *
 * Variants mirror the real surfaces:
 *  • "home"    ▸ marketing landing — eyebrow, tall hero stack, proof rail,
 *                4-card grid (matches app/(public)/page.tsx).
 *  • "compose" ▸ focused brief flow — eyebrow, hero, then a tall composer
 *                panel (matches the /request subtree).
 */
export function StudioPublicLoading({
  variant = "home",
}: {
  variant?: "home" | "compose";
}) {
  // Warm-ink tints — the light analogue of the dark skeleton's white/[0.0x].
  const eyebrow = "bg-[color:var(--home-accent-soft)]";
  const heroPrimary = "bg-[color:var(--home-surface-07)]";
  const heroSecondary = "bg-[color:var(--home-surface)]";
  const lineMuted = "bg-[color:var(--home-surface)]";
  const lineSubtle = "bg-[color:var(--home-surface-04)]";
  const cardSurface = "border-[color:var(--home-line-08)] bg-[color:var(--home-surface-02)]";

  return (
    <div
      className={`${fraunces.variable} studio-public min-h-screen bg-[color:var(--home-canvas)] text-[color:var(--home-ink)]`}
      style={STUDIO_PUBLIC_THEME_STYLE}
    >
      <main
        aria-busy="true"
        aria-live="polite"
        className="px-5 py-12 sm:px-8 lg:px-10"
      >
        <div className="mx-auto max-w-[88rem] space-y-12">
          {/* Eyebrow — the one quiet teal mark, echoing the live hero. */}
          <div className="space-y-6">
            <div aria-hidden className={`h-3 w-32 rounded-full ${eyebrow}`} />
            <div
              aria-hidden
              className={`h-14 w-full max-w-3xl rounded-2xl sm:h-16 ${heroPrimary}`}
            />
            <div
              aria-hidden
              className={`h-12 w-2/3 max-w-2xl rounded-2xl ${heroSecondary}`}
            />
            <div aria-hidden className={`h-4 w-full max-w-lg rounded-full ${lineMuted}`} />
            <div aria-hidden className={`h-4 w-4/5 max-w-md rounded-full ${lineSubtle}`} />
          </div>

          {variant === "home" ? (
            <>
              {/* Proof rail — four quiet stat slots. */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    aria-hidden
                    className={`flex h-24 flex-col justify-center gap-2 rounded-[var(--home-radius)] border px-5 ${cardSurface}`}
                  >
                    <div className={`h-6 w-12 rounded-md ${heroSecondary}`} />
                    <div className={`h-3 w-20 rounded-full ${lineSubtle}`} />
                  </div>
                ))}
              </div>
              {/* Card grid — the service / work rows. */}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    aria-hidden
                    className={`h-44 rounded-[var(--home-radius-lg)] border ${cardSurface}`}
                  />
                ))}
              </div>
            </>
          ) : (
            // Compose — a single tall composer panel with a soft teal frame
            // matching the focused /request canvas.
            <div
              aria-hidden
              className="rounded-[var(--home-radius-lg)] border border-[color:var(--home-line-12)] bg-[color:var(--home-surface-02)] p-8 sm:p-10"
            >
              <div className={`h-3 w-24 rounded-full ${eyebrow}`} />
              <div className={`mt-6 h-10 w-2/3 max-w-xl rounded-xl ${heroSecondary}`} />
              <div className="mt-8 space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-14 w-full rounded-[var(--home-radius)] border ${cardSurface}`}
                  />
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <div className="h-11 w-40 rounded-full bg-[color:var(--home-accent-soft)]" />
                <div className={`h-11 w-32 rounded-full ${heroSecondary}`} />
              </div>
            </div>
          )}

          <span className="sr-only">Loading.</span>
        </div>
      </main>
    </div>
  );
}
