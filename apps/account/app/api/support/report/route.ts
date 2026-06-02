import { NextResponse } from "next/server";
import type { HenryEventEnvelope } from "@henryco/intelligence";
import { createAdminSupabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";
import { AccountIntelEvents, emitIntelligenceEvent } from "@/lib/intelligence-rollout";
import { getAccountAppLocale } from "@/lib/locale-server";
import { autoTranslate } from "@/lib/i18n/auto-translate";

type IntelDivision = HenryEventEnvelope["division"];

const ALLOWED_INTEL_DIVISIONS = new Set<IntelDivision>([
  "hub",
  "account",
  "care",
  "studio",
  "marketplace",
  "property",
  "logistics",
  "learn",
  "jobs",
  "hq",
  "staff",
  "system",
  "wallet",
]);

function toIntelDivision(value: string | null | undefined): IntelDivision {
  const normalized = String(value || "").trim().toLowerCase() as IntelDivision;
  return ALLOWED_INTEL_DIVISIONS.has(normalized) ? normalized : "account";
}

/**
 * Customer-side "Report this thread" action.
 *
 * The customer flags the thread for human review — the most common
 * use case is a staff response that needs escalation or a thread that
 * has drifted into the wrong division. The implementation emits an
 * intelligence event so operations + Linear can route it; no new
 * table is needed because the intelligence pipeline already surfaces
 * flags in the staff dashboard.
 *
 * Body: { threadId: string, reason?: string }
 * Response: { ok: true }
 */
export async function POST(request: Request) {
  const locale = await getAccountAppLocale();
  const tx = (s: string) => autoTranslate(s, locale);
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: await tx("Unauthorized") }, { status: 401 });
    }

    const payload = (await request.json().catch(() => ({}))) as {
      threadId?: unknown;
      reason?: unknown;
    };
    const threadId = String(payload.threadId || "").trim();
    const reason = String(payload.reason || "").trim().slice(0, 500);
    if (!threadId) {
      return NextResponse.json({ ok: false, error: await tx("Thread ID required") }, { status: 400 });
    }

    const admin = createAdminSupabase();
    const { data: thread } = await admin
      .from("support_threads")
      .select("id, user_id, division, subject")
      .eq("id", threadId)
      .eq("user_id", user.id)
      .maybeSingle<{
        id: string;
        user_id: string | null;
        division: string | null;
        subject: string | null;
      }>();
    if (!thread) {
      return NextResponse.json({ ok: false, error: await tx("Thread not found") }, { status: 404 });
    }

    try {
      await emitIntelligenceEvent({
        name: AccountIntelEvents.supportEscalated,
        division: toIntelDivision(thread.division),
        eventId: `support_report:${threadId}:${Date.now()}`,
        actor: { kind: "user", subjectRef: user.id, roleHint: "customer" },
        properties: {
          title: "Customer reported a support thread",
          summary:
            reason ||
            "The customer flagged this thread for human review from the support overflow menu.",
          threadId,
          subject: thread.subject || null,
          reason: reason || null,
          source: "support_overflow_menu",
        },
      });
    } catch {
      // Intelligence pipeline transient — still return ok so the UI
      // doesn't show a hard failure for a soft surface.
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: await tx("Internal error") }, { status: 500 });
  }
}
