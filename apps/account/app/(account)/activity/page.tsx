import Link from "next/link";
import { Activity } from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import { getRecentActivity } from "@/lib/account-data";
import { timeAgo, divisionLabel, divisionColor, formatNaira } from "@/lib/format";
import { isExternalHref } from "@/lib/account-links";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/layout/EmptyState";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const user = await requireAccountUser();
  const activity = await getRecentActivity(user.id, 50);

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader title="Activity" description="Everything you've done across all HenryCo divisions. Items with a destination open the exact related workflow." icon={Activity} />
      {activity.length === 0 ? (
        <EmptyState icon={Activity} title="No activity yet" description="Your cross-division activity will appear here as you use HenryCo services." />
      ) : (
                <div className="acct-card divide-y divide-[var(--acct-line)]">
                  {activity.map((item: Record<string, unknown>) => {
                    const href = String(item.action_url || "").trim();
                    const itemKey = String(item.id || `${item.title || "activity"}-${item.created_at || ""}`);
                    const content = (
              <>
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white" style={{ backgroundColor: divisionColor(String(item.division || "")) }}>
                  {divisionLabel(String(item.division || "general")).charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--acct-ink)]">{String(item.title || "Activity")}</p>
                  {item.description ? <p className="mt-0.5 text-sm text-[var(--acct-muted)]">{String(item.description)}</p> : null}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="acct-chip acct-chip-gold text-[0.65rem]">{divisionLabel(String(item.division || "general"))}</span>
                    {item.status ? <span className="acct-chip acct-chip-blue text-[0.65rem]">{String(item.status)}</span> : null}
                    <span className="text-[0.65rem] text-[var(--acct-muted)]">{timeAgo(String(item.created_at || new Date().toISOString()))}</span>
                  </div>
                </div>
                {item.amount_kobo ? <p className="shrink-0 text-sm font-semibold text-[var(--acct-ink)]">{formatNaira(Number(item.amount_kobo || 0))}</p> : null}
              </>
            );
                    if (!href) return <div key={itemKey} className="flex items-start gap-4 px-5 py-4">{content}</div>;
                    const classes = "flex items-start gap-4 px-5 py-4 transition-colors hover:bg-[var(--acct-surface)]";
                    return isExternalHref(href) ? (
                      <a key={itemKey} href={href} target="_blank" rel="noopener noreferrer" className={classes}>{content}</a>
                    ) : (
                      <Link key={itemKey} href={href} className={classes}>{content}</Link>
                    );
                  })}
                </div>
      )}
    </div>
  );
}
