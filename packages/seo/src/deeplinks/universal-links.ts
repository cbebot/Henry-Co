/**
 * V3-04 (S2) — Universal Links (iOS) + App Links (Android) manifests.
 *
 * Apple's `apple-app-site-association` (AASA) and Google's
 * `assetlinks.json` are tiny JSON documents each web origin serves from
 * `/.well-known/…` so that, when a HenryCo URL is opened on a device with
 * the app installed, the OS routes it straight into the app instead of a
 * browser tab. They are public, unauthenticated files per the Apple /
 * Google specs.
 *
 * This module is the single source of truth for BOTH manifests so all 10
 * web apps emit byte-identical, correct JSON from one thin route handler
 * each (`app/.well-known/apple-app-site-association/route.ts` +
 * `app/.well-known/assetlinks.json/route.ts`).
 *
 * Domain abstraction: the bundle identifiers + Apple Team ID + Android
 * SHA-256 cert fingerprints are *signing identity*, not domains, so they
 * come from env (see below), never hardcoded. The manifests themselves
 * carry no domain — Apple/Google bind them to the origin they are served
 * from — so a `NEXT_PUBLIC_BASE_DOMAIN` flip needs zero edits here.
 *
 * Env (set at deploy; safe to leave unset in dev/preview):
 *   - `HENRYCO_APPLE_TEAM_ID`         Apple Developer Team ID (the AASA
 *                                     `appID` prefix `<TEAMID>.<bundleId>`).
 *   - `HENRYCO_ANDROID_SHA256_CERTS`  Comma-separated upper-case
 *                                     `AA:BB:…` SHA-256 signing-cert
 *                                     fingerprints (debug + Play release).
 *
 * When a secret is absent the corresponding manifest is emitted EMPTY but
 * still well-formed (`{"applinks":{"apps":[],"details":[]}}` /  `[]`).
 * That is valid per spec — the file serves with the right content type
 * and 200, declaring no associations until the signing identity is wired.
 * This keeps CI/preview green without leaking a placeholder Team ID.
 */

/**
 * Mobile bundle identifiers — these mirror `apps/super-app/app.json` +
 * `apps/company-hub/app.json` (`ios.bundleIdentifier` / `android.package`).
 * The super-app intercepts customer division + account deep links; the
 * company-hub app intercepts the staff/owner hub surfaces.
 *
 * NOTE: super-app's app.json currently carries the `.staging` suffix
 * (`com.henryco.superapp.staging`); we declare BOTH the staging and the
 * production bundle id so the same AASA works across both EAS profiles.
 */
export const HENRYCO_MOBILE_BUNDLE_IDS = {
  superApp: ["com.henryco.superapp", "com.henryco.superapp.staging"],
  companyHub: ["com.henryco.hub"],
} as const;

/** Which mobile app a given web app's deep links should open. */
export type MobileTarget = "superApp" | "companyHub";

function readAppleTeamId(): string | null {
  const raw = (process.env.HENRYCO_APPLE_TEAM_ID || "").trim();
  // Apple Team IDs are 10 alphanumerics. Anything else = treat as unset.
  return /^[A-Za-z0-9]{10}$/.test(raw) ? raw : null;
}

function readAndroidCertFingerprints(): string[] {
  return (process.env.HENRYCO_ANDROID_SHA256_CERTS || "")
    .split(",")
    .map((value) => value.trim().toUpperCase())
    // SHA-256 fingerprints are 32 colon-separated upper-hex octets.
    .filter((value) => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(value));
}

function bundleIdsFor(target: MobileTarget): readonly string[] {
  return HENRYCO_MOBILE_BUNDLE_IDS[target];
}

// ─────────────────────────────────────────────────────────────────────
// Apple — apple-app-site-association
// ─────────────────────────────────────────────────────────────────────

export type AppleAppSiteAssociation = {
  applinks: {
    apps: string[];
    details: Array<{ appID: string; paths: string[] }>;
  };
  /** Shared-web-credentials so the app can autofill HenryCo passwords. */
  webcredentials?: { apps: string[] };
};

/**
 * Build the AASA document for a web origin whose deep links open
 * `target`. `paths: ["*"]` lets the app claim every path on the origin;
 * the OS still falls back to the browser when the app is not installed,
 * and the in-app router decides what each path maps to (see
 * `expo-router` mappings). Returns an empty-but-valid doc when the Apple
 * Team ID is not configured.
 */
export function buildAppleAppSiteAssociation(
  target: MobileTarget,
): AppleAppSiteAssociation {
  const teamId = readAppleTeamId();
  if (!teamId) {
    return { applinks: { apps: [], details: [] } };
  }
  const appIDs = bundleIdsFor(target).map((bundleId) => `${teamId}.${bundleId}`);
  return {
    applinks: {
      apps: [],
      details: appIDs.map((appID) => ({ appID, paths: ["*"] })),
    },
    webcredentials: { apps: appIDs },
  };
}

// ─────────────────────────────────────────────────────────────────────
// Android — assetlinks.json
// ─────────────────────────────────────────────────────────────────────

export type AndroidAssetLink = {
  relation: string[];
  target: {
    namespace: "android_app";
    package_name: string;
    sha256_cert_fingerprints: string[];
  };
};

/**
 * Build the Digital Asset Links (`assetlinks.json`) array for a web
 * origin whose deep links open `target`. Returns an empty array when no
 * signing fingerprints are configured (valid + correctly served).
 */
export function buildAndroidAssetLinks(
  target: MobileTarget,
): AndroidAssetLink[] {
  const fingerprints = readAndroidCertFingerprints();
  if (fingerprints.length === 0) return [];
  return bundleIdsFor(target).map((packageName) => ({
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: packageName,
      sha256_cert_fingerprints: fingerprints,
    },
  }));
}

/**
 * Shared route-handler body. Returns a `Response` with the document
 * serialised as `application/json` (the content type Apple/Google
 * require) and a CDN cache header. Used by every web app's
 * `app/.well-known/*` route so the serving contract lives in one place.
 *
 * `Cache-Control`: a day at the edge with stale-while-revalidate — the
 * manifests change only when the signing identity rotates, and mobile
 * OSes cache them aggressively anyway.
 */
export function wellKnownJsonResponse(document: unknown): Response {
  return new Response(`${JSON.stringify(document, null, 2)}\n`, {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
