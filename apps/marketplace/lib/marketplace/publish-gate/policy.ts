// V3-MKT-TRUST-01 — the listing policy. PURE: no I/O, no clock, no randomness.
//
// This is not a second engine. It composes the ones that exist:
//   * content      — @henryco/moderation, ruleset "listing_v2" (which uses
//                    @henryco/trust for contact detection);
//   * economics    — ../governance (quality score, high-risk categories);
//   * store facts  — the seller state the database reports (probation, plan cap,
//                    open hides);
//   * risk         — a STAFF-applied V3-40 hold/freeze, read by the caller.
// and turns their findings into one outcome and a list of reason codes.
//
// The optional AI result is consulted only when everything deterministic says
// "publish", and can only add hold-class codes (see applyAiSignal).

import { runDeterministic, type AiScanResult } from "@henryco/moderation";
import { foldForScreening } from "@henryco/trust/contact";
import { categoryIsHighRisk, evaluateListingSubmission } from "../governance";
import type { MarketplaceVendor } from "../types";
import {
  composeOutcome,
  isGateReasonCode,
  isPolicyViolation,
  normalizeReasons,
  reasonClass,
  type GateOutcome,
  type GateReasonCode,
  type HoldReason,
} from "./reasons";
import type { SellerGateState } from "./seller-state";

export interface ListingGateInput {
  listing: {
    /** The listing's public URL segment. Seller text like any other, so it is screened. */
    slug?: string;
    title: string;
    summary: string;
    description: string;
    sku: string;
    categorySlug: string;
    basePrice: number;
    compareAtPrice: number | null;
    deliveryNote: string;
    leadTime: string;
    /** Free-text specification values (material, warranty, …). */
    specificationValues: ReadonlyArray<string>;
  };
  images: {
    /** Canonical refs the listing will carry, cover first. */
    refs: ReadonlyArray<string>;
    /** Posted values that are not first-party uploads. */
    notFirstParty: ReadonlyArray<string>;
    /** First-party objects uploaded by someone outside this store. */
    foreignRefs: ReadonlyArray<string>;
    /**
     * Fingerprint matches reported by the database:
     *   foreign_ref  — the object was uploaded by another store (a copied reference);
     *   other_seller — another store registered the same picture first;
     *   same_seller  — already on another listing of this store.
     */
    matches: ReadonlyArray<{ ref: string; relation: "foreign_ref" | "other_seller" | "same_seller" }>;
    /** Perceptual hashes of the images, for the known-bad list. */
    hashes?: ReadonlyArray<string>;
    knownBadHashes?: ReadonlySet<string>;
    /** First-party pictures that could not be fingerprinted (so could not be compared). */
    unfingerprinted?: number;
  };
  /** Null when the database could not report the store's state. */
  seller: SellerGateState | null;
  /** The vendor record governance scores quality against (may be null). */
  vendor: Partial<MarketplaceVendor> | null;
  /** A STAFF-applied V3-40 hold/freeze on the seller's account or on this listing. */
  riskGated: boolean;
  /** The listing exists and is live right now (an edit, not a first publish). */
  isLiveEdit: boolean;
  /** The listing does not exist yet. */
  isNew: boolean;
  locale: string;
}

export interface GateVerdict {
  outcome: GateOutcome;
  reasons: GateReasonCode[];
  /** Small, PII-free facts stored with the verdict. */
  signals: {
    qualityScore: number;
    moderationDetail: string[];
    probationActive: boolean;
    aiConsulted: boolean;
  };
}

const MIN_TITLE_LENGTH = 4;
const MIN_BODY_LENGTH = 20;
const MAX_PRICE = 1_000_000_000;

/**
 * Goods a new store is held on whatever category it files them under: the
 * category is the seller's own choice, so a phone listed under "everyday tech"
 * must meet the same rule as one listed under "phones". Only above a price where
 * it matters, and not for accessories priced as accessories.
 *
 * Read as words after folding look-alikes: "iph0ne", "1phone", "i-phone", "sam
 * sung" and "S A M S U N G" all read as the brand, and common misspellings
 * ("Samsumg", "Infinx") as the word meant. Brands that also make televisions,
 * washing machines and routers count only when the listing is not one of those.
 */
const HIGH_RISK_DEVICES: ReadonlySet<string> = new Set([
  "iphone", "ipad", "macbook", "imac", "smartphone", "androidphone", "mobilephone", "cellphone", "smartwatch",
  "applewatch", "redmi", "oneplus", "camon", "pova", "laptop", "playstation", "ps4", "ps5", "xbox", "nintendoswitch",
  "airpods", "rolex", "cartier", "patekphilippe", "audemarspiguet", "18kgold", "22kgold", "24kgold", "18karat",
  "22karat", "24karat", "diamondring",
]);
/** Brands that sell phones AND appliances: a phone only when the listing is not an appliance. */
const DUAL_USE_BRANDS: ReadonlySet<string> = new Set([
  "samsung", "xiaomi", "huawei", "vivo", "oppo", "nokia", "tecno", "infinix", "itel",
]);
const MISSPELLINGS: Readonly<Record<string, string>> = {
  samsumg: "samsung", samsun: "samsung", samsong: "samsung", sumsung: "samsung", samsang: "samsung",
  sansung: "samsung", samung: "samsung", infinx: "infinix", infinex: "infinix", infinics: "infinix",
  iphon: "iphone", ifone: "iphone", iphne: "iphone", aiphone: "iphone", ipone: "iphone", airpod: "airpods",
  aipods: "airpods", macbok: "macbook", playstaion: "playstation", playstion: "playstation", xiomi: "xiaomi",
  xaomi: "xiaomi", huwei: "huawei", hauwei: "huawei", readmi: "redmi", rollex: "rolex", rolax: "rolex",
};
/** Words that make a dual-use brand a phone, a tablet or a watch. */
const PHONE_WORDS: ReadonlySet<string> = new Set([
  "phone", "phones", "smartphone", "handset", "mobile", "tablet", "tab", "watch", "earbuds", "buds",
]);
/** Goods a dual-use brand also sells, that a new store is not held on. */
const APPLIANCE_WORDS: ReadonlySet<string> = new Set([
  "tv", "television", "uhd", "qled", "smarttv", "washing", "washer", "dryer", "fridge", "refrigerator", "freezer",
  "microwave", "oven", "cooker", "router", "modem", "mifi", "vacuum", "cleaner", "aircon", "conditioner", "monitor",
  "soundbar", "printer", "projector", "scooter", "shoes", "sneakers", "barefoot", "kettle", "blender", "fan", "iron",
  "dishwasher", "inverter", "generator", "ssd", "hdd", "powerbank", "toner", "cartridge",
]);
/** "18k gold PLATED", "diamond ring LIGHT": the precious word describes something else. */
const NOT_PRECIOUS: ReadonlySet<string> = new Set([
  "plated", "plating", "filled", "tone", "toned", "coloured", "colored", "colour", "color", "look", "finish",
  "effect", "layered", "dipped", "light", "lights",
]);
export const HIGH_RISK_CONTENT_MIN_PRICE = 50_000;
/** Below this, a listing that says it is an accessory is taken at its word. */
const ACCESSORY_MAX_PRICE = 100_000;
const ACCESSORY_RE =
  /\b(?:case|cases|cover|covers|protector|protectors|screen\s{0,2}guard|tempered\s{0,2}glass|charger|chargers|cable|cables|adapter|adaptor|strap|straps|band|bands|stand|holder|mount|pouch|skin|sticker|sleeve|controller|controllers|gamepad|remote|dock)\b/i;
/** Goods that name a device but are not one, at any price: "laptop backpack", "phone repair tool kit", "PS5 games". */
const NOT_A_DEVICE_RE =
  /\b(?:backpacks?|bags?|table|desk|tray|gimbal|stabili[sz]er|booster|repair|tools?|toolkit|kit|ring\s{1,2}light|lamp|games?(?!\s{1,3}(?:console|consoles|system))|discs?|cartridges?|shoes|sneakers|dress)\b/i;
/** "with free case", "+ charger", "and stand": what comes after is an extra, not the item. */
const CONNECTOR_RE = /\b(?:with|plus|and|free|incl|including|includes|bundle|bundled|comes)\b|[+&]/i;

/** Lower-case words, with spelled-out letters joined ("s a m s u n g" -> "samsung") and misspellings read as meant. */
function riskWords(text: string): string[] {
  const raw = foldForScreening(text).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const words: string[] = [];
  let letters = "";
  for (const word of raw) {
    if (word.length === 1 && word >= "a" && word <= "z") {
      letters += word;
      continue;
    }
    if (letters) words.push(letters);
    letters = "";
    words.push(word);
  }
  if (letters) words.push(letters);
  return words.map((word) => {
    if (HIGH_RISK_DEVICES.has(word) || DUAL_USE_BRANDS.has(word)) return word;
    // "iph0ne", "1phone", "macb00k": a zero for o, a one for i.
    const folded = word.replace(/0/g, "o").replace(/1(?=[a-z])/g, "i");
    return MISSPELLINGS[word] ?? MISSPELLINGS[folded] ?? (HIGH_RISK_DEVICES.has(folded) || DUAL_USE_BRANDS.has(folded) ? folded : word);
  });
}

const MODEL_AFTER_GALAXY_RE = /^(?:[saczmf]\d{1,3}[a-z]?|note\d{0,2}|z|fold\d?|flip\d?|tab|watch\d?|buds\d?)$/;

/** `title` says what the item IS: only its words make a dual-use brand an appliance. */
function hasHighRiskToken(text: string, title: string): boolean {
  const words = riskWords(text);
  const appliance = riskWords(title).some((word) => APPLIANCE_WORDS.has(word));
  let dualUse = false;
  let phoneWord = false;
  for (let start = 0; start < words.length; start += 1) {
    const word = words[start];
    const next = words[start + 1] ?? "";
    if (PHONE_WORDS.has(word)) phoneWord = true;
    // Model names that are a phone on their own: "Galaxy S24", "Pixel 8", "Apple 15 Pro Max", "S24 Ultra".
    // ("Galaxy" alone is a star projector or a print.)
    if (word === "galaxy" && MODEL_AFTER_GALAXY_RE.test(next)) return true;
    if (/^galaxy[saz]\d/.test(word)) return true;
    if (word === "pixel" && /^\d{1,2}[a-z]?$/.test(next)) return true;
    if (word === "apple" && /^\d{1,2}$/.test(next) && /^(?:pro|max|plus|mini|\d{2,4}gb)$/.test(words[start + 2] ?? "")) return true;
    if (/^s\d{2}$/.test(word) && /^(?:ultra|plus|fe)$/.test(next)) return true;
    let joined = "";
    for (let end = start; end < words.length && end < start + 3; end += 1) {
      joined += words[end];
      if (joined.length > 20) break;
      const after = words[end + 1] ?? "";
      const parts = end - start + 1;
      if (HIGH_RISK_DEVICES.has(joined)) {
        // "10 x box" is ten boxes; "one plus one free" is an offer; "18k gold plated" is not gold.
        if (joined === "xbox" && parts > 1 && /^\d/.test(words[start - 1] ?? "")) continue;
        if (joined === "oneplus" && parts > 1 && !/^(?:\d{1,2}[a-z]?|nord|open|ace)$/.test(after)) continue;
        if (/(?:gold|karat|ring)$/.test(joined) && NOT_PRECIOUS.has(after)) continue;
        return true;
      }
      // "no Kia" is a car brand after "no".
      if (DUAL_USE_BRANDS.has(joined) && !(joined === "nokia" && parts > 1)) dualUse = true;
    }
  }
  return dualUse && (phoneWord || !appliance);
}

/** A model named in the description as the item itself ("Samsung Galaxy S24 Ultra, sealed"), not as what it fits. */
const DESCRIPTION_MODEL_RE =
  /\b(?:iphone\s?\d{1,2}|ipad\s?(?:pro|air|mini|\d{1,2})|macbook\s?(?:air|pro)|airpods(?:\s?(?:pro|max|\d))?|apple\s+watch|samsung\s+galaxy|galaxy\s+(?:[saczmf]\s?\d{1,3}|note|z\s?(?:fold|flip)|tab|watch|buds)|s\d{2}\s+(?:ultra|plus|fe)|ps\s?[45]|playstation\s?[45]|xbox\s+(?:series|one)|nintendo\s+switch|rolex\s+[a-z]{3,}|tecno\s+(?:camon|spark|pova|phantom)|infinix\s+(?:hot|note|zero|smart)|redmi\s+(?:note\s+)?\d{1,2}|pixel\s+\d{1,2}|oneplus\s+\d{1,2})\b/g;
const COMPATIBILITY_RE = /\b(?:fits?|for|compatible|compatibility|works\s+with|work\s+with|supports?|designed\s+for|suitable\s+for|made\s+for)\b[^.\n]{0,25}$/;

function describesHighRiskItem(description: string): boolean {
  const text = riskWords(description).join(" ");
  DESCRIPTION_MODEL_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = DESCRIPTION_MODEL_RE.exec(text)) !== null) {
    if (!COMPATIBILITY_RE.test(text.slice(Math.max(0, match.index - 40), match.index))) return true;
  }
  return false;
}

/**
 * What the title is: an accessory or another non-device ("Samsung charger",
 * "laptop backpack", "PS5 games") when that word heads it — it comes before any
 * "with", "+" or "and" ("iPhone 11 with free case" is a phone).
 */
function titleHead(title: string): "accessory" | "not_device" | null {
  const accessory = ACCESSORY_RE.exec(title);
  const other = NOT_A_DEVICE_RE.exec(title);
  const first = accessory && (!other || accessory.index <= other.index) ? accessory : other;
  if (!first) return null;
  if (CONNECTOR_RE.test(title.slice(0, first.index))) return null;
  return first === accessory ? "accessory" : "not_device";
}

export function contentIsHighRisk(
  listing: Pick<ListingGateInput["listing"], "title" | "summary" | "basePrice"> & { slug?: string; description?: string },
): boolean {
  const price = Number(listing.basePrice);
  if (!(price >= HIGH_RISK_CONTENT_MIN_PRICE)) return false;
  const title = String(listing.title ?? "");
  const head = titleHead(title);
  if (head === "not_device") return false;
  if (head === "accessory" && price < ACCESSORY_MAX_PRICE) return false;
  if (hasHighRiskToken(`${title}\n${String(listing.summary ?? "")}\n${String(listing.slug ?? "").replace(/[-_]+/g, " ")}`, title)) {
    return true;
  }
  // The description names the item only when the title does not say it is something else.
  return head === null && describesHighRiskItem(String(listing.description ?? ""));
}

/** A URL handle as a reader sees it: percent-escapes decoded ("%30" is "0"). */
function readableSlug(slug: unknown): string {
  let value = String(slug ?? "");
  for (let pass = 0; pass < 3 && /%[0-9a-f]{2}/i.test(value); pass += 1) {
    try {
      value = decodeURIComponent(value);
    } catch {
      value = value.replace(/%([0-9a-f]{2})/gi, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)));
    }
  }
  return value.replace(/[-_+]+/g, " ");
}

/**
 * The longest text a field may hold. No real listing comes near these; past them
 * the text is refused (`listing_too_long`) before any rule reads it, so no field
 * can be made long enough to slow the gate down.
 */
export const TEXT_LIMITS = {
  /** A title, a store name, a URL handle, a category. */
  short: 300,
  /** A summary, SKU, delivery note, lead time, one specification value, a category focus. */
  line: 1_000,
  /** A description or a store story, and all the specification values together. */
  long: 20_000,
} as const;

function listingTooLong(listing: ListingGateInput["listing"]): boolean {
  let specTotal = 0;
  for (const value of listing.specificationValues) {
    if (value.length > TEXT_LIMITS.line) return true;
    specTotal += value.length;
  }
  return (
    specTotal > TEXT_LIMITS.long ||
    listing.title.length > TEXT_LIMITS.short ||
    (listing.slug ?? "").length > TEXT_LIMITS.short ||
    listing.categorySlug.length > TEXT_LIMITS.short ||
    listing.summary.length > TEXT_LIMITS.line ||
    listing.sku.length > TEXT_LIMITS.line ||
    listing.deliveryNote.length > TEXT_LIMITS.line ||
    listing.leadTime.length > TEXT_LIMITS.line ||
    listing.description.length > TEXT_LIMITS.long
  );
}

/** Every field as text, whatever the caller passed: a malformed draft is screened, not thrown on. */
function normaliseListing(listing: ListingGateInput["listing"]): ListingGateInput["listing"] {
  const text = (value: unknown) => (typeof value === "string" ? value : value == null ? "" : String(value));
  return {
    ...listing,
    slug: text(listing.slug),
    title: text(listing.title),
    summary: text(listing.summary),
    description: text(listing.description),
    sku: text(listing.sku),
    categorySlug: text(listing.categorySlug),
    deliveryNote: text(listing.deliveryNote),
    leadTime: text(listing.leadTime),
    specificationValues: Array.isArray(listing.specificationValues) ? listing.specificationValues.map(text) : [],
  };
}

/** Map the moderation ruleset's machine tokens to gate reason codes. */
export function codesFromModerationDetail(detail: ReadonlyArray<string>): GateReasonCode[] {
  const codes: GateReasonCode[] = [];
  for (const token of detail) {
    if (token.startsWith("banned:")) codes.push("prohibited_goods");
    else if (token === "counterfeit:explicit") codes.push("counterfeit_claim");
    else if (token.startsWith("ambiguous:")) codes.push("restricted_item_review");
    else if (token.startsWith("hate:")) codes.push("hate_speech");
    else if (token === "profanity") codes.push("profanity");
    else if (token === "image:known_bad") codes.push("known_bad_image");
    else if (token === "scam:payment_diversion") codes.push("off_platform_payment");
    else if (token.startsWith("scam:")) codes.push("scam_language");
    else if (token === "signal:urgency") codes.push("urgency_language");
    else if (token === "signal:address") codes.push("pickup_address");
    else if (token.startsWith("contact:")) {
      if (token.endsWith(":high")) codes.push("contact_details");
      else if (token.endsWith(":medium")) codes.push("contact_suspected");
    }
  }
  return codes;
}

/** Everything a buyer can read, as one text for the content ruleset. */
export function listingText(listing: ListingGateInput["listing"]): string {
  return [
    listing.title,
    listing.summary,
    listing.description,
    listing.deliveryNote,
    listing.leadTime,
    listing.sku,
    ...listing.specificationValues,
    // Last, decoded and with its hyphens opened up, so "call-0803-…" and "%30%38…"
    // read as the words and digits they are.
    readableSlug(listing.slug),
  ]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join("\n");
}

/**
 * The deterministic floor. Complete on its own: with no AI and no network it
 * returns the verdict the listing is held to.
 */
export function evaluateListingPolicy(rawInput: ListingGateInput): GateVerdict {
  const codes: GateReasonCode[] = [];
  const input: ListingGateInput = { ...rawInput, listing: normaliseListing(rawInput.listing) };
  const { listing, images, seller } = input;

  // ---- size: refused before any rule reads the text ---------------------------
  if (listingTooLong(listing)) {
    const reasons = normalizeReasons(["listing_too_long"]);
    return {
      outcome: composeOutcome(reasons),
      reasons,
      signals: { qualityScore: 0, moderationDetail: [], probationActive: Boolean(seller?.probation.active), aiConsulted: false },
    };
  }

  // ---- essentials -----------------------------------------------------------
  const title = listing.title.trim();
  const body = `${listing.summary} ${listing.description}`.trim();
  if (title.length < MIN_TITLE_LENGTH || body.length < MIN_BODY_LENGTH || images.refs.length === 0) {
    codes.push("incomplete_listing");
  }
  const price = Number(listing.basePrice);
  const compareAt = listing.compareAtPrice === null ? null : Number(listing.compareAtPrice);
  if (
    !Number.isFinite(price) ||
    !Number.isInteger(price) ||
    price <= 0 ||
    price > MAX_PRICE ||
    (compareAt !== null && (!Number.isFinite(compareAt) || compareAt <= price || compareAt > MAX_PRICE))
  ) {
    // A "was" price at or below the selling price is a discount that is not one;
    // one beyond the ceiling is not a price at all (ten digits fit a phone number).
    codes.push("price_invalid");
  }

  // ---- the store ------------------------------------------------------------
  if (seller === null) {
    // The database could not tell us the store's standing: nothing publishes on a guess.
    codes.push("gate_unavailable");
  } else {
    // A person's "no" to the account stands (the state reads "revoked"): a person decides
    // each listing. A store that is not active cannot publish at all.
    if (seller.vendor.status === "revoked") codes.push("risk_hold_active");
    else if (seller.vendor.status !== "approved") codes.push("seller_not_active");

    if (input.isNew && seller.plan.listingRows >= seller.plan.listingCap) {
      codes.push("plan_listing_limit");
    }

    if (seller.probation.active) {
      const caps = seller.probation.caps;
      if (price > caps.maxPrice) codes.push("probation_price_cap");
      if (!input.isLiveEdit) {
        if (seller.probation.liveListings >= caps.maxLiveListings) codes.push("probation_listing_cap");
        else if (seller.probation.newListings24h >= caps.maxNewListingsPerDay) codes.push("probation_daily_cap");
      }
      if (categoryIsHighRisk(listing.categorySlug) || contentIsHighRisk(listing)) {
        codes.push("high_risk_category_probation");
      }
    }

    // A hide that needs a person stays until a person lifts it.
    if (seller.activeHide && seller.activeHide.kind !== "policy") codes.push("enforcement_hold_active");
  }

  if (input.riskGated) codes.push("risk_hold_active");

  // ---- images ---------------------------------------------------------------
  if (images.notFirstParty.length > 0) codes.push("image_not_first_party");
  const copiedReference =
    images.foreignRefs.length > 0 || images.matches.some((match) => match.relation === "foreign_ref");
  const seenElsewhere = images.matches.some((match) => match.relation === "other_seller");
  if (copiedReference) {
    // The upload flow cannot produce this: someone attached another store's object.
    codes.push("duplicate_image_other_seller");
  } else if (seenElsewhere) {
    // The same picture, uploaded first by another store. From a store on probation
    // that is the copied-listing pattern, and a person looks. From an established
    // store it is usually a shared manufacturer photo: recorded, not queued.
    codes.push(seller !== null && !seller.probation.active ? "shared_image" : "duplicate_image_other_seller");
  }
  if (images.matches.some((match) => match.relation === "same_seller")) {
    codes.push("duplicate_image_same_seller");
  }
  // A picture that could not be fingerprinted could not be compared with anyone
  // else's. From a store on probation (or one whose standing is unknown) that is
  // not a publish: a person looks.
  if ((images.unfingerprinted ?? 0) > 0 && (seller === null || seller.probation.active)) {
    codes.push("gate_unavailable");
  }

  // ---- content --------------------------------------------------------------
  const content = runDeterministic(
    {
      contentType: "marketplace_listing",
      contentId: "gate",
      text: listingText(listing),
      locale: typeof input.locale === "string" && input.locale ? input.locale : "en",
    },
    {
      ruleset: "listing_v2",
      imageHashes: images.hashes,
      knownBadImageHashes: images.knownBadHashes,
    },
  );
  const moderationDetail = content.detail ?? [];
  codes.push(...codesFromModerationDetail(moderationDetail));

  // ---- quality (advice, never a queue) ----------------------------------------
  const assessment = evaluateListingSubmission({
    vendor: input.vendor,
    title: listing.title,
    summary: listing.summary,
    description: listing.description,
    categorySlug: listing.categorySlug,
    imageUrl: images.refs[0] ?? "",
    sku: listing.sku,
    leadTime: listing.leadTime,
    deliveryNote: listing.deliveryNote,
  });
  if (assessment.qualityScore < 68) codes.push("thin_listing");

  const reasons = normalizeReasons(codes);
  return {
    outcome: composeOutcome(reasons),
    reasons,
    signals: {
      qualityScore: assessment.qualityScore,
      moderationDetail: [...moderationDetail],
      probationActive: Boolean(seller?.probation.active),
      aiConsulted: false,
    },
  };
}

export interface StoreProfileVerdict {
  outcome: GateOutcome;
  reasons: GateReasonCode[];
  /** Machine tokens from the content ruleset (stored with the onboarding verdict; never raw text). */
  moderationDetail: string[];
}

/**
 * The deterministic check on a store profile at onboarding: the same content
 * ruleset a listing gets, over the name, the category focus and the story.
 * Identity documents are NOT part of it — identity is checked at the payout.
 */
export function evaluateStorePolicy(input: {
  storeName: string;
  /** The store's URL handle — seller text like the rest. */
  storeSlug?: string;
  categoryFocus: string;
  story: string;
  locale: string;
}): StoreProfileVerdict {
  const length = (value: unknown) => (typeof value === "string" ? value.length : value == null ? 0 : String(value).length);
  if (
    length(input.storeName) > TEXT_LIMITS.short ||
    length(input.storeSlug) > TEXT_LIMITS.short ||
    length(input.categoryFocus) > TEXT_LIMITS.line ||
    length(input.story) > TEXT_LIMITS.long
  ) {
    const reasons = normalizeReasons(["listing_too_long"]);
    return { outcome: composeOutcome(reasons), reasons, moderationDetail: [] };
  }
  const text = [input.storeName, input.categoryFocus, input.story, readableSlug(input.storeSlug)]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join("\n");
  const content = runDeterministic(
    { contentType: "marketplace_listing", contentId: "store-profile", text, locale: input.locale || "en" },
    { ruleset: "listing_v2" },
  );
  const moderationDetail = [...(content.detail ?? [])];
  const reasons = normalizeReasons(codesFromModerationDetail(moderationDetail));
  return { outcome: composeOutcome(reasons), reasons, moderationDetail };
}

// ---- after publish: the sweep's decisions (pure) --------------------------------

export type RescanAction = "hide" | "review" | "clear";

/**
 * What a re-scan of an ALREADY-LIVE listing does with what it found.
 *
 *   hide    an unambiguous violation, on a listing the ENGINE let through;
 *   review  anything a person should look at: an ambiguous finding, or any
 *           finding at all on a listing a PERSON approved — the sweep never
 *           overrules a human decision;
 *   clear   nothing found.
 */
export function rescanDecision(input: {
  codes: ReadonlyArray<GateReasonCode>;
  /** Source of the verdict that originally let the listing through. */
  origin: string | null;
}): { action: RescanAction; reasons: GateReasonCode[] } {
  const codes = normalizeReasons(input.codes);
  const violations = codes.filter(isPolicyViolation);
  const ambiguous = codes.filter((code) => reasonClass(code) === "hold");
  const engineApproved = input.origin === "policy_engine" || input.origin === "backfill";
  if (violations.length > 0 && engineApproved) return { action: "hide", reasons: violations };
  if (violations.length > 0 || ambiguous.length > 0) return { action: "review", reasons: [...violations, ...ambiguous] };
  return { action: "clear", reasons: [] };
}

/** Independent buyers who must report a listing before it is taken down for review. */
export const REPORTS_HIDE_THRESHOLD = 3;
export const REPORTS_WINDOW_DAYS = 14;

/**
 * How many DIFFERENT people reported a listing, counting only reports that are
 * newer than its last resolved take-down and that did not come from an excluded
 * account (other sellers: a competitor must not be able to pull a rival's
 * listing). An anonymous report (no reporter id) never counts.
 */
export function countIndependentReporters(
  reports: ReadonlyArray<{ reporterId: string | null; createdAt: string }>,
  options: { since: string | null; excluded: ReadonlySet<string> },
): number {
  const since = options.since ? new Date(options.since).getTime() : null;
  const people = new Set<string>();
  for (const report of reports) {
    if (!report.reporterId || options.excluded.has(report.reporterId)) continue;
    if (since !== null) {
      const at = new Date(report.createdAt).getTime();
      if (!Number.isFinite(at) || at <= since) continue;
    }
    people.add(report.reporterId);
  }
  return people.size;
}

const AI_REASON_MAP: Record<string, HoldReason> = {
  ai_flagged_scam: "ai_flagged_scam",
  ai_flagged_nsfw: "ai_flagged_nsfw",
  ai_flagged_abuse: "ai_flagged_abuse",
  ai_flagged_other: "ai_flagged_other",
};

/**
 * Fold an AI result into a deterministic verdict.
 *
 * The AI may only ADD. Structurally:
 *   * a verdict that is not `publish` is returned untouched — a reject or a hold
 *     never reaches this function's mutation path, so no AI output can soften it;
 *   * on a `publish` verdict the only codes this function can append are
 *     hold-class codes from a closed vocabulary — nothing the model wrote is
 *     copied into the result.
 * A null result (flag dark, budget spent, provider down, unparseable) changes
 * nothing: the deterministic verdict stands.
 */
export function applyAiSignal(verdict: GateVerdict, ai: AiScanResult | null): GateVerdict {
  if (verdict.outcome !== "publish") return verdict;
  if (ai === null) return verdict;

  const signals = { ...verdict.signals, aiConsulted: true };
  if (ai.recommendation === "approve") return { ...verdict, signals };

  // "hold" — and "reject", which the moderation contract already treats as hold.
  const added: HoldReason[] = [];
  for (const reason of ai.reasons ?? []) {
    const mapped = AI_REASON_MAP[reason];
    if (mapped && !added.includes(mapped)) added.push(mapped);
  }
  if (added.length === 0) added.push("ai_flagged_other");

  const reasons = normalizeReasons([...verdict.reasons, ...added]);
  return { outcome: composeOutcome(reasons), reasons, signals };
}

const OUTCOME_RANK: Record<GateOutcome, number> = { publish: 0, hold: 1, reject: 2 };

/**
 * Fold in what the database said when the verdict was recorded. The recording
 * RPC re-checks the store, the slug, the hides and the caps and may TIGHTEN the
 * outcome; this merge can therefore only tighten too:
 *
 *   merged outcome >= max(TS outcome, DB outcome)      (publish < hold < reject)
 *
 * A reason code the TS vocabulary does not know, or a DB outcome stricter than
 * its codes explain, is treated as "gate unavailable" — a hold, never a publish.
 */
export function mergeDbVerdict(verdict: GateVerdict, db: { outcome: unknown; reasons: unknown }): GateVerdict {
  const codes: GateReasonCode[] = [...verdict.reasons];
  let unknown = false;

  if (Array.isArray(db.reasons)) {
    for (const raw of db.reasons) {
      if (isGateReasonCode(raw)) codes.push(raw);
      else unknown = true;
    }
  } else {
    unknown = true;
  }

  const dbOutcome: GateOutcome | null =
    db.outcome === "publish" || db.outcome === "hold" || db.outcome === "reject" ? db.outcome : null;
  if (dbOutcome === null) unknown = true;

  let reasons = normalizeReasons(codes);
  if (unknown || (dbOutcome !== null && OUTCOME_RANK[dbOutcome] > OUTCOME_RANK[composeOutcome(reasons)])) {
    reasons = normalizeReasons([...reasons, "gate_unavailable"]);
  }

  return { outcome: composeOutcome(reasons), reasons, signals: verdict.signals };
}

/** A verdict for a write the gate could not complete (ledger unreachable, RPC absent). */
export function unavailableVerdict(base?: GateVerdict): GateVerdict {
  const reasons = normalizeReasons([...(base?.reasons ?? []), "gate_unavailable"]);
  return {
    outcome: composeOutcome(reasons),
    reasons,
    signals: base?.signals ?? { qualityScore: 0, moderationDetail: [], probationActive: false, aiConsulted: false },
  };
}
