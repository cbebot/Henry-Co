// Route manifest for V2-A11Y-01 audit.
//
// Each entry is one app the audit covers. `routes` are the surfaces axe-core
// scans. `auth` routes require a pre-recorded Playwright storageState file at
// .codex-temp/v2-a11y-01/auth/<app>.json — record once via `playwright codegen`
// and the audit picks it up automatically.
//
// company-hub (no app/ dir) and super-app (Expo / React Native) are
// out-of-scope per V2-A11Y-01. Document in report.md "Coverage" section.

export const ROUTE_MANIFEST = [
  {
    app: "account",
    pkg: "@henryco/account",
    devPort: 3001,
    routes: [
      { path: "/", name: "home", auth: true },
      { path: "/activity", name: "activity", auth: true },
      { path: "/notifications", name: "notifications", auth: true },
      { path: "/payments", name: "payments", auth: true },
      { path: "/settings", name: "settings", auth: true },
      { path: "/login", name: "login" },
    ],
  },
  {
    app: "care",
    pkg: "@henryco/care",
    devPort: 3002,
    routes: [
      { path: "/", name: "home" },
      { path: "/services", name: "services" },
      { path: "/pricing", name: "pricing" },
      { path: "/book", name: "book" },
      { path: "/about", name: "about" },
      { path: "/contact", name: "contact" },
    ],
  },
  {
    app: "hub",
    pkg: "@henryco/hub",
    devPort: 3000,
    routes: [
      { path: "/", name: "home" },
      { path: "/about", name: "about" },
      { path: "/contact", name: "contact" },
      { path: "/search", name: "search" },
    ],
  },
  {
    app: "jobs",
    pkg: "@henryco/jobs",
    devPort: 3009,
    routes: [
      { path: "/", name: "home" },
      { path: "/jobs", name: "jobs" },
      { path: "/careers", name: "careers" },
      { path: "/talent", name: "talent" },
      { path: "/hire", name: "hire" },
    ],
  },
  {
    app: "learn",
    pkg: "@henryco/learn",
    devPort: 3018,
    routes: [
      { path: "/", name: "home" },
      { path: "/courses", name: "courses" },
      { path: "/certifications", name: "certifications" },
      { path: "/academy", name: "academy" },
      { path: "/login", name: "login" },
    ],
  },
  {
    app: "logistics",
    pkg: "@henryco/logistics",
    devPort: 3007,
    routes: [
      { path: "/", name: "home" },
      { path: "/services", name: "services" },
      { path: "/pricing", name: "pricing" },
      { path: "/book", name: "book" },
      { path: "/track", name: "track" },
      { path: "/login", name: "login" },
    ],
  },
  {
    app: "marketplace",
    pkg: "@henryco/marketplace",
    devPort: 3004,
    routes: [
      { path: "/", name: "home" },
      { path: "/search", name: "search" },
      { path: "/deals", name: "deals" },
      { path: "/sell", name: "sell" },
      { path: "/checkout", name: "checkout" },
    ],
  },
  {
    app: "property",
    pkg: "@henryco/property",
    devPort: 3005,
    routes: [
      { path: "/", name: "home" },
      { path: "/search", name: "search" },
      { path: "/managed", name: "managed" },
      { path: "/login", name: "login" },
      { path: "/faq", name: "faq" },
    ],
  },
  {
    app: "staff",
    pkg: "@henryco/staff",
    devPort: 3010,
    routes: [
      { path: "/login", name: "login" },
      { path: "/", name: "workspace", auth: true },
      { path: "/search", name: "search", auth: true },
      { path: "/settings", name: "settings", auth: true },
    ],
  },
  {
    app: "studio",
    pkg: "@henryco/studio",
    devPort: 3008,
    routes: [
      { path: "/", name: "home" },
      { path: "/services", name: "services" },
      { path: "/pricing", name: "pricing" },
      { path: "/work", name: "work" },
      { path: "/teams", name: "teams" },
    ],
  },
];

// Production hosts scanned by headers-scan.mjs. building/hotel excluded
// (defined in registry but no deployed app yet).
export const PRODUCTION_HOSTS = [
  "henrycogroup.com",
  "hq.henrycogroup.com",
  "staffhq.henrycogroup.com",
  "workspace.henrycogroup.com",
  "account.henrycogroup.com",
  "care.henrycogroup.com",
  "marketplace.henrycogroup.com",
  "learn.henrycogroup.com",
  "logistics.henrycogroup.com",
  "property.henrycogroup.com",
  "studio.henrycogroup.com",
  "jobs.henrycogroup.com",
];

// Source-of-truth header expectations, derived from
// packages/config/security-headers.ts buildSecurityHeaders() defaults.
// Mirrored here so headers-scan.mjs has a static map without bringing in
// TypeScript runtime. `security-headers.spec.ts` snapshot keeps the source
// honest; if the source changes, the snapshot fails first.
export const EXPECTED_HEADERS = {
  "strict-transport-security": "max-age=63072000; includeSubDomains; preload",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-dns-prefetch-control": "on",
  "permissions-policy":
    "camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=(), payment=()",
  "cross-origin-opener-policy": "same-origin",
  "x-frame-options": "DENY",
  "content-security-policy": "frame-ancestors 'none'",
};

// Optional headers worth advising (not yet in baseline).
export const ADVISORY_HEADERS = [
  "cross-origin-embedder-policy",
  "cross-origin-resource-policy",
  "origin-agent-cluster",
];
