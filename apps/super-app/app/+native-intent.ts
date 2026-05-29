/**
 * V3-04 (S2) — Universal Link / App Link → in-app route mapping.
 *
 * Expo Router calls `redirectSystemPath` for every incoming deep link
 * (iOS Universal Link, Android App Link, or the `henryco://` scheme)
 * BEFORE it resolves the path against the file-based router. We use it to
 * translate a canonical HenryCo *web* deep-link path into the matching
 * in-app screen.
 *
 * The web surfaces are richer than the current mobile app (the super-app
 * ships division overview screens via `module/[slug]`, not yet per-record
 * detail screens), so a deep link into a specific record (a care booking,
 * a marketplace order, a job application) opens that record's DIVISION
 * module in the app. The full record detail remains a graceful web
 * fallback until the mobile detail screens land (tracked for V3-87 mobile
 * parity). Unknown paths fall through unchanged so the router can 404 or
 * the OS can hand back to the browser.
 *
 * Mapping (web path → in-app route):
 *   /care/bookings/<id>            → /module/care
 *   /marketplace/orders/<id>       → /module/marketplace
 *   /product/<slug>                → /module/marketplace
 *   /track/<orderNo>               → /module/logistics
 *   /jobs/<slug>                   → /module/jobs
 *   /candidate/applications        → /module/jobs
 *   /courses/<slug>                → /module/learn
 *   /property/<slug>               → /module/property
 *   /studio/...                    → /module/studio
 *   /app/<anything>  (staging)     → unchanged (already an in-app path)
 *   anything else                  → unchanged
 *
 * No domain is hardcoded here — we match on the *path* only. The
 * associated-domains list (which hosts the OS will even hand us) lives in
 * `app.json`; this file just routes whatever path arrives.
 */

type RedirectSystemPathArgs = {
  path: string;
  initial: boolean;
};

/** Division module slugs the app exposes via `module/[slug]`. */
const DIVISION_MODULE = {
  care: "/module/care",
  marketplace: "/module/marketplace",
  property: "/module/property",
  jobs: "/module/jobs",
  learn: "/module/learn",
  logistics: "/module/logistics",
  studio: "/module/studio",
} as const;

/**
 * Ordered prefix → module rules. First match wins. Keys are the leading
 * path segment(s) of the canonical web deep links from
 * `@henryco/seo/deeplinks` builders.
 */
const PATH_RULES: Array<{ test: (segments: string[]) => boolean; to: string }> = [
  { test: (s) => s[0] === "care", to: DIVISION_MODULE.care },
  { test: (s) => s[0] === "marketplace", to: DIVISION_MODULE.marketplace },
  { test: (s) => s[0] === "product", to: DIVISION_MODULE.marketplace },
  { test: (s) => s[0] === "store", to: DIVISION_MODULE.marketplace },
  { test: (s) => s[0] === "pay", to: DIVISION_MODULE.marketplace },
  { test: (s) => s[0] === "track", to: DIVISION_MODULE.logistics },
  { test: (s) => s[0] === "logistics", to: DIVISION_MODULE.logistics },
  { test: (s) => s[0] === "jobs", to: DIVISION_MODULE.jobs },
  { test: (s) => s[0] === "candidate", to: DIVISION_MODULE.jobs },
  { test: (s) => s[0] === "employer", to: DIVISION_MODULE.jobs },
  { test: (s) => s[0] === "courses", to: DIVISION_MODULE.learn },
  { test: (s) => s[0] === "learn", to: DIVISION_MODULE.learn },
  { test: (s) => s[0] === "certifications", to: DIVISION_MODULE.learn },
  { test: (s) => s[0] === "property", to: DIVISION_MODULE.property },
  { test: (s) => s[0] === "studio", to: DIVISION_MODULE.studio },
];

function splitPath(pathname: string): string[] {
  return pathname.split("/").filter(Boolean);
}

export function redirectSystemPath({ path }: RedirectSystemPathArgs): string {
  let pathname = path;
  let query = "";
  try {
    // `path` may be a full URL or a bare path; normalise to pathname+query.
    const url = new URL(path, "https://placeholder.invalid");
    pathname = url.pathname;
    query = url.search;
  } catch {
    const q = path.indexOf("?");
    if (q >= 0) {
      pathname = path.slice(0, q);
      query = path.slice(q);
    }
  }

  const segments = splitPath(pathname);

  // Staging links arrive under `/app/...` and are already in-app paths.
  if (segments[0] === "app") return path;

  for (const rule of PATH_RULES) {
    if (rule.test(segments)) {
      // Preserve the query (attribution: `?ref=share&from=…`) so the
      // in-app screen + analytics still see it.
      return `${rule.to}${query}`;
    }
  }

  // Unknown path — let the router resolve it (or 404 / hand back to web).
  return path;
}
