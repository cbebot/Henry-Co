import { Shield, Key, Smartphone, Clock, Globe } from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import { getSecurityLog } from "@/lib/account-data";
import { formatDateTime } from "@/lib/format";
import PageHeader from "@/components/layout/PageHeader";
import ChangePasswordForm from "@/components/security/ChangePasswordForm";

export const dynamic = "force-dynamic";

export default async function SecurityPage() {
  const user = await requireAccountUser();
  const logs = await getSecurityLog(user.id, 10);

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title="Security"
        description="Manage your password, sessions, and account security."
        icon={Shield}
      />

      {/* Security overview */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="acct-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--acct-green-soft)]">
              <Shield size={20} className="text-[var(--acct-green)]" />
            </div>
            <div>
              <p className="text-sm font-semibold">Account status</p>
              <p className="text-xs text-[var(--acct-green)]">Secure</p>
            </div>
          </div>
        </div>
        <div className="acct-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--acct-blue-soft)]">
              <Key size={20} className="text-[var(--acct-blue)]" />
            </div>
            <div>
              <p className="text-sm font-semibold">Email</p>
              <p className="text-xs text-[var(--acct-muted)]">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Change password */}
      <section className="acct-card p-5">
        <p className="acct-kicker mb-4">Change Password</p>
        <ChangePasswordForm />
      </section>

      {/* Recent security events */}
      <section className="acct-card p-5">
        <p className="acct-kicker mb-4">Recent Security Events</p>
        {logs.length === 0 ? (
          <p className="py-4 text-center text-sm text-[var(--acct-muted)]">No recent security events</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log: Record<string, string>) => (
              <div
                key={log.id}
                className="flex items-center gap-3 rounded-xl bg-[var(--acct-surface)] px-4 py-3"
              >
                <Globe size={16} className="shrink-0 text-[var(--acct-muted)]" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[var(--acct-ink)]">{log.event_type}</p>
                  <p className="text-xs text-[var(--acct-muted)]">
                    {log.ip_address ? `${log.ip_address} · ` : ""}
                    {formatDateTime(log.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
