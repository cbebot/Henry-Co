export type CompanyKey = "hub" | "care" | "building" | "marketplace" | "logistics";

export type NavItem = {
  label: string;
  href: string;
  external?: boolean;
};

export type CompanyConfig = {
  key: CompanyKey;
  parentBrand: string;     // "HENRY & CO."
  division: string;        // "Fabric Care"
  description: string;
  domainLabel: string;     // "care.henryco.com"
  accent: string;          // "#C9A227"
  marketingNav: NavItem[];
  robotsIndex: boolean;    // hub=true, subdomains=false by default
};

export const COMPANIES: Record<CompanyKey, CompanyConfig> = {
  hub: {
    key: "hub",
    parentBrand: "HENRY & CO.",
    division: "Group",
    description:
      "The operating hub for every Henry & Co. business. Explore divisions, choose services, and enter each standalone website.",
    domainLabel: "henryco.com",
    accent: "#C9A227",
    robotsIndex: true,
    marketingNav: [
      { label: "Divisions", href: "/#divisions" },
      { label: "How it works", href: "/#how" },
      { label: "Standards", href: "/#standards" },
      { label: "Contact", href: "/#contact" }
    ]
  },

  care: {
    key: "care",
    parentBrand: "HENRY & CO.",
    division: "Fabric Care",
    description:
      "Premium garment care, home cleaning, office cleaning, and pickup delivery with clear booking, dependable timing, and polished follow-through.",
    domainLabel: "care.henrycogroup.com",
    accent: "#6B7CFF",
    robotsIndex: false,
    marketingNav: [
      { label: "Services", href: "/services" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Reviews", href: "/review" },
      { label: "About", href: "/about" }
    ]
  },

  building: {
    key: "building",
    parentBrand: "HENRY & CO.",
    division: "Building & Projects",
    description:
      "Construction, renovation, finishing, project supervision, and premium building delivery.",
    domainLabel: "building.henryco.com",
    accent: "#4F46E5",
    robotsIndex: false,
    marketingNav: [
      { label: "Services", href: "/#services" },
      { label: "Portfolio", href: "/#portfolio" },
      { label: "Process", href: "/#process" },
      { label: "Contact", href: "/#contact" }
    ]
  },

  marketplace: {
    key: "marketplace",
    parentBrand: "HENRY & CO.",
    division: "Marketplace",
    description:
      "Premium multi-vendor commerce for trusted sellers, cleaner buyer journeys, and sharper operator control.",
    domainLabel: "marketplace.henrycogroup.com",
    accent: "#B2863B",
    robotsIndex: false,
    marketingNav: [
      { label: "Search", href: "/search" },
      { label: "Deals", href: "/deals" },
      { label: "Sell", href: "/sell" },
      { label: "Trust", href: "/trust" }
    ]
  },

  logistics: {
    key: "logistics",
    parentBrand: "HENRY & CO.",
    division: "Logistics",
    description:
      "Premium pickup, dispatch, same-day delivery, scheduled routing, and fleet operations with trustworthy tracking and tighter dispatch control.",
    domainLabel: "logistics.henrycogroup.com",
    accent: "#D06F32",
    robotsIndex: false,
    marketingNav: [
      { label: "Services", href: "/services" },
      { label: "Pricing", href: "/pricing" },
      { label: "Business", href: "/business" },
      { label: "Track", href: "/track" }
    ]
  }
};

export function getCompany(key: CompanyKey) {
  return COMPANIES[key];
}

/**
 * Brand mark asset references. Source SVGs ship with @henryco/ui/brand
 * (see `packages/ui/src/brand/static/`). Each app exposes its own copy
 * via `public/brand/{file}.svg` and via the Next.js `app/icon.svg`
 * convention (auto-served at /icon), so absolute URLs can be composed
 * from the host: `https://{host}/brand/monogram.svg`.
 *
 * Use `marks.monogram.appPath` for in-app references (e.g. JSON-LD logo
 * fields where you compose absolute URLs at request time). Use
 * `marks.monogram.staticImport` only inside the @henryco/ui workspace.
 */
export const marks = {
  monogram: {
    /** Public-served path for absolute-URL composition. */
    appPath: "/brand/monogram.svg",
    /** Next.js auto-favicon path served from app/icon.svg. */
    iconPath: "/icon",
    /** Workspace-internal source. Use only inside @henryco/ui. */
    staticImport: "@henryco/ui/brand/static/monogram.svg",
    width: 64,
    height: 64,
    viewBox: "0 0 64 64",
  },
  wordmarkFull: {
    appPath: "/brand/wordmark-full.svg",
    staticImport: "@henryco/ui/brand/static/wordmark-full.svg",
  },
  wordmarkCompact: {
    appPath: "/brand/wordmark-compact.svg",
    staticImport: "@henryco/ui/brand/static/wordmark-compact.svg",
  },
} as const;

export type BrandMark = keyof typeof marks;
