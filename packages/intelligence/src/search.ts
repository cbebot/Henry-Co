import {
  COMPANY,
  getAccountUrl,
  getDivisionUrl,
  getHubUrl,
  type DivisionKey,
} from "@henryco/config";

export type CrossDivisionSearchContext = "public" | "account" | "staff";
export type CrossDivisionSearchVisibility = "public" | "authenticated" | "staff";
export type CrossDivisionSearchAuthRequirement = "none" | "account" | "staff";
export type CrossDivisionSearchSource =
  | "shared_catalog"
  | "account_catalog"
  | "staff_catalog"
  | "navigation_catalog";

export type CrossDivisionSearchIcon =
  | "compass"
  | "building"
  | "sparkles"
  | "shopping-bag"
  | "briefcase"
  | "graduation-cap"
  | "truck"
  | "palette"
  | "wallet"
  | "bell"
  | "receipt"
  | "life-buoy"
  | "shield"
  | "settings"
  | "message-square"
  | "map-pin"
  | "package"
  | "search"
  | "layout-dashboard"
  | "file-text"
  | "users"
  | "headphones";

export type CrossDivisionSearchType =
  | "division"
  | "page"
  | "workflow"
  | "help"
  | "marketplace_product"
  | "marketplace_store"
  | "marketplace_order"
  | "job_listing"
  | "job_application"
  | "job_help"
  | "learn_course"
  | "learn_certificate"
  | "learn_help"
  | "logistics_tracking"
  | "logistics_help"
  | "property_listing"
  | "property_search"
  | "property_help"
  | "studio_service"
  | "studio_project"
  | "studio_help"
  | "account_workflow"
  | "staff_queue"
  | "staff_item";

export type CrossDivisionSearchDivision =
  | "hub"
  | "account"
  | "care"
  | "marketplace"
  | "jobs"
  | "learn"
  | "logistics"
  | "property"
  | "studio"
  | "staff";

export type CrossDivisionSearchResult = {
  id: string;
  division: CrossDivisionSearchDivision;
  type: CrossDivisionSearchType;
  title: string;
  subtitle?: string;
  description?: string;
  url: string;
  authRequirement: CrossDivisionSearchAuthRequirement;
  visibility: CrossDivisionSearchVisibility;
  badge?: string;
  icon: CrossDivisionSearchIcon;
  priority: number;
  source: CrossDivisionSearchSource;
  tags: string[];
  metadata?: Record<string, string | number | boolean | null>;
};

export type CrossDivisionSearchSignalKind =
  | "query_submitted"
  | "result_clicked"
  | "zero_results"
  | "fallback_clicked"
  | "division_selected"
  | "auth_redirect";

export type CrossDivisionSearchSignal = {
  kind: CrossDivisionSearchSignalKind;
  query: string;
  queryHash: string;
  queryLength: number;
  context: CrossDivisionSearchContext;
  resultCount: number;
  resultId?: string;
  division?: CrossDivisionSearchDivision;
  authRequired?: CrossDivisionSearchAuthRequirement;
};

type SearchDefinition = Omit<CrossDivisionSearchResult, "url"> & {
  href: string;
};

function appendPath(baseUrl: string, path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl.replace(/\/+$/, "")}${normalizedPath === "/" ? "" : normalizedPath}`;
}

function divisionHref(division: DivisionKey, path = "/") {
  return appendPath(getDivisionUrl(division), path);
}

function defineResult(definition: SearchDefinition): CrossDivisionSearchResult {
  return {
    ...definition,
    url: definition.href,
  };
}

const publicCatalog: CrossDivisionSearchResult[] = [
  defineResult({
    id: "hub-search",
    division: "hub",
    type: "workflow",
    title: "Search HenryCo",
    subtitle: "Cross-division discovery",
    description: "Find divisions, workflows, help routes, and major destinations across HenryCo.",
    href: getHubUrl("/search"),
    authRequirement: "none",
    visibility: "public",
    badge: "Global",
    icon: "search",
    priority: 100,
    source: "shared_catalog",
    tags: ["search", "henryco", "discover", "find", "division", "workflow", "global"],
  }),
  defineResult({
    id: "hub-directory",
    division: "hub",
    type: "division",
    title: "HenryCo divisions directory",
    subtitle: "Find a division",
    description: "Browse every live HenryCo division from the central hub.",
    href: getHubUrl("/#divisions"),
    authRequirement: "none",
    visibility: "public",
    badge: "Hub",
    icon: "compass",
    priority: 98,
    source: "shared_catalog",
    tags: ["directory", "divisions", "hub", "find division", "ecosystem", "services"],
  }),
  defineResult({
    id: "care-division",
    division: "care",
    type: "division",
    title: COMPANY.divisions.care.name,
    subtitle: "Fabric care services",
    description: "Garment care, home cleaning, office cleaning, and pickup delivery.",
    href: divisionHref("care"),
    authRequirement: "none",
    visibility: "public",
    badge: "Division",
    icon: "sparkles",
    priority: 86,
    source: "shared_catalog",
    tags: ["care", "cleaning", "laundry", "pickup", "delivery", "services"],
  }),
  defineResult({
    id: "care-services",
    division: "care",
    type: "page",
    title: "Care services",
    subtitle: "What HenryCo Care offers",
    description: "Browse fabric care, home cleaning, and office cleaning services.",
    href: divisionHref("care", "/services"),
    authRequirement: "none",
    visibility: "public",
    badge: "Services",
    icon: "sparkles",
    priority: 84,
    source: "shared_catalog",
    tags: ["care", "services", "cleaning", "laundry", "garment", "home"],
  }),
  defineResult({
    id: "care-book",
    division: "care",
    type: "workflow",
    title: "Book Care pickup or cleaning",
    subtitle: "Schedule a service",
    description: "Start a new booking for care, cleaning, or pickup delivery.",
    href: divisionHref("care", "/book"),
    authRequirement: "none",
    visibility: "public",
    badge: "Book",
    icon: "sparkles",
    priority: 92,
    source: "shared_catalog",
    tags: ["care", "book", "booking", "schedule", "pickup", "service"],
  }),
  defineResult({
    id: "care-track",
    division: "care",
    type: "workflow",
    title: "Track Care order",
    subtitle: "Pickup and service tracking",
    description: "Track a care booking or order status.",
    href: divisionHref("care", "/track"),
    authRequirement: "none",
    visibility: "public",
    badge: "Track",
    icon: "package",
    priority: 91,
    source: "shared_catalog",
    tags: ["care", "track", "tracking", "order", "booking", "status"],
  }),
  defineResult({
    id: "care-contact",
    division: "care",
    type: "help",
    title: "Care contact and help",
    subtitle: "Support and contact",
    description: "Reach HenryCo Care for booking or service support.",
    href: divisionHref("care", "/contact"),
    authRequirement: "none",
    visibility: "public",
    badge: "Help",
    icon: "life-buoy",
    priority: 88,
    source: "shared_catalog",
    tags: ["care", "support", "help", "contact", "issue", "problem"],
  }),
  defineResult({
    id: "marketplace-division",
    division: "marketplace",
    type: "division",
    title: COMPANY.divisions.marketplace.name,
    subtitle: "Premium commerce",
    description: "A calmer multi-vendor marketplace with premium discovery and trust rails.",
    href: divisionHref("marketplace"),
    authRequirement: "none",
    visibility: "public",
    badge: "Division",
    icon: "shopping-bag",
    priority: 86,
    source: "shared_catalog",
    tags: ["marketplace", "shop", "commerce", "products", "stores", "vendors"],
  }),
  defineResult({
    id: "marketplace-search",
    division: "marketplace",
    type: "marketplace_product",
    title: "Search marketplace products",
    subtitle: "Products, stores, and brands",
    description: "Search live marketplace products, categories, brands, and stores.",
    href: divisionHref("marketplace", "/search"),
    authRequirement: "none",
    visibility: "public",
    badge: "Search",
    icon: "search",
    priority: 95,
    source: "shared_catalog",
    tags: ["marketplace", "products", "stores", "brands", "search", "shop", "catalog"],
  }),
  defineResult({
    id: "marketplace-sell",
    division: "marketplace",
    type: "workflow",
    title: "Sell on Marketplace",
    subtitle: "Seller onboarding",
    description: "Start the seller onboarding flow and pricing guidance.",
    href: divisionHref("marketplace", "/sell"),
    authRequirement: "none",
    visibility: "public",
    badge: "Sell",
    icon: "shopping-bag",
    priority: 84,
    source: "shared_catalog",
    tags: ["marketplace", "sell", "vendor", "store", "seller", "onboarding"],
  }),
  defineResult({
    id: "marketplace-help",
    division: "marketplace",
    type: "help",
    title: "Marketplace help",
    subtitle: "Buyer and seller support",
    description: "Get help with shopping, orders, trust, or seller questions.",
    href: divisionHref("marketplace", "/help"),
    authRequirement: "none",
    visibility: "public",
    badge: "Help",
    icon: "life-buoy",
    priority: 90,
    source: "shared_catalog",
    tags: ["marketplace", "support", "help", "orders", "seller", "buyer", "refund"],
  }),
  defineResult({
    id: "jobs-division",
    division: "jobs",
    type: "division",
    title: COMPANY.divisions.jobs.name,
    subtitle: "Hiring and talent",
    description: "Jobs, verified talent, recruitment operations, and hiring support.",
    href: divisionHref("jobs"),
    authRequirement: "none",
    visibility: "public",
    badge: "Division",
    icon: "briefcase",
    priority: 86,
    source: "shared_catalog",
    tags: ["jobs", "hiring", "recruitment", "roles", "talent", "career"],
  }),
  defineResult({
    id: "jobs-browse",
    division: "jobs",
    type: "job_listing",
    title: "Browse jobs",
    subtitle: "Open roles and filters",
    description: "Search live roles, categories, and employer listings.",
    href: divisionHref("jobs", "/jobs"),
    authRequirement: "none",
    visibility: "public",
    badge: "Jobs",
    icon: "briefcase",
    priority: 95,
    source: "shared_catalog",
    tags: ["jobs", "roles", "job search", "browse", "vacancy", "career"],
  }),
  defineResult({
    id: "jobs-hire",
    division: "jobs",
    type: "workflow",
    title: "Hire with HenryCo Jobs",
    subtitle: "Employer workflow",
    description: "Start the employer and recruitment workflow.",
    href: divisionHref("jobs", "/hire"),
    authRequirement: "none",
    visibility: "public",
    badge: "Hire",
    icon: "users",
    priority: 84,
    source: "shared_catalog",
    tags: ["jobs", "hire", "employer", "recruitment", "talent", "team"],
  }),
  defineResult({
    id: "jobs-help",
    division: "jobs",
    type: "job_help",
    title: "Jobs help",
    subtitle: "Candidate and employer support",
    description: "Get help with applications, hiring, and platform support.",
    href: divisionHref("jobs", "/help"),
    authRequirement: "none",
    visibility: "public",
    badge: "Help",
    icon: "life-buoy",
    priority: 90,
    source: "shared_catalog",
    tags: ["jobs", "help", "support", "candidate", "employer", "application"],
  }),
  defineResult({
    id: "learn-division",
    division: "learn",
    type: "division",
    title: COMPANY.divisions.learn.name,
    subtitle: "Courses and certificates",
    description: "Practical courses, paths, assessments, and certificates.",
    href: divisionHref("learn"),
    authRequirement: "none",
    visibility: "public",
    badge: "Division",
    icon: "graduation-cap",
    priority: 86,
    source: "shared_catalog",
    tags: ["learn", "academy", "courses", "certificates", "training", "education"],
  }),
  defineResult({
    id: "learn-courses",
    division: "learn",
    type: "learn_course",
    title: "Browse Learn courses",
    subtitle: "Course catalog",
    description: "Search the course catalog, categories, and learning paths.",
    href: divisionHref("learn", "/courses"),
    authRequirement: "none",
    visibility: "public",
    badge: "Courses",
    icon: "graduation-cap",
    priority: 95,
    source: "shared_catalog",
    tags: ["learn", "courses", "catalog", "academy", "training", "classes"],
  }),
  defineResult({
    id: "learn-certifications",
    division: "learn",
    type: "learn_certificate",
    title: "Learn certificates and verification",
    subtitle: "Certificates and trust",
    description: "View certificate flows and public verification routes.",
    href: divisionHref("learn", "/certifications"),
    authRequirement: "none",
    visibility: "public",
    badge: "Certificates",
    icon: "shield",
    priority: 88,
    source: "shared_catalog",
    tags: ["learn", "certificate", "certification", "verify", "credential", "trust"],
  }),
  defineResult({
    id: "learn-help",
    division: "learn",
    type: "learn_help",
    title: "Learn help",
    subtitle: "Learner support",
    description: "Get help with courses, certificates, and learning support.",
    href: divisionHref("learn", "/help"),
    authRequirement: "none",
    visibility: "public",
    badge: "Help",
    icon: "life-buoy",
    priority: 90,
    source: "shared_catalog",
    tags: ["learn", "help", "support", "courses", "certificate", "billing"],
  }),
  defineResult({
    id: "logistics-division",
    division: "logistics",
    type: "division",
    title: COMPANY.divisions.logistics.name,
    subtitle: "Dispatch and delivery",
    description: "Pickup, dispatch, delivery, and fleet operations.",
    href: divisionHref("logistics"),
    authRequirement: "none",
    visibility: "public",
    badge: "Division",
    icon: "truck",
    priority: 86,
    source: "shared_catalog",
    tags: ["logistics", "delivery", "dispatch", "shipments", "tracking", "fleet"],
  }),
  defineResult({
    id: "logistics-track",
    division: "logistics",
    type: "logistics_tracking",
    title: "Track shipment",
    subtitle: "Logistics tracking",
    description: "Track a shipment, run, or dispatch status.",
    href: divisionHref("logistics", "/track"),
    authRequirement: "none",
    visibility: "public",
    badge: "Track",
    icon: "package",
    priority: 95,
    source: "shared_catalog",
    tags: ["logistics", "track", "tracking", "shipment", "dispatch", "delivery"],
  }),
  defineResult({
    id: "logistics-book",
    division: "logistics",
    type: "workflow",
    title: "Book logistics delivery",
    subtitle: "Delivery booking",
    description: "Book a dispatch or delivery with HenryCo Logistics.",
    href: divisionHref("logistics", "/book"),
    authRequirement: "none",
    visibility: "public",
    badge: "Book",
    icon: "truck",
    priority: 92,
    source: "shared_catalog",
    tags: ["logistics", "book", "delivery", "dispatch", "shipment", "pickup"],
  }),
  defineResult({
    id: "logistics-quote",
    division: "logistics",
    type: "workflow",
    title: "Get logistics quote",
    subtitle: "Pricing and quote",
    description: "Request a delivery or dispatch quote.",
    href: divisionHref("logistics", "/quote"),
    authRequirement: "none",
    visibility: "public",
    badge: "Quote",
    icon: "receipt",
    priority: 86,
    source: "shared_catalog",
    tags: ["logistics", "quote", "pricing", "delivery", "estimate"],
  }),
  defineResult({
    id: "logistics-support",
    division: "logistics",
    type: "logistics_help",
    title: "Logistics support",
    subtitle: "Shipment help",
    description: "Get help with shipment issues, delivery support, and service questions.",
    href: divisionHref("logistics", "/support"),
    authRequirement: "none",
    visibility: "public",
    badge: "Help",
    icon: "life-buoy",
    priority: 91,
    source: "shared_catalog",
    tags: ["logistics", "support", "help", "tracking", "delivery", "shipment"],
  }),
  defineResult({
    id: "property-division",
    division: "property",
    type: "division",
    title: COMPANY.divisions.property.name,
    subtitle: "Listings and managed property",
    description: "Premium rentals, listings, viewings, and managed-property operations.",
    href: divisionHref("property"),
    authRequirement: "none",
    visibility: "public",
    badge: "Division",
    icon: "building",
    priority: 86,
    source: "shared_catalog",
    tags: ["property", "real estate", "rentals", "listings", "viewings", "managed"],
  }),
  defineResult({
    id: "property-search",
    division: "property",
    type: "property_search",
    title: "Search property listings",
    subtitle: "Listings and locations",
    description: "Search live property listings, areas, and listing details.",
    href: divisionHref("property", "/search"),
    authRequirement: "none",
    visibility: "public",
    badge: "Search",
    icon: "search",
    priority: 95,
    source: "shared_catalog",
    tags: ["property", "search", "listings", "rent", "homes", "apartments", "viewing"],
  }),
  defineResult({
    id: "property-managed",
    division: "property",
    type: "property_listing",
    title: "Managed property services",
    subtitle: "Managed operations",
    description: "Explore managed-property offerings and owner services.",
    href: divisionHref("property", "/managed"),
    authRequirement: "none",
    visibility: "public",
    badge: "Managed",
    icon: "building",
    priority: 84,
    source: "shared_catalog",
    tags: ["property", "managed", "owners", "management", "operations"],
  }),
  defineResult({
    id: "property-submit",
    division: "property",
    type: "workflow",
    title: "Submit property listing",
    subtitle: "Owner submission",
    description: "Submit a property for review and listing consideration.",
    href: divisionHref("property", "/submit"),
    authRequirement: "none",
    visibility: "public",
    badge: "Submit",
    icon: "map-pin",
    priority: 86,
    source: "shared_catalog",
    tags: ["property", "submit", "listing", "owner", "landlord", "publish"],
  }),
  defineResult({
    id: "property-help",
    division: "property",
    type: "property_help",
    title: "Property FAQ and help",
    subtitle: "Guidance and trust",
    description: "Get help with listings, viewings, and property questions.",
    href: divisionHref("property", "/faq"),
    authRequirement: "none",
    visibility: "public",
    badge: "Help",
    icon: "life-buoy",
    priority: 88,
    source: "shared_catalog",
    tags: ["property", "faq", "help", "support", "viewing", "listing"],
  }),
  defineResult({
    id: "studio-division",
    division: "studio",
    type: "division",
    title: COMPANY.divisions.studio.name,
    subtitle: "Digital product studio",
    description: "Websites, apps, systems, brand execution, and premium digital delivery.",
    href: divisionHref("studio"),
    authRequirement: "none",
    visibility: "public",
    badge: "Division",
    icon: "palette",
    priority: 86,
    source: "shared_catalog",
    tags: ["studio", "software", "design", "apps", "websites", "branding"],
  }),
  defineResult({
    id: "studio-services",
    division: "studio",
    type: "studio_service",
    title: "Studio services",
    subtitle: "Software and brand delivery",
    description: "Browse HenryCo Studio services and delivery offerings.",
    href: divisionHref("studio", "/services"),
    authRequirement: "none",
    visibility: "public",
    badge: "Services",
    icon: "palette",
    priority: 84,
    source: "shared_catalog",
    tags: ["studio", "services", "websites", "apps", "branding", "systems"],
  }),
  defineResult({
    id: "studio-request",
    division: "studio",
    type: "workflow",
    title: "Request a Studio project",
    subtitle: "Start a new brief",
    description: "Start the project request flow for HenryCo Studio.",
    href: divisionHref("studio", "/request"),
    authRequirement: "none",
    visibility: "public",
    badge: "Request",
    icon: "message-square",
    priority: 93,
    source: "shared_catalog",
    tags: ["studio", "request", "brief", "project", "proposal", "quote"],
  }),
  defineResult({
    id: "studio-work",
    division: "studio",
    type: "studio_project",
    title: "Studio work and case studies",
    subtitle: "Portfolio and delivery examples",
    description: "View completed work, delivery patterns, and studio case studies.",
    href: divisionHref("studio", "/work"),
    authRequirement: "none",
    visibility: "public",
    badge: "Work",
    icon: "palette",
    priority: 82,
    source: "shared_catalog",
    tags: ["studio", "work", "portfolio", "projects", "case studies"],
  }),
  defineResult({
    id: "studio-help",
    division: "studio",
    type: "studio_help",
    title: "Studio contact and support",
    subtitle: "Sales and client help",
    description: "Reach HenryCo Studio for sales, project, and support questions.",
    href: divisionHref("studio", "/contact"),
    authRequirement: "none",
    visibility: "public",
    badge: "Help",
    icon: "life-buoy",
    priority: 89,
    source: "shared_catalog",
    tags: ["studio", "support", "help", "contact", "project", "sales"],
  }),
];

const authenticatedCatalog: CrossDivisionSearchResult[] = [
  defineResult({
    id: "account-overview",
    division: "account",
    type: "account_workflow",
    title: "Account overview",
    subtitle: "HenryCo account home",
    description: "Open your HenryCo account dashboard.",
    href: getAccountUrl("/"),
    authRequirement: "account",
    visibility: "authenticated",
    badge: "Account",
    icon: "layout-dashboard",
    priority: 97,
    source: "shared_catalog",
    tags: ["account", "overview", "dashboard", "home", "profile"],
  }),
  defineResult({
    id: "account-notifications",
    division: "account",
    type: "account_workflow",
    title: "Notifications",
    subtitle: "Alerts and updates",
    description: "Review HenryCo notifications across services.",
    href: getAccountUrl("/notifications"),
    authRequirement: "account",
    visibility: "authenticated",
    badge: "Account",
    icon: "bell",
    priority: 97,
    source: "shared_catalog",
    tags: ["notifications", "alerts", "updates", "messages", "inbox"],
  }),
  defineResult({
    id: "account-support",
    division: "account",
    type: "help",
    title: "Support inbox",
    subtitle: "Threads and support history",
    description: "Open existing HenryCo support threads and requests.",
    href: getAccountUrl("/support"),
    authRequirement: "account",
    visibility: "authenticated",
    badge: "Support",
    icon: "life-buoy",
    priority: 98,
    source: "shared_catalog",
    tags: ["support", "help", "threads", "requests", "tickets", "inbox"],
  }),
  defineResult({
    id: "account-support-new",
    division: "account",
    type: "workflow",
    title: "Create support request",
    subtitle: "New ticket",
    description: "Start a new HenryCo support request.",
    href: getAccountUrl("/support/new"),
    authRequirement: "account",
    visibility: "authenticated",
    badge: "Support",
    icon: "message-square",
    priority: 98,
    source: "shared_catalog",
    tags: ["support", "ticket", "new ticket", "new request", "contact", "help"],
  }),
  defineResult({
    id: "account-wallet",
    division: "account",
    type: "account_workflow",
    title: "Wallet",
    subtitle: "Funds and balance",
    description: "Open wallet balance, funding, and withdrawal workflows.",
    href: getAccountUrl("/wallet"),
    authRequirement: "account",
    visibility: "authenticated",
    badge: "Wallet",
    icon: "wallet",
    priority: 99,
    source: "shared_catalog",
    tags: ["wallet", "balance", "funding", "withdraw", "money", "finance"],
  }),
  defineResult({
    id: "account-payments",
    division: "account",
    type: "account_workflow",
    title: "Payments",
    subtitle: "Payment methods and history",
    description: "Open payment methods and transaction history.",
    href: getAccountUrl("/payments"),
    authRequirement: "account",
    visibility: "authenticated",
    badge: "Finance",
    icon: "receipt",
    priority: 94,
    source: "shared_catalog",
    tags: ["payments", "cards", "billing", "finance", "transactions"],
  }),
  defineResult({
    id: "account-invoices",
    division: "account",
    type: "account_workflow",
    title: "Invoices and receipts",
    subtitle: "Billing documents",
    description: "Open invoices, receipts, and billing history.",
    href: getAccountUrl("/invoices"),
    authRequirement: "account",
    visibility: "authenticated",
    badge: "Finance",
    icon: "file-text",
    priority: 98,
    source: "shared_catalog",
    tags: ["invoice", "invoices", "receipts", "billing", "payment proof", "tax"],
  }),
  defineResult({
    id: "account-subscriptions",
    division: "account",
    type: "account_workflow",
    title: "Subscriptions",
    subtitle: "Plans and recurring services",
    description: "Open subscriptions and recurring service plans.",
    href: getAccountUrl("/subscriptions"),
    authRequirement: "account",
    visibility: "authenticated",
    badge: "Finance",
    icon: "receipt",
    priority: 98,
    source: "shared_catalog",
    tags: ["subscriptions", "plans", "billing", "renewal", "membership"],
  }),
  defineResult({
    id: "account-security",
    division: "account",
    type: "account_workflow",
    title: "Security",
    subtitle: "Access and trust controls",
    description: "Review account security settings and trust state.",
    href: getAccountUrl("/security"),
    authRequirement: "account",
    visibility: "authenticated",
    badge: "Security",
    icon: "shield",
    priority: 93,
    source: "shared_catalog",
    tags: ["security", "password", "trust", "verification", "login", "mfa"],
  }),
  defineResult({
    id: "account-preferences",
    division: "account",
    type: "account_workflow",
    title: "Preferences",
    subtitle: "Settings and profile preferences",
    description: "Open account settings, preferences, and personalization.",
    href: getAccountUrl("/settings"),
    authRequirement: "account",
    visibility: "authenticated",
    badge: "Settings",
    icon: "settings",
    priority: 92,
    source: "shared_catalog",
    tags: ["settings", "preferences", "language", "profile", "account settings"],
  }),
  defineResult({
    id: "marketplace-orders",
    division: "marketplace",
    type: "marketplace_order",
    title: "Marketplace orders",
    subtitle: "Buyer order history",
    description: "Open marketplace orders and order details.",
    href: divisionHref("marketplace", "/account/orders"),
    authRequirement: "account",
    visibility: "authenticated",
    badge: "Orders",
    icon: "package",
    priority: 96,
    source: "shared_catalog",
    tags: ["marketplace", "orders", "order history", "purchases", "track order"],
  }),
  defineResult({
    id: "marketplace-wishlist",
    division: "marketplace",
    type: "marketplace_product",
    title: "Marketplace saved items",
    subtitle: "Wishlist",
    description: "Open saved marketplace products and wishlist items.",
    href: divisionHref("marketplace", "/account/wishlist"),
    authRequirement: "account",
    visibility: "authenticated",
    badge: "Saved",
    icon: "shopping-bag",
    priority: 84,
    source: "shared_catalog",
    tags: ["marketplace", "wishlist", "saved items", "favorites"],
  }),
  defineResult({
    id: "jobs-applications",
    division: "jobs",
    type: "job_application",
    title: "Jobs applications",
    subtitle: "Candidate applications",
    description: "Open your submitted job applications.",
    href: divisionHref("jobs", "/candidate/applications"),
    authRequirement: "account",
    visibility: "authenticated",
    badge: "Applications",
    icon: "briefcase",
    priority: 94,
    source: "shared_catalog",
    tags: ["jobs", "applications", "candidate", "roles", "applied jobs"],
  }),
  defineResult({
    id: "jobs-interviews",
    division: "jobs",
    type: "job_application",
    title: "Jobs interviews",
    subtitle: "Upcoming and completed interviews",
    description: "Open interview schedules, sessions, and outcomes for your applications.",
    href: getAccountUrl("/jobs/interviews"),
    authRequirement: "account",
    visibility: "authenticated",
    badge: "Interviews",
    icon: "briefcase",
    priority: 95,
    source: "shared_catalog",
    tags: ["jobs", "interviews", "interview schedule", "candidate", "applications"],
  }),
  defineResult({
    id: "jobs-saved",
    division: "jobs",
    type: "job_application",
    title: "Saved jobs",
    subtitle: "Candidate shortlist",
    description: "Open saved jobs and shortlisted roles.",
    href: divisionHref("jobs", "/candidate/saved-jobs"),
    authRequirement: "account",
    visibility: "authenticated",
    badge: "Saved",
    icon: "briefcase",
    priority: 82,
    source: "shared_catalog",
    tags: ["jobs", "saved jobs", "shortlist", "candidate"],
  }),
  defineResult({
    id: "learn-my-courses",
    division: "learn",
    type: "learn_course",
    title: "Learn courses",
    subtitle: "My learner course workspace",
    description: "Open enrolled courses and course progress.",
    href: divisionHref("learn", "/learner/courses"),
    authRequirement: "account",
    visibility: "authenticated",
    badge: "Courses",
    icon: "graduation-cap",
    priority: 94,
    source: "shared_catalog",
    tags: ["learn", "my courses", "enrolled courses", "progress", "academy"],
  }),
  defineResult({
    id: "learn-my-certificates",
    division: "learn",
    type: "learn_certificate",
    title: "Learn certificates",
    subtitle: "My issued certificates",
    description: "Open issued HenryCo Learn certificates.",
    href: divisionHref("learn", "/learner/certificates"),
    authRequirement: "account",
    visibility: "authenticated",
    badge: "Certificates",
    icon: "shield",
    priority: 92,
    source: "shared_catalog",
    tags: ["learn", "certificates", "credentials", "issued certificates"],
  }),
  defineResult({
    id: "property-viewings",
    division: "property",
    type: "property_listing",
    title: "Property viewings",
    subtitle: "Viewing schedule and status",
    description: "Open viewing requests and scheduled viewings.",
    href: divisionHref("property", "/account/viewings"),
    authRequirement: "account",
    visibility: "authenticated",
    badge: "Viewings",
    icon: "map-pin",
    priority: 93,
    source: "shared_catalog",
    tags: ["property", "viewings", "schedule", "appointment", "listing"],
  }),
  defineResult({
    id: "property-saved",
    division: "property",
    type: "property_listing",
    title: "Saved property listings",
    subtitle: "Saved homes and listings",
    description: "Open saved property listings.",
    href: divisionHref("property", "/account/saved"),
    authRequirement: "account",
    visibility: "authenticated",
    badge: "Saved",
    icon: "building",
    priority: 82,
    source: "shared_catalog",
    tags: ["property", "saved", "saved listings", "favorites", "homes"],
  }),
  defineResult({
    id: "studio-projects",
    division: "studio",
    type: "studio_project",
    title: "Studio client projects",
    subtitle: "Project workspace",
    description: "Open Studio client projects and active deliveries.",
    href: divisionHref("studio", "/client/projects"),
    authRequirement: "account",
    visibility: "authenticated",
    badge: "Projects",
    icon: "palette",
    priority: 89,
    source: "shared_catalog",
    tags: ["studio", "projects", "client", "deliveries", "project status"],
  }),
];

const accountCatalog: CrossDivisionSearchResult[] = [
  defineResult({
    id: "account-activity",
    division: "account",
    type: "account_workflow",
    title: "Account activity",
    subtitle: "Recent actions and events",
    description: "Review recent account and service activity.",
    href: getAccountUrl("/activity"),
    authRequirement: "account",
    visibility: "authenticated",
    badge: "Account",
    icon: "layout-dashboard",
    priority: 86,
    source: "account_catalog",
    tags: ["activity", "timeline", "history", "recent actions"],
  }),
  defineResult({
    id: "account-tasks",
    division: "account",
    type: "account_workflow",
    title: "Account tasks",
    subtitle: "Open tasks and next actions",
    description: "Open tasks, reminders, and next actions.",
    href: getAccountUrl("/tasks"),
    authRequirement: "account",
    visibility: "authenticated",
    badge: "Account",
    icon: "layout-dashboard",
    priority: 84,
    source: "account_catalog",
    tags: ["tasks", "to-do", "next steps", "pending items"],
  }),
  defineResult({
    id: "account-addresses",
    division: "account",
    type: "account_workflow",
    title: "Addresses",
    subtitle: "Saved addresses",
    description: "Review and manage saved addresses.",
    href: getAccountUrl("/addresses"),
    authRequirement: "account",
    visibility: "authenticated",
    badge: "Profile",
    icon: "map-pin",
    priority: 76,
    source: "account_catalog",
    tags: ["addresses", "locations", "saved address", "profile"],
  }),
  defineResult({
    id: "account-documents",
    division: "account",
    type: "account_workflow",
    title: "Documents",
    subtitle: "Uploaded documents",
    description: "Open uploaded documents and file history.",
    href: getAccountUrl("/documents"),
    authRequirement: "account",
    visibility: "authenticated",
    badge: "Profile",
    icon: "file-text",
    priority: 78,
    source: "account_catalog",
    tags: ["documents", "files", "uploads", "verification documents"],
  }),
  defineResult({
    id: "account-verification",
    division: "account",
    type: "account_workflow",
    title: "Verification",
    subtitle: "Identity and trust",
    description: "Open verification status and KYC-related actions.",
    href: getAccountUrl("/verification"),
    authRequirement: "account",
    visibility: "authenticated",
    badge: "Trust",
    icon: "shield",
    priority: 88,
    source: "account_catalog",
    tags: ["verification", "kyc", "identity", "trust", "documents"],
  }),
];

export function getPublicSearchCatalog() {
  return [...publicCatalog];
}

export function getAuthenticatedSearchCatalog() {
  return [...authenticatedCatalog];
}

export function getAccountSearchCatalog() {
  return [...publicCatalog, ...authenticatedCatalog, ...accountCatalog];
}

export function getHubSearchCatalog(options?: { signedIn?: boolean }) {
  if (options?.signedIn) {
    return [...publicCatalog, ...authenticatedCatalog];
  }
  return [...publicCatalog];
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s/-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeSearchQuery(value: string) {
  return normalizeSearchText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);
}

function searchableText(result: CrossDivisionSearchResult) {
  return normalizeSearchText(
    [
      result.title,
      result.subtitle,
      result.description,
      result.badge,
      result.division,
      result.type,
      ...result.tags,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function scoreIntent(result: CrossDivisionSearchResult, tokens: string[]) {
  let score = 0;
  const helpIntent = tokens.some((token) =>
    ["help", "support", "issue", "problem", "contact", "ticket"].includes(token)
  );
  const financeIntent = tokens.some((token) =>
    ["wallet", "invoice", "invoices", "payment", "payments", "subscription", "subscriptions", "billing"].includes(token)
  );
  const trackingIntent = tokens.some((token) =>
    ["track", "tracking", "order", "orders", "shipment", "delivery", "status"].includes(token)
  );

  if (helpIntent && result.type.includes("help")) score += 190;
  if (helpIntent && result.division === "account" && result.title.toLowerCase().includes("support")) score += 170;
  if (financeIntent && ["wallet", "receipt", "file-text"].includes(result.icon)) score += 120;
  if (trackingIntent && ["logistics_tracking", "marketplace_order"].includes(result.type)) score += 130;
  if (trackingIntent && result.title.toLowerCase().includes("track")) score += 110;

  return score;
}

function scoreRouteUtility(result: CrossDivisionSearchResult, tokens: string[]) {
  let score = 0;
  const hasQuery = tokens.length > 0;
  if (!hasQuery) return score;

  if (result.type === "workflow" || result.type.includes("help")) score += 90;
  if (result.type.includes("order") || result.type.includes("application")) score += 70;
  if (result.type === "division") score -= 80;
  if (result.type === "page") score -= 35;

  const path = (() => {
    try {
      return new URL(result.url).pathname;
    } catch {
      return "";
    }
  })();

  if (path.includes("/support") || path.includes("/help")) score += 65;
  if (path.includes("/search") || path.includes("/track")) score += 58;
  if (path.includes("/wallet") || path.includes("/invoices") || path.includes("/subscriptions")) score += 60;
  if (path.includes("/jobs/interviews")) score += 75;

  return score;
}

export function scoreSearchResult(result: CrossDivisionSearchResult, query: string) {
  const normalizedQuery = normalizeSearchText(query);
  const tokens = tokenizeSearchQuery(query);

  if (!normalizedQuery) {
    return result.priority;
  }

  const title = normalizeSearchText(result.title);
  const subtitle = normalizeSearchText(result.subtitle || "");
  const description = normalizeSearchText(result.description || "");
  const tags = result.tags.map((tag) => normalizeSearchText(tag));
  const corpus = searchableText(result);

  let score = result.priority;

  if (title === normalizedQuery) score += 1000;
  if (subtitle === normalizedQuery) score += 760;
  if (tags.includes(normalizedQuery)) score += 720;
  if (title.startsWith(normalizedQuery)) score += 520;
  if (title.includes(normalizedQuery)) score += 360;
  if (subtitle.includes(normalizedQuery)) score += 220;
  if (description.includes(normalizedQuery)) score += 130;

  let matchedTokens = 0;

  for (const token of tokens) {
    let tokenScore = 0;
    if (title === token) tokenScore += 220;
    if (title.startsWith(token)) tokenScore += 160;
    if (title.includes(token)) tokenScore += 110;
    if (tags.includes(token)) tokenScore += 95;
    if (tags.some((tag) => tag.includes(token))) tokenScore += 60;
    if (subtitle.includes(token)) tokenScore += 50;
    if (description.includes(token)) tokenScore += 35;

    if (tokenScore > 0) {
      matchedTokens += 1;
      score += tokenScore;
    }
  }

  if (matchedTokens === tokens.length) score += 120;
  if (matchedTokens === 0 && !corpus.includes(normalizedQuery)) return -1;

  score += scoreIntent(result, tokens);
  score += scoreRouteUtility(result, tokens);
  return score;
}

export function searchCrossDivisionResults(
  results: CrossDivisionSearchResult[],
  query: string,
  options?: { limit?: number }
) {
  const deduplicated = new Map<string, { result: CrossDivisionSearchResult; score: number }>();
  for (const entry of results
    .map((result) => ({ result, score: scoreSearchResult(result, query) }))
    .filter((entry) => entry.score >= 0)) {
    const dedupeKey = `${entry.result.url}::${entry.result.authRequirement}`;
    const current = deduplicated.get(dedupeKey);
    if (!current || entry.score > current.score) {
      deduplicated.set(dedupeKey, entry);
    }
  }

  const ranked = [...deduplicated.values()].sort(
    (left, right) => right.score - left.score || right.result.priority - left.result.priority
  );

  if (options?.limit) {
    return ranked.slice(0, options.limit);
  }

  return ranked;
}

export function groupSearchResultsByDivision(results: CrossDivisionSearchResult[]) {
  const grouped = new Map<CrossDivisionSearchDivision, CrossDivisionSearchResult[]>();

  for (const result of results) {
    const current = grouped.get(result.division) || [];
    current.push(result);
    grouped.set(result.division, current);
  }

  return grouped;
}

function fnv1a(input: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function buildSearchQueryHash(query: string) {
  return fnv1a(normalizeSearchText(query));
}

export function buildSearchSignal(input: {
  kind: CrossDivisionSearchSignalKind;
  query: string;
  context: CrossDivisionSearchContext;
  resultCount: number;
  result?: CrossDivisionSearchResult;
}) {
  return {
    kind: input.kind,
    query: input.query,
    queryHash: buildSearchQueryHash(input.query),
    queryLength: input.query.trim().length,
    context: input.context,
    resultCount: input.resultCount,
    resultId: input.result?.id,
    division: input.result?.division,
    authRequired: input.result?.authRequirement,
  } satisfies CrossDivisionSearchSignal;
}
