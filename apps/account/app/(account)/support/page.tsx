import Link from "next/link";
import { LifeBuoy, Plus, MessageSquare, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { RouteLiveRefresh } from "@henryco/ui";
import { requireAccountUser } from "@/lib/auth";
import { getSupportThreads } from "@/lib/account-data";
import { timeAgo, divisionLabel } from "@/lib/format";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/layout/EmptyState";

export const dynamic = "force-dynamic";

const statusInfo: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  open: { icon: AlertCircle, color: "var(--acct-blue)", label: "Open" },
  awaiting_reply: { icon: Clock, color: "var(--acct-orange)", label: "Awaiting reply" },
  pending_customer: { icon: Clock, color: "var(--acct-orange)", label: "Awaiting your reply" },
  in_progress: { icon: MessageSquare, color: "var(--acct-purple)", label: "In progress" },
  resolved: { icon: CheckCircle2, color: "var(--acct-green)", label: "Resolved" },
  closed: { icon: CheckCircle2, color: "var(--acct-muted)", label: "Closed" },
};

export default async function SupportPage() {
  const user = await requireAccountUser();
  const threads = await getSupportThreads(user.id);
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
        title="Support"
        description="Get help with any HenryCo service."
        icon={LifeBuoy}
        actions={
          <Link href="/support/new" className="acct-button-primary rounded-xl">
            <Plus size={16} /> New request
          </Link>
        }
      />

      <div className="acct-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="acct-chip acct-chip-blue text-[0.65rem]">{openCount} open request(s)</span>
          <span className="acct-chip acct-chip-red text-[0.65rem]">{urgentCount} escalated</span>
          <span className="text-xs text-[var(--acct-muted)]">
            Every message is tracked. If triage marks risk or urgency, staff gets a prioritized queue automatically.
          </span>
        </div>
      </div>

      {/* Quick help */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Help Center", desc: "Browse FAQs and guides", href: "/support" },
          { label: "Contact Us", desc: "Email or phone support", href: "/support/new" },
          { label: "Live Chat", desc: "Chat with our team", href: "/support/new" },
        ].map((item) => (
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

      {/* Threads */}
      <section>
        <p className="acct-kicker mb-3">Your requests</p>
        {threads.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No support requests"
            description="You haven't created any support requests yet. We're here to help if you need anything."
            action={
              <Link href="/support/new" className="acct-button-primary rounded-xl">
                <Plus size={16} /> Create request
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
                      {t.division ? divisionLabel(t.division) + " · " : ""}
                      {si.label} · {timeAgo(t.updated_at)}
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
