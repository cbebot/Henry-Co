/**
 * OG-SOCIAL-METADATA — registry for non-division, customer-facing surfaces.
 *
 * Some Henry Onyx surfaces are customer-facing but are NOT divisions in the
 * `COMPANY.divisions` registry — `account.henryonyx.com` is the first. They
 * still need the exact same Open Graph / Twitter Card treatment as the public
 * division sites (so a shared link renders a preview on Facebook, X, LinkedIn,
 * and WhatsApp), and they should pull their brand + URL from ONE place rather
 * than hand-rolling `metadata` per app.
 *
 * This mirrors the shape of `DivisionConfig` (the fields the social-metadata
 * helper and the shared OG image template actually read) so that
 * `createSurfaceMetadata` / `DefaultOgTemplate` can treat a surface and a
 * division symmetrically. Brand strings are written here in their final
 * "Henry Onyx" form — this registry IS the source of truth.
 *
 * Tests: see __tests__/seo-metadata.test.mjs
 */

import { COMPANY } from "./company";

export type SurfaceKey = "account";

export type SurfaceConfig = {
  key: SurfaceKey;
  /** `<subdomain>.<baseDomain>` host, e.g. "account". */
  subdomain: string;
  /** Open Graph `site_name` + the OG image headline. */
  name: string;
  shortName: string;
  /** Longer marketing sentence — default page + og:description. */
  description: string;
  /** OG image tagline (lower line). */
  tagline: string;
  /** OG image eyebrow (small line above the headline). */
  sub: string;
  accent: string;
  accentStrong: string;
  dark: string;
  /** Local dev port — drives the non-production metadataBase origin. */
  devPort: number;
  /** Authenticated dashboards are noindex but still need link previews. */
  noIndex: boolean;
};

// NOTE: every surface added here MUST also ship `opengraph-image` (and ideally
// `twitter-image`) file-convention routes in its app, because the shared
// metadata helper always emits `twitter:card = summary_large_image`. A surface
// without an image route would advertise a large card with no image.
export const SURFACES = {
  account: {
    key: "account",
    subdomain: "account",
    name: "Henry Onyx Account",
    shortName: "Account",
    description:
      "Manage your Henry Onyx account, wallet, payments, orders, and preferences across all divisions.",
    tagline: "One identity, one secure session, every Henry Onyx service in one place.",
    sub: "Single sign-on across every Henry Onyx division",
    accent: "#C9A227",
    accentStrong: "#F2D77A",
    dark: "#050816",
    devPort: 3003,
    noIndex: true,
  },
} as const satisfies Record<SurfaceKey, SurfaceConfig>;

export function getSurfaceConfig<K extends SurfaceKey>(key: K): (typeof SURFACES)[K] {
  return SURFACES[key];
}

/** Canonical production origin (no trailing slash) for a surface. */
export function getSurfaceUrl(key: SurfaceKey): string {
  return `https://${SURFACES[key].subdomain}.${COMPANY.group.baseDomain}`;
}

/** Bare host (no protocol) for a surface — used as the OG image footer label. */
export function getSurfaceHost(key: SurfaceKey): string {
  return `${SURFACES[key].subdomain}.${COMPANY.group.baseDomain}`;
}
