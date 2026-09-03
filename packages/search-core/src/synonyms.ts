/**
 * SEARCH-01 — Per-division synonym tables.
 *
 * These tables drive Typesense's `synonyms` collection API. Each
 * entry is a *one-way* synonym group: `[root, alias, alias, ...]`
 * where any query containing one of `alias` is rewritten to also
 * match `root`. We keep groups intentionally small — large groups
 * with weak semantic ties create false-positive hits.
 *
 * NIGERIAN-ENGLISH-FIRST: HenryCo is a Nigerian platform; many
 * synonyms here are Pidgin/Nigerian-English surface forms ("naija"
 * for "nigerian", "yoyo" for "Yoruba", "abc transport" for the
 * logistics provider). Add new groups as we see zero-result queries
 * carry a real intent that the catalogue should answer.
 *
 * Wiring: the synonym groups are EITHER materialised in Typesense as
 * collection-level synonyms (preferred — persistent, server-side) OR
 * inlined into the `multi_search` body as one-shot synonym hints. We
 * ship the static table here and `provisionSynonyms()` (called from
 * `ensureCollectionsExist` extension point next pass) projects them
 * into Typesense. For session 1 we expose the static table; the
 * provisioning hook can be wired in session 2 alongside the dead-
 * letter + recents work.
 *
 * Anti-pattern guard: do NOT add culturally-loaded "corrections"
 * (e.g. "girlboss" → "founder"). Synonyms are search affordances,
 * not editorial overrides — the customer's words are the ones we
 * widen, not narrow.
 */

import type { SearchDivision } from "./types";

export interface SynonymGroup {
  /**
   * The canonical term the index already stores ("t-shirt" because
   * that's how vendors usually list it). Queries that hit any
   * `aliases` rewrite to also include `root` — they don't replace.
   */
  root: string;
  aliases: string[];
}

/**
 * The full synonym book. Keys are divisions; values are curated
 * groups. Cross-division synonyms (e.g. an account-level "wallet"
 * synonym) live under the `"account"` key by convention.
 */
export const SYNONYMS_BY_DIVISION: Readonly<Record<SearchDivision, SynonymGroup[]>> = Object.freeze({
  marketplace: [
    { root: "t-shirt", aliases: ["tee", "tees", "t shirt", "tshirt"] },
    { root: "nigerian", aliases: ["naija", "9ja"] },
    { root: "fabric", aliases: ["material", "ankara", "kente"] },
    { root: "smartphone", aliases: ["phone", "mobile", "handset"] },
    { root: "laptop", aliases: ["notebook", "macbook", "computer"] },
    { root: "sneakers", aliases: ["sneaker", "trainers", "kicks"] },
    { root: "perfume", aliases: ["fragrance", "scent", "cologne"] },
    { root: "accessories", aliases: ["accessory", "accs"] },
    { root: "men", aliases: ["mens", "male", "man"] },
    { root: "women", aliases: ["womens", "female", "lady"] },
    { root: "kids", aliases: ["children", "child", "babies", "baby"] },
  ],
  property: [
    { root: "lekki phase 1", aliases: ["lekki phase one", "lp1", "phase 1 lekki"] },
    { root: "victoria island", aliases: ["vi", "v.i.", "victoria-island"] },
    { root: "ikoyi", aliases: ["ikoyii"] },
    { root: "yaba", aliases: ["yaba mainland"] },
    { root: "ajah", aliases: ["sangotedo", "abraham adesanya"] },
    { root: "bedroom", aliases: ["bed", "br", "rm"] },
    { root: "self contain", aliases: ["self-contain", "self contained", "single room"] },
    { root: "apartment", aliases: ["flat", "apt"] },
    { root: "duplex", aliases: ["semi-detached", "terrace"] },
    { root: "short let", aliases: ["short-let", "shortlet", "short stay"] },
    { root: "rent", aliases: ["renting", "to let", "for rent"] },
    { root: "sale", aliases: ["for sale", "buy", "selling"] },
  ],
  care: [
    { root: "cleaning", aliases: ["housekeeping", "house cleaning", "maid"] },
    { root: "nanny", aliases: ["babysitter", "child minder", "childminder", "au pair"] },
    { root: "caregiver", aliases: ["care giver", "care worker", "home care"] },
    { root: "chef", aliases: ["cook", "private chef", "home chef"] },
    { root: "elderly care", aliases: ["senior care", "geriatric care", "old people care"] },
    { root: "tutor", aliases: ["lesson teacher", "home tutor", "after-school"] },
    { root: "driver", aliases: ["chauffeur", "uber-style driver"] },
    { root: "security", aliases: ["guard", "watchman", "estate security"] },
  ],
  jobs: [
    { root: "developer", aliases: ["dev", "engineer", "programmer", "coder", "software"] },
    { root: "designer", aliases: ["ui", "ux", "ui/ux", "ui ux", "product designer"] },
    { root: "data scientist", aliases: ["data analyst", "analyst", "ds", "machine learning"] },
    { root: "manager", aliases: ["mgr", "lead", "head"] },
    { root: "marketing", aliases: ["growth", "comms", "communications"] },
    { root: "remote", aliases: ["work from home", "wfh", "work-from-home"] },
    { root: "internship", aliases: ["intern", "trainee", "graduate trainee", "nysc"] },
    { root: "customer service", aliases: ["cs", "support", "csr", "customer care"] },
  ],
  learn: [
    { root: "course", aliases: ["class", "lesson", "module"] },
    { root: "certificate", aliases: ["cert", "certification", "credential"] },
    { root: "programming", aliases: ["coding", "code", "software development"] },
    { root: "data", aliases: ["analytics", "sql", "spreadsheet", "excel"] },
    { root: "english", aliases: ["communication", "writing", "speaking"] },
    { root: "free", aliases: ["no cost", "0 naira", "scholarship"] },
  ],
  logistics: [
    { root: "shipment", aliases: ["package", "parcel", "delivery", "consignment"] },
    { root: "intra-state", aliases: ["intra state", "same state", "in state"] },
    { root: "inter-state", aliases: ["inter state", "across states"] },
    { root: "express", aliases: ["fast", "next day", "same day", "rush"] },
    { root: "fragile", aliases: ["delicate", "breakable"] },
  ],
  studio: [
    { root: "branding", aliases: ["brand identity", "logo", "visual identity"] },
    { root: "web design", aliases: ["website", "landing page", "site design"] },
    { root: "mobile app", aliases: ["app", "android app", "ios app"] },
    { root: "social media", aliases: ["instagram", "tiktok", "x post", "twitter"] },
  ],
  // Shared synonyms — wallet / verification / KYC are account-wide.
  account: [
    { root: "wallet", aliases: ["balance", "naira balance", "purse"] },
    { root: "withdraw", aliases: ["cash out", "payout", "transfer out"] },
    { root: "deposit", aliases: ["top up", "top-up", "fund", "funding"] },
    { root: "kyc", aliases: ["verification", "verify", "identity", "bvn"] },
    { root: "support", aliases: ["help", "ticket", "complaint", "issue"] },
    { root: "notification", aliases: ["alert", "ping", "message"] },
  ],
  hub: [],
  staff: [],
});

/**
 * Convert the static groups into the format Typesense's
 * `/collections/<name>/synonyms/<synonym_id>` API expects. Caller
 * decides whether to push them (provisioning hook) or inline them
 * into a `multi_search` body.
 *
 * One-way synonyms because the catalogue stores the canonical root,
 * not the alias — so we widen alias queries to also match root, but
 * we don't surface alias strings on the result cards.
 */
export interface TypesenseSynonymPayload {
  /** Stable id; we hash the root for idempotency. */
  id: string;
  /** Typesense supports 'one-way' or 'two-way'; we use one-way. */
  synonyms: string[];
  root?: string;
}

export function buildTypesenseSynonyms(division: SearchDivision): TypesenseSynonymPayload[] {
  const groups = SYNONYMS_BY_DIVISION[division] ?? [];
  return groups.map((g) => ({
    id: synonymId(division, g.root),
    synonyms: [g.root, ...g.aliases],
    root: g.root,
  }));
}

function synonymId(division: string, root: string): string {
  // Deterministic id so re-provisioning is idempotent.
  const slug = root
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${division}_${slug || "root"}`;
}

/**
 * Build the per-query synonym hint that we can also surface in the
 * multi_search request body (Typesense supports `synonyms` field on
 * the per-search object). Useful when we have NOT yet provisioned a
 * persistent synonym entity — the hint applies for the duration of
 * the request.
 *
 * Returns a flat list of all aliases for the given division that
 * also have a non-empty root. The caller is responsible for emitting
 * them in the format Typesense expects (CSV or array depending on
 * client). Helper kept simple so the query layer doesn't carry
 * Typesense-protocol knowledge.
 */
export function flattenSynonymsForDivision(division: SearchDivision): string[] {
  const groups = SYNONYMS_BY_DIVISION[division] ?? [];
  const out: string[] = [];
  for (const g of groups) {
    out.push(g.root);
    for (const a of g.aliases) out.push(a);
  }
  return out;
}
