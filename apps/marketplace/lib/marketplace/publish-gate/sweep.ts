// V3-MKT-TRUST-01 — post-publish enforcement. SERVER ONLY.
//
// Instant publish moves the check from before a listing is live to the moment it
// goes live — and keeps checking afterwards. This sweep is the "afterwards". It
// runs from the existing hourly automation cron, only when the flag is on, and
// it can do exactly ONE thing to a listing: take it down for review through
// marketplace_gate_hide_listing(). That moves the listing to `under_review` and
// records why. It deletes nothing, suspends no one, touches no money, and a
// staff approval puts the listing back.
//
// Three triggers, all deterministic evidence — never a score, never the AI:
//
//   policy   the content ruleset moved since the listing was let through, and the
//            listing now breaks an unambiguous rule. ONLY for listings the engine
//            approved: a listing a person approved goes back to a person.
//   reports  three or more independent buyers reported it in fourteen days.
//   risk     staff applied a V3-40 hold/freeze to the listing in the risk console.
//            This mirrors a human decision; the sweep never creates one (V3-40's
//            own rule: the system may only flag).
//
// A take-down that staff resolved is not repeated on the same evidence. Each
// take-down records the newest piece of evidence it was based on (the latest
// report, the hold's own timestamp); after staff resolve it, only evidence NEWER
// than that counts. The comparison is always between two timestamps from the
// SAME table, so it does not depend on any two tables agreeing on a clock.

import "server-only";

import { runDeterministic } from "@henryco/moderation";
import { formatMarketplaceTrustTemplate, getMarketplaceTrustCopy } from "@henryco/i18n/server";
import { isSensitiveActionGated, type ActiveEnforcement } from "@henryco/intelligence";
import { sendMarketplaceEvent } from "../notifications";
import { emitGateEvent } from "./events";
import { describeReasons } from "./messages";
import {
  REPORTS_HIDE_THRESHOLD,
  REPORTS_WINDOW_DAYS,
  codesFromModerationDetail,
  countIndependentReporters,
  listingText,
  rescanDecision,
} from "./policy";
import { GATE_ENGINE_VERSION } from "./reasons";
import { isMissingRpc, riskSystemLive, type GateAdmin } from "./server";

export interface TrustSweepSummary {
  /** False when the trust migration is not applied; nothing was done. */
  available: boolean;
  scanned: number;
  cleared: number;
  /** Sent to the human queue without being taken down. */
  flaggedForReview: number;
  hiddenPolicy: number;
  hiddenReports: number;
  hiddenRisk: number;
  errors: number;
}

type HideKind = "policy" | "reports" | "risk";

interface ProductRow {
  id: string;
  slug: string;
  vendor_id: string | null;
  title: string | null;
  summary: string | null;
  description: string | null;
  sku: string | null;
  delivery_note: string | null;
  lead_time: string | null;
  specifications: Record<string, unknown> | null;
  approval_status: string | null;
}

const PRODUCT_COLUMNS =
  "id, slug, vendor_id, title, summary, description, sku, delivery_note, lead_time, specifications, approval_status";
const RESCAN_BATCH = 100;

function specificationValues(specifications: Record<string, unknown> | null): string[] {
  if (!specifications || typeof specifications !== "object") return [];
  return Object.values(specifications).filter((value): value is string => typeof value === "string");
}

async function openCase(admin: GateAdmin, input: { productId: string; vendorId: string | null; queue: string; note: string }) {
  try {
    await admin.from("marketplace_moderation_cases").insert({
      subject_type: "product",
      subject_id: input.productId,
      queue: input.queue,
      status: "open",
      note: input.note,
      vendor_id: input.vendorId,
    } as never);
  } catch {
    // The queue table is optional on older databases.
  }
}

/** The one enforcement action. Returns true when the listing was actually taken down. */
async function hideListing(
  admin: GateAdmin,
  product: ProductRow,
  kind: HideKind,
  reasons: ReadonlyArray<string>,
  evidence: Record<string, unknown>,
): Promise<boolean> {
  const { data, error } = await admin.rpc("marketplace_gate_hide_listing", {
    p_product_id: product.id,
    p_kind: kind,
    p_reasons: [...reasons],
    p_evidence: evidence,
    p_engine_version: GATE_ENGINE_VERSION,
  });
  if (error) throw new Error(error.message ?? "hide failed");
  const hidden = Boolean((data as { hidden?: unknown } | null)?.hidden);
  if (!hidden) return false;

  await emitGateEvent({
    admin,
    name: "henry.marketplace.listing_gate.hidden",
    outcome: "removed",
    actorId: null,
    payload: { productId: product.id, slug: product.slug, vendorId: product.vendor_id, kind, reasons: [...reasons] },
  });
  await openCase(admin, {
    productId: product.id,
    vendorId: product.vendor_id,
    queue: "listing_auto_hidden",
    note: `gate take-down (${kind}): ${reasons.join(", ")}`,
  });
  await notifySeller(admin, product, kind, reasons);
  return true;
}

async function notifySeller(admin: GateAdmin, product: ProductRow, kind: HideKind, reasons: ReadonlyArray<string>) {
  if (!product.vendor_id) return;
  try {
    const { data: vendor } = await admin
      .from("marketplace_vendors")
      .select("owner_user_id, support_email, support_phone")
      .eq("id", product.vendor_id)
      .maybeSingle();
    const owner = vendor as { owner_user_id?: string | null; support_email?: string | null; support_phone?: string | null } | null;
    if (!owner?.owner_user_id && !owner?.support_email) return;

    // English source copy; the notification pipeline localizes it for the recipient.
    const copy = getMarketplaceTrustCopy("en");
    const labels = describeReasons({ reasons, caps: null, locale: "en", copy }).map((reason) => reason.label);
    const why =
      labels.length > 0
        ? labels.join(copy.result.reasonSeparator)
        : kind === "reports"
          ? copy.hide.reportsReason
          : kind === "risk"
            ? copy.hide.riskReason
            : copy.status.hidden;
    const note = `${formatMarketplaceTrustTemplate(copy.hide.noticeBody, {
      title: product.title ?? product.slug,
      reasons: why,
    })} ${kind === "policy" ? copy.hide.fixHint : copy.hide.reviewHint}`;

    await sendMarketplaceEvent({
      event: "product_changes_requested",
      userId: owner.owner_user_id ?? null,
      recipientEmail: owner.support_email ?? null,
      recipientPhone: owner.support_phone ?? null,
      actorUserId: null,
      actorEmail: null,
      entityType: "product",
      entityId: product.id,
      payload: { productTitle: product.title ?? product.slug, note },
    });
  } catch {
    // A notice that could not be sent does not undo the take-down.
  }
}

async function loadProducts(admin: GateAdmin, ids: ReadonlyArray<string>): Promise<Map<string, ProductRow>> {
  const map = new Map<string, ProductRow>();
  if (ids.length === 0) return map;
  const { data } = await admin.from("marketplace_products").select(PRODUCT_COLUMNS).in("id", [...ids]);
  for (const row of (data ?? []) as ProductRow[]) map.set(String(row.id), row);
  return map;
}

/**
 * For each product: the evidence watermark of its last RESOLVED take-down of this
 * kind — the timestamp (in the evidence's own table clock) up to which evidence
 * has already been judged by a person.
 */
async function judgedUpTo(
  admin: GateAdmin,
  productIds: ReadonlyArray<string>,
  kind: HideKind,
  key: "lastReportAt" | "holdAt",
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (productIds.length === 0) return map;
  try {
    const { data } = await admin
      .from("marketplace_listing_enforcement")
      .select("product_id, evidence, resolved_at")
      .in("product_id", [...productIds])
      .eq("kind", kind)
      .in("status", ["lifted", "upheld"])
      .order("resolved_at", { ascending: false });
    type Row = { product_id: string; evidence: Record<string, unknown> | null; resolved_at: string | null };
    for (const row of (data ?? []) as Row[]) {
      const productId = String(row.product_id);
      if (map.has(productId)) continue;
      const mark = row.evidence && typeof row.evidence[key] === "string" ? (row.evidence[key] as string) : null;
      if (mark) map.set(productId, mark);
    }
  } catch {
    // Without the history, evidence is simply counted in full.
  }
  return map;
}

// ---------------------------------------------------------------------------
// 1. Policy re-scan
// ---------------------------------------------------------------------------

async function sweepPolicy(admin: GateAdmin, summary: TrustSweepSummary): Promise<boolean> {
  const { data, error } = await admin.rpc("marketplace_gate_rescan_candidates", {
    p_engine_version: GATE_ENGINE_VERSION,
    p_limit: RESCAN_BATCH,
  });
  if (error) {
    if (isMissingRpc(error)) return false;
    summary.errors += 1;
    return true;
  }
  const candidates = (Array.isArray(data) ? data : []) as Array<{ product_id: string; origin: string | null }>;
  const products = await loadProducts(
    admin,
    candidates.map((candidate) => String(candidate.product_id)),
  );

  for (const candidate of candidates) {
    const product = products.get(String(candidate.product_id));
    if (!product || product.approval_status !== "approved") continue;
    summary.scanned += 1;
    try {
      const content = runDeterministic(
        {
          contentType: "marketplace_listing",
          contentId: product.id,
          text: listingText({
            title: product.title ?? "",
            summary: product.summary ?? "",
            description: product.description ?? "",
            sku: product.sku ?? "",
            categorySlug: "",
            basePrice: 0,
            compareAtPrice: null,
            deliveryNote: product.delivery_note ?? "",
            leadTime: product.lead_time ?? "",
            specificationValues: specificationValues(product.specifications),
          }),
          locale: "en",
        },
        { ruleset: "listing_v2" },
      );
      const detail = content.detail ?? [];
      const decision = rescanDecision({ codes: codesFromModerationDetail(detail), origin: candidate.origin });

      if (decision.action === "hide") {
        const hidden = await hideListing(admin, product, "policy", decision.reasons, { detail: [...detail] });
        if (hidden) summary.hiddenPolicy += 1;
        continue; // a hidden listing has no standing verdict to refresh
      }
      if (decision.action === "review") {
        await openCase(admin, {
          productId: product.id,
          vendorId: product.vendor_id,
          queue: "product_risk_review",
          note: `gate re-scan (not taken down): ${decision.reasons.join(", ")}`,
        });
        summary.flaggedForReview += 1;
      } else {
        summary.cleared += 1;
      }
      // Either way the listing has now been read under the current ruleset.
      const refreshed = await admin.rpc("marketplace_gate_record_rescan", {
        p_product_id: product.id,
        p_engine_version: GATE_ENGINE_VERSION,
      });
      if (refreshed.error) summary.errors += 1;
    } catch {
      summary.errors += 1;
    }
  }
  return true;
}

// ---------------------------------------------------------------------------
// 2. Reports
// ---------------------------------------------------------------------------

/** A reporter's account must be at least this old to count towards a take-down. */
export const REPORTER_MIN_ACCOUNT_AGE_DAYS = 7;

async function sweepReports(admin: GateAdmin, summary: TrustSweepSummary, now: Date): Promise<void> {
  const windowStart = new Date(now.getTime() - REPORTS_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  let rows: Array<{ content_id: string; reporter_id: string | null; reason_code: string; created_at: string }> = [];
  try {
    const { data, error } = await admin
      .from("moderation_reports")
      .select("content_id, reporter_id, reason_code, created_at")
      .eq("content_type", "marketplace_listing")
      .in("status", ["open", "reviewing"])
      .gte("created_at", windowStart)
      .order("created_at", { ascending: false })
      .limit(2000);
    if (error) return; // the reports table is optional
    rows = (data ?? []) as typeof rows;
  } catch {
    return;
  }
  if (rows.length === 0) return;

  // A report names a listing by id or by slug.
  const keys = Array.from(new Set(rows.map((row) => String(row.content_id))));
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const ids = keys.filter((key) => uuid.test(key));
  const slugs = keys.filter((key) => !uuid.test(key));
  const byKey = new Map<string, ProductRow>();
  if (ids.length > 0) {
    const { data } = await admin.from("marketplace_products").select(PRODUCT_COLUMNS).in("id", ids);
    for (const row of (data ?? []) as ProductRow[]) byKey.set(String(row.id), row);
  }
  if (slugs.length > 0) {
    const { data } = await admin.from("marketplace_products").select(PRODUCT_COLUMNS).in("slug", slugs);
    for (const row of (data ?? []) as ProductRow[]) byKey.set(String(row.slug), row);
  }

  const reportsByProduct = new Map<string, { product: ProductRow; reports: typeof rows }>();
  for (const row of rows) {
    const product = byKey.get(String(row.content_id));
    if (!product || product.approval_status !== "approved") continue;
    const entry = reportsByProduct.get(product.id) ?? { product, reports: [] };
    entry.reports.push(row);
    reportsByProduct.set(product.id, entry);
  }
  if (reportsByProduct.size === 0) return;

  // Other sellers do not count towards a take-down: a competitor (or a ring of
  // them) must not be able to pull a rival's listing by reporting it.
  const reporterIds = Array.from(new Set(rows.map((row) => row.reporter_id).filter((id): id is string => Boolean(id))));
  // Nor do accounts made for the purpose: a reporter counts only when the account
  // existed for a week before the first report in the window. If either read
  // fails, nothing is taken down on this pass — a take-down is never decided on
  // a list of reporters that could not be checked.
  const sellers = new Set<string>();
  try {
    const { data, error } = await admin
      .from("marketplace_role_memberships")
      .select("user_id")
      .eq("role", "vendor")
      .eq("is_active", true)
      .in("user_id", reporterIds);
    if (error) return;
    for (const row of (data ?? []) as Array<{ user_id: string | null }>) if (row.user_id) sellers.add(String(row.user_id));

    // The account's age comes from the account itself (auth), through a gate
    // function — a profile row is its owner's to edit, dates included.
    const established = new Set<string>();
    const { data: accounts, error: ageError } = await admin.rpc("marketplace_gate_established_accounts", {
      p_users: reporterIds,
      p_min_age_days: REPORTER_MIN_ACCOUNT_AGE_DAYS,
    });
    if (ageError || !Array.isArray(accounts)) return;
    for (const value of accounts as unknown[]) {
      const id = typeof value === "string" ? value : (value as { marketplace_gate_established_accounts?: unknown })?.marketplace_gate_established_accounts;
      if (typeof id === "string") established.add(id);
    }
    for (const id of reporterIds) if (!established.has(id)) sellers.add(id);
  } catch {
    return;
  }

  const judged = await judgedUpTo(admin, Array.from(reportsByProduct.keys()), "reports", "lastReportAt");

  for (const { product, reports } of reportsByProduct.values()) {
    try {
      const independent = countIndependentReporters(
        reports.map((report) => ({ reporterId: report.reporter_id, createdAt: report.created_at })),
        { since: judged.get(product.id) ?? null, excluded: sellers },
      );
      if (independent < REPORTS_HIDE_THRESHOLD) continue;
      // `reports` is newest-first: the first row is the newest evidence used.
      const hidden = await hideListing(admin, product, "reports", ["reports_threshold"], {
        reporters: independent,
        windowDays: REPORTS_WINDOW_DAYS,
        reasonCodes: Array.from(new Set(reports.map((report) => report.reason_code))).slice(0, 12),
        lastReportAt: reports[0]?.created_at ?? null,
      });
      if (hidden) summary.hiddenReports += 1;
    } catch {
      summary.errors += 1;
    }
  }
}

// ---------------------------------------------------------------------------
// 3. Staff risk holds (V3-40) — mirrored, never created
// ---------------------------------------------------------------------------

async function sweepRisk(admin: GateAdmin, summary: TrustSweepSummary): Promise<void> {
  if (!riskSystemLive()) return;
  type LogRow = {
    entity_id: string;
    action: string;
    actor: string;
    model_kind: string;
    model_version: string;
    created_at: string;
  };
  let rows: LogRow[] = [];
  try {
    const { data, error } = await admin
      .from("risk_enforcement_log")
      .select("entity_id, action, actor, model_kind, model_version, created_at, id")
      .eq("entity_type", "listing")
      .in("action", ["hold", "freeze", "release", "staff_override"])
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(1000);
    if (error) return; // the risk tables are optional
    rows = (data ?? []) as LogRow[];
  } catch {
    return;
  }

  // The latest user-affecting action per listing is its current state.
  const latest = new Map<string, LogRow>();
  for (const row of rows) if (!latest.has(String(row.entity_id))) latest.set(String(row.entity_id), row);
  const held = Array.from(latest.values()).filter((row) => row.action === "hold" || row.action === "freeze");
  if (held.length === 0) return;

  const modelStatus = new Map<string, string>();
  try {
    const { data } = await admin.from("model_versions").select("model_kind, version, status");
    for (const row of (data ?? []) as Array<{ model_kind: string; version: string; status: string }>) {
      modelStatus.set(`${row.model_kind}:${row.version}`, row.status);
    }
  } catch {
    return;
  }

  const products = await loadProducts(admin, held.map((row) => String(row.entity_id)));
  const judged = await judgedUpTo(admin, Array.from(products.keys()), "risk", "holdAt");

  for (const row of held) {
    const product = products.get(String(row.entity_id));
    if (!product || product.approval_status !== "approved") continue;
    const status = modelStatus.get(`${row.model_kind}:${row.model_version}`);
    const enforcement: ActiveEnforcement = {
      state: row.action as "hold" | "freeze",
      appliedByStaff: row.actor !== "system",
      modelStatus:
        status === "live" || status === "shadow" || status === "rolled_back" || status === "retired" ? status : "retired",
    };
    // Only a STAFF-applied hold under a LIVE model counts (V3-40's own gate).
    if (!isSensitiveActionGated(enforcement)) continue;
    // Staff already restored this listing over THIS hold: it stays up until a NEW one.
    const since = judged.get(product.id);
    if (since && new Date(row.created_at).getTime() <= new Date(since).getTime()) continue;
    try {
      const hidden = await hideListing(admin, product, "risk", ["risk_hold_active"], {
        state: row.action,
        holdAt: row.created_at,
      });
      if (hidden) summary.hiddenRisk += 1;
    } catch {
      summary.errors += 1;
    }
  }
}

export async function runListingTrustSweep(admin: GateAdmin, now = new Date()): Promise<TrustSweepSummary> {
  const summary: TrustSweepSummary = {
    available: true,
    scanned: 0,
    cleared: 0,
    flaggedForReview: 0,
    hiddenPolicy: 0,
    hiddenReports: 0,
    hiddenRisk: 0,
    errors: 0,
  };

  const installed = await sweepPolicy(admin, summary);
  if (!installed) return { ...summary, available: false };

  await sweepReports(admin, summary, now).catch(() => {
    summary.errors += 1;
  });
  await sweepRisk(admin, summary).catch(() => {
    summary.errors += 1;
  });

  await emitGateEvent({
    admin,
    name: "henry.marketplace.listing_gate.swept",
    outcome: summary.errors > 0 ? "failed" : "completed",
    actorId: null,
    payload: { ...summary, engine: GATE_ENGINE_VERSION },
  });
  return summary;
}
