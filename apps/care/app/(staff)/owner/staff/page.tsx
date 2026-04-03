import type { Metadata } from "next";
import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { createHmac } from "crypto";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Lock,
  Search,
  ShieldCheck,
  UserCog,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import ConfirmButton from "@/components/feedback/ConfirmButton";
import PendingSubmitButton from "@/components/forms/PendingSubmitButton";

import { reconcileStaffDirectory } from "@/lib/auth/staff-identity";
import { requireRoles } from "@/lib/auth/server";
import { logProtectedPageAccess } from "@/lib/security/logger";
import { createAdminSupabase } from "@/lib/supabase";
import {
  clearStaffReauthAction,
  createStaffAccountAction,
  deleteStaffAccountAction,
  forceStaffReauthAction,
  repairStaffIdentityAction,
  resendStaffSetupAction,
  setStaffArchivedAction,
  setStaffFrozenAction,
  updateStaffRoleAction,
} from "../actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Owner Staff | Henry & Co. Fabric Care",
  description:
    "Owner control for staff roles, account access, freezing, and operational permissions.",
};

const ROLE_OPTIONS = ["owner", "manager", "rider", "support", "staff"] as const;

function getOwnerActionSecret() {
  return (
    process.env.OWNER_ACTION_SIGNING_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "local-owner-action-secret"
  );
}

function createOwnerActionSignature(actorUserId: string, actorRole: string, actorTs: string) {
  return createHmac("sha256", getOwnerActionSecret())
    .update(`${actorUserId}:${actorRole}:${actorTs}`)
    .digest("hex");
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function safeText(value?: string | null, fallback = "—") {
  const v = String(value || "").trim();
  return v || fallback;
}

function roleTone(role?: string | null) {
  const key = String(role || "").toLowerCase();

  if (key === "owner") {
    return "border-amber-300/30 bg-amber-500/10 text-amber-700 dark:text-amber-100";
  }
  if (key === "manager") {
    return "border-blue-300/30 bg-blue-500/10 text-blue-700 dark:text-blue-100";
  }
  if (key === "rider") {
    return "border-cyan-300/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-100";
  }
  if (key === "support") {
    return "border-purple-300/30 bg-purple-500/10 text-purple-700 dark:text-purple-100";
  }

  return "border-zinc-300/30 bg-zinc-500/10 text-zinc-700 dark:text-zinc-100";
}

function displayRole(role?: string | null) {
  const raw = String(role || "staff").replaceAll("_", " ").trim();
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function roleDestination(role?: string | null) {
  const key = String(role || "staff").toLowerCase();
  if (key === "owner") return "/owner";
  if (key === "manager") return "/manager";
  if (key === "rider") return "/rider";
  if (key === "support") return "/support";
  return "/staff";
}

function OwnerActionFields({
  actorUserId,
  actorRole,
  actorTs,
  actorSig,
}: {
  actorUserId: string;
  actorRole: string;
  actorTs: string;
  actorSig: string;
}) {
  return (
    <>
      <input type="hidden" name="actor_user_id" value={actorUserId} />
      <input type="hidden" name="actor_role" value={actorRole} />
      <input type="hidden" name="actor_ts" value={actorTs} />
      <input type="hidden" name="actor_sig" value={actorSig} />
    </>
  );
}

type RecentProvisioningIssue = {
  createdAt: string;
  reason: string | null;
  targetEmail: string | null;
  code: string | null;
  constraint: string | null;
  detail: string | null;
};

function isProfilesRoleConstraintIssue(issue?: RecentProvisioningIssue | null) {
  const reason = String(issue?.reason || "").toLowerCase();
  const detail = String(issue?.detail || "").toLowerCase();
  const constraint = String(issue?.constraint || "").toLowerCase();

  return (
    constraint === "profiles_role_check" ||
    reason.includes("profiles_role_check") ||
    detail.includes("profiles_role_check") ||
    (reason.includes("customer") && reason.includes("profile"))
  );
}

async function getRecentProvisioningIssue(): Promise<RecentProvisioningIssue | null> {
  try {
    const supabase = createAdminSupabase();
    const { data } = await supabase
      .from("care_security_logs")
      .select("created_at, details")
      .in("event_type", ["staff_create_primary_insert_blocked", "staff_create_failed"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return null;

    const details =
      data.details && typeof data.details === "object" && !Array.isArray(data.details)
        ? (data.details as Record<string, unknown>)
        : null;

    return {
      createdAt: String(data.created_at || "").trim(),
      reason: String(details?.reason || "").trim() || null,
      targetEmail: String(details?.target_email || "").trim() || null,
      code: String(details?.code || "").trim() || null,
      constraint: String(details?.constraint || "").trim() || null,
      detail: String(details?.detail || "").trim() || null,
    };
  } catch {
    return null;
  }
}

export default async function OwnerStaffPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    role?: string;
    state?: string;
  }>;
}) {
  const auth = await requireRoles(["owner"]);
  await logProtectedPageAccess("/owner/staff");

  const actorRole = String(auth.profile.role || "").toLowerCase();
  const actorTs = auth.user.last_sign_in_at
    ? String(new Date(auth.user.last_sign_in_at).getTime())
    : "";
  const actorSig = createOwnerActionSignature(auth.profile.id, actorRole, actorTs);

  const params = (await searchParams) ?? {};
  const q = String(params.q || "").trim().toLowerCase();
  const roleFilter = String(params.role || "").trim().toLowerCase();
  const stateFilter = String(params.state || "").trim().toLowerCase();

  const [directory, recentProvisioningIssue] = await Promise.all([
    reconcileStaffDirectory(),
    getRecentProvisioningIssue(),
  ]);
  const rows = directory.rows;

  const filtered = rows.filter((row) => {
    const matchesQ =
      !q ||
      JSON.stringify({
        id: row.id,
        email: row.email,
        full_name: row.full_name,
        phone: row.phone,
        role: row.role,
      })
        .toLowerCase()
        .includes(q);

    const matchesRole = !roleFilter || String(row.role).toLowerCase() === roleFilter;

    const matchesState =
      !stateFilter ||
      (stateFilter === "frozen" && row.is_frozen) ||
      (stateFilter === "active" && !row.is_frozen && !row.is_archived) ||
      (stateFilter === "archived" && row.is_archived) ||
      (stateFilter === "reauth" && Boolean(row.force_reauth_after)) ||
      (stateFilter === "missing-profile" && !row.profile_exists);

    return matchesQ && matchesRole && matchesState;
  });

  const total = rows.length;
  const frozenCount = rows.filter((row) => row.is_frozen).length;
  const reauthCount = rows.filter((row) => Boolean(row.force_reauth_after)).length;
  const managersCount = rows.filter((row) => String(row.role).toLowerCase() === "manager").length;
  const missingProfilesCount = rows.filter((row) => !row.profile_exists).length;
  const authDriftCount = rows.filter((row) => !row.auth_role_aligned).length;
  const archivedCount = rows.filter((row) => row.is_archived).length;
  const provisioningConstraintIssue = isProfilesRoleConstraintIssue(recentProvisioningIssue);

  return (
    <div className="space-y-8">
      <section className="rounded-[38px] border border-black/10 bg-white/80 p-8 shadow-[0_22px_80px_rgba(0,0,0,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
          Staff command
        </div>
        <h1 className="mt-2 text-4xl font-black tracking-[-0.03em] text-zinc-950 dark:text-white sm:text-5xl">
          Control every staff account from one command surface.
        </h1>
        <p className="mt-4 max-w-3xl text-zinc-600 dark:text-white/65">
          Promote, demote, freeze, clear access pressure, force re-authentication,
          and keep the live auth role, the mirrored profile row, and the actual dashboard route aligned.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/owner/security"
            className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-[color:var(--accent)]/40 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
          >
            Security center
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/owner"
            className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-[color:var(--accent)]/40 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
          >
            Owner dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {directory.createdProfiles > 0 || directory.syncedAuthMetadata > 0 ? (
          <div className="mt-6 rounded-2xl border border-[color:var(--accent)]/25 bg-[color:var(--accent)]/10 px-4 py-3 text-sm text-zinc-700 dark:text-white/78">
            Repaired {directory.syncedAuthMetadata} auth access record
            {directory.syncedAuthMetadata === 1 ? "" : "s"} and created {directory.createdProfiles} missing
            profile row{directory.createdProfiles === 1 ? "" : "s"} while loading staff access.
          </div>
        ) : null}
      </section>

      <section className="rounded-[34px] border border-black/10 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
              Staff provisioning
            </div>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-zinc-950 dark:text-white">
              Create staff, assign role, and send setup access from one place.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-600 dark:text-white/65">
              New accounts are provisioned securely, aligned with their assigned dashboard, and sent a
              setup link that opens the correct workspace after password creation. If a live auth issue
              blocks new-user creation, this page now reports the exact failure instead of implying success.
            </p>
          </div>

          <form action={createStaffAccountAction} className="grid gap-4 rounded-[2rem] border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/5">
            <OwnerActionFields
              actorUserId={auth.profile.id}
              actorRole={actorRole}
              actorTs={actorTs}
              actorSig={actorSig}
            />
            <input type="hidden" name="source_route" value="/owner/staff" />

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
                  Full name
                </span>
                <input
                  name="full_name"
                  required
                  placeholder="Staff member name"
                  className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-zinc-900 shadow-sm outline-none dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
                  Work email
                </span>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="staff@henrycogroup.com"
                  className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-zinc-900 shadow-sm outline-none dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_0.7fr_0.8fr]">
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
                  Phone
                </span>
                <input
                  name="phone"
                  placeholder="Optional phone number"
                  className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-zinc-900 shadow-sm outline-none dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
                  Role
                </span>
                <select
                  name="role"
                  defaultValue="staff"
                  className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-zinc-900 shadow-sm outline-none dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {displayRole(role)}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-3">
                <input type="hidden" name="is_active" value="false" />
                <label className="flex h-12 items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-zinc-900 shadow-sm dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white">
                  <input type="checkbox" name="is_active" value="true" defaultChecked />
                  Active immediately
                </label>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <input type="hidden" name="send_invite" value="false" />
                <label className="inline-flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-zinc-900 shadow-sm dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white">
                  <input type="checkbox" name="send_invite" value="true" defaultChecked />
                  Send setup email immediately
                </label>
              </div>

              <PendingSubmitButton
                label="Create or update staff"
                pendingLabel="Saving staff account..."
                className="h-12 rounded-2xl px-5 text-sm font-semibold"
              />
            </div>

            {recentProvisioningIssue ? (
              <div className="rounded-[1.6rem] border border-amber-300/30 bg-amber-500/10 px-4 py-4 text-sm leading-7 text-amber-800 dark:text-amber-100">
                {provisioningConstraintIssue
                  ? "Fresh auth inserts are still colliding with the live profile mirror rule: the database tries to create a customer profile first, and profiles_role_check rejects customer. This owner page can still recover onboarding by reactivating a retired empty access slot when one is available."
                  : "Fresh auth inserts are currently being rejected upstream by Supabase Auth before the account row can exist. Existing staff can still receive setup links and access resets."}
                <div className="mt-2 text-xs uppercase tracking-[0.14em] text-amber-700/80 dark:text-amber-200/70">
                  Last blocked attempt • {formatDateTime(recentProvisioningIssue.createdAt)}
                  {recentProvisioningIssue.targetEmail ? ` • ${recentProvisioningIssue.targetEmail}` : ""}
                  {recentProvisioningIssue.code ? ` • code ${recentProvisioningIssue.code}` : ""}
                </div>
                {recentProvisioningIssue.reason ? (
                  <div className="mt-2 rounded-2xl border border-amber-300/30 bg-white/60 px-3 py-3 text-sm text-amber-900 dark:bg-black/10 dark:text-amber-50">
                    {recentProvisioningIssue.reason}
                  </div>
                ) : null}
                {recentProvisioningIssue.detail ? (
                  <div className="mt-2 rounded-2xl border border-amber-300/30 bg-black/[0.04] px-3 py-3 text-xs leading-6 text-amber-900 dark:bg-black/20 dark:text-amber-50/90">
                    {recentProvisioningIssue.detail}
                  </div>
                ) : null}
              </div>
            ) : null}
          </form>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-7">
        <MetricCard
          icon={Users}
          label="Total staff"
          value={String(total)}
          note="All accounts seen by the system"
        />
        <MetricCard
          icon={UserCog}
          label="Managers"
          value={String(managersCount)}
          note="Operational leadership"
        />
        <MetricCard
          icon={Lock}
          label="Frozen accounts"
          value={String(frozenCount)}
          note="Blocked from normal use"
        />
        <MetricCard
          icon={UserMinus}
          label="Archived access"
          value={String(archivedCount)}
          note="Safe delete / restore state"
        />
        <MetricCard
          icon={ShieldCheck}
          label="Forced re-login"
          value={String(reauthCount)}
          note="Must sign in again"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Missing profile rows"
          value={String(missingProfilesCount)}
          note="Auth user exists without profile row"
        />
        <MetricCard
          icon={BadgeCheck}
          label="Auth role drift"
          value={String(authDriftCount)}
          note="Profile mirror not aligned with live auth metadata"
        />
      </section>

      <section className="rounded-[34px] border border-black/10 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <form className="grid gap-4 xl:grid-cols-[1.2fr_0.7fr_0.7fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-white/35" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search name, email, phone, role, or ID..."
              className="h-12 w-full rounded-2xl border border-black/10 bg-white pl-11 pr-4 text-sm font-medium text-zinc-900 shadow-sm outline-none dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white"
            />
          </div>

          <select
            name="role"
            defaultValue={roleFilter}
            className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-zinc-900 shadow-sm outline-none dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white"
          >
            <option value="">All roles</option>
            <option value="owner">Owner</option>
            <option value="manager">Manager</option>
            <option value="rider">Rider</option>
            <option value="support">Support</option>
            <option value="staff">Staff</option>
          </select>

          <select
            name="state"
            defaultValue={stateFilter}
            className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-zinc-900 shadow-sm outline-none dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white"
          >
            <option value="">All states</option>
            <option value="active">Active only</option>
            <option value="frozen">Frozen only</option>
            <option value="archived">Archived only</option>
            <option value="reauth">Forced re-login</option>
            <option value="missing-profile">Missing profile rows</option>
          </select>

          <button
            type="submit"
            className="care-button-primary h-12 rounded-2xl px-5 text-sm font-semibold"
          >
            Filter
          </button>
        </form>
      </section>

      <section className="grid gap-5">
        {filtered.length > 0 ? (
          filtered.map((staff) => {
            const isSelf = staff.id === auth.profile.id;
            const frozen = Boolean(staff.is_frozen);
            const forced = Boolean(staff.force_reauth_after);
            const archived = Boolean(staff.is_archived);
            const needsRepair =
              !staff.profile_exists || !staff.auth_role_aligned || Boolean(staff.profile_write_error);

            return (
              <article
                key={staff.id}
                className="rounded-[34px] border border-black/10 bg-white/80 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.06)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]"
              >
                <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-2xl font-semibold text-zinc-950 dark:text-white">
                        {safeText(staff.full_name, "Unnamed staff")}
                      </div>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${roleTone(
                          staff.role
                        )}`}
                      >
                        {displayRole(staff.role)}
                      </span>

                      {frozen ? (
                        <span className="rounded-full border border-red-300/30 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-red-700 dark:text-red-100">
                          Frozen
                        </span>
                      ) : null}

                      {archived ? (
                        <span className="rounded-full border border-amber-300/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-100">
                          Archived
                        </span>
                      ) : null}

                      {forced ? (
                        <span className="rounded-full border border-purple-300/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-purple-700 dark:text-purple-100">
                          Reauth required
                        </span>
                      ) : null}

                      {!staff.profile_exists ? (
                        <span className="rounded-full border border-amber-300/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-100">
                          Profile missing
                        </span>
                      ) : null}

                      {!staff.auth_role_aligned ? (
                        <span className="rounded-full border border-[color:var(--accent)]/25 bg-[color:var(--accent)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--accent)]">
                          Auth role drift
                        </span>
                      ) : null}

                      {staff.profile_write_error ? (
                        <span className="rounded-full border border-amber-300/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-100">
                          Profile mirror blocked
                        </span>
                      ) : null}

                      {isSelf ? (
                        <span className="rounded-full border border-amber-300/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-100">
                          Current owner
                        </span>
                      ) : null}
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <Field label="Email">{safeText(staff.email)}</Field>
                      <Field label="Phone">{safeText(staff.phone)}</Field>
                      <Field label="User ID">{staff.id}</Field>
                      <Field label="Dashboard route">{roleDestination(staff.role)}</Field>
                      <Field label="Access state">
                        {archived ? "Archived" : frozen ? "Frozen" : "Active"}
                      </Field>
                      <Field label="Created">{formatDateTime(staff.created_at)}</Field>
                      <Field label="Last sign in">{formatDateTime(staff.last_sign_in_at)}</Field>
                      <Field label="Auth access role">
                        {safeText(staff.app_role || staff.user_role || null)}
                      </Field>
                      <Field label="Forced re-login at">
                        {formatDateTime(staff.force_reauth_after)}
                      </Field>
                      <Field label="Archived at">{formatDateTime(staff.deleted_at)}</Field>
                    </div>

                    {!staff.profile_exists ? (
                      <div className="rounded-2xl border border-amber-300/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-100">
                        This sign-in account exists, but the staff directory record is missing. Access can
                        still follow the assigned role, and the repair action below will keep trying to rebuild
                        the missing record safely.
                      </div>
                    ) : null}

                    {staff.profile_write_error ? (
                      <div className="rounded-2xl border border-amber-300/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-100">
                        The database rejected the latest staff directory refresh for this account. Role-based
                        access can still follow the auth record, and the repair action below will retry the
                        directory sync once the database-side issue is clear.
                      </div>
                    ) : null}

                    {!staff.email ? (
                      <div className="rounded-2xl border border-amber-300/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-100">
                        This is now a profile-only archive record without a live auth sign-in attached. You can
                        preserve it for history, repair it when auth exists again, or permanently delete it once
                        you are sure the record is no longer needed.
                      </div>
                    ) : null}

                    {archived ? (
                      <div className="rounded-2xl border border-amber-300/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-100">
                        This account is archived under the safe-delete model. Sign-in is blocked until an owner restores access.
                      </div>
                    ) : null}
                  </div>

                  <div className="grid gap-4">
                    <div className="rounded-3xl border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/5">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
                        <UserPlus className="h-4 w-4 text-[color:var(--accent)]" />
                        Role control
                      </div>
                      <div className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-white/65">
                        Saving a role refreshes the account’s assigned workspace, repairs the directory record
                        when possible, and prompts a fresh access check the next time the staff member signs in.
                      </div>

                      <form action={updateStaffRoleAction} className="mt-4 grid gap-3">
                        <OwnerActionFields
                          actorUserId={auth.profile.id}
                          actorRole={actorRole}
                          actorTs={actorTs}
                          actorSig={actorSig}
                        />
                        <input type="hidden" name="id" value={staff.id} />
                        <input type="hidden" name="source_route" value="/owner/staff" />

                        <select
                          name="role"
                          defaultValue={String(staff.role || "staff").toLowerCase()}
                          disabled={isSelf}
                          className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-zinc-900 shadow-sm outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white"
                        >
                          {ROLE_OPTIONS.map((role) => (
                            <option key={role} value={role}>
                              {displayRole(role)}
                            </option>
                          ))}
                        </select>

                        <PendingSubmitButton
                          label="Save role"
                          pendingLabel="Saving role..."
                          disabled={isSelf}
                          className="h-12 rounded-2xl px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                        />
                      </form>

                      <div className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-xs leading-6 text-zinc-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/62">
                        Expected dashboard after save: <span className="font-semibold text-zinc-900 dark:text-white">{roleDestination(staff.role)}</span>
                        {staff.auth_role_aligned ? (
                          <> • the access record already matches this assignment.</>
                        ) : (
                          <> • the live access record still needs repair and will be rechecked on the next successful save.</>
                        )}
                        {staff.profile_write_error ? (
                          <> • the staff directory record is still blocked by a database-side restriction.</>
                        ) : null}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-3xl border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/5">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
                          <UserMinus className="h-4 w-4 text-red-500" />
                          Account state
                        </div>

                        <form action={setStaffFrozenAction} className="mt-4 grid gap-3">
                          <OwnerActionFields
                            actorUserId={auth.profile.id}
                            actorRole={actorRole}
                            actorTs={actorTs}
                            actorSig={actorSig}
                          />
                          <input type="hidden" name="id" value={staff.id} />
                          <input type="hidden" name="frozen" value={frozen ? "false" : "true"} />
                          <input type="hidden" name="source_route" value="/owner/staff" />

                          <ConfirmButton
                            type="submit"
                            disabled={isSelf || archived}
                            confirmTitle={frozen ? "Unfreeze this staff account?" : "Freeze this staff account?"}
                            confirmDescription={
                              frozen
                                ? "The user will be allowed back into the workspace unless another restriction is active."
                                : "The user will be blocked from the workspace and will need owner review before returning."
                            }
                            className={`h-12 rounded-2xl px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
                              frozen
                                ? "border border-emerald-300/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100"
                                : "border border-red-300/30 bg-red-500/10 text-red-700 dark:text-red-100"
                            }`}
                          >
                            {frozen ? "Unfreeze account" : "Freeze account"}
                          </ConfirmButton>
                        </form>

                        <form action={setStaffArchivedAction} className="mt-3 grid gap-3">
                          <OwnerActionFields
                            actorUserId={auth.profile.id}
                            actorRole={actorRole}
                            actorTs={actorTs}
                            actorSig={actorSig}
                          />
                          <input type="hidden" name="id" value={staff.id} />
                          <input type="hidden" name="archived" value={archived ? "false" : "true"} />
                          <input type="hidden" name="source_route" value="/owner/staff" />

                          <ConfirmButton
                            type="submit"
                            disabled={isSelf}
                            confirmTitle={archived ? "Restore this staff account?" : "Archive this staff account?"}
                            confirmDescription={
                              archived
                                ? "Restoring access clears the archive flag and allows normal sign-in again."
                                : "Archiving is the safe-delete model. It blocks sign-in, preserves records, and keeps historical actions intact."
                            }
                            className={`h-12 rounded-2xl px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
                              archived
                                ? "border border-cyan-300/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-100"
                                : "border border-amber-300/30 bg-amber-500/10 text-amber-700 dark:text-amber-100"
                            }`}
                          >
                            {archived ? "Restore access" : "Archive access (safe delete)"}
                          </ConfirmButton>
                        </form>

                        <div className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-xs leading-6 text-zinc-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/62">
                          Archive is the safest delete model here. It removes workspace access without destroying historical bookings, payments, reviews, or audit records.
                        </div>

                        <form action={deleteStaffAccountAction} className="mt-3 grid gap-3">
                          <OwnerActionFields
                            actorUserId={auth.profile.id}
                            actorRole={actorRole}
                            actorTs={actorTs}
                            actorSig={actorSig}
                          />
                          <input type="hidden" name="id" value={staff.id} />
                          <input type="hidden" name="source_route" value="/owner/staff" />

                          <ConfirmButton
                            type="submit"
                            disabled={isSelf || !archived}
                            confirmTitle="Permanently delete this archived account?"
                            confirmDescription="This removes sign-in access for good. The profile row will only be removed if no historical records still depend on it."
                            className="h-12 rounded-2xl border border-red-300/30 bg-red-500/10 px-5 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-100"
                          >
                            {archived ? "Permanent delete archived account" : "Archive before permanent delete"}
                          </ConfirmButton>
                        </form>
                      </div>

                      <div className="rounded-3xl border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/5">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
                          <BadgeCheck className="h-4 w-4 text-[color:var(--accent)]" />
                          Session control
                        </div>

                        <div className="mt-4 grid gap-3">
                          {needsRepair ? (
                            <form action={repairStaffIdentityAction}>
                              <OwnerActionFields
                                actorUserId={auth.profile.id}
                                actorRole={actorRole}
                                actorTs={actorTs}
                                actorSig={actorSig}
                              />
                              <input type="hidden" name="id" value={staff.id} />
                              <input type="hidden" name="source_route" value="/owner/staff" />
                              <PendingSubmitButton
                                label="Repair access record"
                                pendingLabel="Repairing access..."
                                variant="secondary"
                                className="h-12 w-full rounded-2xl border border-cyan-300/30 bg-cyan-500/10 px-5 text-sm font-semibold text-cyan-700 dark:text-cyan-100"
                              />
                            </form>
                          ) : null}

                          <form action={forceStaffReauthAction}>
                            <OwnerActionFields
                              actorUserId={auth.profile.id}
                              actorRole={actorRole}
                              actorTs={actorTs}
                              actorSig={actorSig}
                            />
                            <input type="hidden" name="id" value={staff.id} />
                            <input type="hidden" name="source_route" value="/owner/staff" />
                            <PendingSubmitButton
                              label="Force sign-in again"
                              pendingLabel="Forcing sign-in..."
                              disabled={isSelf}
                              variant="danger"
                              className="h-12 w-full rounded-2xl border border-amber-300/30 bg-amber-500/10 px-5 text-sm font-semibold text-amber-700 disabled:cursor-not-allowed disabled:opacity-60 dark:text-amber-100"
                            />
                          </form>

                          {forced ? (
                            <form action={clearStaffReauthAction}>
                              <OwnerActionFields
                                actorUserId={auth.profile.id}
                                actorRole={actorRole}
                                actorTs={actorTs}
                                actorSig={actorSig}
                              />
                              <input type="hidden" name="id" value={staff.id} />
                              <input type="hidden" name="source_route" value="/owner/staff" />
                              <PendingSubmitButton
                                label="Clear forced re-login"
                                pendingLabel="Clearing re-login..."
                                variant="secondary"
                                className="h-12 w-full rounded-2xl border border-black/10 bg-white px-5 text-sm font-semibold text-zinc-900 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
                              />
                            </form>
                          ) : null}

                          <form action={resendStaffSetupAction}>
                            <OwnerActionFields
                              actorUserId={auth.profile.id}
                              actorRole={actorRole}
                              actorTs={actorTs}
                              actorSig={actorSig}
                            />
                            <input type="hidden" name="id" value={staff.id} />
                            <input type="hidden" name="source_route" value="/owner/staff" />
                            <PendingSubmitButton
                              label={archived ? "Restore before setup email" : "Resend setup email"}
                              pendingLabel="Sending setup email..."
                              variant="secondary"
                              disabled={archived}
                              className="h-12 w-full rounded-2xl border border-[color:var(--accent)]/20 bg-[color:var(--accent)]/10 px-5 text-sm font-semibold text-zinc-900 dark:text-white"
                            />
                          </form>

                          <div className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-xs leading-6 text-zinc-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/62">
                            Setup email delivery now reports the real outcome: sent, queued, or failed. It no longer
                            shows a false success when an older notification record already exists.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-3xl border border-black/10 bg-white/80 p-16 text-center text-zinc-500 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white/55">
            No staff records matched your filter.
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white/80 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-white/[0.04]">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--accent)]/10">
        <Icon className="h-6 w-6 text-[color:var(--accent)]" />
      </div>
      <div className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
        {label}
      </div>
      <div className="mt-2 text-4xl font-black text-zinc-950 dark:text-white">{value}</div>
      <div className="mt-2 text-sm text-zinc-600 dark:text-white/60">{note}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/75 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
        {label}
      </div>
      <div className="mt-2 break-words text-sm leading-relaxed text-zinc-800 dark:text-white/80">
        {children}
      </div>
    </div>
  );
}
