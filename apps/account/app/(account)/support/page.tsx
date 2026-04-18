import Link from "next/link";
import { LifeBuoy, Plus, MessageSquare, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n/server";
import { RouteLiveRefresh } from "@henryco/ui";
import { requireAccountUser } from "@/lib/auth";
import { getSupportThreads } from "@/lib/account-data";
import { timeAgoLocalized, divisionLabel } from "@/lib/format";
import { getAccountAppLocale } from "@/lib/locale-server";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/layout/EmptyState";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const threads = await getSupportThreads(user.id);
  const statusInfo: Record<string, { icon: typeof Clock; color: string; label: string }> =
    {
      open: { icon: AlertCircle, color: "var(--acct-blue)", label: t("Open") },
      awaiting_reply: { icon: Clock, color: "var(--acct-orange)", label: t("Awaiting reply") },
      in_progress: { icon: MessageSquare, color: "var(--acct-purple)", label: t("In progress") },
      resolved: { icon: CheckCircle2, color: "var(--acct-green)", label: t("Resolved") },
      closed: { icon: CheckCircle2, color: "var(--acct-muted)", label: t("Closed") },
    };
  const quickHelp = [
    { label: t("Help Center"), desc: t("Browse FAQs and guides"), href: "/support" },
    { label: t("Contact Us"), desc: t("Email or phone support"), href: "/support/new" },
    { label: t("Live Chat"), desc: t("Chat with our team"), href: "/support/new" },
  ];
  const openCount = threads.filter((thread: Record<string, unknown>) => {
    const status = String(thread.status || "");
    return status !== "resolved" && status !== "closed";
  }).length;
  const urgentCount = threads.filter(
    (thread: Record<string, unknown>) => String(thread.priority || "").toLowerCase() === "high"
  ).length;

  return (
    <div className="space-y-6 acct-fade-in">
      <RouteLiveRefresh intervalMs={12000} />
      <PageHeader
        title={t("Support")}
        description={t("Get help with any HenryCo service.")}
        icon={LifeBuoy}
        actions={
          <Link href="/support/new" className="acct-button-primary rounded-xl">
            <Plus size={16} /> {t("New request")}
          </Link>
        }
      />

      <div className="acct-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="acct-chip acct-chip-blue text-[0.65rem]">{openCount} {t("open request(s)")}</span>
          <span className="acct-chip acct-chip-red text-[0.65rem]">{urgentCount} {t("escalated")}</span>
          <span className="text-xs text-[var(--acct-muted)]">
            {t("Every message is tracked. If triage marks risk or urgency, staff gets a prioritized queue automatically.")}
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {quickHelp.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="acct-card flex items-center gap-3 p-4 transition-shadow hover:shadow-md"
          >
            <LifeBuoy size={20} className="shrink-0 text-[var(--acct-gold)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--acct-ink)]">{item.label}</p>
              <p className="text-xs text-[var(--acct-muted)]">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <section>
        <p className="acct-kicker mb-3">{t("Your requests")}</p>
        {threads.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title={t("No support requests")}
            description={t("You haven't created any support requests yet. We're here to help if you need anything.")}
            action={
              <Link href="/support/new" className="acct-button-primary rounded-xl">
                <Plus size={16} /> {t("Create request")}
              </Link>
            }
          />
        ) : (
          <div className="acct-card divide-y divide-[var(--acct-line)]">
            {threads.map((t: Record<string, string>) => {
              const si = statusInfo[t.status] || statusInfo.open;
              const StatusIcon = si.icon;
              return (
                <Link
                  key={t.id}
                  href={`/support/${t.id}`}
                  className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[var(--acct-surface)]"
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: si.color + "18", color: si.color }}
                  >
                    <StatusIcon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--acct-ink)]">{t.subject}</p>
                    <p className="text-xs text-[var(--acct-muted)]">
                      {t.division ? `${translateSurfaceLabel(locale, divisionLabel(t.division))} · ` : ""}
                      {si.label} · {timeAgoLocalized(t.updated_at, locale)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
