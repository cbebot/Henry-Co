/**
 * COPY-RESET — route manifest + word budgets. The ONE place budgets live.
 *
 * Budgets are visible PAGE words (main + outside-main content; header/footer
 * chrome and fixed overlays are budgeted separately), taken as the MAX of the
 * desktop (1440×900) and mobile (390×844) renders. See docs/copy-audit/README.md
 * for how the numbers were derived from the five-second / twenty-second rule.
 *
 * Route `type` drives the budget. `discover` resolves a dynamic route to a real
 * sample by following the first same-origin link on `from` whose pathname matches
 * `match` — so samples come from what the site itself links to, never a guess.
 * A dynamic route with no rendered sample (data-driven while the database is
 * unavailable) is reported as `no-sample`, not silently passed.
 */

/** @typedef {"home"|"landing"|"info"|"index"|"detail"|"pricing"|"help"|"transactional"|"auth"|"utility"|"legal"} RouteType */

export const BUDGETS = {
  /** Visible page words (max of desktop/mobile). `null` = measured, not budgeted. */
  page: {
    home: 250,
    landing: 250,
    info: 280,
    pricing: 300,
    index: 180,
    detail: 220,
    help: 250,
    transactional: 150,
    auth: 80,
    utility: 100,
    legal: null,
  },
  /** Five-second zone: page words painted in the first viewport (max of desktop/mobile). */
  aboveFold: 60,
  /** The single h1 must carry the page in a glance. */
  h1MaxWords: 12,
  /** Concise meta description (SEO): characters. */
  metaDescriptionMaxChars: 160,
  metaDescriptionMinChars: 50,
  /** Per-domain chrome (header + footer + nav outside main), max of desktop/mobile. */
  chrome: 160,
};

const D = (path, type, extra = {}) => ({ path, type, ...extra });
const DYN = (path, type, from, match, extra = {}) => ({ path, type, discover: { from, match }, ...extra });

/** @type {{domain:string, app:string, pkg:string, port:number, routes:any[]}[]} */
export const DOMAINS = [
  {
    domain: "hub",
    app: "hub",
    pkg: "@henryco/hub",
    port: 4100,
    routes: [
      D("/", "home"),
      D("/about", "info"),
      D("/services", "index"),
      D("/search", "index"),
      D("/contact", "help"),
      D("/announcing-v3", "info"),
      D("/press/v3", "info"),
      D("/v3", "info"),
      D("/v3/how-we-earn", "info"),
      D("/v3/try", "landing"),
      D("/v3/what-shipped", "info"),
      D("/newsletter", "utility"),
      D("/newsletter/preferences", "utility"),
      D("/newsletter/unsubscribe", "utility"),
      D("/preferences", "utility"),
      D("/privacy", "legal"),
      D("/terms", "legal"),
    ],
  },
  {
    domain: "account",
    app: "account",
    pkg: "@henryco/account",
    port: 4101,
    routes: [
      D("/login", "auth"),
      D("/signup", "auth"),
      D("/forgot-password", "auth"),
      D("/reset-password", "auth"),
      D("/auth/choose", "auth"),
      D("/auth/link-account", "auth"),
      D("/auth/verified", "auth"),
    ],
  },
  {
    domain: "care",
    app: "care",
    pkg: "@henryco/care",
    port: 4102,
    routes: [
      D("/", "home"),
      D("/about", "info"),
      D("/services", "index"),
      DYN("/services/[verticalSlug]", "detail", "/services", "^/services/[^/]+$"),
      DYN("/services/[verticalSlug]/[serviceSlug]", "detail", "@/services/[verticalSlug]", "^/services/[^/]+/[^/]+$"),
      D("/pricing", "pricing"),
      D("/book", "transactional"),
      D("/track", "transactional"),
      DYN("/pay/[trackingCode]", "transactional", "/track", "^/pay/[^/]+$", { data: true }),
      DYN("/pay/[trackingCode]/card", "transactional", "/track", "^/pay/[^/]+/card$", { data: true }),
      D("/review", "utility"),
      D("/contact", "help"),
      D("/login", "auth"),
      D("/unsubscribe", "utility"),
    ],
  },
  {
    domain: "marketplace",
    app: "marketplace",
    pkg: "@henryco/marketplace",
    port: 4103,
    routes: [
      D("/", "home"),
      D("/search", "index"),
      D("/deals", "index"),
      DYN("/category/[slug]", "index", "/", "^/category/[^/]+$", { data: true }),
      DYN("/collections/[slug]", "index", "/", "^/collections/[^/]+$", { data: true }),
      DYN("/brand/[slug]", "index", "/", "^/brand/[^/]+$", { data: true }),
      DYN("/product/[slug]", "detail", "/", "^/product/[^/]+$", { data: true }),
      DYN("/store/[slug]", "detail", "/", "^/store/[^/]+$", { data: true }),
      DYN("/business/[slug]", "detail", "/", "^/business/[^/]+$", { data: true }),
      D("/cart", "transactional"),
      D("/checkout", "transactional"),
      DYN("/pay/[orderNo]", "transactional", "/track", "^/pay/[^/]+$", { data: true }),
      DYN("/pay/[orderNo]/card", "transactional", "/track", "^/pay/[^/]+/card$", { data: true }),
      D("/track", "transactional"),
      DYN("/track/[orderNo]", "transactional", "/track", "^/track/[^/]+$", { data: true }),
      D("/sell", "landing"),
      D("/sell/pricing", "pricing"),
      D("/trust", "info"),
      D("/help", "help"),
      DYN("/policies/[slug]", "legal", "/help", "^/policies/[^/]+$"),
      D("/login", "auth"),
      D("/signup", "auth"),
    ],
  },
  {
    domain: "property",
    app: "property",
    pkg: "@henryco/property",
    port: 4104,
    routes: [
      D("/", "home"),
      D("/search", "index"),
      DYN("/area/[slug]", "index", "/", "^/area/[^/]+$", { data: true }),
      DYN("/property/[slug]", "detail", "/", "^/property/[^/]+$", { data: true }),
      D("/managed", "landing"),
      D("/submit", "transactional"),
      DYN("/pay/[paymentId]", "transactional", "/", "^/pay/[^/]+$", { data: true }),
      D("/trust", "info"),
      D("/faq", "help"),
      D("/login", "auth"),
    ],
  },
  {
    domain: "logistics",
    app: "logistics",
    pkg: "@henryco/logistics",
    port: 4105,
    routes: [
      D("/", "home"),
      D("/services", "index"),
      D("/business", "landing"),
      D("/coverage", "info"),
      D("/pricing", "pricing"),
      D("/quote", "transactional"),
      D("/book", "transactional"),
      D("/track", "transactional"),
      DYN("/pay/[paymentId]", "transactional", "/track", "^/pay/[^/]+$", { data: true }),
      D("/support", "help"),
      D("/login", "auth"),
    ],
  },
  {
    domain: "studio",
    app: "studio",
    pkg: "@henryco/studio",
    port: 4106,
    // Studio's loaders throw when the database is unreachable (every page then
    // renders the error boundary — live in production too while it is paused),
    // so it is measured against the empty stand-in instead.
    mockDb: true,
    routes: [
      D("/", "home"),
      D("/about", "info"),
      D("/services", "index"),
      DYN("/services/[slug]", "detail", "/services", "^/services/[^/]+$"),
      D("/pick", "index"),
      DYN("/pick/[slug]", "detail", "/pick", "^/pick/[^/]+$"),
      DYN("/checkout/template/[slug]", "transactional", "@/pick/[slug]", "^/checkout/template/[^/]+$"),
      D("/work", "index"),
      DYN("/work/[slug]", "detail", "/work", "^/work/[^/]+$"),
      D("/teams", "index"),
      DYN("/teams/[slug]", "detail", "/teams", "^/teams/[^/]+$"),
      D("/pricing", "pricing"),
      D("/process", "info"),
      D("/trust", "info"),
      D("/faq", "help"),
      D("/contact", "help"),
      D("/request", "transactional"),
      D("/request/build", "transactional"),
      D("/request/guided", "transactional"),
      D("/request/copilot", "transactional"),
      DYN("/pay/[paymentId]", "transactional", "/", "^/pay/[^/]+$", { data: true }),
      DYN("/pay/[paymentId]/card", "transactional", "/", "^/pay/[^/]+/card$", { data: true }),
      D("/policies", "legal"),
      DYN("/policies/[slug]", "legal", "/policies", "^/policies/[^/]+$"),
      D("/login", "auth"),
    ],
  },
  {
    domain: "jobs",
    app: "jobs",
    pkg: "@henryco/jobs",
    port: 4107,
    routes: [
      D("/", "home"),
      D("/jobs", "index"),
      DYN("/jobs/[slug]", "detail", "/jobs", "^/jobs/[^/]+$", { data: true }),
      DYN("/categories/[slug]", "index", "/", "^/categories/[^/]+$", { data: true }),
      DYN("/employers/[slug]", "detail", "/", "^/employers/[^/]+$", { data: true }),
      D("/hire", "landing"),
      D("/talent", "landing"),
      D("/careers", "landing"),
      D("/trust", "info"),
      D("/help", "help"),
      DYN("/pay/[paymentId]", "transactional", "/", "^/pay/[^/]+$", { data: true }),
      D("/login", "auth"),
      D("/signup", "auth"),
    ],
  },
  {
    domain: "learn",
    app: "learn",
    pkg: "@henryco/learn",
    port: 4108,
    routes: [
      D("/", "home"),
      D("/courses", "index"),
      DYN("/courses/[slug]", "detail", "/courses", "^/courses/[^/]+$", { data: true }),
      D("/paths", "index"),
      DYN("/paths/[slug]", "detail", "/paths", "^/paths/[^/]+$", { data: true }),
      DYN("/categories/[slug]", "index", "/", "^/categories/[^/]+$", { data: true }),
      D("/instructors", "index"),
      DYN("/instructors/[slug]", "detail", "/instructors", "^/instructors/[^/]+$", { data: true }),
      D("/certifications", "info"),
      D("/certifications/verify", "utility"),
      DYN("/certifications/verify/[code]", "utility", "/certifications/verify", "^/certifications/verify/[^/]+$", { data: true }),
      D("/academy", "landing"),
      D("/academy/seller", "landing"),
      D("/teach", "landing"),
      D("/trust", "info"),
      D("/help", "help"),
      D("/login", "auth"),
      D("/signup", "auth"),
    ],
  },
];

/** Routes deliberately left out of the copy budget (with the reason recorded). */
export const EXCLUDED_ROUTES = [
  { domain: "property", path: "/auth/callback", reason: "OAuth callback — redirects, renders no copy" },
  { domain: "hub", path: "/type-sample", reason: "internal type specimen, not linked publicly" },
  { domain: "hub", path: "/interactions-gallery", reason: "(dev) route group — internal gallery" },
  { domain: "hub", path: "/workspace/[[...slug]]", reason: "staff workspace host, not a public page" },
  { domain: "logistics", path: "/[...slug]", reason: "catch-all fallback" },
];

export function budgetFor(type) {
  return BUDGETS.page[type] ?? null;
}
