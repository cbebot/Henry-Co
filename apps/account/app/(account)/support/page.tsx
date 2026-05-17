import Link from "next/link";
import { LifeBuoy, Plus, MessageSquare, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import {
  formatAccountTemplate,
  getAccountCopy,
  translateSurfaceLabel,
} from "@henryco/i18n/server";
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
  const copy = getAccountCopy(locale).support;
  const threads = await getSupportThreads(user.id);
  const statusInfo: Record<string, { icon: typeof Clock; color: string; label: string }> =
    {
      open: { icon: AlertCircle, color: "var(--acct-blue)", label: copy.statusLabels.open },
      awaiting_reply: { icon: Clock, color: "var(--acct-orange)", label: copy.statusLabels.awaitingReply },
      in_progress: { icon: MessageSquare, color: "var(--acct-purple)", label: copy.statusLabels.inProgress },
      resolved: { icon: CheckCircle2, color: "var(--acct-green)", label: copy.statusLabels.resolved },
      closed: { icon: CheckCircle2, color: "var(--acct-muted)", label: copy.statusLabels.closed },
    };
  const quickHelp = [
    { label: copy.quickHelp.helpCenterLabel, desc: copy.quickHelp.helpCenterDesc, href: "/support" },
    { label: copy.quickHelp.contactLabel, desc: copy.quickHelp.contactDesc, href: "/support/new" },
    { label: copy.quickHelp.liveChatLabel, desc: copy.quickHelp.liveChatDesc, href: "/support/new" },
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
        title={copy.hero.title}
        description={copy.hero.description}
        icon={LifeBuoy}
        actions={
          <Link href="/support/new" className="acct-button-primary rounded-xl">
            <Plus size={16} /> {copy.hero.newRequestCta}
          </Link>
        }
      />

      <div className="acct-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="acct-chip acct-chip-blue text-[0.65rem]">
            {formatAccountTemplate(copy.summary.openRequestsTemplate, { count: openCount })}
          </span>
          <span className="acct-chip acct-chip-red text-[0.65rem]">
            {formatAccountTemplate(copy.summary.escalatedTemplate, { count: urgentCount })}
          </span>
          <span className="text-xs text-[var(--acct-muted)]">
            {copy.summary.escalationNote}
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
        <p className="acct-kicker mb-3">{copy.threads.sectionKicker}</p>
        {threads.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title={copy.threads.emptyTitle}
            description={copy.threads.emptyDescription}
            action={
              <Link href="/support/new" className="acct-button-primary rounded-xl">
                <Plus size={16} /> {copy.threads.createCta}
              </Link>
            }
          />
        ) : (
          <div className="acct-card divide-y divide-[var(--acct-line)]">
            {threads.map((thread: Record<string, string>) => {
              const si = statusInfo[thread.status] || statusInfo.open;
              const StatusIcon = si.icon;
              return (
                <Link
                  key={thread.id}
                  href={`/support/${thread.id}`}
                  className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[var(--acct-surface)]"
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: si.color + "18", color: si.color }}
                  >
                    <StatusIcon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--acct-ink)]">{thread.subject}</p>
                    <p className="text-xs text-[var(--acct-muted)]">
                      {thread.division ? `${translateSurfaceLabel(locale, divisionLabel(thread.division))} · ` : ""}
                      {si.label} · {timeAgoLocalized(thread.updated_at, locale)}
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
