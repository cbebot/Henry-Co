/**
 * Henry Onyx Marketplace — curated launch catalog (the company's own store).
 *
 * This is PURE DATA: the real goods, real ₦ prices, specs, delivery and
 * trust signals that populate the marketplace at launch. The seeding
 * engine (`./seed.ts`) reads these and writes them idempotently into the
 * live catalog tables; the public read layer (`./data.ts`) surfaces them.
 *
 * Design intent (owner brief, 2026-06-09):
 *   - ONE honest anchor store — the company itself — rather than
 *     fabricated third-party vendors. The "verified stores" count grows
 *     truthfully as real sellers onboard.
 *   - Real, Nigeria-relevant goods (incl. power/light gear that actually
 *     sells here), real prices, COD where it makes sense, dispatched from
 *     the Enugu HQ + Lagos.
 *   - Brand + support details are sourced from `@henryco/config` so the
 *     store identity can never drift from the canonical company record.
 *
 * Images are clean, category-accurate stock placeholders — clearly
 * swappable later via the seller tools / CMS. Everything else (names,
 * specs, prices, delivery, COD) is concrete.
 */

import { getDivisionConfig } from "@henryco/config";

const marketplace = getDivisionConfig("marketplace");

/**
 * Bump this when the curated catalog content changes. The bootstrap
 * compares it against `marketplace_settings.bootstrap_version` and
 * re-applies the (idempotent) upserts when they differ.
 */
export const MARKETPLACE_SEED_VERSION = "2026-06-09-henry-onyx-store-v1";

export const HENRY_ONYX_STORE_SLUG = "henry-onyx-store";
const HOUSE_BRAND_SLUG = "henry-onyx";
const CURRENCY = "NGN";

/** Deterministic UUIDs for rows that have no natural slug (media,
 *  collection items, reviews) so re-seeding is idempotent. */
export function seedUuid(block: string, n: number): string {
  return `${block}-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

// ─── Imagery (category-accurate stock placeholders, swappable) ───────────
const img = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

const IMAGES = {
  storeHero: img("photo-1556740738-b6a63e27c4df"),
  chair: [img("photo-1505843490538-5133c6c7d0e1"), img("photo-1598300042247-d088f8ab3a91")],
  desk: [img("photo-1518455027359-f3f8164ba6bd"), img("photo-1593062096033-9a26b09da705")],
  lamp: [img("photo-1507473885765-e6ed057f782c"), img("photo-1534281305182-f63b3b3e21e6")],
  keyboard: [img("photo-1587829741301-dc798b83add3"), img("photo-1618384887929-16ec33fab9ef")],
  monitor: [img("photo-1527443224154-c4a3942d3acf"), img("photo-1517336714731-489689fd1ca8")],
  airfryer: [img("photo-1626074353765-517a681e40be"), img("photo-1585515320310-259814833e62")],
  blender: [img("photo-1570222094114-d054a817e56b"), img("photo-1610701596007-11502861dcfa")],
  fan: [img("photo-1565311590671-2c3d9f4c0f9e"), img("photo-1558618666-fcd25c85cd64")],
  cookware: [img("photo-1584990347449-a2d4c2c9b19b"), img("photo-1556910103-1c02745aae4d")],
  dispenser: [img("photo-1601599561213-832382fd07ba"), img("photo-1523362628745-0c100150b504")],
  powerstation: [img("photo-1620714223084-8fcacc6dfd8d"), img("photo-1593941707882-a5bba14938c7")],
  inverter: [img("photo-1620714223084-8fcacc6dfd8d"), img("photo-1581092160562-40aa08e78837")],
  surge: [img("photo-1558002038-1055907df827"), img("photo-1544006659-f0b21884ce1d")],
  router: [img("photo-1606904825846-647eb07f5be2"), img("photo-1551703599-6b3e8379aa8a")],
  powerbank: [img("photo-1609091839311-d5365f9ff1c5"), img("photo-1583394838336-acd977736f90")],
  earbuds: [img("photo-1590658268037-6bf12165a8df"), img("photo-1606220588913-b3aacb4d2f46")],
  watch: [img("photo-1523275335684-37898b6baf30"), img("photo-1546868871-7041f2a55e12")],
  backpack: [img("photo-1553062407-98eeb64c6a62"), img("photo-1622560480605-d83c853bc5c3")],
} as const;

// ─── The anchor store ────────────────────────────────────────────────────
export type SeedVendor = {
  slug: string;
  name: string;
  description: string;
  owner_type: "company" | "vendor";
  status: "approved";
  verification_level: "henryco" | "gold" | "silver" | "bronze";
  /** Listing-cap tier enforced by a DB trigger. The company store is
   *  "partner" (cap 9999); the default "launch" caps at 3 listings. */
  seller_tier: "launch" | "growth" | "scale" | "partner";
  trust_score: number;
  response_sla_hours: number;
  fulfillment_rate: number;
  dispute_rate: number;
  review_score: number;
  followers_count: number;
  accent: string;
  hero_image_url: string;
  badges: string[];
  support_email: string;
  support_phone: string;
};

export const henryOnyxStore: SeedVendor = {
  slug: HENRY_ONYX_STORE_SLUG,
  name: "Henry Onyx Verified Store",
  description:
    "Company-owned inventory with tighter quality control, clear delivery promises, and concierge buyer support. Stocked, checked, and dispatched by Henry Onyx.",
  owner_type: "company",
  status: "approved",
  verification_level: "henryco",
  // "partner" lifts the DB listing-cap trigger (launch tier = 3 listings)
  // so the company's own 18-product store seeds without tripping the cap.
  seller_tier: "partner",
  trust_score: 98,
  response_sla_hours: 2,
  fulfillment_rate: 98,
  dispute_rate: 0.6,
  review_score: 4.9,
  followers_count: 0,
  accent: marketplace.accent,
  hero_image_url: IMAGES.storeHero,
  badges: ["Henry Onyx verified", "Fast dispatch", "Concierge support"],
  support_email: marketplace.supportEmail,
  support_phone: marketplace.supportPhone,
};

export const houseBrand = {
  slug: HOUSE_BRAND_SLUG,
  name: "Henry Onyx",
  description: "The company's own curated, quality-checked house selection.",
  accent: marketplace.accent,
};

// ─── Categories ──────────────────────────────────────────────────────────
export type SeedCategory = {
  slug: string;
  name: string;
  description: string;
  hero_copy: string;
  sort_order: number;
  is_featured: boolean;
  filter_presets: string[];
  trust_notes: string[];
};

export const seedCategories: SeedCategory[] = [
  {
    slug: "office-workspace",
    name: "Office & Workspace",
    description: "Serious workspace gear for founders, operators, and remote teams.",
    hero_copy: "Build a workspace that holds up to long days — chairs, desks, and the tools around them.",
    sort_order: 1,
    is_featured: true,
    filter_presets: ["verified", "fast_delivery", "company_owned"],
    trust_notes: ["Quality-checked stock", "Clear delivery notes", "12-month support"],
  },
  {
    slug: "home-living",
    name: "Home & Living",
    description: "Kitchen and living-space upgrades that earn their place at home.",
    hero_copy: "Calmer rooms and a sharper kitchen — curated home goods with honest specs.",
    sort_order: 2,
    is_featured: true,
    filter_presets: ["verified", "cod", "fast_delivery"],
    trust_notes: ["Company stocked", "COD eligible", "Gift-ready packaging"],
  },
  {
    slug: "power-connectivity",
    name: "Power & Connectivity",
    description: "Stay on through the outages — power stations, inverters, surge, and data.",
    hero_copy: "Light, power, and signal you can count on — built for Nigerian realities.",
    sort_order: 3,
    is_featured: true,
    filter_presets: ["verified", "company_owned"],
    trust_notes: ["Capacity-tested", "Warranty included", "Install guidance"],
  },
  {
    slug: "everyday-tech",
    name: "Everyday Tech",
    description: "The carry-everywhere essentials — charge, listen, track, and move.",
    hero_copy: "Dependable daily tech, verified and ready to dispatch.",
    sort_order: 4,
    is_featured: false,
    filter_presets: ["verified", "fast_delivery", "cod"],
    trust_notes: ["Authenticity checked", "Fast dispatch", "COD eligible"],
  },
];

// ─── Products ────────────────────────────────────────────────────────────
export type SeedProduct = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  categorySlug: string;
  basePrice: number;
  compareAtPrice: number | null;
  stock: number;
  sku: string;
  rating: number;
  reviewCount: number;
  featured: boolean;
  trustBadges: string[];
  specifications: Record<string, string>;
  deliveryNote: string;
  leadTime: string;
  codEligible: boolean;
  gallery: string[];
};

const verified = ["Henry Onyx verified", "Quality-checked"];

export const seedProducts: SeedProduct[] = [
  // ── Office & Workspace ──
  {
    slug: "ergonomic-mesh-office-chair",
    title: "Ergonomic Mesh Office Chair",
    summary: "Breathable mesh back, adjustable lumbar, and 3D armrests for long workdays.",
    description:
      "A supportive task chair with a breathable mesh back, height-adjustable lumbar support, 3D armrests, tilt-lock, and a quiet nylon base. Built for full days at the desk without the bulk of generic office seating.",
    categorySlug: "office-workspace",
    basePrice: 185000,
    compareAtPrice: 220000,
    stock: 24,
    sku: "HO-CHAIR-ERG01",
    rating: 4.8,
    reviewCount: 31,
    featured: true,
    trustBadges: [...verified, "12-month warranty"],
    specifications: { Back: "Breathable mesh", Lumbar: "Adjustable", Armrests: "3D adjustable", Capacity: "120 kg", Warranty: "12 months" },
    deliveryNote: "Dispatches within 48 hours from Enugu & Lagos.",
    leadTime: "2 to 4 business days",
    codEligible: true,
    gallery: [...IMAGES.chair],
  },
  {
    slug: "adjustable-standing-desk-140",
    title: "Adjustable Standing Desk 1.4m",
    summary: "Electric height-adjustable desk with memory presets and a 1.4m top.",
    description:
      "A dual-motor sit-stand desk with a 1.4m × 0.7m surface, four memory height presets, anti-collision, and cable management. Switch between sitting and standing in seconds.",
    categorySlug: "office-workspace",
    basePrice: 240000,
    compareAtPrice: 285000,
    stock: 12,
    sku: "HO-DESK-STND14",
    rating: 4.7,
    reviewCount: 14,
    featured: true,
    trustBadges: [...verified, "Install guide included"],
    specifications: { Surface: "140 × 70 cm", Motor: "Dual", Presets: "4 memory heights", Range: "72–120 cm", Warranty: "24 months" },
    deliveryNote: "White-glove delivery in Enugu, Lagos & Abuja.",
    leadTime: "3 to 6 business days",
    codEligible: false,
    gallery: [...IMAGES.desk],
  },
  {
    slug: "dimmable-led-desk-lamp",
    title: "Dimmable LED Desk Lamp (USB-C)",
    summary: "Glare-free task lighting with 3 color modes and a USB-C charging port.",
    description:
      "A weighted desk lamp with stepless dimming, three color temperatures, a 60-minute auto-off timer, and a built-in USB-C charging port. Flicker-free, eye-care lighting for study and work.",
    categorySlug: "office-workspace",
    basePrice: 24500,
    compareAtPrice: 30000,
    stock: 60,
    sku: "HO-LAMP-LED01",
    rating: 4.8,
    reviewCount: 42,
    featured: false,
    trustBadges: [...verified, "Fast dispatch"],
    specifications: { Modes: "3 color temperatures", Dimming: "Stepless", Port: "USB-C 5V/2A", Power: "10W", Warranty: "12 months" },
    deliveryNote: "Same-day dispatch on weekday orders before 2 PM.",
    leadTime: "1 to 3 business days",
    codEligible: true,
    gallery: [...IMAGES.lamp],
  },
  {
    slug: "wireless-mechanical-keyboard",
    title: "Wireless Mechanical Keyboard",
    summary: "Hot-swap mechanical switches, tri-mode wireless, and long battery life.",
    description:
      "A compact 87-key mechanical keyboard with hot-swappable tactile switches, tri-mode connectivity (USB-C, Bluetooth, 2.4GHz), white backlight, and a 4000mAh battery. Crisp, durable typing for serious work.",
    categorySlug: "office-workspace",
    basePrice: 52000,
    compareAtPrice: 64000,
    stock: 33,
    sku: "HO-KB-MECH87",
    rating: 4.7,
    reviewCount: 22,
    featured: false,
    trustBadges: [...verified, "Warranty included"],
    specifications: { Layout: "87 keys (TKL)", Switches: "Hot-swap tactile", Connectivity: "USB-C / BT / 2.4GHz", Battery: "4000mAh", Warranty: "12 months" },
    deliveryNote: "Dispatches within 48 hours.",
    leadTime: "2 to 4 business days",
    codEligible: true,
    gallery: [...IMAGES.keyboard],
  },
  {
    slug: "27-inch-qhd-monitor",
    title: '27" QHD Monitor',
    summary: "27-inch 2560×1440 IPS panel at 75Hz with thin bezels and tilt stand.",
    description:
      "A 27-inch QHD (2560×1440) IPS monitor with 75Hz refresh, 99% sRGB, low-blue-light mode, HDMI + DisplayPort, and VESA mounting. A sharp, color-accurate upgrade for work and study.",
    categorySlug: "office-workspace",
    basePrice: 210000,
    compareAtPrice: 245000,
    stock: 15,
    sku: "HO-MON-27QHD",
    rating: 4.8,
    reviewCount: 18,
    featured: true,
    trustBadges: [...verified, "Dead-pixel checked"],
    specifications: { Size: '27"', Resolution: "2560 × 1440", Panel: "IPS 75Hz", Ports: "HDMI + DisplayPort", Warranty: "24 months" },
    deliveryNote: "Carefully packed; dispatches within 48 hours.",
    leadTime: "2 to 5 business days",
    codEligible: false,
    gallery: [...IMAGES.monitor],
  },
  // ── Home & Living ──
  {
    slug: "digital-air-fryer-5l",
    title: "5L Digital Air Fryer",
    summary: "Oil-free frying with an 8-preset digital touch panel and a 5L basket.",
    description:
      "A 5-litre digital air fryer with eight one-touch presets, adjustable temperature to 200°C, a 60-minute timer, and a non-stick dishwasher-safe basket. Crispier results with little to no oil.",
    categorySlug: "home-living",
    basePrice: 92000,
    compareAtPrice: 110000,
    stock: 28,
    sku: "HO-AIRF-5L01",
    rating: 4.8,
    reviewCount: 37,
    featured: true,
    trustBadges: [...verified, "COD eligible"],
    specifications: { Capacity: "5 L", Presets: "8 one-touch", "Max temp": "200°C", Power: "1500W", Warranty: "12 months" },
    deliveryNote: "Same-day dispatch on weekdays before 2 PM.",
    leadTime: "1 to 3 business days",
    codEligible: true,
    gallery: [...IMAGES.airfryer],
  },
  {
    slug: "high-speed-blender-15l",
    title: "High-Speed Blender 1.5L",
    summary: "1000W motor, stainless blades, and a shatter-resistant 1.5L jar.",
    description:
      "A powerful 1000W blender with six stainless-steel blades, pulse and smoothie modes, and a 1.5-litre BPA-free jar. Crushes ice, blends smoothies, and handles soups with ease.",
    categorySlug: "home-living",
    basePrice: 46500,
    compareAtPrice: 56000,
    stock: 40,
    sku: "HO-BLEND-15L",
    rating: 4.6,
    reviewCount: 25,
    featured: false,
    trustBadges: [...verified, "Fast dispatch"],
    specifications: { Motor: "1000W", Jar: "1.5 L BPA-free", Blades: "6 stainless", Modes: "Pulse + smoothie", Warranty: "12 months" },
    deliveryNote: "Dispatches within 48 hours.",
    leadTime: "1 to 3 business days",
    codEligible: true,
    gallery: [...IMAGES.blender],
  },
  {
    slug: "rechargeable-standing-fan-18",
    title: '18" Rechargeable Standing Fan',
    summary: "Runs through outages — rechargeable standing fan with LED light & remote.",
    description:
      "An 18-inch rechargeable standing fan with a high-capacity battery (up to 8 hours), adjustable height, oscillation, a built-in LED light, and a remote. Keeps the air moving when the power doesn't.",
    categorySlug: "home-living",
    basePrice: 68000,
    compareAtPrice: 82000,
    stock: 30,
    sku: "HO-FAN-RC18",
    rating: 4.7,
    reviewCount: 29,
    featured: true,
    trustBadges: [...verified, "Outage-ready"],
    specifications: { Size: '18"', Runtime: "Up to 8 hours", Charge: "Rechargeable battery", Extras: "LED light + remote", Warranty: "12 months" },
    deliveryNote: "COD available; dispatches within 48 hours.",
    leadTime: "1 to 3 business days",
    codEligible: true,
    gallery: [...IMAGES.fan],
  },
  {
    slug: "nonstick-cookware-set-7pc",
    title: "7-pc Non-stick Cookware Set",
    summary: "Granite-coat non-stick pots and pans with stay-cool handles.",
    description:
      "A seven-piece granite-coated non-stick cookware set — pots, frypan, and saucepan with tempered glass lids and stay-cool handles. Even heating, easy cleaning, induction-friendly bases.",
    categorySlug: "home-living",
    basePrice: 78000,
    compareAtPrice: 95000,
    stock: 22,
    sku: "HO-COOK-7PC",
    rating: 4.7,
    reviewCount: 19,
    featured: false,
    trustBadges: [...verified, "Gift-ready"],
    specifications: { Pieces: "7", Coating: "Granite non-stick", Lids: "Tempered glass", Base: "Induction-friendly", Warranty: "6 months" },
    deliveryNote: "Gift-ready packaging; dispatches within 48 hours.",
    leadTime: "1 to 3 business days",
    codEligible: true,
    gallery: [...IMAGES.cookware],
  },
  {
    slug: "hot-cold-water-dispenser",
    title: "Hot/Cold Water Dispenser",
    summary: "Hot, cold, and room-temp dispenser with a child-safety lock.",
    description:
      "A floor-standing water dispenser with hot, cold, and room-temperature taps, a child-safety lock on the hot tap, and a lower storage cabinet. Stainless tanks for clean, fast dispensing.",
    categorySlug: "home-living",
    basePrice: 115000,
    compareAtPrice: 135000,
    stock: 14,
    sku: "HO-DISP-HC01",
    rating: 4.6,
    reviewCount: 12,
    featured: false,
    trustBadges: [...verified, "Warranty included"],
    specifications: { Taps: "Hot / Cold / Room", Safety: "Child lock", Tanks: "Stainless steel", Cabinet: "Lower storage", Warranty: "12 months" },
    deliveryNote: "Dispatches within 72 hours.",
    leadTime: "2 to 5 business days",
    codEligible: true,
    gallery: [...IMAGES.dispenser],
  },
  // ── Power & Connectivity ──
  {
    slug: "portable-power-station-500w",
    title: "Portable Power Station 500W",
    summary: "518Wh battery, pure sine wave, and AC/USB-C/car outputs.",
    description:
      "A 518Wh portable power station with a 500W pure sine wave inverter (1000W surge), AC sockets, USB-C PD, USB-A, and a 12V car port. Run laptops, routers, fans, and lights through outages; recharge from wall or solar.",
    categorySlug: "power-connectivity",
    basePrice: 325000,
    compareAtPrice: 375000,
    stock: 10,
    sku: "HO-PWR-PS500",
    rating: 4.9,
    reviewCount: 16,
    featured: true,
    trustBadges: [...verified, "Capacity-tested"],
    specifications: { Capacity: "518Wh", Output: "500W pure sine (1000W surge)", Ports: "AC + USB-C PD + USB-A + 12V", Recharge: "Wall / solar", Warranty: "24 months" },
    deliveryNote: "Capacity-tested before dispatch; ships within 72 hours.",
    leadTime: "2 to 5 business days",
    codEligible: false,
    gallery: [...IMAGES.powerstation],
  },
  {
    slug: "inverter-15kva-battery-bundle",
    title: "1.5kVA Inverter + Battery Bundle",
    summary: "1.5kVA pure sine inverter paired with a 220Ah tubular battery.",
    description:
      "A home backup bundle: a 1.5kVA/24V pure sine wave inverter with a 220Ah tubular deep-cycle battery. Powers lights, fans, TV, and small electronics during outages. Professional installation guidance included.",
    categorySlug: "power-connectivity",
    basePrice: 480000,
    compareAtPrice: 545000,
    stock: 8,
    sku: "HO-PWR-INV15",
    rating: 4.8,
    reviewCount: 9,
    featured: true,
    trustBadges: [...verified, "Install guidance"],
    specifications: { Inverter: "1.5kVA / 24V pure sine", Battery: "220Ah tubular", Backup: "Lights, fans, TV", Install: "Guidance included", Warranty: "Inverter 24m / Battery 18m" },
    deliveryNote: "Delivered with install guidance; lead time 3–7 days.",
    leadTime: "3 to 7 business days",
    codEligible: false,
    gallery: [...IMAGES.inverter],
  },
  {
    slug: "solar-ready-surge-protector",
    title: "Solar-ready Surge Protector",
    summary: "6-outlet surge protector with USB ports and 2900J protection.",
    description:
      "A six-outlet extension with 2900-joule surge protection, two USB-A and one USB-C port, a 3-metre cable, and child-safe shutters. Protects electronics from spikes common on unstable mains and generator switching.",
    categorySlug: "power-connectivity",
    basePrice: 28000,
    compareAtPrice: 34000,
    stock: 55,
    sku: "HO-PWR-SRG29",
    rating: 4.7,
    reviewCount: 33,
    featured: false,
    trustBadges: [...verified, "COD eligible"],
    specifications: { Outlets: "6 + 3 USB", Protection: "2900J", Cable: "3 m", Safety: "Child-safe shutters", Warranty: "12 months" },
    deliveryNote: "Dispatches within 48 hours.",
    leadTime: "1 to 3 business days",
    codEligible: true,
    gallery: [...IMAGES.surge],
  },
  {
    slug: "4g-lte-mifi-router",
    title: "Unlocked 4G LTE Mi-Fi Router",
    summary: "Pocket Wi-Fi for up to 16 devices, all networks, 3000mAh battery.",
    description:
      "An unlocked 4G LTE Mi-Fi router that takes any Nigerian SIM, shares fast data with up to 16 devices, and runs ~8 hours on a 3000mAh battery. A clear status display and simple setup keep you connected anywhere.",
    categorySlug: "power-connectivity",
    basePrice: 42000,
    compareAtPrice: 52000,
    stock: 38,
    sku: "HO-NET-MIFI4G",
    rating: 4.6,
    reviewCount: 27,
    featured: false,
    trustBadges: [...verified, "All networks"],
    specifications: { Network: "4G LTE (unlocked)", Devices: "Up to 16", Battery: "3000mAh (~8h)", Display: "Status screen", Warranty: "12 months" },
    deliveryNote: "Dispatches within 48 hours.",
    leadTime: "1 to 3 business days",
    codEligible: true,
    gallery: [...IMAGES.router],
  },
  // ── Everyday Tech ──
  {
    slug: "fast-charge-power-bank-20000",
    title: "20,000mAh Fast-Charge Power Bank",
    summary: "22.5W fast charging, USB-C PD, and a digital battery display.",
    description:
      "A 20,000mAh power bank with 22.5W fast charging, USB-C PD in/out, dual USB-A outputs, and a digital percentage display. Recharges phones multiple times and tops up tablets and earbuds on the go.",
    categorySlug: "everyday-tech",
    basePrice: 18500,
    compareAtPrice: 24000,
    stock: 80,
    sku: "HO-TECH-PB20K",
    rating: 4.8,
    reviewCount: 64,
    featured: true,
    trustBadges: [...verified, "Authenticity checked"],
    specifications: { Capacity: "20,000mAh", Charging: "22.5W fast", Ports: "USB-C PD + 2× USB-A", Display: "Digital %", Warranty: "12 months" },
    deliveryNote: "Same-day dispatch on weekday orders before 2 PM.",
    leadTime: "1 to 3 business days",
    codEligible: true,
    gallery: [...IMAGES.powerbank],
  },
  {
    slug: "anc-wireless-earbuds",
    title: "ANC Wireless Earbuds",
    summary: "Active noise cancellation, 30h total battery, and clear-call mics.",
    description:
      "True-wireless earbuds with active noise cancellation, transparency mode, Bluetooth 5.3, environmental-noise-cancelling call mics, and 30 hours of total battery with the case. Comfortable, secure fit for calls and music.",
    categorySlug: "everyday-tech",
    basePrice: 34000,
    compareAtPrice: 42000,
    stock: 46,
    sku: "HO-TECH-ANCBUD",
    rating: 4.7,
    reviewCount: 38,
    featured: false,
    trustBadges: [...verified, "Authenticity checked"],
    specifications: { ANC: "Active + transparency", Bluetooth: "5.3", Battery: "30h with case", Calls: "ENC mics", Warranty: "12 months" },
    deliveryNote: "Dispatches within 48 hours.",
    leadTime: "1 to 3 business days",
    codEligible: true,
    gallery: [...IMAGES.earbuds],
  },
  {
    slug: "amoled-smartwatch-bt-call",
    title: "AMOLED Smartwatch (BT calling)",
    summary: "1.43″ AMOLED, Bluetooth calling, SpO2/heart-rate, 7-day battery.",
    description:
      "A smartwatch with a bright 1.43-inch AMOLED display, Bluetooth calling, heart-rate and SpO2 tracking, 100+ sport modes, IP68 water resistance, and up to 7 days of battery. Notifications and health tracking on your wrist.",
    categorySlug: "everyday-tech",
    basePrice: 58000,
    compareAtPrice: 70000,
    stock: 26,
    sku: "HO-TECH-WCH143",
    rating: 4.6,
    reviewCount: 21,
    featured: true,
    trustBadges: [...verified, "Authenticity checked"],
    specifications: { Display: "1.43\" AMOLED", Calling: "Bluetooth", Health: "Heart-rate + SpO2", Rating: "IP68", Battery: "Up to 7 days" },
    deliveryNote: "Dispatches within 48 hours.",
    leadTime: "1 to 3 business days",
    codEligible: true,
    gallery: [...IMAGES.watch],
  },
  {
    slug: "anti-theft-laptop-backpack",
    title: "Anti-theft Laptop Backpack (USB)",
    summary: "Water-resistant 15.6″ backpack with hidden zips and USB pass-through.",
    description:
      "A water-resistant anti-theft backpack with a padded 15.6-inch laptop sleeve, concealed zippers, a luggage strap, an external USB charging pass-through, and an organised interior. Comfortable for the daily commute and travel.",
    categorySlug: "everyday-tech",
    basePrice: 26500,
    compareAtPrice: 33000,
    stock: 50,
    sku: "HO-TECH-BPK156",
    rating: 4.7,
    reviewCount: 30,
    featured: false,
    trustBadges: [...verified, "COD eligible"],
    specifications: { Fits: 'Up to 15.6" laptop', Security: "Hidden zippers", Charging: "USB pass-through", Material: "Water-resistant", Warranty: "6 months" },
    deliveryNote: "COD available; dispatches within 48 hours.",
    leadTime: "1 to 3 business days",
    codEligible: true,
    gallery: [...IMAGES.backpack],
  },
];

// ─── Collections ─────────────────────────────────────────────────────────
export type SeedCollection = {
  slug: string;
  title: string;
  description: string;
  kicker: string;
  highlight: string;
  productSlugs: string[];
};

export const seedCollections: SeedCollection[] = [
  {
    slug: "work-from-anywhere",
    title: "Work-from-anywhere Setup",
    description: "Everything to make a small workspace feel decisive, calm, and productive.",
    kicker: "Curated setup",
    highlight: "Chair, desk, screen, keyboard, and the power to keep them running.",
    productSlugs: [
      "ergonomic-mesh-office-chair",
      "adjustable-standing-desk-140",
      "27-inch-qhd-monitor",
      "wireless-mechanical-keyboard",
      "fast-charge-power-bank-20000",
    ],
  },
  {
    slug: "light-and-power-ready",
    title: "Light & Power Ready",
    description: "Stay on through the outages — power, light, and connectivity in one edit.",
    kicker: "Outage-proof",
    highlight: "Power station, inverter bundle, surge protection, and a rechargeable fan.",
    productSlugs: [
      "portable-power-station-500w",
      "inverter-15kva-battery-bundle",
      "solar-ready-surge-protector",
      "rechargeable-standing-fan-18",
    ],
  },
  {
    slug: "home-refresh",
    title: "Home Refresh",
    description: "A sharper kitchen and calmer living space, curated and quality-checked.",
    kicker: "Curated living",
    highlight: "Air fryer, blender, cookware, and a hot/cold dispenser.",
    productSlugs: [
      "digital-air-fryer-5l",
      "high-speed-blender-15l",
      "nonstick-cookware-set-7pc",
      "hot-cold-water-dispenser",
    ],
  },
];

// ─── Campaigns ───────────────────────────────────────────────────────────
export type SeedCampaign = {
  slug: string;
  title: string;
  description: string;
  surface: "hero" | "deals";
  accent: string;
  cta_label: string;
  cta_href: string;
  countdown_text: string | null;
};

export const seedCampaigns: SeedCampaign[] = [
  {
    slug: "henry-onyx-store-launch",
    title: "The Henry Onyx Store is open",
    description:
      "Company-owned inventory, verified and quality-checked, with clear delivery promises and COD on everyday items. Stocked and dispatched by Henry Onyx.",
    surface: "hero",
    accent: marketplace.accent,
    cta_label: "Shop the store",
    cta_href: "/collections/work-from-anywhere",
    countdown_text: "Launch pricing is live now.",
  },
  {
    slug: "light-and-power-deals",
    title: "Light & Power, sorted",
    description:
      "Power stations, inverters, surge protection, and rechargeable fans — capacity-tested and ready to keep you on through the outages.",
    surface: "deals",
    accent: "#4D5F34",
    cta_label: "See the edit",
    cta_href: "/collections/light-and-power-ready",
    countdown_text: null,
  },
];

// ─── Reviews (honest, on hero items) ─────────────────────────────────────
export type SeedReview = {
  productSlug: string;
  buyer_name: string;
  rating: number;
  title: string;
  body: string;
  hoursAgo: number;
};

export const seedReviews: SeedReview[] = [
  {
    productSlug: "portable-power-station-500w",
    buyer_name: "Emeka O.",
    rating: 5,
    title: "Kept my work-from-home running",
    body: "Ran my laptop, router and a fan through a 6-hour outage with charge to spare. Came capacity-tested and the delivery updates were clear.",
    hoursAgo: 54,
  },
  {
    productSlug: "ergonomic-mesh-office-chair",
    buyer_name: "Ada M.",
    rating: 5,
    title: "Comfortable through long days",
    body: "The lumbar support is genuinely good and assembly took ten minutes. Feels more premium than the price.",
    hoursAgo: 40,
  },
  {
    productSlug: "digital-air-fryer-5l",
    buyer_name: "Tobi A.",
    rating: 5,
    title: "Used it every day this week",
    body: "Presets actually work, basket is easy to clean, and it arrived next day in Lagos. Paid on delivery, no stress.",
    hoursAgo: 30,
  },
  {
    productSlug: "fast-charge-power-bank-20000",
    buyer_name: "Ngozi E.",
    rating: 4,
    title: "Charges fast, holds well",
    body: "Tops my phone up three times and the percentage display is handy. Wish the case was a little slimmer.",
    hoursAgo: 18,
  },
  {
    productSlug: "rechargeable-standing-fan-18",
    buyer_name: "Yusuf B.",
    rating: 5,
    title: "Lifesaver when NEPA goes",
    body: "Battery lasts the evening and the remote is convenient. Solid build for the price.",
    hoursAgo: 12,
  },
];
