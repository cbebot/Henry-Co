/**
 * studio-sites — the bundle renderer. Reads ONLY typed fields of a validated
 * SiteBundle and emits plain JSX text. It never uses dangerouslySetInnerHTML
 * and the bundle has no field that could carry markup or a script — script
 * injection is excluded by construction (the schema is the boundary). Theme
 * tokens are applied as inline CSS custom properties; the ink/surface contract
 * is dark-ink-on-accent, never white-on-gold.
 */

import type { SiteBundle, BundleSection } from "@henryco/studio-bundle";

function SectionBlock({ section, accent, ink }: { section: BundleSection; accent: string; ink: string }) {
  const isHero = section.kind === "hero";
  return (
    <section
      style={{
        padding: isHero ? "5rem 1.5rem" : "3rem 1.5rem",
        borderTop: isHero ? undefined : "1px solid rgba(0,0,0,0.06)",
        background: isHero ? `color-mix(in srgb, ${accent} 8%, transparent)` : undefined,
      }}
    >
      <div style={{ maxWidth: "62rem", margin: "0 auto" }}>
        {section.heading ? (
          <h2
            style={{
              fontSize: isHero ? "2.4rem" : "1.6rem",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              margin: 0,
              color: ink,
            }}
          >
            {section.heading}
          </h2>
        ) : null}
        {section.body ? (
          <p style={{ marginTop: "1rem", fontSize: "1.05rem", lineHeight: 1.7, color: `color-mix(in srgb, ${ink} 78%, transparent)` }}>
            {section.body}
          </p>
        ) : null}
        {section.items.length > 0 ? (
          <ul style={{ marginTop: "1.25rem", display: "grid", gap: "0.5rem", paddingLeft: "1.1rem" }}>
            {section.items.map((item, i) => (
              <li key={`${section.kind}-${i}`} style={{ color: `color-mix(in srgb, ${ink} 82%, transparent)` }}>
                {item}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

export function BundleRenderer({ bundle, preview }: { bundle: SiteBundle; preview?: boolean }) {
  const { theme } = bundle;
  return (
    <main
      style={{
        // Register-L: light-primary. Inline theme tokens per bundle.
        // Accent labels/CTAs render dark ink ON accent, never white-on-gold.
        // The site font selector is 'sans' | 'serif' — never a font URL.
        ["--site-surface" as string]: theme.surface,
        ["--site-ink" as string]: theme.ink,
        ["--site-font" as string]:
          theme.fontFamily === "serif" ? "ui-serif, Georgia, serif" : "ui-sans-serif, system-ui, sans-serif",
        background: theme.surface,
        color: theme.ink,
        minHeight: "100vh",
        fontFamily: theme.fontFamily === "serif" ? "ui-serif, Georgia, serif" : "ui-sans-serif, system-ui, sans-serif",
      }}
    >
      {preview ? (
        <div
          style={{
            background: theme.accent,
            color: theme.ink,
            textAlign: "center",
            padding: "0.5rem",
            fontSize: "0.8rem",
            fontWeight: 600,
          }}
        >
          Preview — not yet published
        </div>
      ) : null}
      <header style={{ padding: "1.5rem", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: "62rem", margin: "0 auto", display: "flex", alignItems: "baseline", gap: "0.75rem" }}>
          <strong style={{ fontSize: "1.15rem", color: theme.ink }}>{bundle.siteName}</strong>
          {bundle.tagline ? (
            <span style={{ fontSize: "0.9rem", color: `color-mix(in srgb, ${theme.ink} 65%, transparent)` }}>
              {bundle.tagline}
            </span>
          ) : null}
        </div>
      </header>
      {bundle.sections.map((section, i) => (
        <SectionBlock key={`${section.kind}-${i}`} section={section} accent={theme.accent} ink={theme.ink} />
      ))}
      <footer style={{ padding: "2rem 1.5rem", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: "62rem", margin: "0 auto", fontSize: "0.85rem", color: `color-mix(in srgb, ${theme.ink} 55%, transparent)` }}>
          Built with Henry Onyx Studio.
        </div>
      </footer>
    </main>
  );
}
