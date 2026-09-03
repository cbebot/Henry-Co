import { NextResponse } from "next/server";
import { requireSensitiveAction } from "@henryco/auth/server/sensitive-action-guard";
import { setActingContext } from "@henryco/auth/server/acting-context";
import { createSupabaseServer } from "@/lib/supabase/server";
import { emitIntelligenceEvent, BusinessIntelEvents } from "@/lib/intelligence-rollout";
import { auditBusinessAction } from "@/lib/business-audit";
import { USER_FACING_SAVE, logApiError } from "@/lib/user-facing-error";

export const dynamic = "force-dynamic";

/**
 * V3-57 S2 — switch acting context (personal <-> business).
 *
 * requireSensitiveAction-guarded: a stolen session cannot silently assume a
 * business identity without a fresh-credential step-up. setActingContext
 * re-verifies membership server-side and throws (-> 403) if the caller is not a
 * member of the target business; the signed cookie never widens authority.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const guard = await requireSensitiveAction(request, {
      action: "business.context.switch",
      entityType: "business_context",
      resolveUser: async () => user,
      userId: (u) => u.id,
    });
    if (!guard.ok) return guard.response;

    const body = (await request.json().catch(() => ({}))) as {
      target?: string;
      businessId?: string;
    };
    const target =
      body?.target === "personal"
        ? ("personal" as const)
        : typeof body?.businessId === "string" && body.businessId
          ? { businessId: body.businessId }
          : null;
    if (!target) {
      return NextResponse.json({ error: "businessId or target required" }, { status: 400 });
    }

    let context;
    try {
      context = await setActingContext(user.id, target);
    } catch {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (context.kind === "business") {
      await auditBusinessAction({
        action: "business.context.switched",
        businessId: context.businessId,
        actorUserId: user.id,
        details: { role: context.role },
      });
      try {
        await emitIntelligenceEvent({
          name: BusinessIntelEvents.contextSwitched,
          division: "account",
          eventId: `business_context:${context.businessId}:${user.id}`,
          actor: { kind: "user", subjectRef: user.id, roleHint: context.role },
          properties: {
            title: "Business context switched",
            summary: "Member switched into a business context.",
            businessId: context.businessId,
            role: context.role,
          },
        });
      } catch {
        // telemetry is best-effort
      }
    }

    return NextResponse.json({ ok: true, context });
  } catch (error) {
    logApiError("business/context POST", error);
    return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
  }
}
