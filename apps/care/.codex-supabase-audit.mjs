import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const baseDir = path.resolve(process.cwd());
  const candidates = [
    ".env.runtime.production",
    ".env.care.production.local",
    ".env.vercel.latest",
    ".env.local",
  ];

  for (const name of candidates) {
    const filePath = path.join(baseDir, name);
    if (!fs.existsSync(filePath)) continue;

    const source = fs.readFileSync(filePath, "utf8");
    for (const line of source.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function safeCount(table) {
  const res = await supabase.from(table).select("*", { count: "exact", head: true });
  return res.count ?? null;
}

async function sample(table, select = "*") {
  const res = await supabase.from(table).select(select).limit(3);
  return { error: res.error?.message ?? null, data: res.data ?? [] };
}

async function authSummary() {
  const page1 = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  const users = page1.data?.users ?? [];
  const roles = {};

  for (const user of users) {
    const role = String(
      user.app_metadata?.role || user.user_metadata?.role || "customer"
    ).toLowerCase();
    roles[role] = (roles[role] || 0) + 1;
  }

  return { count: users.length, roles };
}

const tables = [
  "care_bookings",
  "care_reviews",
  "care_notification_queue",
  "care_security_logs",
  "care_settings",
  "profiles",
  "care_messages",
  "care_message_threads",
  "care_contact_submissions",
  "care_support_threads",
  "care_support_messages",
  "care_email_inbox",
  "care_email_threads",
];

const summary = {};
for (const table of tables) {
  try {
    summary[table] = { count: await safeCount(table) };
  } catch (error) {
    summary[table] = {
      count: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

const [reviews, bookings, notifications, logs, settings, profiles, auth] = await Promise.all([
  sample("care_reviews"),
  sample("care_bookings"),
  sample("care_notification_queue"),
  sample("care_security_logs"),
  sample("care_settings"),
  sample("profiles", "id, full_name, role, is_frozen, force_reauth_after"),
  authSummary(),
]);

console.log(
  JSON.stringify(
    {
      projectRef: new URL(url).hostname.split(".")[0],
      tableSummary: summary,
      samples: {
        care_reviews: reviews,
        care_bookings: bookings,
        care_notification_queue: notifications,
        care_security_logs: logs,
        care_settings: settings,
        profiles,
      },
      auth,
    },
    null,
    2
  )
);
