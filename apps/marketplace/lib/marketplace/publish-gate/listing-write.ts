// V3-MKT-TRUST-01 — the instant-publish write path. SERVER ONLY.
//
// Called by the `vendor_product_upsert` handler when MARKETPLACE_INSTANT_PUBLISH
// is on and the seller pressed Publish. It runs the gate, then writes what the
// verdict allows:
//
//   publish → the listing is live when this returns
//   hold    → saved, not live, in the staff queue (a LIVE listing is left as it
//             is unless the seller asked for the edit to be sent for review)
//   reject  → nothing is written
//
// WRITE ORDER. The database guard checks, at the moment a row becomes live, that
// every attached image is one the verdict covers. So a listing that is not live
// yet is written in three steps — content (not live) → gallery → approve — and
// the last step is the only one that can make it live. If that step is refused
// the listing simply is not live; there is no half-published state to clean up.
// A listing that is already live is updated in place: the guard consumes the
// verdict on the content write, and the gallery is then synced against it.
//
// This module never sets `approval_status = 'approved'` without a verdict id in
// hand, but nothing depends on that: the guard would refuse the write anyway.

import "server-only";

import type { AppLocale } from "@henryco/i18n/server";
import { buildProductMediaRows } from "../product-images";
import type { MarketplaceVendor } from "../types";
import { emitGateEvent, outcomeToEvent } from "./events";
import type { PublicMediaBases } from "./image-refs";
import { withGateBlock, type ListingDraft } from "./listing-row";
import { gateNotice, type GateNotice } from "./messages";
import { unavailableVerdict, type GateVerdict } from "./policy";
import {
  blockingReasons,
  composeOutcome,
  isGateReasonCode,
  normalizeReasons,
  type GateOutcome,
  type GateReasonCode,
} from "./reasons";
import { guardHint, readStandingMediaRefs, runListingGate, type GateAdmin, type ListingAiScan } from "./server";

type DbError = { code?: string; message?: string; hint?: string; details?: string } | null;

interface MediaRow {
  id: string;
  url: string;
  sort_order: number | null;
  is_primary: boolean | null;
}

export interface InstantUpsertInput {
  admin: GateAdmin;
  actorId: string;
  vendorId: string;
  /** The store as the catalogue snapshot knows it (quality scoring only). */
  vendor: Partial<MarketplaceVendor> | null;
  draft: ListingDraft;
  stock: number;
  postedImages: ReadonlyArray<string>;
  /**
   * What to do when an edit of a LIVE listing is held:
   *   "keep"   — leave the live version untouched and say why (default);
   *   "review" — save the edit and take the listing to the staff queue.
   */
  onHold: "keep" | "review";
  locale: AppLocale;
  publicBaseUrl: PublicMediaBases;
  /** Staff acting for a store may attach their own uploads. */
  extraUploaders?: ReadonlyArray<string>;
  aiScan?: ListingAiScan | null;
  resolveImageUrl?: (ref: string) => string | null;
  /** "backfill" when the held backfill script re-runs a pending listing; recorded on the verdict. */
  source?: "policy_engine" | "backfill";
}

export type InstantUpsertResult =
  /** The trust migration is not applied: run the legacy review path. */
  | { kind: "legacy" }
  /** The database refused the actor for this store. */
  | { kind: "forbidden" }
  | {
      kind: "done";
      outcome: GateOutcome;
      reasons: GateReasonCode[];
      productId: string | null;
      /** The listing was live before this request. */
      wasLive: boolean;
      /** A live listing whose edit was not applied; the previous version is still live. */
      keptLive: boolean;
      /** Something was written to the listing. */
      written: boolean;
      notice: GateNotice;
    };

function planCapHit(error: DbError): boolean {
  return /marketplace_listing_cap_exceeded/i.test(String(error?.message ?? ""));
}

/** A refusal by the database, as reason codes. Unknown refusals hold. */
function reasonsFromDbError(error: DbError): GateReasonCode[] {
  if (planCapHit(error)) return ["plan_listing_limit"];
  if (error?.code === "23505") return ["listing_conflict"];
  const hint = guardHint(error);
  if (hint && isGateReasonCode(hint)) return [hint];
  return ["gate_unavailable"];
}

function tighten(verdict: GateVerdict, extra: ReadonlyArray<GateReasonCode>): GateVerdict {
  const reasons = normalizeReasons([...verdict.reasons, ...extra]);
  // A write the database refused can never come out as "publish".
  if (composeOutcome(reasons) === "publish") return unavailableVerdict(verdict);
  return { outcome: composeOutcome(reasons), reasons, signals: verdict.signals };
}

async function readGallery(admin: GateAdmin, productId: string): Promise<MediaRow[]> {
  const { data } = await admin
    .from("marketplace_product_media")
    .select("id, url, sort_order, is_primary")
    .eq("product_id", productId)
    .eq("kind", "image")
    .order("sort_order", { ascending: true });
  return ((data ?? []) as MediaRow[]).filter((row) => typeof row.url === "string" && row.url.length > 0);
}

/**
 * Bring the gallery to `refs` (cover first) without ever leaving the listing
 * without pictures: add what is new, then drop what is gone, then fix the order.
 * On a live listing the insert is checked by the media guard; if it is refused,
 * nothing has been removed yet.
 */
async function syncGallery(
  admin: GateAdmin,
  productId: string,
  current: ReadonlyArray<MediaRow>,
  refs: ReadonlyArray<string>,
): Promise<DbError> {
  if (refs.length === 0) return null;

  const keep = new Map<string, MediaRow>();
  const drop: string[] = [];
  for (const row of current) {
    if (refs.includes(row.url) && !keep.has(row.url)) keep.set(row.url, row);
    else drop.push(row.id);
  }

  const fresh = buildProductMediaRows(productId, [...refs]).filter((row) => !keep.has(row.url));
  if (fresh.length > 0) {
    const { error } = await admin.from("marketplace_product_media").insert(fresh as never);
    if (error) return error;
  }
  if (drop.length > 0) {
    const { error } = await admin.from("marketplace_product_media").delete().in("id", drop);
    if (error) return error;
  }
  for (const [index, ref] of refs.entries()) {
    const row = keep.get(ref);
    if (!row) continue;
    const primary = index === 0;
    if (row.sort_order === index && Boolean(row.is_primary) === primary) continue;
    const { error } = await admin
      .from("marketplace_product_media")
      .update({ sort_order: index, is_primary: primary } as never)
      .eq("id", row.id);
    if (error) return error;
  }
  return null;
}

export async function instantListingUpsert(input: InstantUpsertInput): Promise<InstantUpsertResult> {
  const { admin, draft } = input;

  const { data: existingRow } = await admin
    .from("marketplace_products")
    .select("id, vendor_id, approval_status, currency")
    .eq("slug", draft.slug)
    .maybeSingle();
  const existing = (existingRow ?? null) as {
    id: string;
    vendor_id: string | null;
    approval_status: string | null;
    currency: string | null;
  } | null;

  // The route refuses a cross-store slug before calling; this is the same check
  // again, because every write below is keyed on this row.
  if (existing && existing.vendor_id !== input.vendorId) {
    const reasons: GateReasonCode[] = ["listing_conflict"];
    await emitGateEvent({
      admin,
      name: "henry.marketplace.listing_gate.decided",
      outcome: "rejected",
      actorId: input.actorId,
      payload: { slug: draft.slug, vendorId: input.vendorId, reasons },
    });
    return {
      kind: "done",
      outcome: "reject",
      reasons,
      productId: null,
      wasLive: false,
      keptLive: false,
      written: false,
      notice: gateNotice({ locale: input.locale, outcome: "reject", reasons, liveEdit: false, keptLive: false, caps: null }),
    };
  }

  const [gallery, covered, disputes] = await Promise.all([
    existing ? readGallery(admin, existing.id) : Promise.resolve([] as MediaRow[]),
    existing ? readStandingMediaRefs(admin, existing.id) : Promise.resolve([] as string[]),
    admin
      .from("marketplace_disputes")
      .select("id", { count: "exact", head: true })
      .eq("vendor_id", input.vendorId)
      .in("status", ["open", "investigating"]),
  ]);
  const existingMedia = gallery.map((row) => row.url);
  // Only pictures the listing's standing verdict covers may be kept unchecked. A
  // row that was never live has none: whatever a draft save attached to it —
  // an outside URL, another store's upload — is judged as newly posted.
  const coveredMedia = existingMedia.filter((url) => covered.includes(url));

  const gate = await runListingGate(admin, {
    actorId: input.actorId,
    vendorId: input.vendorId,
    vendor: input.vendor,
    draft,
    // An edit that posts no images keeps the gallery it has.
    postedImages: input.postedImages.length > 0 ? input.postedImages : existingMedia,
    existingMedia: coveredMedia,
    existingCurrency: existing?.currency ?? null,
    openDisputeCount: disputes.count ?? 0,
    locale: input.locale,
    publicBaseUrl: input.publicBaseUrl,
    extraUploaders: input.extraUploaders,
    aiScan: input.aiScan,
    resolveImageUrl: input.resolveImageUrl,
    source: input.source,
  });

  if (!gate.available) {
    await emitGateEvent({
      admin,
      name: "henry.marketplace.listing_gate.decided",
      outcome: "failed",
      actorId: input.actorId,
      payload: { slug: draft.slug, vendorId: input.vendorId, why: "gate_not_installed", path: "legacy_review" },
    });
    return { kind: "legacy" };
  }
  if (gate.unauthorized) {
    await emitGateEvent({
      admin,
      name: "henry.marketplace.listing_gate.decided",
      outcome: "blocked",
      actorId: input.actorId,
      payload: { slug: draft.slug, vendorId: input.vendorId, why: "actor_not_authorized" },
    });
    return { kind: "forbidden" };
  }

  const wasLive = existing?.approval_status === "approved";
  let verdict = gate.verdict;
  let productId = existing?.id ?? null;
  let written = false;
  let keptLive = false;
  let gallerySyncFailed = false;

  const base = { ...gate.row, total_stock: input.stock, status: "active" };

  /** Save the listing as not-live, in the staff queue. */
  const saveNotLive = async (): Promise<DbError> => {
    if (existing) {
      const { error } = await admin
        .from("marketplace_products")
        .update({ ...base, approval_status: "under_review" } as never)
        .eq("id", existing.id);
      if (error) return error;
    } else {
      const { data, error } = await admin
        .from("marketplace_products")
        .insert({ ...base, approval_status: "under_review" } as never)
        .select("id")
        .maybeSingle();
      if (error) return error;
      productId = data?.id ? String(data.id) : null;
      if (!productId) return { message: "listing row was not returned" };
    }
    written = true;
    return syncGallery(admin, productId as string, gallery, gate.refs);
  };

  /** After a refused go-live: make the stored row say what actually happened. */
  const correctStoredRow = async (current: GateVerdict) => {
    if (!productId) return;
    await admin
      .from("marketplace_products")
      .update({
        approval_status: current.outcome === "reject" ? "draft" : "under_review",
        filter_data: withGateBlock(gate.row.filter_data, current.outcome, current.reasons),
      } as never)
      .eq("id", productId);
  };

  if (verdict.outcome === "publish") {
    if (wasLive && existing) {
      // In place. The guard matches the verdict to this exact content and consumes it.
      const { error } = await admin
        .from("marketplace_products")
        .update({ ...base, approval_status: "approved" } as never)
        .eq("id", existing.id);
      if (error) {
        // Refused atomically: the previous version is still live.
        verdict = tighten(verdict, reasonsFromDbError(error));
        keptLive = true;
      } else {
        written = true;
        // The text is live under its verdict. If the gallery cannot follow, nothing
        // uncovered was attached and the previous pictures are still there; it is
        // retried once and then reported in the event, not dressed up as a hold.
        let mediaError = await syncGallery(admin, existing.id, gallery, gate.refs);
        if (mediaError) {
          mediaError = await syncGallery(admin, existing.id, await readGallery(admin, existing.id), gate.refs);
        }
        gallerySyncFailed = mediaError !== null;
      }
    } else {
      // Staged in the staff queue first: if the last step is refused (or never
      // runs), a person can still decide it — it is never stranded half-live.
      const stageError = await saveNotLive();
      if (stageError) {
        verdict = tighten(verdict, reasonsFromDbError(stageError));
        await correctStoredRow(verdict);
      } else {
        const { error } = await admin
          .from("marketplace_products")
          .update({ approval_status: "approved" } as never)
          .eq("id", productId as string);
        if (error) {
          // e.g. a probation cap reached between the verdict and this write.
          verdict = tighten(verdict, reasonsFromDbError(error));
          await correctStoredRow(verdict);
        }
      }
    }
  } else if (verdict.outcome === "hold") {
    if (wasLive && input.onHold !== "review") {
      keptLive = true;
    } else {
      const holdError = await saveNotLive();
      if (holdError) verdict = tighten(verdict, reasonsFromDbError(holdError));
    }
  } else if (wasLive) {
    keptLive = true;
  }

  // A listing that just went live has nothing left for the staff queue to decide.
  if (verdict.outcome === "publish" && productId) {
    try {
      await admin
        .from("marketplace_moderation_cases")
        .update({ status: "resolved", decision: "cleared_by_gate" } as never)
        .eq("subject_type", "product")
        .eq("subject_id", productId)
        .eq("status", "open");
    } catch {
      // The queue table is optional on older databases.
    }
  }

  const reasons = normalizeReasons(verdict.reasons);
  const outcome = verdict.outcome;

  await emitGateEvent({
    admin,
    name: "henry.marketplace.listing_gate.decided",
    outcome: outcomeToEvent(outcome),
    actorId: input.actorId,
    payload: {
      slug: draft.slug,
      vendorId: input.vendorId,
      productId,
      reasons,
      wasLive,
      keptLive,
      written,
      probation: verdict.signals.probationActive,
      aiConsulted: verdict.signals.aiConsulted,
      fingerprintsMissing: gate.fingerprintsMissing,
      gallerySyncFailed,
    },
  });

  const notice = gateNotice({
    locale: input.locale,
    outcome,
    reasons: blockingReasons(reasons),
    liveEdit: wasLive,
    keptLive,
    caps: gate.seller?.probation.caps ?? null,
  });

  return { kind: "done", outcome, reasons, productId, wasLive, keptLive, written, notice };
}
