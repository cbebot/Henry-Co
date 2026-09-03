/**
 * @henryco/ui/public-design — the HenryCo PUBLIC design system (V3-PUBLIC-DESIGN-01).
 *
 * Themeable, i18n-ready, mobile-first, server-safe primitives that consume the
 * `--home-*` token layer (packages/ui/src/styles/public-design.css). Import that
 * stylesheet once in the app's globals, expose the display font as --font-fraunces,
 * and set the division accent (--accent / --accent-text) on the public subtree.
 * Full usage + the Phase-2 migration recipe: docs/v3/design-system.md.
 */
export { Eyebrow, DisplayHeading, Lede, Body, type DisplaySize } from "./typography";
export { Section, SectionHeader, Hairline, Reveal } from "./section";
export { PublicCTA } from "./cta";
// Motion doctrine primitives (Lagos study, 2026-07-08) — one motion voice.
export { CountUp } from "./count-up";
export { AmbientGlow } from "./ambient";
export { ScrollProgress } from "./scroll-progress";
export { Magnetic } from "./magnetic";
export { PublicProofRail, type ProofItem } from "./proof-rail";
export { EditorialList, EditorialRow, Card } from "./editorial";
export {
  PublicSiteFooter,
  type PublicSiteFooterCopy,
  type SiteFooterLink,
  type SiteFooterColumn,
} from "./site-footer";
// Live-registry footer: same footer, minus owner-paused/unpublished divisions.
export { LivePublicSiteFooter } from "./live-site-footer";
