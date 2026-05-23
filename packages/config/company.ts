import { BRAND_EMAILS } from "./brand-emails";

export type DivisionKey =
  | "hub"
  | "care"
  | "building"
  | "hotel"
  | "marketplace"
  | "property"
  | "logistics"
  | "studio"
  | "jobs"
  | "learn";

export type NavItem = {
  label: string;
  href: string;
  external?: boolean;
};

export type DivisionConfig = {
  key: DivisionKey;
  name: string;
  shortName: string;
  sub: string;
  tagline: string;
  description: string;
  path: string;
  subdomain: string | null;
  accent: string;
  accentStrong: string;
  /**
   * WCAG-AA-safe darker sibling of `accent`, intended for text/icon use on
   * white surfaces (≥4.5:1 contrast). Use `accent` for fills, gradients, and
   * decorative dividers; use `accentText` whenever the accent is rendered as
   * body text or as an interactive icon glyph. V2-A11Y-01 derived these from
   * `accent` to clear WCAG 1.4.3 on white/near-white surfaces.
   */
  accentText: string;
  dark: string;
  supportEmail: string;
  supportPhone: string;
  publicNav: NavItem[];
};

function normalizeHostname(value?: string | null) {
  return String(value || "")
    .trim()
    .replace(/\\r\\n/gi, "")
    .replace(/\\n/gi, "")
    .replace(/\\r/gi, "")
    .replace(/[\r\n]+/g, "")
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "");
}

const BASE_DOMAIN =
  normalizeHostname(process.env.NEXT_PUBLIC_BASE_DOMAIN || "henrycogroup.com") ||
  "henrycogroup.com";
const GROUP_SUPPORT_PHONE = "+2349133957084";

export const COMPANY = {
  group: {
    name: "Henry & Co.",
    legalName: "Henry & Co. Group",
    baseDomain: BASE_DOMAIN,
    mission:
      "A premium group of service businesses built on clarity, trust, and operational excellence.",
    promise:
      "Every Henry & Co. division should feel premium, dependable, and beautifully structured.",
    supportEmail: BRAND_EMAILS.hello,
    supportPhone: GROUP_SUPPORT_PHONE,
  },

  divisions: {
    hub: {
      key: "hub",
      name: "Henry & Co.",
      shortName: "Hub",
      sub: "Group Directory",
      tagline: "The ecosystem hub for every Henry & Co. business.",
      description:
        "Explore all Henry & Co. divisions from one premium central discovery experience.",
      path: "/",
      subdomain: null,
      accent: "#C9A227",
      accentStrong: "#F2D77A",
      accentText: "#8A6F00",
      dark: "#05070D",
      supportEmail: BRAND_EMAILS.hello,
      supportPhone: GROUP_SUPPORT_PHONE,
      publicNav: [
        { label: "Directory", href: "/#directory" },
        { label: "How It Works", href: "/#how" },
        { label: "Why Henry & Co.", href: "/#why" },
        { label: "FAQ", href: "/#faq" }
      ],
    },

    care: {
      key: "care",
      name: "Henry & Co. Fabric Care",
      shortName: "Fabric Care",
      sub: "Garment care, home cleaning, office cleaning, and pickup delivery",
      tagline: "A premium care company for garments, homes, offices, and recurring service.",
      description:
        "Premium garment care, home cleaning, office cleaning, and pickup delivery with clear booking, dependable timing, and polished follow-through.",
      path: "/",
      subdomain: "care",
      accent: "#6B7CFF",
      accentStrong: "#E8EBFF",
      accentText: "#4F5BD0",
      dark: "#09112B",
      supportEmail: BRAND_EMAILS.care,
      supportPhone: GROUP_SUPPORT_PHONE,
      // Public chrome primary nav. "Home" intentionally absent — the brand
      // logo links to `/`. Order optimises for the top customer intents on
      // care.henrycogroup.com: browse → understand cost → book/track → trust
      // (reviews) → about/contact. Both `book` and `track` also render as
      // CTAs in the header (`siteNavCare.defaultCtas`), but staying in the
      // nav row keeps them reachable from drawer mode and the desktop tab
      // list — confirmed in `apps/care/components/public/CareNavbar.tsx`
      // (the `ctaHrefs` filter only de-dupes inside the header bar, not the
      // drawer). Audit: docs/v3/public-nav-intelligence-2026-05-23.md.
      publicNav: [
        { label: "Services", href: "/services" },
        { label: "Pricing", href: "/pricing" },
        { label: "Book", href: "/book" },
        { label: "Track", href: "/track" },
        { label: "Reviews", href: "/review" },
        { label: "About", href: "/about" },
        { label: "Contact", href: "/contact" }
      ],
    },

    building: {
      key: "building",
      name: "Henry & Co. Building",
      shortName: "Building",
      sub: "Construction & Project Delivery",
      tagline: "Modern construction, delivery, and project confidence.",
      description:
        "Construction and project services under the Henry & Co. premium operating standard.",
      path: "/",
      subdomain: "building",
      accent: "#C9A227",
      accentStrong: "#F2D77A",
      accentText: "#8A6F00",
      dark: "#07111F",
      supportEmail: BRAND_EMAILS.building,
      supportPhone: "+2349133957084",
      publicNav: [
        { label: "Home", href: "/" },
        { label: "Services", href: "/services" },
        { label: "Projects", href: "/projects" },
        { label: "Contact", href: "/contact" }
      ],
    },

    hotel: {
      key: "hotel",
      name: "Henry & Co. Hotels",
      shortName: "Hotels",
      sub: "Hospitality & Stays",
      tagline: "Premium stays, bookings, and guest experience.",
      description:
        "A modern hospitality experience designed with premium service and clean digital flow.",
      path: "/",
      subdomain: "hotel",
      accent: "#C9A227",
      accentStrong: "#F2D77A",
      accentText: "#8A6F00",
      dark: "#07111F",
      supportEmail: BRAND_EMAILS.hotel,
      supportPhone: GROUP_SUPPORT_PHONE,
      publicNav: [
        { label: "Home", href: "/" },
        { label: "Rooms", href: "/rooms" },
        { label: "Bookings", href: "/book" },
        { label: "Contact", href: "/contact" }
      ],
    },

    marketplace: {
      key: "marketplace",
      name: "Henry & Co. Marketplace",
      shortName: "Marketplace",
      sub: "Premium multi-vendor commerce",
      tagline:
        "A calmer marketplace for premium buyers, accountable sellers, and sharper operators.",
      description:
        "Premium multi-vendor commerce with cleaner discovery, stronger trust signals, vendor accountability, and operational clarity across buyers, sellers, and HenryCo teams.",
      path: "/",
      subdomain: "marketplace",
      accent: "#B2863B",
      accentStrong: "#F7E8CA",
      accentText: "#7E5E1F",
      dark: "#18120C",
      supportEmail: BRAND_EMAILS.marketplace,
      supportPhone: "+2349133957084",
      // Public chrome primary nav. "Home" intentionally absent — the brand
      // logo links to `/`. "Track" surfaces the customer's #1 post-purchase
      // intent ("where is my order?") that previously routed through the
      // account-side mirror only — the real route lives at
      // `apps/marketplace/app/(public)/track/page.tsx`. Search is mirrored
      // in nav for keyboard / drawer paths even though the toolbar has a
      // visible search input on lg+. Audit:
      // docs/v3/public-nav-intelligence-2026-05-23.md.
      publicNav: [
        { label: "Search", href: "/search" },
        { label: "Deals", href: "/deals" },
        { label: "Track", href: "/track" },
        { label: "Sell", href: "/sell" },
        { label: "Trust", href: "/trust" },
        { label: "Help", href: "/help" }
      ],
    },

    property: {
      key: "property",
      name: "HenryCo Property",
      shortName: "Property",
      sub: "Premium rentals, listings, and managed property operations",
      tagline:
        "A calmer property platform for high-trust discovery, sharper operations, and managed-property confidence.",
      description:
        "HenryCo Property brings premium rentals, property listings, viewing coordination, owner submissions, managed-property services, and trust-led operations into one editorial, high-conviction platform.",
      path: "/",
      subdomain: "property",
      accent: "#B06C3E",
      accentStrong: "#F8DDCB",
      accentText: "#7A4924",
      dark: "#130B08",
      supportEmail: BRAND_EMAILS.property,
      supportPhone: "+2349133957084",
      // Public chrome primary nav. "Home" intentionally absent — the brand
      // logo links to `/`. "FAQ" added — real `(public)/faq` route never
      // exposed in nav, even though pre-decision question funnel matters
      // for high-trust property buyers/renters.
      //
      // NOTE: An "Areas" entry was considered but NOT added — the route
      // `/area` has no index `page.tsx` (only `[slug]`), so a bare-path
      // nav entry would 404. Area-led browse remains reachable from search
      // filters and the sitemap. Audit:
      // docs/v3/public-nav-intelligence-2026-05-23.md.
      publicNav: [
        { label: "Search", href: "/search" },
        { label: "Managed", href: "/managed" },
        { label: "Trust", href: "/trust" },
        { label: "Submit", href: "/submit" },
        { label: "FAQ", href: "/faq" }
      ],
    },

    logistics: {
      key: "logistics",
      name: "HenryCo Logistics",
      shortName: "Logistics",
      sub: "Pickup, dispatch, delivery, and fleet operations",
      tagline:
        "Premium dispatch and delivery operations with sharper booking, cleaner tracking, and confident execution.",
      description:
        "HenryCo Logistics handles package pickup, dispatch delivery, same-day and scheduled runs, inter-city readiness, fleet coordination, rider workflows, proof of delivery, pricing governance, and customer tracking through one premium operating surface.",
      path: "/",
      subdomain: "logistics",
      accent: "#D06F32",
      accentStrong: "#FFE4D3",
      accentText: "#9D4F1F",
      dark: "#120B08",
      supportEmail: BRAND_EMAILS.logistics,
      supportPhone: "+2349133957084",
      // Public chrome primary nav. "Home" intentionally absent — logo handles
      // it. "Quote" and "Book" were both in the nav AND duplicated as the two
      // most-prominent CTAs, eating row space. They now render only as CTAs
      // (`siteNavLogistics.defaultCtas` — primary Book, secondary Quote) and
      // are dropped from primary nav. "Coverage" stays in nav — "do you serve
      // my area?" is a top-of-funnel decision question that drives drop-off
      // if hidden. Audit: docs/v3/public-nav-intelligence-2026-05-23.md.
      publicNav: [
        { label: "Services", href: "/services" },
        { label: "Pricing", href: "/pricing" },
        { label: "Coverage", href: "/coverage" },
        { label: "Business", href: "/business" },
        { label: "Track", href: "/track" },
        { label: "Support", href: "/support" }
      ],
    },

    studio: {
      key: "studio",
      name: "HenryCo Studio",
      shortName: "Studio",
      sub: "Premium digital products, software systems, and brand execution",
      tagline:
        "A premium product studio for websites, apps, internal systems, brand systems, and elite delivery.",
      description:
        "HenryCo Studio designs and delivers websites, mobile apps, UI systems, branding, e-commerce, internal tools, and custom software with premium process, milestone visibility, and operational clarity.",
      path: "/",
      subdomain: "studio",
      accent: "#4AC1C5",
      accentStrong: "#D3FBFC",
      accentText: "#1F7375",
      dark: "#081219",
      supportEmail: BRAND_EMAILS.studio,
      supportPhone: "+2349133957084",
      // NOTE: `apps/studio` chrome reads from `siteNavStudio` in
      // `packages/ui/src/public-shell/navigation/site-nav.studio.ts` (local
      // override of the registry default), not from this array. This array
      // is kept in sync so other consumers (sitemap, footers, JSON-LD)
      // reading off `getDivisionConfig("studio").publicNav` stay aligned with
      // the public chrome. Audit:
      // docs/v3/public-nav-intelligence-2026-05-23.md.
      publicNav: [
        { label: "Project types", href: "/pick" },
        { label: "Services", href: "/services" },
        { label: "Packages", href: "/pricing" },
        { label: "Case studies", href: "/work" },
        { label: "Process", href: "/process" },
        { label: "Trust", href: "/trust" },
        { label: "Teams", href: "/teams" }
      ],
    },

    jobs: {
      key: "jobs",
      name: "HenryCo Jobs",
      shortName: "Jobs",
      sub: "Hiring, verified talent, and recruitment operations",
      tagline:
        "A premium hiring operating system for serious employers, verified talent, and cleaner recruitment.",
      description:
        "HenryCo Jobs brings public hiring, verified candidate profiles, trusted employer onboarding, recruiter pipelines, and internal HenryCo hiring into one premium operating system.",
      path: "/",
      subdomain: "jobs",
      accent: "#0E7C86",
      accentStrong: "#D7F4F3",
      accentText: "#0E7C86",
      dark: "#071418",
      supportEmail: BRAND_EMAILS.jobs,
      supportPhone: "+2349133957084",
      // Public chrome primary nav. "Careers" (internal HenryCo hiring)
      // removed from primary because it semantically collides with
      // "Find jobs" — candidates routinely clicked it expecting public
      // listings. "Careers" still lives in the footer ("Work at HenryCo")
      // and the employer/candidate-aware account-chip menu, so the
      // work-for-HenryCo surface is preserved where context disambiguates.
      //
      // NOTE: A "Categories" nav entry was considered but NOT added — the
      // route `/categories` has no index `page.tsx` (only `[slug]`), so a
      // bare-path nav entry would 404. Browse-by-category remains reachable
      // via category links on /jobs, sitemap, and search filters. Audit:
      // docs/v3/public-nav-intelligence-2026-05-23.md.
      publicNav: [
        { label: "Find jobs", href: "/jobs" },
        { label: "Talent", href: "/talent" },
        { label: "Hire", href: "/hire" },
        { label: "Trust", href: "/trust" },
        { label: "Help", href: "/help" }
      ],
    },

    learn: {
      key: "learn",
      name: "HenryCo Learn",
      shortName: "Learn",
      sub: "Courses, paths, quizzes, and verified certificates",
      tagline:
        "Practical courses you can finish—with clear progress, fair assessments, and credentials employers can check.",
      description:
        "Browse structured programs, learn at your own pace, pass short assessments where required, and earn HenryCo certificates with a public verification code. Your enrollments and progress also appear in your HenryCo account dashboard.",
      path: "/",
      subdomain: "learn",
      accent: "#3C8C7A",
      accentStrong: "#D8F4EB",
      accentText: "#2E6E5F",
      dark: "#081414",
      supportEmail: BRAND_EMAILS.learn,
      supportPhone: "+2349133957084",
      // Public chrome primary nav. Rename "How it works" → "Academy" — the
      // route slug is `/academy`, the new label is terser, and "Academy"
      // matches the brand surface across emails/marketing. No structural
      // change to the URL set otherwise; every route exists. Audit:
      // docs/v3/public-nav-intelligence-2026-05-23.md.
      publicNav: [
        { label: "Courses", href: "/courses" },
        { label: "Paths", href: "/paths" },
        { label: "Academy", href: "/academy" },
        { label: "Certificates", href: "/certifications" },
        { label: "Teach", href: "/teach" },
        { label: "Trust", href: "/trust" },
        { label: "Help", href: "/help" }
      ],
    },
  },
} as const;

export function getDivisionConfig<K extends DivisionKey>(key: K) {
  return COMPANY.divisions[key];
}

export function getDivisionUrl(key: DivisionKey) {
  const division = COMPANY.divisions[key];
  if (!division.subdomain) {
    return `https://${COMPANY.group.baseDomain}`;
  }
  return `https://${division.subdomain}.${COMPANY.group.baseDomain}`;
}

export function getHubUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `https://${COMPANY.group.baseDomain}${normalizedPath}`;
}

export function getAccountUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `https://account.${COMPANY.group.baseDomain}${normalizedPath}`;
}

export function getHqUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `https://hq.${COMPANY.group.baseDomain}${normalizedPath}`;
}

export function getWorkspaceUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `https://workspace.${COMPANY.group.baseDomain}${normalizedPath}`;
}

export function getStaffHqUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `https://staff.${COMPANY.group.baseDomain}${normalizedPath}`;
}

export function getSharedCookieDomain(hostname?: string | null) {
  const normalizedHost = normalizeHostname(hostname);
  const baseDomain = normalizeHostname(COMPANY.group.baseDomain);

  if (!normalizedHost || !baseDomain) return undefined;
  if (
    normalizedHost === "localhost" ||
    normalizedHost.endsWith(".localhost") ||
    normalizedHost === "127.0.0.1" ||
    normalizedHost === "::1" ||
    /^\d+\.\d+\.\d+\.\d+$/.test(normalizedHost)
  ) {
    return undefined;
  }

  if (normalizedHost === baseDomain || normalizedHost.endsWith(`.${baseDomain}`)) {
    return `.${baseDomain}`;
  }

  return undefined;
}
