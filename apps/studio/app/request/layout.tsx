import { fraunces, manrope, STUDIO_PUBLIC_THEME_STYLE } from "@/components/studio/studio-public-theme";

/**
 * Themed shell for the focused brief flow (/request, /request/build,
 * /request/copilot, /request/guided) — V3-PUBLIC-REBUILD-studio.
 *
 * Adopts the locked --home-* design system + Fraunces + the Studio teal accent
 * so the composer reads as the same family as the marketing pages — WITHOUT the
 * marketing header/footer, because this is a deliberately distraction-light
 * flow (the prior team's hub + three on-ramps + builder). The flow's logic,
 * steps, validation, pricing, and submit are untouched; this only paints the
 * canvas and aliases the legacy --studio-* tokens onto theme-aware --home-*
 * (light-primary, dark as the flip) for the /request subtree.
 */
export default function RequestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${fraunces.variable} ${manrope.variable} studio-public min-h-screen bg-[color:var(--home-canvas)] text-[color:var(--home-ink)]`}
      style={STUDIO_PUBLIC_THEME_STYLE}
    >
      {children}
    </div>
  );
}
