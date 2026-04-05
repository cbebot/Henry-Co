import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const envPath = path.join(root, ".env.vercel.production.hub");
const raw = fs.readFileSync(envPath, "utf8");
const env = {};
for (const line of raw.split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq < 1) continue;
  const k = t.slice(0, eq).trim();
  let v = t.slice(eq + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  env[k] = v;
}

const base = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!base || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.vercel.production.hub");
  process.exit(1);
}

const tables = [
  "hq_internal_comm_threads",
  "hq_internal_comm_messages",
  "hq_internal_comm_thread_members",
  "hq_internal_comm_attachments",
  "hq_internal_comm_presence",
  "customer_wallet_withdrawal_requests",
  "staff_navigation_audit",
];

const PKS = {
  hq_internal_comm_thread_members: "thread_id",
  hq_internal_comm_presence: "user_id",
};

for (const table of tables) {
  const pk = PKS[table] || "id";
  const res = await fetch(`${base}/rest/v1/${table}?select=${pk}&limit=1`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
    },
  });
  const body = await res.text();
  const ok = res.ok ? "OK" : "ERR";
  const hint =
    body.includes("schema cache") || body.includes("does not exist") || res.status === 404
      ? " (missing or not exposed)"
      : "";
  console.log(`${table}: ${res.status} ${ok}${hint}`);
  if (!res.ok && body.length < 400) console.log("  ", body.trim().slice(0, 300));
}
