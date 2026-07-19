import { NextResponse } from "next/server";
import { emitEvent, persistEvent } from "@henryco/observability";
import { PERSONALIZATION_CONSENT_TEXT_VERSION } from "@henryco/ui/public";
import { createAdminSupabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";
import { ensureAccountProfileRecords } from "@/lib/account-profile";
import { USER_FACING_SAVE, logApiError } from "@/lib/user-facing-error";

const ALLOWED_FIELDS = [
  "email_marketing", "email_transactional", "email_digest", "push_enabled",
  "sms_enabled", "notification_care", "notification_marketplace",
  "notification_studio", "notification_wallet", "notification_security", "theme",
  "whatsapp_enabled", "notification_jobs", "notification_learn",
  "notification_property", "notification_logistics", "notification_referrals",
  "default_division", "in_app_toast_enabled", "notification_sound_enabled",
  "notification_vibration_enabled", "high_priority_only", "quiet_hours_enabled",
  "quiet_hours_start", "quiet_hours_end",
  // V3-34 — account-scoped NDPR personalization consent (governs profiling).
  "personalization_enabled",
];

function normalizeTimeValue(value: unknown) {
  if (typeof value !== "string") return null;

  const raw = value.trim();
  const match = raw.match(/^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/);
  if (!match) return null;

  return `${match[1]}:${match[2]}:00`;
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureAccountProfileRecords(user);

    const body = await request.json();

    // Only allow known fields
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of ALLOWED_FIELDS) {
      if (!(key in body)) continue;

      if (key === "quiet_hours_start" || key === "quiet_hours_end") {
        const normalizedTime = normalizeTimeValue(body[key]);
        if (normalizedTime) {
          updates[key] = normalizedTime;
        }
        continue;
      }

      // V3-34 — the personalization consent flag is a strict boolean (only a
      // literal `true` grants profiling; anything else is a withhold).
      if (key === "personalization_enabled") {
        updates[key] = body[key] === true;
        continue;
      }

      updates[key] = body[key];
    }

    const admin = createAdminSupabase();

    // V3-34 — capture the prior consent state BEFORE the upsert so the NDPR
    // ledger records an actual CHANGE, not every save (no-op de-dup).
    let priorPersonalization: boolean | null = null;
    if ("personalization_enabled" in body) {
      const { data: priorPref } = await admin
        .from("customer_preferences")
        .select("personalization_enabled")
        .eq("user_id", user.id)
        .maybeSingle();
      priorPersonalization = priorPref?.personalization_enabled ?? null;
    }

    const { error } = await admin
      .from("customer_preferences")
      .upsert({ user_id: user.id, ...updates }, { onConflict: "user_id" });

    if (error) {
      logApiError("preferences/update", error);
      return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
    }

    // V3-34 — append an NDPR consent-ledger row (append-only, service-role
    // insert) pinning the exact copy version, and emit owner-tile telemetry —
    // ONLY when the value actually changed. Best-effort but OBSERVABLE: the
    // insert error is checked (supabase-js resolves errors, it does not throw),
    // so a lost consent record is logged rather than silently dropped.
    if ("personalization_enabled" in body) {
      const granted = updates["personalization_enabled"] === true;
      if (priorPersonalization !== granted) {
        const outcome = granted ? "approved" : "rejected";
        const eventName = granted
          ? "henry.personalization.consent.granted"
          : "henry.personalization.consent.revoked";
        const { error: ledgerError } = await admin
          .from("personalization_consent_events")
          .insert({
            user_id: user.id,
            action: granted ? "granted" : "revoked",
            consent_text_version: PERSONALIZATION_CONSENT_TEXT_VERSION,
            source: "account_preferences",
          });
        if (ledgerError) {
          logApiError("preferences/update:consent-ledger", ledgerError);
        }
        const payload = {
          surface: "account_preferences" as const,
          consent_text_version: PERSONALIZATION_CONSENT_TEXT_VERSION,
          outcome,
        };
        emitEvent({
          name: eventName,
          classification: "user_action",
          outcome,
          actorId: user.id,
          payload,
        });
        void persistEvent({
          supabase: admin,
          name: eventName,
          actorId: user.id,
          payload,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logApiError("preferences/update", error);
    return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
  }
}
