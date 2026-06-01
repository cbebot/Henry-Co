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
export { PublicProofRail, type ProofItem } from "./proof-rail";
export { EditorialList, EditorialRow, Card } from "./editorial";
