import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import {
  renderHenryCoEmail,
  renderHenryCoEmailText,
  resolveSenderIdentity,
  sendBrevoEmail,
  sendResendEmail,
  type EmailDispatchResult,
  type EmailPurpose,
  type SendTransactionalEmailInput,
} from "@henryco/email";
import { createAdminSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── Constants ─────────────────────────────────────────────────────────────
//
// Why these specific numbers:
//   PROCESS_LIMIT — bounds invocation duration; the next 15-min run picks up
//     the rest. Also keeps the worker well inside Vercel's function timeout.
//   RETRY_CAP    — after this many recorded delivery_log errors for a row,
//     stop spinning the queue on it. Audit log preserves the trail.
//   PER_USER_INDIVIDUAL_CAP — premium-trust ceiling: no user gets more than
//     5 individual fallback emails in a rolling 24h window. Excess gets
//     bundled into a single digest.
//   RATE_LIMIT_*  — defense in depth against a misconfigured/looping cron.
//   BODY_CAP      — Vercel Cron sends an empty body; reject anything else.

const CRON_SECRET_ENV = "CRON_SECRET";
const PROCESS_LIMIT = 100;
const RETRY_CAP = 5;
const PER_USER_INDIVIDUAL_CAP = 5;
const PER_USER_WINDOW_MS = 24 * 60 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 1;
const BODY_CAP = 1024;

const ACCOUNT_HOME_FALLBACK = "https://account.henrycogroup.com";
const PREFERENCES_PATH = "/account/settings/notifications";
const HENRYCO_HOST_SUFFIXES: readonly string[] = ["henrycogroup.com", "henryco.local"];

type Bucket = { count: number; windowStartedAt: number };
const rateBuckets = new Map<string, Bucket>();

// ─── Safe responses (never leak shape/state) ───────────────────────────────

function safe200() {
  return new NextResponse(null, { status: 200 });
}
function safe401() {
  return new NextResponse(null, { status: 401 });
}
function safe413() {
  return new NextResponse(null, { status: 413 });
}
function safe429() {
  return new NextResponse(null, { status: 429 });
}
function safe500() {
  return new NextResponse(null, { status: 500 });
}

// ─── Auth ──────────────────────────────────────────────────────────────────

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now - bucket.windowStartedAt > RATE_LIMIT_WINDOW_MS) {
    rateBuckets.set(ip, { count: 1, windowStartedAt: now });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= RATE_LIMIT_MAX;
}

function verifyCronAuth(req: NextRequest): boolean {
  const expected = (process.env[CRON_SECRET_ENV] || "").trim();
  if (!expected) return false;

  const header = req.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return false;
  const provided = match[1]!.trim();

  // timing-safe comparison; lengths must match for the buffer compare to run.
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// ─── URL safety (mirrors packages/notifications validate.ts; standalone so the
//     worker stays decoupled from the publisher package's internals) ─────────

function isSafeAbsoluteHenryCoUrl(value: string): boolean {
  if (!value || value.length > 1024) return false;
  if (value.includes("<") || value.includes(">") || value.includes('"')) return false;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
  if (parsed.username || parsed.password) return false;
  const host = parsed.hostname.toLowerCase();
  for (const suffix of HENRYCO_HOST_SUFFIXES) {
    if (host === suffix || host.endsWith(`.${suffix}`)) return true;
  }
  return false;
}

function safeRelativeToAbsolute(value: string): string | null {
  // Permit "/path" (single leading slash, no backslash, no HTML), upgrading to
  // absolute against account.henrycogroup.com so the email always carries a
  // clickable URL even if the source row stored a relative deep_link.
  if (!value || value.length > 1024) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (value.includes("\\")) return null;
  if (value.includes("<") || value.includes(">") || value.includes('"')) return null;
  return `${ACCOUNT_HOME_FALLBACK}${value}`;
}

function resolveSafeCtaUrl(rawActionUrl: string | null): string {
  const candidate = (rawActionUrl || "").trim();
  if (!candidate) return ACCOUNT_HOME_FALLBACK;
  if (isSafeAbsoluteHenryCoUrl(candidate)) return candidate;
  const upgraded = safeRelativeToAbsolute(candidate);
  if (upgraded && isSafeAbsoluteHenryCoUrl(upgraded)) return upgraded;
  return ACCOUNT_HOME_FALLBACK;
}

// ─── Division → email purpose mapping ──────────────────────────────────────
//
// Critical invariant (V2-PNH-03B): Care must NEVER be the fallback identity.
// Notifications from `account`/`hub`/`staff`/`system` route to the auth
// purpose (accounts@henrycogroup.com), not care@. Notifications from
// `wallet` aren't a Division — wallet events ride under `account` per the
// notification publisher's Division enum.

const DIVISION_TO_PURPOSE: Record<string, EmailPurpose> = {
  care: "care",
  marketplace: "marketplace",
  property: "property",
  jobs: "jobs",
  learn: "learn",
  logistics: "logistics",
  studio: "studio",
  security: "security",
  account: "auth",
  hub: "auth",
  staff: "auth",
  system: "auth",
};

function purposeForDivision(division: string | null | undefined): EmailPurpose {
  const key = String(division || "").trim().toLowerCase();
  return DIVISION_TO_PURPOSE[key] || "auth";
}

const DIVISION_TITLE: Record<string, string> = {
  care: "Care",
  marketplace: "Marketplace",
  property: "Property",
  jobs: "Jobs",
  learn: "Learn",
  logistics: "Logistics",
  studio: "Studio",
  security: "Security",
  account: "Account",
  hub: "HenryCo",
  staff: "HenryCo",
  system: "HenryCo",
};

function divisionTitle(division: string | null | undefined): string {
  const key = String(division || "").trim().toLowerCase();
  return DIVISION_TITLE[key] || "HenryCo";
}

// ─── Dispatch with explicit Resend→Brevo fallback ──────────────────────────
//
// Why we don't use sendTransactionalEmail() here: that helper picks ONE
// provider and returns its result. The auth-hook taught us that on a Resend
// 5xx/rate-limit, we want a deterministic Brevo fallback for the same
// message, not a "try again next cron run" miss. Mirrors the pattern
// established in apps/account/app/api/auth/email-hook/route.ts.

async function dispatchWithFallback(
  input: SendTransactionalEmailInput,
): Promise<{ result: EmailDispatchResult; providerUsed: "resend" | "brevo" | null }> {
  const primary = await sendResendEmail(input);
  if (primary.status === "sent") return { result: primary, providerUsed: "resend" };

  // Resend failed; do not log title/body/email values per info-disclosure rules.
  console.error("[cron/notification-email-fallback] resend failed", {
    status: primary.status,
    safeError: primary.safeError,
    skippedReason: primary.skippedReason,
  });

  const fallback = await sendBrevoEmail(input);
  if (fallback.status === "sent") {
    console.warn("[cron/notification-email-fallback] brevo fallback succeeded after resend failure");
    return { result: fallback, providerUsed: "brevo" };
  }

  console.error("[cron/notification-email-fallback] brevo fallback also failed", {
    status: fallback.status,
    safeError: fallback.safeError,
    skippedReason: fallback.skippedReason,
  });
  return { result: fallback, providerUsed: null };
}

// ─── Worker types ──────────────────────────────────────────────────────────

type CandidateRow = {
  id: string;
  user_id: string;
  division: string | null;
  category: string | null;
  title: string | null;
  body: string | null;
  action_url: string | null;
  reference_id: string | null;
  reference_type: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

type PreferenceShape = {
  email_fallback_enabled: boolean | null;
  email_fallback_delay_hours: number | null;
  muted_divisions: string[] | null;
  muted_event_types: string[] | null;
};

type UserShape = {
  email: string | null;
};

// ─── DB helpers ────────────────────────────────────────────────────────────

type AdminClient = ReturnType<typeof createAdminSupabase>;

async function fetchCandidates(admin: AdminClient): Promise<CandidateRow[]> {
  // The predicate index `customer_notifications_email_fallback_candidate_idx`
  // (added in 20260501120000 foundation extensions) covers the inbox-side
  // filters. We then join preferences in-app rather than as a SQL JOIN
  // because supabase-js's relational queries against the same table set
  // can be brittle across PostgREST versions; a two-step fetch is steady
  // and the predicate index already shrinks the candidate set sharply.
  const { data, error } = await admin
    .from("customer_notifications")
    .select(
      "id, user_id, division, category, title, body, action_url, reference_id, reference_type, created_at, metadata",
    )
    .is("email_dispatched_at", null)
    .eq("is_read", false)
    .is("archived_at", null)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(PROCESS_LIMIT * 2); // headroom for preference filtering, capped below.

  if (error) {
    console.error("[cron/notification-email-fallback] candidates query failed", {
      code: error.code,
      message: error.message,
    });
    return [];
  }
  return (data || []) as CandidateRow[];
}

async function fetchPreferences(
  admin: AdminClient,
  userIds: string[],
): Promise<Map<string, PreferenceShape>> {
  if (userIds.length === 0) return new Map();
  const { data, error } = await admin
    .from("customer_preferences")
    .select(
      "user_id, email_fallback_enabled, email_fallback_delay_hours, muted_divisions, muted_event_types",
    )
    .in("user_id", userIds);
  if (error || !data) {
    console.error("[cron/notification-email-fallback] preferences query failed", {
      code: error?.code,
      message: error?.message,
    });
    return new Map();
  }
  const map = new Map<string, PreferenceShape>();
  for (const row of data as Array<{
    user_id: string;
    email_fallback_enabled: boolean | null;
    email_fallback_delay_hours: number | null;
    muted_divisions: string[] | null;
    muted_event_types: string[] | null;
  }>) {
    map.set(row.user_id, {
      email_fallback_enabled: row.email_fallback_enabled,
      email_fallback_delay_hours: row.email_fallback_delay_hours,
      muted_divisions: row.muted_divisions,
      muted_event_types: row.muted_event_types,
    });
  }
  return map;
}

async function fetchUserEmails(
  admin: AdminClient,
  userIds: string[],
): Promise<Map<string, string>> {
  if (userIds.length === 0) return new Map();
  // auth.users is the source of truth for the email used at signup. We use
  // per-user `getUserById` instead of `listUsers({ perPage: 1000 })` because
  // the candidate set comes from a query that's already capped (PROCESS_LIMIT
  // * 2 rows -> a much smaller distinct user count) and per-user fetches
  // scale linearly past 1000 customers without paginating the entire user
  // table on every cron run.
  const map = new Map<string, string>();
  const lookups = userIds.map(async (userId) => {
    try {
      const { data, error } = await admin.auth.admin.getUserById(userId);
      if (error || !data?.user) return;
      const email = (data.user as UserShape & { id: string }).email;
      if (email && email.trim()) map.set(userId, email.trim());
    } catch (err) {
      console.error("[cron/notification-email-fallback] getUserById failed", {
        message: err instanceof Error ? err.message : "unknown",
      });
    }
  });
  await Promise.all(lookups);
  return map;
}

async function failedAttemptCount(
  admin: AdminClient,
  notificationId: string,
): Promise<number> {
  const { count, error } = await admin
    .from("notification_delivery_log")
    .select("id", { count: "exact", head: true })
    .eq("notification_id", notificationId)
    .eq("channel", "email")
    .eq("status", "error");
  if (error) return 0;
  return count || 0;
}

async function emailsSentInWindow(
  admin: AdminClient,
  userId: string,
  sinceIso: string,
): Promise<number> {
  const { count, error } = await admin
    .from("notification_delivery_log")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("channel", "email")
    .eq("status", "sent")
    .gte("created_at", sinceIso);
  if (error) return 0;
  return count || 0;
}

async function logDelivery(
  admin: AdminClient,
  params: {
    userId: string;
    notificationId: string | null;
    division: string | null;
    eventType: string | null;
    status: "sent" | "error" | "skipped";
    provider: "resend" | "brevo" | "none";
    errorCode?: string | null;
    errorMessage?: string | null;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  const { error } = await admin.from("notification_delivery_log").insert({
    user_id: params.userId,
    notification_id: params.notificationId,
    channel: "email",
    provider: params.provider,
    status: params.status,
    division: params.division,
    event_name: params.eventType,
    publisher: "cron:notification-email-fallback",
    error_code: params.errorCode ?? null,
    error_message: params.errorMessage ?? null,
    metadata: params.metadata ?? {},
  } as never);
  if (error) {
    console.warn("[cron/notification-email-fallback] delivery log insert failed", {
      code: error.code,
    });
  }
}

async function markDispatched(
  admin: AdminClient,
  notificationId: string,
  provider: "resend" | "brevo" | null,
  metadataPatch?: Record<string, unknown>,
): Promise<void> {
  // Read existing metadata to merge — supabase-js doesn't support JSON merge
  // server-side without an RPC, and we'd rather keep this code path inline.
  const { data: existing } = await admin
    .from("customer_notifications")
    .select("metadata")
    .eq("id", notificationId)
    .single();

  const merged = {
    ...((existing as { metadata?: Record<string, unknown> } | null)?.metadata || {}),
    ...(metadataPatch || {}),
  };

  const update: Record<string, unknown> = {
    email_dispatched_at: new Date().toISOString(),
    email_provider: provider, // null is permitted by the schema constraint.
    metadata: merged,
  };

  const { error } = await admin
    .from("customer_notifications")
    .update(update)
    .eq("id", notificationId);
  if (error) {
    console.error("[cron/notification-email-fallback] mark dispatched failed", {
      code: error.code,
    });
  }
}

// ─── Email rendering ───────────────────────────────────────────────────────

function buildIndividualEmail(args: {
  division: string | null;
  title: string;
  body: string | null;
  ctaUrl: string;
}): { subject: string; html: string; text: string } {
  const purpose = purposeForDivision(args.division);
  const divTitle = divisionTitle(args.division);
  const subject = `[${divTitle}] ${args.title}`.slice(0, 240);
  const layout = {
    purpose,
    subject,
    title: args.title,
    intro: args.body || "You have a new HenryCo notification waiting in your inbox.",
    actionLabel: "View notification",
    actionHref: args.ctaUrl,
    footnote:
      "This is a HenryCo transactional message. Manage notification email preferences any time at " +
      `${ACCOUNT_HOME_FALLBACK}${PREFERENCES_PATH}.`,
  } as const;
  return {
    subject,
    html: renderHenryCoEmail(layout),
    text: renderHenryCoEmailText(layout),
  };
}

function buildDigestEmail(args: {
  pendingCount: number;
}): { subject: string; html: string; text: string } {
  const subject = `[HenryCo] You have ${args.pendingCount} pending notifications`;
  const layout = {
    purpose: "auth" as EmailPurpose,
    eyebrow: "HenryCo",
    subject,
    title: `${args.pendingCount} updates are waiting in your inbox`,
    intro:
      "You’ve reached your daily limit for individual notification emails. Open your inbox " +
      "to review the pending updates in one place.",
    actionLabel: "Open my inbox",
    actionHref: `${ACCOUNT_HOME_FALLBACK}/notifications`,
    footnote:
      "This is a HenryCo transactional message. Manage notification email preferences any time at " +
      `${ACCOUNT_HOME_FALLBACK}${PREFERENCES_PATH}.`,
  } as const;
  return {
    subject,
    html: renderHenryCoEmail(layout),
    text: renderHenryCoEmailText(layout),
  };
}

// ─── Per-row dispatch ──────────────────────────────────────────────────────

type DispatchOutcome =
  | { kind: "sent"; provider: "resend" | "brevo" }
  | { kind: "skipped" }
  | { kind: "failed"; reason: string };

async function sendIndividual(
  admin: AdminClient,
  recipientEmail: string,
  row: CandidateRow,
): Promise<DispatchOutcome> {
  const purpose = purposeForDivision(row.division);
  const sender = resolveSenderIdentity(purpose);
  const ctaUrl = resolveSafeCtaUrl(row.action_url);
  const titleText = (row.title || "").slice(0, 200) || "You have a new HenryCo notification";
  const bodyText = (row.body || "").slice(0, 800);
  const rendered = buildIndividualEmail({
    division: row.division,
    title: titleText,
    body: bodyText,
    ctaUrl,
  });

  const dispatch = await dispatchWithFallback({
    to: recipientEmail,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    from: sender.email,
    fromName: sender.name,
    purpose,
  });

  if (dispatch.providerUsed) {
    await Promise.all([
      markDispatched(admin, row.id, dispatch.providerUsed),
      logDelivery(admin, {
        userId: row.user_id,
        notificationId: row.id,
        division: row.division,
        eventType: row.category,
        status: "sent",
        provider: dispatch.providerUsed,
      }),
    ]);
    return { kind: "sent", provider: dispatch.providerUsed };
  }

  await logDelivery(admin, {
    userId: row.user_id,
    notificationId: row.id,
    division: row.division,
    eventType: row.category,
    status: "error",
    provider: "none",
    errorCode: dispatch.result.safeError ? "provider_error" : "provider_skipped",
    errorMessage: dispatch.result.safeError || dispatch.result.skippedReason || null,
  });
  return { kind: "failed", reason: "both providers failed" };
}

async function sendDigest(
  admin: AdminClient,
  userId: string,
  recipientEmail: string,
  rows: CandidateRow[],
): Promise<DispatchOutcome> {
  if (rows.length === 0) return { kind: "skipped" };
  // Digest goes from accounts@ — it's an account-wide summary, not a
  // division-specific message. Channel separation invariant intact.
  const purpose: EmailPurpose = "auth";
  const sender = resolveSenderIdentity(purpose);
  const rendered = buildDigestEmail({ pendingCount: rows.length });

  const dispatch = await dispatchWithFallback({
    to: recipientEmail,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    from: sender.email,
    fromName: sender.name,
    purpose,
  });

  if (dispatch.providerUsed) {
    await Promise.all([
      logDelivery(admin, {
        userId,
        notificationId: null,
        division: "system",
        eventType: "digest",
        status: "sent",
        provider: dispatch.providerUsed,
        metadata: { digest_size: rows.length },
      }),
      ...rows.map((r) =>
        markDispatched(admin, r.id, dispatch.providerUsed, {
          email_outcome: "digest",
          digest_size: rows.length,
        }),
      ),
    ]);
    return { kind: "sent", provider: dispatch.providerUsed };
  }

  await logDelivery(admin, {
    userId,
    notificationId: null,
    division: "system",
    eventType: "digest",
    status: "error",
    provider: "none",
    errorCode: "provider_error",
    errorMessage: dispatch.result.safeError || dispatch.result.skippedReason || null,
    metadata: { digest_size: rows.length },
  });
  return { kind: "failed", reason: "digest dispatch failed" };
}

// ─── Worker entry ──────────────────────────────────────────────────────────

async function runWorker(): Promise<{
  considered: number;
  individuals_sent_resend: number;
  individuals_sent_brevo: number;
  digests_sent: number;
  failed: number;
  retired_after_retries: number;
  skipped_pref_disabled: number;
  skipped_delay_not_elapsed: number;
  skipped_muted: number;
}> {
  const summary = {
    considered: 0,
    individuals_sent_resend: 0,
    individuals_sent_brevo: 0,
    digests_sent: 0,
    failed: 0,
    retired_after_retries: 0,
    skipped_pref_disabled: 0,
    skipped_delay_not_elapsed: 0,
    skipped_muted: 0,
  };

  const admin = createAdminSupabase();
  const candidates = await fetchCandidates(admin);
  if (candidates.length === 0) return summary;

  // Group by user (ordered by created_at ASC inside each group, since the
  // overall query returned ASC). This keeps "first unread first" fairness.
  const byUser = new Map<string, CandidateRow[]>();
  for (const row of candidates) {
    const list = byUser.get(row.user_id) || [];
    list.push(row);
    byUser.set(row.user_id, list);
  }

  const userIds = [...byUser.keys()];
  const [prefsByUser, emailsByUser] = await Promise.all([
    fetchPreferences(admin, userIds),
    fetchUserEmails(admin, userIds),
  ]);

  let processedTotal = 0;
  const windowSinceIso = new Date(Date.now() - PER_USER_WINDOW_MS).toISOString();
  const now = Date.now();

  for (const [userId, rowsRaw] of byUser) {
    if (processedTotal >= PROCESS_LIMIT) break;
    const prefs = prefsByUser.get(userId);

    // Default delay is 24h per migration. If row is null, the trigger should
    // have created it, but we treat absence as "use defaults" rather than
    // creating it here (publisher path owns row creation).
    const fallbackEnabled = prefs?.email_fallback_enabled ?? true;
    const delayHours = prefs?.email_fallback_delay_hours ?? 24;
    const delayMs = delayHours * 60 * 60 * 1000;

    if (!fallbackEnabled) {
      // Mark as dispatched-with-null-provider so they exit the candidate set;
      // the user's preference is the deliberate decision not to email. The
      // delivery log records the "skipped" outcome for audit.
      for (const row of rowsRaw) {
        if (processedTotal >= PROCESS_LIMIT) break;
        summary.considered += 1;
        summary.skipped_pref_disabled += 1;
        await Promise.all([
          markDispatched(admin, row.id, null, { email_outcome: "preference_disabled" }),
          logDelivery(admin, {
            userId,
            notificationId: row.id,
            division: row.division,
            eventType: row.category,
            status: "skipped",
            provider: "none",
            errorCode: "pref_disabled",
          }),
        ]);
        processedTotal += 1;
      }
      continue;
    }

    // Per-user mute lists (V2-NOT-01-A schema). Either array source mutes the
    // row; the publisher already mutes UI for these but rows still INSERT to
    // inbox — premium UX requires that we also DON'T email muted divisions
    // / event types. We mark these as dispatched-with-null-provider with a
    // distinct outcome so they exit the candidate set permanently.
    const mutedDivisions = new Set(
      Array.isArray(prefs?.muted_divisions) ? (prefs!.muted_divisions || []) : [],
    );
    const mutedEvents = new Set(
      Array.isArray(prefs?.muted_event_types) ? (prefs!.muted_event_types || []) : [],
    );

    // Filter rows by mute lists, then by the user-specific delay window.
    const eligible: CandidateRow[] = [];
    for (const row of rowsRaw) {
      if (processedTotal >= PROCESS_LIMIT) break;
      const divisionKey = String(row.division || "").trim().toLowerCase();
      const categoryKey = String(row.category || "").trim();
      if (
        (divisionKey && mutedDivisions.has(divisionKey)) ||
        (categoryKey && mutedEvents.has(categoryKey))
      ) {
        summary.considered += 1;
        summary.skipped_muted += 1;
        await Promise.all([
          markDispatched(admin, row.id, null, { email_outcome: "user_muted" }),
          logDelivery(admin, {
            userId,
            notificationId: row.id,
            division: row.division,
            eventType: row.category,
            status: "skipped",
            provider: "none",
            errorCode: "user_muted",
          }),
        ]);
        processedTotal += 1;
        continue;
      }
      const createdMs = Date.parse(row.created_at);
      if (Number.isNaN(createdMs)) continue;
      if (now - createdMs < delayMs) {
        summary.skipped_delay_not_elapsed += 1;
        continue;
      }
      eligible.push(row);
    }
    if (eligible.length === 0) continue;

    const recipientEmail = emailsByUser.get(userId);
    if (!recipientEmail) {
      // No email on file — treat each row as failed (will retry next run);
      // the retry cap protects against an unbounded loop.
      for (const row of eligible) {
        if (processedTotal >= PROCESS_LIMIT) break;
        summary.considered += 1;
        const failures = await failedAttemptCount(admin, row.id);
        if (failures >= RETRY_CAP) {
          await markDispatched(admin, row.id, null, { email_outcome: "no_recipient_email" });
          summary.retired_after_retries += 1;
        } else {
          await logDelivery(admin, {
            userId,
            notificationId: row.id,
            division: row.division,
            eventType: row.category,
            status: "error",
            provider: "none",
            errorCode: "no_recipient_email",
          });
          summary.failed += 1;
        }
        processedTotal += 1;
      }
      continue;
    }

    const sentInWindow = await emailsSentInWindow(admin, userId, windowSinceIso);
    const individualSlots = Math.max(0, PER_USER_INDIVIDUAL_CAP - sentInWindow);
    const individualBatch = eligible.slice(0, individualSlots);
    const overflow = eligible.slice(individualSlots);

    for (const row of individualBatch) {
      if (processedTotal >= PROCESS_LIMIT) break;
      summary.considered += 1;

      const failures = await failedAttemptCount(admin, row.id);
      if (failures >= RETRY_CAP) {
        await markDispatched(admin, row.id, null, { email_outcome: "failed_after_retries" });
        summary.retired_after_retries += 1;
        processedTotal += 1;
        continue;
      }

      const outcome = await sendIndividual(admin, recipientEmail, row);
      processedTotal += 1;
      if (outcome.kind === "sent") {
        if (outcome.provider === "resend") summary.individuals_sent_resend += 1;
        else summary.individuals_sent_brevo += 1;
      } else if (outcome.kind === "failed") {
        summary.failed += 1;
      }
    }

    if (overflow.length > 0 && processedTotal < PROCESS_LIMIT) {
      summary.considered += overflow.length;
      const outcome = await sendDigest(admin, userId, recipientEmail, overflow);
      // Digest counts as one processed slot regardless of bundle size — this is
      // intentional, the cap is on per-invocation duration not row count.
      processedTotal += 1;
      if (outcome.kind === "sent") summary.digests_sent += 1;
      else if (outcome.kind === "failed") summary.failed += 1;
    }
  }

  return summary;
}

// ─── Route handlers ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (!rateLimit(ip)) return safe429();

  // Body cap (Vercel Cron sends none, but defense against accidental loops).
  const lengthHeader = req.headers.get("content-length");
  if (lengthHeader && Number.parseInt(lengthHeader, 10) > BODY_CAP) return safe413();

  if (!verifyCronAuth(req)) return safe401();

  try {
    const summary = await runWorker();
    // Operational visibility: the keys are counts, never values.
    console.info("[cron/notification-email-fallback] run complete", summary);
    return safe200();
  } catch (err) {
    console.error("[cron/notification-email-fallback] unhandled", {
      message: err instanceof Error ? err.message : "unknown",
    });
    return safe500();
  }
}

// Vercel Cron defaults to GET in some scheduling configurations; mirror POST so
// either is honored once auth passes. Idempotent because every action checks
// state before mutating.
export async function GET(req: NextRequest) {
  return POST(req);
}
