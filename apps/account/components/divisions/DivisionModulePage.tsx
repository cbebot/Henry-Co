import Link from "next/link";
import {
  Activity,
  Receipt,
  Bell,
  LifeBuoy,
  ChevronRight,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import { timeAgo, formatNaira, divisionLabel, divisionColor } from "@/lib/format";
import { isExternalHref } from "@/lib/account-links";
import PageHeader from "@/components/layout/PageHeader";

type DivisionModulePageProps = {
  divisionKey: string;
  icon: LucideIcon;
  title?: string;
  description: string;
  externalUrl?: string;
  activity: Record<string, string | number | null>[];
  notifications: Record<string, string | boolean>[];
  supportThreads: Record<string, string>[];
  invoices: Record<string, string | number>[];
  features: { label: string; description: string; href?: string }[];
};

export default function DivisionModulePage({
  divisionKey,
  icon: Icon,
  title,
  description,
  externalUrl,
  activity,
  notifications,
  supportThreads,
  invoices,
  features,
}: DivisionModulePageProps) {
  const color = divisionColor(divisionKey);
  const label = divisionLabel(divisionKey);
  const pageTitle = title || label;

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title={pageTitle}
        description={description}
        icon={Icon}
        actions={
          externalUrl ? (
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="acct-button-primary rounded-xl"
              style={{ backgroundColor: color }}
            >
              Go to {label} <ExternalLink size={14} />
            </a>
          ) : undefined
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) =>
          feature.href ? (
            isExternalHref(feature.href) ? (
              <a
                key={feature.label}
                href={feature.href}
                target="_blank"
                rel="noopener noreferrer"
                className="acct-card group p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--acct-ink)]">{feature.label}</p>
                    <p className="mt-0.5 text-xs text-[var(--acct-muted)]">{feature.description}</p>
                  </div>
                  <ExternalLink
                    size={14}
                    className="mt-0.5 text-[var(--acct-muted)] transition group-hover:text-[var(--acct-gold)]"
                  />
                </div>
              </a>
            ) : (
              <Link
                key={feature.label}
                href={feature.href}
                className="acct-card group p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--acct-ink)]">{feature.label}</p>
                    <p className="mt-0.5 text-xs text-[var(--acct-muted)]">{feature.description}</p>
                  </div>
                  <ChevronRight
                    size={14}
                    className="mt-0.5 text-[var(--acct-muted)] transition group-hover:text-[var(--acct-gold)]"
                  />
                </div>
              </Link>
            )
          ) : (
            <div
              key={feature.label}
              className="acct-card border-dashed border-[var(--acct-line)]/70 bg-[var(--acct-surface)]/65 p-4"
            >
              <p className="text-sm font-semibold text-[var(--acct-ink)]">{feature.label}</p>
              <p className="mt-0.5 text-xs text-[var(--acct-muted)]">{feature.description}</p>
              <p className="mt-2 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--acct-muted)]">
                Not exposed in account hub yet
              </p>
            </div>
          )
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="acct-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-[var(--acct-muted)]" />
              <p className="acct-kicker">Recent Activity</p>
            </div>
            <Link
              href="/activity"
              className="flex items-center gap-1 text-xs font-medium text-[var(--acct-gold)] hover:underline"
            >
              All activity <ChevronRight size={14} />
            </Link>
          </div>
          {activity.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--acct-muted)]">
              No {label} activity yet
            </p>
          ) : (
            <div className="space-y-2">
              {activity.slice(0, 5).map((item) => {
                const href = String(item.action_url || "").trim();
                const classes =
                  "block rounded-xl bg-[var(--acct-surface)] px-3 py-2.5 transition-colors hover:bg-[var(--acct-line)]";
                const content = (
                  <>
                    <p className="text-sm font-medium text-[var(--acct-ink)]">{item.title}</p>
                    <p className="mt-0.5 text-xs text-[var(--acct-muted)]">
                      {item.status ? `${item.status} · ` : ""}
                      {timeAgo(item.created_at as string)}
                      {item.amount_kobo ? ` · ${formatNaira(item.amount_kobo as number)}` : ""}
                    </p>
                  </>
                );
                if (!href) return <div key={item.id as string} className={classes}>{content}</div>;
                return isExternalHref(href) ? (
                  <a key={item.id as string} href={href} target="_blank" rel="noopener noreferrer" className={classes}>{content}</a>
                ) : (
                  <Link key={item.id as string} href={href} className={classes}>{content}</Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="acct-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-[var(--acct-muted)]" />
              <p className="acct-kicker">Notifications</p>
            </div>
            <Link
              href="/notifications"
              className="flex items-center gap-1 text-xs font-medium text-[var(--acct-gold)] hover:underline"
            >
              All <ChevronRight size={14} />
            </Link>
          </div>
          {notifications.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--acct-muted)]">
              No notifications from {label}
            </p>
          ) : (
            <div className="space-y-2">
              {notifications.slice(0, 5).map((notification) => {
                const href = String(notification.action_url || "").trim();
                const classes = `rounded-xl px-3 py-2.5 ${
                  !notification.is_read ? "bg-[var(--acct-gold-soft)]/50" : "bg-[var(--acct-surface)]"
                } block transition-colors hover:bg-[var(--acct-line)]`;
                const content = (
                  <>
                    <p className="text-sm font-medium text-[var(--acct-ink)]">{notification.title}</p>
                    <p className="mt-0.5 text-xs text-[var(--acct-muted)] line-clamp-1">{notification.body}</p>
                  </>
                );
                if (!href) return <div key={notification.id as string} className={classes}>{content}</div>;
                return isExternalHref(href) ? (
                  <a key={notification.id as string} href={href} target="_blank" rel="noopener noreferrer" className={classes}>{content}</a>
                ) : (
                  <Link key={notification.id as string} href={href} className={classes}>{content}</Link>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {invoices.length > 0 && (
        <section className="acct-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt size={14} className="text-[var(--acct-muted)]" />
              <p className="acct-kicker">{label} Invoices</p>
            </div>
            <Link href="/invoices" className="flex items-center gap-1 text-xs font-medium text-[var(--acct-gold)] hover:underline">All invoices <ChevronRight size={14} /></Link>
          </div>
          <div className="space-y-2">
            {invoices.slice(0, 5).map((invoice) => (
              <Link key={invoice.id as string} href={`/invoices/${invoice.id}`} className="flex items-center justify-between rounded-xl bg-[var(--acct-surface)] px-4 py-3 transition-colors hover:bg-[var(--acct-line)]">
                <div>
                  <p className="text-sm font-medium text-[var(--acct-ink)]">{invoice.description || `Invoice ${invoice.invoice_no}`}</p>
                  <p className="text-xs text-[var(--acct-muted)]">{invoice.invoice_no}</p>
                </div>
                <p className="text-sm font-semibold">{formatNaira(invoice.total_kobo as number)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {supportThreads.length > 0 && (
        <section className="acct-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LifeBuoy size={14} className="text-[var(--acct-muted)]" />
              <p className="acct-kicker">{label} Support</p>
            </div>
            <Link href="/support" className="flex items-center gap-1 text-xs font-medium text-[var(--acct-gold)] hover:underline">All support <ChevronRight size={14} /></Link>
          </div>
          <div className="space-y-2">
            {supportThreads.slice(0, 3).map((thread) => (
              <Link key={thread.id} href={`/support/${thread.id}`} className="flex items-center justify-between rounded-xl bg-[var(--acct-surface)] px-4 py-3 transition-colors hover:bg-[var(--acct-line)]">
                <p className="text-sm font-medium text-[var(--acct-ink)]">{thread.subject}</p>
                <span className="acct-chip acct-chip-blue text-[0.6rem]">{thread.status}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
