// V3-MKT-TRUST-01 — the gate's I/O. SERVER ONLY.
//
// The decisions live in ./policy (pure). This file gathers the facts they need,
// records the verdict through the SECURITY DEFINER RPCs of the trust migration
// and reports back what the database said.
//
// DEGRADE CLOSED — two failures, two answers:
//   * the migration is not applied (a gate RPC does not exist) → `available: false`.
//     The caller runs the legacy review path: a person approves, as before the
//     flag existed. Nothing new is switched on by a half-applied rollout.
//   * anything else goes wrong → the verdict is HOLD (`gate_unavailable`).
//     Nothing publishes on a guess.

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isFlagEnabled,
  isSensitiveActionGated,
  parseHenryFeatureFlags,
  type ActiveEnforcement,
} from "@henryco/intelligence";
import type { AiScanResult } from "@henryco/moderation";
import { MARKETPLACE_IMAGE_BUCKET } from "../media-image";
import type { MarketplaceVendor } from "../types";
import { fingerprintImageBytes, type ImageFingerprint } from "./image-fingerprint";
import { classifyImage, classifyImageSet, storageKeyOf, type PublicMediaBases } from "./image-refs";
import { buildListingRow, type HashedListingRow, type ListingDraft } from "./listing-row";
import {
  applyAiSignal,
  evaluateListingPolicy,
  listingText,
  mergeDbVerdict,
  unavailableVerdict,
  type GateVerdict,
  type ListingGateInput,
} from "./policy";
import { GATE_ENGINE_VERSION } from "./reasons";
import { parseSellerGateState, type SellerGateState } from "./seller-state";

export type GateAdmin = SupabaseClient;

type RpcError = { code?: string; message?: string; hint?: string; details?: string } | null;

/** PostgREST "no such function in the schema cache" / Postgres undefined_function. */
export function isMissingRpc(error: RpcError): boolean {
  if (!error) return false;
  if (error.code === "PGRST202" || error.code === "42883") return true;
  return /could not find the function|function .* does not exist/i.test(String(error.message ?? ""));
}

/** The guard's and the RPCs' refusal reasons travel in the Postgres HINT. */
export function guardHint(error: RpcError): string | null {
  const hint = String(error?.hint ?? "").trim();
  return /^[a-z][a-z0-9_]{1,47}$/.test(hint) ? hint : null;
}

// ---------------------------------------------------------------------------
// Store facts
// ---------------------------------------------------------------------------

export async function readSellerGateState(
  admin: GateAdmin,
  vendorId: string,
  slug: string | null,
): Promise<{ available: boolean; state: SellerGateState | null }> {
  try {
    const { data, error } = await admin.rpc("marketplace_gate_seller_state", {
      p_vendor_id: vendorId,
      p_slug: slug,
    });
    if (error) return { available: !isMissingRpc(error), state: null };
    return { available: true, state: parseSellerGateState(data) };
  } catch {
    return { available: true, state: null };
  }
}

/** The user ids whose uploads a store may put on its listings: its active members. */
export async function readStoreUploaders(admin: GateAdmin, vendorId: string): Promise<string[]> {
  try {
    const { data, error } = await admin
      .from("marketplace_role_memberships")
      .select("user_id")
      .eq("scope_type", "vendor")
      .eq("scope_id", vendorId)
      .eq("is_active", true)
      .limit(50);
    if (error || !data) return [];
    return (data as Array<{ user_id: string | null }>)
      .map((row) => row.user_id)
      .filter((id): id is string => typeof id === "string" && id.length > 0);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// V3-40 — a STAFF-applied hold/freeze. Read only; this gate never writes one.
// Mirrors the account-side reader: dark flag, absent tables or any read error
// mean "not gated" (a broken risk reader must not stop a seller from selling —
// the deterministic floor still decides the listing).
// ---------------------------------------------------------------------------

async function readActiveEnforcement(
  admin: GateAdmin,
  entityType: "account" | "listing",
  entityId: string,
): Promise<ActiveEnforcement | null> {
  try {
    const { data, error } = await admin
      .from("risk_enforcement_log")
      .select("action, actor, model_kind, model_version, created_at, id")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .in("action", ["hold", "freeze", "release", "staff_override"])
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as { action: string; actor: string; model_kind: string; model_version: string };
    if (row.action !== "hold" && row.action !== "freeze") return null;

    const { data: model } = await admin
      .from("model_versions")
      .select("status")
      .eq("model_kind", row.model_kind)
      .eq("version", row.model_version)
      .maybeSingle();
    const status = (model as { status?: string } | null)?.status;
    return {
      state: row.action,
      appliedByStaff: row.actor !== "system",
      modelStatus:
        status === "live" || status === "shadow" || status === "rolled_back" || status === "retired"
          ? status
          : "retired",
    };
  } catch {
    return null;
  }
}

export function riskSystemLive(env: Record<string, string | undefined> = process.env as Record<string, string | undefined>) {
  return isFlagEnabled(parseHenryFeatureFlags(env), "predictive_shadow");
}

/** True only for a staff-applied hold/freeze under a live model, on the account or the listing. */
export async function readStaffRiskHold(
  admin: GateAdmin,
  input: { accountId: string | null; listingId: string | null },
): Promise<boolean> {
  if (!riskSystemLive()) return false;
  const [account, listing] = await Promise.all([
    input.accountId ? readActiveEnforcement(admin, "account", input.accountId) : Promise.resolve(null),
    input.listingId ? readActiveEnforcement(admin, "listing", input.listingId) : Promise.resolve(null),
  ]);
  return isSensitiveActionGated(account) || isSensitiveActionGated(listing);
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

const FINGERPRINT_CONCURRENCY = 3;
const DOWNLOAD_TIMEOUT_MS = 8_000;

async function downloadImage(admin: GateAdmin, key: string): Promise<Uint8Array | null> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    const download = admin.storage.from(MARKETPLACE_IMAGE_BUCKET).download(key);
    const timeout = new Promise<null>((resolve) => {
      timer = setTimeout(() => resolve(null), DOWNLOAD_TIMEOUT_MS);
    });
    const result = await Promise.race([download, timeout]);
    if (!result || result.error || !result.data) return null;
    return new Uint8Array(await result.data.arrayBuffer());
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** The strings an image is looked up by in the known-bad list: its sha256 and "<pos>:<neg>". */
function hashKeys(sha256: string, pos: string | null, neg: string | null): string[] {
  return pos !== null && neg !== null ? [sha256, `${pos}:${neg}`] : [sha256];
}

async function registerFingerprint(
  admin: GateAdmin,
  input: { ref: string; fingerprint: ImageFingerprint; uploaderId: string | null; vendorId: string | null },
): Promise<boolean> {
  try {
    const { error } = await admin.rpc("marketplace_gate_register_image", {
      p_ref: input.ref,
      p_sha256: input.fingerprint.sha256,
      // bigint values travel as decimal strings: a JS number cannot hold 64 bits.
      p_phash: input.fingerprint.phash?.pos ?? null,
      p_bytes: input.fingerprint.bytes,
      p_uploader: input.uploaderId,
      p_vendor_id: input.vendorId,
      p_phash_aux: input.fingerprint.phash?.neg ?? null,
    });
    return !error;
  } catch {
    return false;
  }
}

export interface FingerprintOutcome {
  /** Known-bad lookup keys of every fingerprinted image (sha256, and "<pos>:<neg>"). */
  hashes: string[];
  /** First-party images that could not be fingerprinted (download or decode failed). */
  missing: number;
}

/**
 * Make sure each first-party image of this store is in the fingerprint registry.
 *
 * Only refs uploaded by one of the store's own members are registered. A ref
 * that points at someone else's upload is never claimed for this store — that
 * would let a copier "own" a picture by referencing it first.
 */
export async function ensureImageFingerprints(
  admin: GateAdmin,
  input: { refs: ReadonlyArray<string>; vendorId: string; allowedUploaders: ReadonlyArray<string> },
): Promise<FingerprintOutcome> {
  const allowed = new Set(input.allowedUploaders.map((id) => id.toLowerCase()));
  const candidates = input.refs
    .map((ref) => ({ ref, key: storageKeyOf(ref), uploader: classifyImage(ref, null).uploaderId }))
    .filter(
      (item): item is { ref: string; key: string; uploader: string } =>
        item.key !== null && item.uploader !== null && allowed.has(item.uploader),
    );
  if (candidates.length === 0) return { hashes: [], missing: 0 };

  const known = new Map<string, string[]>();
  try {
    const { data } = await admin
      .from("marketplace_image_fingerprints")
      .select("ref, sha256, phash, phash_aux, bytes, vendor_id")
      .in(
        "ref",
        candidates.map((item) => item.ref),
      );
    type Row = {
      ref: string;
      sha256: string;
      phash: string | number | null;
      phash_aux: string | number | null;
      bytes: number | null;
      vendor_id: string | null;
    };
    for (const row of (data ?? []) as Row[]) {
      const pos = row.phash === null ? null : String(row.phash);
      const neg = row.phash_aux === null ? null : String(row.phash_aux);
      known.set(row.ref, hashKeys(row.sha256, pos, neg));
      // Uploaded before the store existed (or by staff): attribute it now. The
      // database only ever fills an EMPTY owner, so this cannot take a picture
      // from a store that already has it.
      if (row.vendor_id === null) {
        const uploader = candidates.find((item) => item.ref === row.ref)?.uploader;
        if (uploader) {
          await registerFingerprint(admin, {
            ref: row.ref,
            fingerprint: {
              sha256: row.sha256,
              phash: pos !== null && neg !== null ? { pos, neg } : null,
              bytes: Number(row.bytes ?? 0),
            },
            uploaderId: uploader,
            vendorId: input.vendorId,
          });
        }
      }
    }
  } catch {
    // The registry could not be read: fingerprint everything again (idempotent).
  }

  const hashes: string[] = [];
  let missing = 0;
  const pending = candidates.filter((item) => {
    const hit = known.get(item.ref);
    if (!hit) return true;
    hashes.push(...hit);
    return false;
  });

  for (let index = 0; index < pending.length; index += FINGERPRINT_CONCURRENCY) {
    const batch = pending.slice(index, index + FINGERPRINT_CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (item) => {
        const bytes = await downloadImage(admin, item.key);
        const fingerprint = bytes ? await fingerprintImageBytes(bytes) : null;
        if (!fingerprint) return null;
        const registered = await registerFingerprint(admin, {
          ref: item.ref,
          fingerprint,
          uploaderId: item.uploader,
          vendorId: input.vendorId,
        });
        return registered ? fingerprint : null;
      }),
    );
    for (const fingerprint of results) {
      if (!fingerprint) {
        missing += 1;
        continue;
      }
      hashes.push(...hashKeys(fingerprint.sha256, fingerprint.phash?.pos ?? null, fingerprint.phash?.neg ?? null));
    }
  }

  return { hashes, missing };
}

/** Register one freshly uploaded image. Best-effort: a failure here is retried at publish time. */
export async function registerUploadedImage(
  admin: GateAdmin,
  input: { ref: string; bytes: Uint8Array; uploaderId: string | null; vendorId: string | null },
): Promise<boolean> {
  const fingerprint = await fingerprintImageBytes(input.bytes);
  if (!fingerprint) return false;
  return registerFingerprint(admin, {
    ref: input.ref,
    fingerprint,
    uploaderId: input.uploaderId,
    vendorId: input.vendorId,
  });
}

export type ImageMatch = { ref: string; relation: "foreign_ref" | "other_seller" | "same_seller" };

/** Matches the registry reports; NULL when it could not be asked (the caller treats that as "not compared"). */
export async function readImageMatches(
  admin: GateAdmin,
  input: { vendorId: string; slug: string; refs: ReadonlyArray<string> },
): Promise<ImageMatch[] | null> {
  if (input.refs.length === 0) return [];
  try {
    const { data, error } = await admin.rpc("marketplace_gate_image_matches", {
      p_vendor_id: input.vendorId,
      p_slug: input.slug,
      p_refs: [...input.refs],
    });
    if (error || !Array.isArray(data)) return null;
    const matches: ImageMatch[] = [];
    for (const entry of data as Array<Record<string, unknown>>) {
      const ref = typeof entry?.ref === "string" ? entry.ref : null;
      const relation =
        entry?.relation === "foreign_ref" || entry?.relation === "other_seller" || entry?.relation === "same_seller"
          ? entry.relation
          : null;
      if (ref && relation) matches.push({ ref, relation });
    }
    return matches;
  } catch {
    return null;
  }
}

/**
 * The pictures the listing's STANDING verdict covers — the only ones an edit may
 * keep without their being checked again. Anything else on the row (for example
 * something a draft save put there) is treated as newly posted. A failed read
 * answers "none": nothing is waved through on a guess.
 */
export async function readStandingMediaRefs(admin: GateAdmin, productId: string): Promise<string[]> {
  try {
    const { data, error } = await admin
      .from("marketplace_listing_gate_verdicts")
      .select("media_refs")
      .eq("product_id", productId)
      .eq("subject_type", "listing")
      .eq("outcome", "publish")
      .not("consumed_at", "is", null)
      .order("consumed_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return [];
    const refs = (data as { media_refs?: unknown }).media_refs;
    return Array.isArray(refs) ? refs.filter((ref): ref is string => typeof ref === "string") : [];
  } catch {
    return [];
  }
}

/** How many times the optional AI screen has run for this store in the last 24 hours. Null when unknown. */
export async function countRecentAiScreens(admin: GateAdmin, vendorId: string): Promise<number | null> {
  try {
    const { count, error } = await admin
      .from("marketplace_listing_gate_verdicts")
      .select("id", { count: "exact", head: true })
      .eq("vendor_id", vendorId)
      .eq("subject_type", "listing")
      .eq("signals->>aiConsulted", "true")
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    if (error) return null;
    return count ?? 0;
  } catch {
    return null;
  }
}

/** Deploy-time list of banned image hashes: sha256 hex, or a perceptual hash written "<pos>:<neg>". */
export function knownBadImageHashes(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): ReadonlySet<string> {
  const raw = String(env.MARKETPLACE_KNOWN_BAD_IMAGE_HASHES ?? "");
  return new Set(
    raw
      .split(/[\s,]+/)
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
}

// ---------------------------------------------------------------------------
// Buyers
// ---------------------------------------------------------------------------

/**
 * True when a cart line points at a listing that is not live any more (taken
 * down for review, held, or removed). A hide only removes a listing from the
 * storefront; without this a cart that already held it could still buy it.
 * Read only. A failed read answers "no": a soft, reversible measure must not
 * stop every checkout when the database blinks.
 */
export async function cartHasUnavailableListing(admin: GateAdmin, productIds: ReadonlyArray<string>): Promise<boolean> {
  const ids = Array.from(new Set(productIds.filter(Boolean)));
  if (ids.length === 0) return false;
  try {
    const { data, error } = await admin.from("marketplace_products").select("id, approval_status").in("id", ids);
    if (error || !data) return false;
    const live = new Set(
      (data as Array<{ id: string; approval_status: string | null }>)
        .filter((row) => row.approval_status === "approved")
        .map((row) => String(row.id)),
    );
    return ids.some((id) => !live.has(id));
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// The verdict
// ---------------------------------------------------------------------------

export type RecordedVerdict =
  | { ok: true; verdictId: string | null; outcome: unknown; reasons: unknown }
  | { ok: false; missing: boolean; unauthorized: boolean };

export async function recordListingVerdict(
  admin: GateAdmin,
  input: {
    actorId: string;
    vendorId: string;
    row: HashedListingRow;
    refs: ReadonlyArray<string>;
    verdict: GateVerdict;
    source?: "policy_engine" | "backfill";
  },
): Promise<RecordedVerdict> {
  try {
    const { data, error } = await admin.rpc("marketplace_gate_record_listing_verdict", {
      p_actor: input.actorId,
      p_vendor_id: input.vendorId,
      p_listing: input.row,
      p_media_refs: [...input.refs],
      p_outcome: input.verdict.outcome,
      p_reasons: [...input.verdict.reasons],
      p_signals: input.verdict.signals,
      p_engine_version: GATE_ENGINE_VERSION,
      p_source: input.source ?? "policy_engine",
    });
    if (error) {
      return { ok: false, missing: isMissingRpc(error), unauthorized: error.code === "42501" };
    }
    const payload = data && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, unknown>) : null;
    if (!payload) return { ok: false, missing: false, unauthorized: false };
    return {
      ok: true,
      verdictId: typeof payload.verdict_id === "string" ? payload.verdict_id : null,
      outcome: payload.outcome,
      reasons: payload.reasons,
    };
  } catch {
    return { ok: false, missing: false, unauthorized: false };
  }
}

/** The optional AI step. Implemented by ./ai; absent, dark or failing means "no signal". */
export type ListingAiScan = (input: {
  actorId: string;
  /** The store, for the per-store daily limit. */
  vendorId: string;
  slug: string;
  text: string;
  imageUrls: ReadonlyArray<string>;
  locale: string;
}) => Promise<AiScanResult | null>;

export interface ListingGateRequest {
  actorId: string;
  vendorId: string;
  vendor: Partial<MarketplaceVendor> | null;
  draft: ListingDraft;
  /** Image values exactly as posted (refs or resolved URLs). */
  postedImages: ReadonlyArray<string>;
  /** Media already attached to the listing before this write. */
  existingMedia: ReadonlyArray<string>;
  /** The existing row's currency, when the listing exists. */
  existingCurrency?: string | null;
  openDisputeCount: number;
  locale: string;
  publicBaseUrl: PublicMediaBases;
  source?: "policy_engine" | "backfill";
  /** Staff acting for a store (or the backfill operator) may use their own uploads too. */
  extraUploaders?: ReadonlyArray<string>;
  aiScan?: ListingAiScan | null;
  /** Public URLs for the AI step, resolved by the caller (the gate never builds a URL itself). */
  resolveImageUrl?: (ref: string) => string | null;
  /**
   * Evaluate only: register no fingerprint, call no AI, record no verdict. The
   * result says what the gate WOULD decide and can authorise nothing (it carries
   * no verdict id). For the backfill's dry run.
   */
  dryRun?: boolean;
}

export interface ListingGateResult {
  /** False when the trust migration is not applied: run the legacy path instead. */
  available: boolean;
  /** The actor is not entitled to this store (the database said so). */
  unauthorized: boolean;
  verdict: GateVerdict;
  verdictId: string | null;
  seller: SellerGateState | null;
  /** The exact hashed values to write. Bound to `verdictId` when the outcome is publish. */
  row: HashedListingRow;
  /** Canonical media refs to persist, cover first. */
  refs: string[];
  fingerprintsMissing: number;
}

/**
 * Evaluate a listing and put the decision on the record.
 *
 * Order matters: the deterministic floor decides first; the AI step runs only
 * when that floor says "publish" and can only add a hold; the database then
 * re-checks the store and may tighten again. No later step can loosen an
 * earlier one.
 */
export async function runListingGate(admin: GateAdmin, request: ListingGateRequest): Promise<ListingGateResult> {
  const { draft } = request;

  const sellerRead = await readSellerGateState(admin, request.vendorId, draft.slug);
  const seller = sellerRead.state;

  const uploaders = await readStoreUploaders(admin, request.vendorId);
  const allowedUploaders = [
    ...uploaders,
    ...(seller?.vendor.ownerUserId ? [seller.vendor.ownerUserId] : []),
    ...(request.extraUploaders ?? []),
  ];

  const images = classifyImageSet({
    values: request.postedImages,
    publicBaseUrl: request.publicBaseUrl,
    allowedUploaders,
    grandfathered: request.existingMedia,
  });

  const isLiveEdit = seller?.product?.approvalStatus === "approved" && seller.product.vendorId === request.vendorId;
  const isNew = !seller?.product;

  const emptyRow = () =>
    buildListingRow({
      draft,
      vendorId: request.vendorId,
      vendor: request.vendor,
      refs: images.refs,
      listingRows: seller?.plan.listingRows ?? 0,
      openDisputeCount: request.openDisputeCount,
      duplicateImage: false,
      outcome: "hold",
      reasons: ["gate_unavailable"],
      currency: request.existingCurrency,
    });

  if (!sellerRead.available) {
    return {
      available: false,
      unauthorized: false,
      verdict: unavailableVerdict(),
      verdictId: null,
      seller: null,
      row: emptyRow(),
      refs: images.refs,
      fingerprintsMissing: 0,
    };
  }

  const [fingerprints, riskGated] = await Promise.all([
    request.dryRun
      ? Promise.resolve<FingerprintOutcome>({ hashes: [], missing: 0 })
      : ensureImageFingerprints(admin, { refs: images.refs, vendorId: request.vendorId, allowedUploaders }),
    readStaffRiskHold(admin, {
      accountId: seller?.vendor.ownerUserId ?? null,
      listingId: seller?.product?.id ?? null,
    }),
  ]);
  const matchRead = await readImageMatches(admin, { vendorId: request.vendorId, slug: draft.slug, refs: images.refs });
  const matches = matchRead ?? [];
  // A comparison that could not be made counts like a picture that could not be
  // fingerprinted: a store on probation does not publish on it.
  const notCompared = fingerprints.missing + (matchRead === null ? images.refs.length : 0);

  const policyInput: ListingGateInput = {
    listing: {
      slug: draft.slug,
      title: draft.title,
      summary: draft.summary,
      description: draft.description,
      sku: draft.sku,
      categorySlug: draft.categorySlug,
      basePrice: draft.basePrice,
      compareAtPrice: draft.compareAtPrice,
      deliveryNote: draft.deliveryNote,
      leadTime: draft.leadTime,
      specificationValues: [draft.material, draft.warranty],
    },
    images: {
      refs: images.refs,
      notFirstParty: images.notFirstParty,
      foreignRefs: images.foreignRefs,
      matches,
      hashes: fingerprints.hashes,
      knownBadHashes: knownBadImageHashes(),
      unfingerprinted: notCompared,
    },
    seller,
    vendor: request.vendor,
    riskGated,
    isLiveEdit,
    isNew,
    locale: request.locale,
  };

  // The floor is pure and should never throw; if it does, nothing publishes on it.
  let verdict: GateVerdict;
  try {
    verdict = evaluateListingPolicy(policyInput);
  } catch {
    verdict = unavailableVerdict();
  }

  // The AI step is consulted only on a deterministic "publish", and only to add.
  if (verdict.outcome === "publish" && request.aiScan && !request.dryRun) {
    let ai: AiScanResult | null = null;
    try {
      ai = await request.aiScan({
        actorId: request.actorId,
        vendorId: request.vendorId,
        slug: draft.slug,
        // Everything the deterministic rules read, so no field is screened by one layer only.
        text: listingText(policyInput.listing),
        imageUrls: images.refs
          .map((ref) => request.resolveImageUrl?.(ref) ?? null)
          .filter((url): url is string => typeof url === "string" && url.length > 0),
        locale: request.locale,
      });
    } catch {
      ai = null;
    }
    verdict = applyAiSignal(verdict, ai);
  }

  const duplicateImage =
    images.foreignRefs.length > 0 || matches.some((match) => match.relation !== "same_seller");
  const rowFor = (current: GateVerdict) =>
    buildListingRow({
      draft,
      vendorId: request.vendorId,
      vendor: request.vendor,
      refs: images.refs,
      listingRows: seller?.plan.listingRows ?? 0,
      openDisputeCount: request.openDisputeCount,
      duplicateImage,
      outcome: current.outcome,
      reasons: current.reasons,
      currency: request.existingCurrency,
    });

  let row = rowFor(verdict);
  if (request.dryRun) {
    return {
      available: true,
      unauthorized: false,
      verdict,
      verdictId: null,
      seller,
      row,
      refs: images.refs,
      fingerprintsMissing: 0,
    };
  }
  const recorded = await recordListingVerdict(admin, {
    actorId: request.actorId,
    vendorId: request.vendorId,
    row,
    refs: images.refs,
    verdict,
    source: request.source,
  });

  if (!recorded.ok) {
    if (recorded.missing) {
      return {
        available: false,
        unauthorized: false,
        verdict: unavailableVerdict(verdict),
        verdictId: null,
        seller,
        row: emptyRow(),
        refs: images.refs,
        fingerprintsMissing: fingerprints.missing,
      };
    }
    const failed = unavailableVerdict(verdict);
    return {
      available: true,
      unauthorized: recorded.unauthorized,
      verdict: failed,
      verdictId: null,
      seller,
      row: rowFor(failed),
      refs: images.refs,
      fingerprintsMissing: fingerprints.missing,
    };
  }

  const merged = mergeDbVerdict(verdict, { outcome: recorded.outcome, reasons: recorded.reasons });
  // The recorded hash covers `row` exactly as sent, so a publish writes that
  // object untouched. Only when the outcome is NOT publish — the row is then
  // written to a listing that is not live — is it rebuilt to carry the reasons.
  if (merged.outcome !== "publish") row = rowFor(merged);

  return {
    available: true,
    unauthorized: false,
    verdict: merged,
    verdictId: merged.outcome === "publish" ? recorded.verdictId : null,
    seller,
    row,
    refs: images.refs,
    fingerprintsMissing: fingerprints.missing,
  };
}
