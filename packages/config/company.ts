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

export const COMPANY = {
  group: {
    name: "Henry & Co.",
    legalName: "Henry & Co. Group",
    baseDomain: BASE_DOMAIN,
    mission:
      "A premium group of service businesses built on clarity, trust, and operational excellence.",
    promise:
      "Every Henry & Co. division should feel premium, dependable, and beautifully structured.",
    supportEmail: "hello@henrycogroup.com",
    supportPhone: "+2349133957084",
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
      dark: "#05070D",
      supportEmail: "hello@henrycogroup.com",
      supportPhone: "+234 000 000 0000",
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
      dark: "#09112B",
      supportEmail: "care@henrycogroup.com",
      supportPhone: "+234 000 000 0000",
      publicNav: [
        { label: "Home", href: "/" },
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
      dark: "#07111F",
      supportEmail: "building@henrycogroup.com",
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
      dark: "#07111F",
      supportEmail: "hotel@henrycogroup.com",
      supportPhone: "+234 000 000 0000",
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
      dark: "#18120C",
      supportEmail: "marketplace@henrycogroup.com",
      supportPhone: "+2349133957084",
      publicNav: [
        { label: "Home", href: "/" },
        { label: "Search", href: "/search" },
        { label: "Deals", href: "/deals" },
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
      dark: "#130B08",
      supportEmail: "property@henrycogroup.com",
      supportPhone: "+2349133957084",
      publicNav: [
        { label: "Home", href: "/" },
        { label: "Search", href: "/search" },
        { label: "Managed", href: "/managed" },
        { label: "Trust", href: "/trust" },
        { label: "Submit", href: "/submit" }
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
      dark: "#120B08",
      supportEmail: "logistics@henrycogroup.com",
      supportPhone: "+2349133957084",
      publicNav: [
        { label: "Home", href: "/" },
        { label: "Services", href: "/services" },
        { label: "Pricing", href: "/pricing" },
        { label: "Business", href: "/business" },
        { label: "Quote", href: "/quote" },
        { label: "Book", href: "/book" },
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
      dark: "#081219",
      supportEmail: "studio@henrycogroup.com",
      supportPhone: "+2349133957084",
      publicNav: [
        { label: "Home", href: "/" },
        { label: "Services", href: "/services" },
        { label: "Work", href: "/work" },
        { label: "Teams", href: "/teams" },
        { label: "Pricing", href: "/pricing" },
        { label: "Process", href: "/process" },
        { label: "Trust", href: "/trust" },
        { label: "Request", href: "/request" },
        { label: "Contact", href: "/contact" }
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
      dark: "#071418",
      supportEmail: "jobs@henrycogroup.com",
      supportPhone: "+2349133957084",
      publicNav: [
        { label: "Find jobs", href: "/jobs" },
        { label: "Talent", href: "/talent" },
        { label: "Hire", href: "/hire" },
        { label: "Careers", href: "/careers" },
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
      dark: "#081414",
      supportEmail: "learn@henrycogroup.com",
      supportPhone: "+2349133957084",
      publicNav: [
        { label: "Courses", href: "/courses" },
        { label: "Paths", href: "/paths" },
        { label: "How it works", href: "/academy" },
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
  return `https://staffhq.${COMPANY.group.baseDomain}${normalizedPath}`;
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
