import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const offline = args.includes("--offline");
const strict = args.includes("--strict");
const requireGovernanceLive = args.includes("--require-governance-live");
const envFileIndex = args.indexOf("--env-file");
const explicitEnvFile = envFileIndex >= 0 ? args[envFileIndex + 1] : null;

const repoRoot = process.cwd();

const ENV_CANDIDATES = [
  ".env.local",
  ".env.production.vercel",
  "apps/hub/.env.local",
  "apps/hub/.env.pull.hub.production",
  "apps/hub/.env.vercel.check",
  "apps/hub/.env.vercel.production.local",
  "apps/account/.env.local",
];

const REQUIRED_LIVE_TABLES = [
  "profiles",
  "customer_profiles",
  "customer_preferences",
  "customer_security_log",
  "customer_activity",
  "customer_notifications",
  "customer_documents",
  "support_threads",
  "support_messages",
  "audit_logs",
  "staff_audit_logs",
  "staff_navigation_audit",
  "customer_wallet_transactions",
  "customer_verification_submissions",
  "marketplace_orders",
  "marketplace_order_groups",
  "marketplace_payment_records",
  "marketplace_payout_requests",
  "marketplace_disputes",
  "marketplace_audit_logs",
  "marketplace_support_threads",
  "marketplace_support_messages",
  "care_bookings",
  "jobs_applications",
  "logistics_shipments",
  "logistics_events",
  "logistics_proof_of_delivery",
  "studio_projects",
  "studio_proposals",
  "studio_payments",
  "studio_project_files",
  "notification_delivery_log",
  "pricing_quotes",
  "pricing_override_events",
];

const GOVERNANCE_TABLES = [
  "data_governance_domains",
  "data_retention_policies",
  "data_storage_surfaces",
  "data_recovery_drill_runs",
];

const OPTIONAL_REPO_TABLES = [
  "customer_wallet_funding_requests",
  "customer_wallet_withdrawal_requests",
  "customer_trust_profiles",
  "jobs_interview_sessions",
  "jobs_interview_events",
  "learn_enrollments",
  "learn_certificates",
  "learn_certificate_verification",
  "learn_teacher_applications",
  "property_listings",
  "property_viewing_requests",
  "property_listing_applications",
  "account_webhook_receipts",
  "account_idempotency_keys",
];

const REQUIRED_BUCKETS = [
  "company-assets",
  "property-runtime",
  "property-media",
  "property-documents",
  "jobs-documents",
  "studio-assets",
  "hq-internal-comms",
  "learn-teaching-files",
];

const REQUIRED_FILES = [
  "apps/hub/supabase/migrations/20260423143000_data_governance_foundation.sql",
  "docs/data-governance-backup-recovery-v2.md",
  "docs/data-recovery-playbook-v2.md",
  "docs/data-retention-and-delete-readiness.md",
];

function parseEnvFile(filePath) {
  const env = {};
  const raw = fs.readFileSync(filePath, "utf8");
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index <= 0) continue;
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function resolveEnvFile() {
  if (explicitEnvFile) {
    const resolved = path.resolve(repoRoot, explicitEnvFile);
    return fs.existsSync(resolved) ? resolved : null;
  }

  for (const candidate of ENV_CANDIDATES) {
    const resolved = path.resolve(repoRoot, candidate);
    if (fs.existsSync(resolved)) return resolved;
  }

  return null;
}

function hasDuplicates(values) {
  return values.length !== new Set(values).size;
}

function validateStaticManifest() {
  const failures = [];
  if (hasDuplicates(REQUIRED_LIVE_TABLES)) failures.push("Duplicate required live table names.");
  if (hasDuplicates(GOVERNANCE_TABLES)) failures.push("Duplicate governance table names.");
  if (hasDuplicates(OPTIONAL_REPO_TABLES)) failures.push("Duplicate optional repo table names.");
  if (hasDuplicates(REQUIRED_BUCKETS)) failures.push("Duplicate required bucket names.");

  for (const file of REQUIRED_FILES) {
    if (!fs.existsSync(path.resolve(repoRoot, file))) {
      failures.push(`Missing required governance artifact: ${file}`);
    }
  }

  return failures;
}

function classifyFailure(status, body) {
  const text = String(body || "");
  if (status === 404 || /schema cache|could not find|does not exist/i.test(text)) {
    return "MISSING_OR_NOT_EXPOSED";
  }
  if (status === 401 || status === 403) return "AUTH_OR_RLS_BLOCKED";
  return "ERROR";
}

async function supabaseFetch(baseUrl, serviceKey, pathname) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    headers: {
      apikey: serviceKey,
      authorization: `Bearer ${serviceKey}`,
      accept: "application/json",
    },
  });
  const body = await response.text();
  return { response, body };
}

async function checkTable(baseUrl, serviceKey, tableName, tier) {
  const { response, body } = await supabaseFetch(
    baseUrl,
    serviceKey,
    `/rest/v1/${encodeURIComponent(tableName)}?select=*&limit=1`
  );

  return {
    table: tableName,
    tier,
    http: response.status,
    ok: response.ok,
    status: response.ok ? "OK" : classifyFailure(response.status, body),
  };
}

async function checkBuckets(baseUrl, serviceKey) {
  const { response, body } = await supabaseFetch(baseUrl, serviceKey, "/storage/v1/bucket");
  if (!response.ok) {
    return {
      http: response.status,
      ok: false,
      status: classifyFailure(response.status, body),
      buckets: [],
      missing: REQUIRED_BUCKETS,
    };
  }

  const payload = body ? JSON.parse(body) : [];
  const buckets = Array.isArray(payload)
    ? payload.map((bucket) => ({
        id: bucket.id,
        name: bucket.name,
        public: Boolean(bucket.public),
      }))
    : [];
  const names = new Set(buckets.map((bucket) => bucket.name || bucket.id));

  return {
    http: response.status,
    ok: true,
    status: "OK",
    buckets,
    missing: REQUIRED_BUCKETS.filter((bucket) => !names.has(bucket)),
  };
}

async function checkSupabaseBackups(projectRef, managementToken) {
  if (!projectRef || !managementToken) {
    return {
      checked: false,
      reason: "SUPABASE_ACCESS_TOKEN was not provided; project backup/PITR state was not verified.",
    };
  }

  const response = await fetch(
    `https://api.supabase.com/v1/projects/${encodeURIComponent(projectRef)}/database/backups`,
    {
      headers: {
        authorization: `Bearer ${managementToken}`,
        accept: "application/json",
      },
    }
  );
  const body = await response.text();
  if (!response.ok) {
    return {
      checked: true,
      ok: false,
      http: response.status,
      status: classifyFailure(response.status, body),
    };
  }

  const payload = body ? JSON.parse(body) : [];
  return {
    checked: true,
    ok: true,
    http: response.status,
    backupCount: Array.isArray(payload) ? payload.length : null,
  };
}

const staticFailures = validateStaticManifest();

if (offline) {
  const result = {
    mode: "offline",
    checkedAt: new Date().toISOString(),
    requiredArtifacts: REQUIRED_FILES,
    requiredLiveTables: REQUIRED_LIVE_TABLES.length,
    optionalRepoTables: OPTIONAL_REPO_TABLES.length,
    governanceTables: GOVERNANCE_TABLES,
    requiredBuckets: REQUIRED_BUCKETS,
    failures: staticFailures,
  };
  console.log(JSON.stringify(result, null, 2));
  process.exit(staticFailures.length ? 1 : 0);
}

const envFile = resolveEnvFile();
const fileEnv = envFile ? parseEnvFile(envFile) : {};
const env = { ...fileEnv, ...process.env };
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error(
    JSON.stringify(
      {
        mode: "live",
        checkedAt: new Date().toISOString(),
        ok: false,
        reason:
          "Missing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Use --offline for static validation or --env-file <path> for live checks.",
        staticFailures,
      },
      null,
      2
    )
  );
  process.exit(1);
}

const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
const tableChecks = [];
for (const table of REQUIRED_LIVE_TABLES) {
  tableChecks.push(await checkTable(supabaseUrl, serviceKey, table, "required_live"));
}
for (const table of GOVERNANCE_TABLES) {
  tableChecks.push(await checkTable(supabaseUrl, serviceKey, table, "governance"));
}
for (const table of OPTIONAL_REPO_TABLES) {
  tableChecks.push(await checkTable(supabaseUrl, serviceKey, table, "optional_repo"));
}

const bucketCheck = await checkBuckets(supabaseUrl, serviceKey);
const backupCheck = await checkSupabaseBackups(projectRef, env.SUPABASE_ACCESS_TOKEN);

const missingRequiredTables = tableChecks
  .filter((check) => check.tier === "required_live" && !check.ok)
  .map((check) => ({ table: check.table, status: check.status, http: check.http }));

const missingGovernanceTables = tableChecks
  .filter((check) => check.tier === "governance" && !check.ok)
  .map((check) => ({ table: check.table, status: check.status, http: check.http }));

const strictOptionalFailures = strict
  ? tableChecks
      .filter((check) => check.tier === "optional_repo" && !check.ok)
      .map((check) => ({ table: check.table, status: check.status, http: check.http }))
  : [];

const failures = [
  ...staticFailures,
  ...missingRequiredTables.map((item) => `Required table failed: ${item.table} (${item.status})`),
  ...bucketCheck.missing.map((bucket) => `Required bucket missing: ${bucket}`),
  ...strictOptionalFailures.map((item) => `Optional repo table failed under --strict: ${item.table}`),
];

if (requireGovernanceLive) {
  failures.push(
    ...missingGovernanceTables.map((item) => `Governance table not live: ${item.table}`)
  );
}

const result = {
  mode: "live",
  checkedAt: new Date().toISOString(),
  envFileUsed: envFile ? path.relative(repoRoot, envFile) || envFile : "process.env",
  projectRef,
  ok: failures.length === 0,
  tables: tableChecks,
  buckets: bucketCheck,
  backups: backupCheck,
  failures,
  notes: [
    "No row data or secrets are printed by this script.",
    "Optional repo tables may be missing live when migrations have not been applied or PostgREST schema cache is stale.",
    "Use --require-governance-live after applying 20260423143000_data_governance_foundation.sql.",
  ],
};

console.log(JSON.stringify(result, null, 2));
process.exit(failures.length ? 1 : 0);
