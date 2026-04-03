import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase";
import { getJobPosts, JOBS_ACTIVITY_ALERT, JOBS_DIVISION } from "@/lib/jobs/data";
import { createJobsInAppNotification, sendJobsEmail } from "@/lib/jobs/notifications";

export const dynamic = "force-dynamic";

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

export async function GET() {
  const admin = createAdminSupabase();
  const [jobs, alertsRes] = await Promise.all([
    getJobPosts(),
    admin
      .from("customer_activity")
      .select("*")
      .eq("division", JOBS_DIVISION)
      .eq("activity_type", JOBS_ACTIVITY_ALERT)
      .eq("status", "active"),
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
          summary: `HenryCo Jobs found ${topMatches.length} fresh role${topMatches.length === 1 ? "" : "s"} for ${metadata.label || "your saved alert"}.`,
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
  });
}
