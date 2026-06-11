import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase";
import { getJobPosts, JOBS_ACTIVITY_ALERT, JOBS_DIVISION } from "@/lib/jobs/data";
import { createJobsInAppNotification, sendJobsEmail } from "@/lib/jobs/notifications";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const secret = String(process.env.CRON_SECRET || "").trim();
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function matchJobs(job: Awaited<ReturnType<typeof getJobPosts>>[number], metadata: Record<string, unknown>) {
  const q = asString(metadata.q).toLowerCase();
  const category = asString(metadata.category).toLowerCase();
  const mode = asString(metadata.mode).toLowerCase();
  const internal = asString(metadata.internal) === "1";

  if (category && job.categorySlug !== category) return false;
  if (mode && job.workMode !== mode) return false;
  if (internal && !job.internal) return false;
  if (!q) return true;

  return [job.title, job.summary, job.description, job.employerName, ...job.skills]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

type AdminClient = ReturnType<typeof createAdminSupabase>;

/**
 * V3 PASS 21 — interview reminder dispatch.
 *
 * Sends 24h-out and 1h-out reminders for jobs_interview_rooms in
 * status='scheduled'. Idempotency is enforced by an
 * `interview_reminder_sent` marker on customer_activity keyed by
 * (room_id, reminder_window) so a re-run of the cron within the same
 * window is a noop. The reminder body comes from notifications.ts
 * (in-app + email; OneSignal push is best-effort).
 */
async function runInterviewReminders(admin: AdminClient) {
  const now = Date.now();
  const horizonHigh = new Date(now + 25 * 60 * 60 * 1000).toISOString();

  const { data: rooms } = await admin
    .from("jobs_interview_rooms")
    .select("id, application_id, scheduled_at, join_url, status")
    .eq("status", "scheduled")
    .gte("scheduled_at", new Date(now).toISOString())
    .lte("scheduled_at", horizonHigh);

  let sent24h = 0;
  let sent1h = 0;

  for (const row of rooms ?? []) {
    const item = row as Record<string, unknown>;
    const scheduledAt = new Date(String(item.scheduled_at)).getTime();
    if (!Number.isFinite(scheduledAt)) continue;
    const minutesOut = (scheduledAt - now) / 60000;

    let window: "24h" | "1h" | null = null;
    if (minutesOut <= 60 && minutesOut > 0) {
      window = "1h";
    } else if (minutesOut <= 24 * 60 && minutesOut > 23 * 60) {
      window = "24h";
    }
    if (!window) continue;

    // Resolve candidate user for routing (prod column: candidate_id = auth user id).
    const { data: app } = await admin
      .from("jobs_applications")
      .select("candidate_id, candidate_name")
      .eq("id", item.application_id)
      .maybeSingle();
    if (!app) continue;

    const candidateUserId = String(
      (app as Record<string, unknown>).candidate_id || "",
    );
    if (!candidateUserId) continue;

    // Idempotency marker.
    const markerKey = `interview-reminder:${item.id}:${window}`;
    const { data: existing } = await admin
      .from("customer_activity")
      .select("id")
      .eq("reference_id", markerKey)
      .maybeSingle();
    if (existing) continue;

    await createJobsInAppNotification({
      userId: candidateUserId,
      title: window === "1h"
        ? "Interview starts in 1 hour"
        : "Interview tomorrow",
      body:
        window === "1h"
          ? "Your interview starts in one hour. Open your candidate hub to join."
          : "You have an interview scheduled in about a day. Confirm your availability.",
      actionUrl: "/candidate/interviews",
      actionLabel: "Open interview",
      priority: "high",
      referenceType: "jobs_interview_room",
      referenceId: String(item.id),
    });

    await admin.from("customer_activity").insert({
      user_id: candidateUserId,
      division: JOBS_DIVISION,
      activity_type: "interview_reminder_sent",
      reference_type: "jobs_interview_room",
      reference_id: markerKey,
      title: "Interview reminder sent",
      status: "sent",
      metadata: { window, roomId: item.id, sentAt: new Date().toISOString() },
    } as never);

    if (window === "24h") sent24h += 1;
    else sent1h += 1;
  }

  return { sent24h, sent1h, scanned: rooms?.length ?? 0 };
}

/**
 * V3 PASS 21 — offer letter expiry reminders.
 *
 * Reminds candidates 24h before an offer letter expires (status='sent',
 * expires_at within 25h). Idempotent via expiry_reminder_sent marker.
 */
async function runOfferLetterExpiryReminders(admin: AdminClient) {
  const now = Date.now();
  const horizon = new Date(now + 25 * 60 * 60 * 1000).toISOString();

  const { data: offers } = await admin
    .from("jobs_offer_letters")
    .select("id, application_id, expires_at, status")
    .in("status", ["sent", "viewed"])
    .not("expires_at", "is", null)
    .lte("expires_at", horizon)
    .gte("expires_at", new Date(now).toISOString());

  let sent = 0;

  for (const row of offers ?? []) {
    const item = row as Record<string, unknown>;
    const markerKey = `offer-expiry:${item.id}`;
    const { data: existing } = await admin
      .from("customer_activity")
      .select("id")
      .eq("reference_id", markerKey)
      .maybeSingle();
    if (existing) continue;

    const { data: app } = await admin
      .from("jobs_applications")
      .select("candidate_id")
      .eq("id", item.application_id)
      .maybeSingle();
    if (!app) continue;

    const candidateUserId = String(
      (app as Record<string, unknown>).candidate_id || "",
    );
    if (!candidateUserId) continue;

    await createJobsInAppNotification({
      userId: candidateUserId,
      title: "Offer expires soon",
      body: "Your offer letter expires within 24 hours. Review and sign or decline.",
      actionUrl: "/candidate/applications",
      actionLabel: "Open offer",
      priority: "high",
      referenceType: "jobs_offer_letter",
      referenceId: String(item.id),
    });

    await admin.from("customer_activity").insert({
      user_id: candidateUserId,
      division: JOBS_DIVISION,
      activity_type: "offer_expiry_reminder_sent",
      reference_type: "jobs_offer_letter",
      reference_id: markerKey,
      title: "Offer expiry reminder sent",
      status: "sent",
      metadata: { offerLetterId: item.id, sentAt: new Date().toISOString() },
    } as never);

    sent += 1;
  }

  return { sent, scanned: offers?.length ?? 0 };
}

async function runAlerts(request: Request) {
  const secret = String(process.env.CRON_SECRET || "").trim();
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET is not configured for jobs alerts." },
      { status: 503 }
    );
  }
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminSupabase();
  // TODO(wave3-cron) — alert email rendering needs per-subscriber locale
  // (currently this passes the EN source job text). The dynamic-field
  // resolver caches by source string, so per-recipient localization can
  // happen inside the email render loop once subscriber locale is
  // threaded through the activity row.
  const [jobs, alertsRes, reminders, offerReminders] = await Promise.all([
    getJobPosts(),
    admin
      .from("customer_activity")
      .select("*")
      .eq("division", JOBS_DIVISION)
      .eq("activity_type", JOBS_ACTIVITY_ALERT)
      .eq("status", "active"),
    runInterviewReminders(admin),
    runOfferLetterExpiryReminders(admin),
  ]);

  let processed = 0;
  let notified = 0;

  for (const row of alertsRes.data ?? []) {
    processed += 1;
    const item = row as Record<string, unknown>;
    const metadata = asObject(item.metadata);
    const matches = jobs.filter((job) => matchJobs(job, metadata));
    const lastMatchSlugs = Array.isArray(metadata.lastMatchSlugs) ? metadata.lastMatchSlugs.map(String) : [];
    const newMatches = matches.filter((job) => !lastMatchSlugs.includes(job.slug));

    if (newMatches.length === 0) {
      continue;
    }

    const topMatches = newMatches.slice(0, 3);
    await createJobsInAppNotification({
      userId: String(item.user_id),
      title: metadata.label ? String(metadata.label) : "Jobs alert update",
      body: `${topMatches.length} new role${topMatches.length === 1 ? "" : "s"} matched your alert.`,
      actionUrl: "/candidate/alerts",
      actionLabel: "View alert",
      priority: "normal",
      referenceType: "jobs_alert",
      referenceId: String(item.id),
    });

    const { data: profile } = await admin
      .from("customer_profiles")
      .select("email")
      .eq("id", item.user_id)
      .maybeSingle();

    if (profile?.email) {
      await sendJobsEmail(
        String(profile.email),
        {
          key: "job_alert",
          heading: "New jobs matched your alert",
          summary: `Henry Onyx Jobs found ${topMatches.length} fresh role${topMatches.length === 1 ? "" : "s"} for ${metadata.label || "your saved alert"}.`,
          detailLines: topMatches.map((job) => `${job.title} · ${job.employerName} · ${job.location}`),
          ctaLabel: "Open alerts",
          ctaHref: "/candidate/alerts",
        },
        {
          entityType: "jobs_alert",
          entityId: String(item.id),
        }
      );
    }

    await admin
      .from("customer_activity")
      .update({
        metadata: {
          ...metadata,
          lastNotifiedAt: new Date().toISOString(),
          lastMatchSlugs: matches.slice(0, 20).map((job) => job.slug),
        },
      } as never)
      .eq("id", item.id);

    notified += 1;
  }

  return NextResponse.json({
    ok: true,
    processed,
    notified,
    interviewReminders: reminders,
    offerReminders,
  });
}

export async function GET(request: Request) {
  return runAlerts(request);
}

export async function POST(request: Request) {
  return runAlerts(request);
}
