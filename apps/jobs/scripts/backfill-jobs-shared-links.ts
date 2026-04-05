import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..", "..");

function loadEnv() {
  const text = fs.readFileSync(path.resolve(repoRoot, ".env.local"), "utf8").replace(/^\uFEFF/, "");

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function toJobsUrl(baseUrl: string, pathname?: string | null) {
  const clean = asText(pathname).trim();
  if (!clean) return baseUrl;
  if (/^https?:\/\//i.test(clean)) return clean;
  return `${baseUrl}${clean.startsWith("/") ? clean : `/${clean}`}`;
}

function desiredActivityUrl(baseUrl: string, row: Record<string, unknown>) {
  const activityType = asText(row.activity_type);
  const metadata = asObject(row.metadata);

  if (activityType === "jobs_candidate_profile") return toJobsUrl(baseUrl, "/candidate/profile");
  if (activityType === "jobs_alert_subscription") return toJobsUrl(baseUrl, "/candidate/alerts");
  if (activityType === "jobs_application") return toJobsUrl(baseUrl, "/candidate/applications");
  if (activityType === "jobs_employer_profile") return toJobsUrl(baseUrl, "/employer/company");
  if (activityType === "jobs_employer_membership") return toJobsUrl(baseUrl, "/employer/company");
  if (activityType === "jobs_employer_verification") return toJobsUrl(baseUrl, "/employer/company");
  if (activityType === "jobs_saved_post") {
    if (asText(row.status) === "saved") {
      return toJobsUrl(baseUrl, asText(metadata.jobHref) || `/jobs/${asText(metadata.jobSlug)}`);
    }
    return toJobsUrl(baseUrl, "/candidate/saved-jobs");
  }
  if (activityType === "jobs_post") {
    return toJobsUrl(baseUrl, `/employer/jobs/${asText(metadata.slug || row.reference_id)}`);
  }

  return null;
}

async function main() {
  loadEnv();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "henrycogroup.com";
  const jobsBaseUrl = process.env.NEXT_PUBLIC_JOBS_URL || `https://jobs.${baseDomain}`;

  if (!supabaseUrl || !serviceKey) {
    throw new Error("Missing Supabase service credentials in .env.local.");
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: activityRows, error: activityError } = await supabase
    .from("customer_activity")
    .select("id,activity_type,status,reference_id,action_url,metadata")
    .eq("division", "jobs")
    .order("created_at", { ascending: false });

  if (activityError) {
    throw new Error(activityError.message);
  }

  let updatedActivity = 0;

  for (const row of (activityRows ?? []) as Array<Record<string, unknown>>) {
    const nextUrl = desiredActivityUrl(jobsBaseUrl, row);
    if (!nextUrl) continue;

    const currentUrl = asText(row.action_url).trim();
    if (currentUrl === nextUrl) continue;

    const { error } = await supabase
      .from("customer_activity")
      .update({ action_url: nextUrl } as never)
      .eq("id", asText(row.id));

    if (error) {
      throw new Error(`Could not update customer_activity ${asText(row.id)}: ${error.message}`);
    }

    updatedActivity += 1;
  }

  const { data: notificationRows, error: notificationError } = await supabase
    .from("customer_notifications")
    .select("id,division,category,reference_type,action_url")
    .or("reference_type.like.jobs_%,action_url.ilike.%jobs.henrycogroup.com%")
    .order("created_at", { ascending: false })
    .limit(200);

  if (notificationError) {
    throw new Error(notificationError.message);
  }

  let updatedNotifications = 0;

  for (const row of (notificationRows ?? []) as Array<Record<string, unknown>>) {
    const division = asText(row.division);
    const actionUrl = asText(row.action_url);
    const nextActionUrl = actionUrl ? toJobsUrl(jobsBaseUrl, actionUrl) : null;

    if (division === "jobs" && (!nextActionUrl || nextActionUrl === actionUrl)) {
      continue;
    }

    const { error } = await supabase
      .from("customer_notifications")
      .update({
        division: "jobs",
        category: "general",
        action_url: nextActionUrl,
      } as never)
      .eq("id", asText(row.id));

    if (error) {
      throw new Error(`Could not update customer_notifications ${asText(row.id)}: ${error.message}`);
    }

    updatedNotifications += 1;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        jobsBaseUrl,
        updatedActivity,
        updatedNotifications,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
