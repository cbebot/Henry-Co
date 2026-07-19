import { translateSurfaceLabel } from "@henryco/i18n/server";
import { requireLearnRoles } from "@/lib/learn/auth";
import { getLearnSnapshot } from "@/lib/learn/data";
import { supportNav } from "@/lib/learn/navigation";
import { getLearnPublicLocale } from "@/lib/locale-server";
import { createAdminSupabase } from "@/lib/supabase";
import { LearnPanel, LearnWorkspaceShell } from "@/components/learn/ui";

type SupportThread = {
  id: string;
  subject: string;
  status: string | null;
  priority: string | null;
  updated_at: string | null;
};

// Humanize internal pipeline enums (status/priority/channel) into readable
// labels rather than rendering raw snake_case tokens in the support console.
const TOKEN_LABELS: Record<string, string> = {
  open: "Open",
  closed: "Closed",
  resolved: "Resolved",
  pending: "Pending",
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
  email: "Email",
  whatsapp: "WhatsApp",
  sms: "SMS",
  sent: "Sent",
  queued: "Pending",
  skipped: "Skipped",
  failed: "Failed",
  delivered: "Delivered",
};

function humanizeToken(t: (s: string) => string, value: string | null): string {
  if (!value) return "";
  const key = value.trim().toLowerCase();
  const label = TOKEN_LABELS[key] ?? value.replace(/[_-]+/g, " ").replace(/^\w/, (c) => c.toUpperCase());
  return t(label);
}

export default async function SupportPage() {
  await requireLearnRoles(["academy_owner", "academy_admin", "support"], "/support");
  const admin = createAdminSupabase();
  const snapshot = await getLearnSnapshot();
  const locale = await getLearnPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const { data: threads } = await admin
    .from("support_threads")
    .select("id, subject, status, priority, updated_at")
    .eq("division", "learn")
    .order("updated_at", { ascending: false })
    .limit(20)
    .returns<SupportThread[]>();

  return (
    <LearnWorkspaceShell
      kicker={t("Support")}
      title={t("Academy support and notification visibility.")}
      description={t("Review learner support requests alongside academy notification status in one place.")}
      nav={supportNav("/support", t)}
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <LearnPanel className="rounded-[2rem]">
          <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">{t("Support threads")}</h3>
          <div className="mt-5 space-y-3">
            {(threads || []).map((thread) => (
              <div key={thread.id} className="rounded-[1.4rem] border border-[var(--learn-line)] bg-white/5 p-4">
                <div className="font-semibold text-[var(--learn-ink)]">{thread.subject}</div>
                <p className="mt-2 text-sm text-[var(--learn-ink-soft)]">{humanizeToken(t, thread.status)} • {humanizeToken(t, thread.priority)}</p>
              </div>
            ))}
          </div>
        </LearnPanel>

        <LearnPanel className="rounded-[2rem]">
          <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">{t("Latest academy notifications")}</h3>
          <div className="mt-5 space-y-3">
            {snapshot.notifications.slice(0, 10).map((notification) => (
              <div key={notification.id} className="rounded-[1.4rem] border border-[var(--learn-line)] bg-white/5 p-4">
                <div className="font-semibold text-[var(--learn-ink)]">{notification.title}</div>
                <p className="mt-2 text-sm text-[var(--learn-ink-soft)]">{humanizeToken(t, notification.channel)} • {humanizeToken(t, notification.status)}</p>
              </div>
            ))}
          </div>
        </LearnPanel>
      </div>
    </LearnWorkspaceShell>
  );
}
