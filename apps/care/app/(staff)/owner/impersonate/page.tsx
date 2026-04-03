import type { Metadata } from "next";
import { Shield, ShieldCheck, Snowflake, UserCheck } from "lucide-react";
import { requireRoles } from "@/lib/auth/server";
import { createAdminSupabase } from "@/lib/supabase";
import { logProtectedPageAccess } from "@/lib/security/logger";
import { ImpersonateButton } from "./impersonate-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Staff Impersonation | Henry & Co. Fabric Care",
  description:
    "View any staff dashboard exactly as they see it, with full audit trail.",
};

function roleTone(role?: string | null) {
  const key = String(role || "").toLowerCase();
  if (key === "owner")
    return "border-amber-300/30 bg-amber-500/10 text-amber-700 dark:text-amber-100";
  if (key === "manager")
    return "border-blue-300/30 bg-blue-500/10 text-blue-700 dark:text-blue-100";
  if (key === "rider")
    return "border-cyan-300/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-100";
  if (key === "support")
    return "border-purple-300/30 bg-purple-500/10 text-purple-700 dark:text-purple-100";
  return "border-zinc-300/30 bg-zinc-500/10 text-zinc-700 dark:text-zinc-100";
}

function displayRole(role?: string | null) {
  const raw = String(role || "staff").replaceAll("_", " ").trim();
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function formatDateTime(value?: string | null) {
  if (!value) return "";
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

type StaffProfile = {
  id: string;
  full_name: string | null;
  role: string;
  is_frozen: boolean;
  deleted_at: string | null;
};

type AuditEntry = {
  id: string;
  created_at: string;
  details: Record<string, unknown> | null;
};

export default async function OwnerImpersonatePage() {
  const auth = await requireRoles(["owner"]);
  await logProtectedPageAccess("/owner/impersonate");

  const supabase = createAdminSupabase();

  const [staffResult, auditResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, role, is_frozen, deleted_at")
      .neq("role", "customer")
      .order("role")
      .order("full_name"),
    supabase
      .from("care_security_logs")
      .select("id, created_at, details")
      .eq("event_type", "owner_impersonation_start")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const staffProfiles: StaffProfile[] = (staffResult.data ?? []).filter(
    (p) => p.id !== auth.profile.id
  );
  const auditLog: AuditEntry[] = auditResult.data ?? [];

  // Group by role
  const grouped = new Map<string, StaffProfile[]>();
  for (const profile of staffProfiles) {
    const role = profile.role || "staff";
    if (!grouped.has(role)) grouped.set(role, []);
    grouped.get(role)!.push(profile);
  }

  const roleOrder = ["manager", "support", "rider", "staff", "owner"];
  const sortedRoles = [...grouped.keys()].sort(
    (a, b) => (roleOrder.indexOf(a) ?? 99) - (roleOrder.indexOf(b) ?? 99)
  );

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-7 w-7 text-[color:var(--accent)]" />
          <h1 className="text-2xl font-bold tracking-tight text-[color:var(--accent)]">
            Staff Impersonation
          </h1>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
          View any dashboard exactly as your team sees it. Every session is
          audit-logged.
        </p>
      </div>

      {/* Staff grid by role */}
      {sortedRoles.map((role) => {
        const members = grouped.get(role) ?? [];
        return (
          <section key={role}>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {displayRole(role)} ({members.length})
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {members.map((member) => {
                const disabled = Boolean(member.is_frozen || member.deleted_at);
                return (
                  <div
                    key={member.id}
                    className="care-card rounded-[2rem] p-6 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-zinc-900 dark:text-zinc-100">
                          {member.full_name || "Unnamed"}
                        </p>
                        <span
                          className={`mt-1 inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${roleTone(member.role)}`}
                        >
                          {displayRole(member.role)}
                        </span>
                      </div>
                      <div className="flex-shrink-0">
                        {member.is_frozen ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            <Snowflake className="h-3 w-3" /> Frozen
                          </span>
                        ) : member.deleted_at ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300">
                            Deactivated
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                            <UserCheck className="h-3 w-3" /> Active
                          </span>
                        )}
                      </div>
                    </div>

                    <ImpersonateButton
                      targetUserId={member.id}
                      targetName={member.full_name || "Unnamed"}
                      disabled={disabled}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {staffProfiles.length === 0 && (
        <div className="care-card rounded-[2rem] p-10 text-center text-sm text-zinc-500">
          No staff members found.
        </div>
      )}

      {/* Audit log */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          <Shield className="h-4 w-4" />
          Recent impersonation sessions
        </h2>
        {auditLog.length === 0 ? (
          <p className="text-sm text-zinc-500">No impersonation sessions recorded yet.</p>
        ) : (
          <div className="care-card rounded-[2rem] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200/60 dark:border-zinc-700/60">
                    <th className="px-6 py-3 font-medium text-zinc-500">When</th>
                    <th className="px-6 py-3 font-medium text-zinc-500">Target</th>
                    <th className="px-6 py-3 font-medium text-zinc-500">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLog.map((entry) => {
                    const details = entry.details ?? {};
                    return (
                      <tr
                        key={entry.id}
                        className="border-b border-zinc-100/60 dark:border-zinc-800/60 last:border-0"
                      >
                        <td className="px-6 py-3 text-zinc-600 dark:text-zinc-300">
                          {formatDateTime(entry.created_at)}
                        </td>
                        <td className="px-6 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                          {String(details.target_name || "Unknown")}
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${roleTone(String(details.target_role || ""))}`}
                          >
                            {displayRole(String(details.target_role || ""))}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
