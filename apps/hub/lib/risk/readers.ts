// V3-40 — bounded, best-effort entity feature readers (server-only).
//
// The engine is DB-less; these readers are the only place the batch touches data,
// and every one of them:
//   * is BOUNDED (hard row limits — a runaway fleet can never unbound the batch),
//   * is BEST-EFFORT (an absent table / query error → that entity type contributes
//     zero entities this run, recorded honestly in the run counts — the pre-data /
//     pre-apply degrade posture),
//   * emits only ids + numbers + severity words into features — labels, emails,
//     free text NEVER enter a feature value (factors land in a staff-readable
//     table; PII stays out by construction).
//
// Data reality (BUILD-PLAN honesty rule): several entity domains are pre-data;
// per-entity-type sample sizes surface in risk_batch_runs.counts so the shadow
// validation report states them rather than pretending volume exists.

import "server-only";

import { detectOffPlatformContact, detectSuspiciousContent } from "@henryco/trust";
import type { RiskFeatures, RiskSignal } from "@henryco/intelligence";
import { getSecurityThreatData } from "@/lib/owner-data";
import { createAdminSupabase } from "@/lib/supabase";
import { threatInvolvementsByAccount } from "./watchtower-features";

export interface RiskEntityCandidate {
  entityType: "account" | "listing" | "transaction" | "support_ticket";
  entityId: string;
  features: RiskFeatures;
}

const LISTING_LIMIT = 400;
const TRANSACTION_LIMIT = 400;
const SUPPORT_LIMIT = 400;
const SECURITY_EVENT_LIMIT = 5000;

function signal(
  type: RiskSignal["type"],
  severity: RiskSignal["severity"],
  subjectRef: string,
  recordedAt: string,
): RiskSignal {
  return { id: `${type}:${subjectRef}`, type, severity, subjectRef, recordedAt, metadataKeys: [] };
}

/** Accounts: watchtower involvement + 24h security-event velocity. */
export async function readAccountCandidates(now: Date): Promise<RiskEntityCandidate[]> {
  try {
    const assessment = await getSecurityThreatData();
    const byAccount = threatInvolvementsByAccount(assessment);
    if (byAccount.size === 0) return [];

    // 24h per-account event velocity — one bounded query, grouped in TS.
    const velocity = new Map<string, number>();
    try {
      const admin = createAdminSupabase();
      const since = new Date(now.getTime() - 24 * 3_600_000).toISOString();
      const { data } = await admin
        .from("customer_security_log")
        .select("user_id")
        .gte("created_at", since)
        .limit(SECURITY_EVENT_LIMIT);
      for (const row of (data ?? []) as { user_id: string | null }[]) {
        if (!row.user_id) continue;
        velocity.set(row.user_id, (velocity.get(row.user_id) ?? 0) + 1);
      }
    } catch {
      /* velocity is optional enrichment */
    }

    return Array.from(byAccount.entries()).map(([userId, threats]) => ({
      entityType: "account" as const,
      entityId: userId,
      features: {
        signals: [],
        threats,
        behavioral: { velocity_events_24h: velocity.get(userId) ?? 0 },
      },
    }));
  } catch {
    return [];
  }
}

/** Listings: content-signal floor over active marketplace products (@henryco/trust). */
export async function readListingCandidates(): Promise<RiskEntityCandidate[]> {
  try {
    const admin = createAdminSupabase();
    const { data, error } = await admin
      .from("marketplace_products")
      .select("id, title, description, summary, status, created_at")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(LISTING_LIMIT);
    if (error || !data) return [];
    const candidates: RiskEntityCandidate[] = [];
    for (const row of data as {
      id: string;
      title: string | null;
      description: string | null;
      summary: string | null;
      created_at: string;
    }[]) {
      const text = [row.title, row.summary, row.description].filter(Boolean).join("\n");
      if (!text) continue;
      const suspicious = detectSuspiciousContent(text);
      const offPlatform = detectOffPlatformContact(text);
      const signals: RiskSignal[] = [];
      if (suspicious.detected) {
        signals.push(signal("listing_spam_pattern", suspicious.severity, row.id, row.created_at));
      }
      if (offPlatform.detected) {
        signals.push(signal("listing_spam_pattern", offPlatform.severity, row.id, row.created_at));
      }
      if (signals.length === 0) continue; // only surface listings with a real signal
      candidates.push({
        entityType: "listing",
        entityId: row.id,
        features: { signals },
      });
    }
    return candidates;
  } catch {
    return [];
  }
}

/** Open transactions: pending payment intents; per-payer 24h intent velocity. */
export async function readTransactionCandidates(now: Date): Promise<RiskEntityCandidate[]> {
  try {
    const admin = createAdminSupabase();
    const { data, error } = await admin
      .from("payment_intents")
      .select("id, user_id, status, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(TRANSACTION_LIMIT);
    if (error || !data) return [];
    const rows = data as { id: string; user_id: string; status: string; created_at: string }[];
    const dayAgo = now.getTime() - 24 * 3_600_000;
    const perUser24h = new Map<string, number>();
    for (const row of rows) {
      const t = new Date(row.created_at).getTime();
      if (Number.isFinite(t) && t >= dayAgo) {
        perUser24h.set(row.user_id, (perUser24h.get(row.user_id) ?? 0) + 1);
      }
    }
    return rows.map((row) => {
      const burst = perUser24h.get(row.user_id) ?? 0;
      const signals: RiskSignal[] =
        burst >= 3
          ? [signal("wallet_velocity_anomaly", burst >= 6 ? "high" : "medium", row.id, row.created_at)]
          : [];
      return {
        entityType: "transaction" as const,
        entityId: row.id,
        features: { signals, behavioral: { velocity_events_24h: burst } },
      };
    });
  } catch {
    return [];
  }
}

/** Open support tickets: per-requester thread velocity as the abuse floor. */
export async function readSupportTicketCandidates(now: Date): Promise<RiskEntityCandidate[]> {
  try {
    const admin = createAdminSupabase();
    const { data, error } = await admin
      .from("support_threads")
      .select("id, user_id, status, created_at")
      .is("resolved_at", null)
      .is("closed_at", null)
      .order("created_at", { ascending: false })
      .limit(SUPPORT_LIMIT);
    if (error || !data) return [];
    const rows = data as { id: string; user_id: string; status: string; created_at: string }[];
    const weekAgo = now.getTime() - 7 * 86_400_000;
    const perUser7d = new Map<string, number>();
    for (const row of rows) {
      const t = new Date(row.created_at).getTime();
      if (Number.isFinite(t) && t >= weekAgo) {
        perUser7d.set(row.user_id, (perUser7d.get(row.user_id) ?? 0) + 1);
      }
    }
    return rows.map((row) => {
      const burst = perUser7d.get(row.user_id) ?? 0;
      const signals: RiskSignal[] =
        burst >= 5
          ? [signal("support_abuse_pattern", burst >= 10 ? "high" : "medium", row.id, row.created_at)]
          : [];
      return {
        entityType: "support_ticket" as const,
        entityId: row.id,
        features: { signals, behavioral: { velocity_events_24h: burst } },
      };
    });
  } catch {
    return [];
  }
}
