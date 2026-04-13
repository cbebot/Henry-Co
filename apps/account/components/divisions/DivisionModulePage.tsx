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
import { timeAgo, formatCurrencyAmount, divisionLabel, divisionColor } from "@/lib/format";
import { resolveAccountLedgerCurrencyTruth } from "@/lib/currency-truth";
import { activityMessageHref, notificationMessageHref } from "@/lib/notification-center";
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
  viewerRegion?: {
    countryCode?: string | null;
    locale?: string | null;
    displayCurrency?: string | null;
  };
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
  viewerRegion,
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

      {/* Feature cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          f.href ? (
            /^https?:\/\//i.test(f.href) ? (
              <a
                key={f.label}
                href={f.href}
                target="_blank"
                rel="noopener noreferrer"
                className="acct-card group p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--acct-ink)]">{f.label}</p>
                    <p className="mt-0.5 text-xs text-[var(--acct-muted)]">{f.description}</p>
                  </div>
                  <ExternalLink
                    size={14}
                    className="mt-0.5 text-[var(--acct-muted)] transition group-hover:text-[var(--acct-gold)]"
                  />
                </div>
              </a>
            ) : (
              <Link
                key={f.label}
                href={f.href}
                className="acct-card group p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--acct-ink)]">{f.label}</p>
                    <p className="mt-0.5 text-xs text-[var(--acct-muted)]">{f.description}</p>
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
              key={f.label}
              className="acct-card p-4 transition-shadow hover:shadow-md"
            >
              <p className="text-sm font-semibold text-[var(--acct-ink)]">{f.label}</p>
              <p className="mt-0.5 text-xs text-[var(--acct-muted)]">{f.description}</p>
            </div>
          )
        ))}
      </div>

      {/* Two column layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Activity */}
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
              {activity.slice(0, 5).map((item) => (
                (() => {
                  const truth = resolveAccountLedgerCurrencyTruth(
                    item as Record<string, unknown>,
                    {
                      country: viewerRegion?.countryCode,
                      locale: viewerRegion?.locale,
                      preferredCurrency: viewerRegion?.displayCurrency,
                    }
                  );

                  return (
                <Link
                  key={item.id as string}
                  href={activityMessageHref(String(item.id || ""))}
                  className="block rounded-xl bg-[var(--acct-surface)] px-3 py-2.5 transition-colors hover:bg-[var(--acct-line)]"
                >
                  <p className="text-sm font-medium text-[var(--acct-ink)]">{item.title}</p>
                  <p className="mt-0.5 text-xs text-[var(--acct-muted)]">
                    {item.status ? `${item.status} · ` : ""}
                    {timeAgo(item.created_at as string)}
                    {item.amount_kobo
                      ? ` · ${formatCurrencyAmount(Number(item.amount_kobo || 0), truth.pricingCurrency, {
                          unit: "kobo",
                          locale: truth.locale,
                        })}`
                      : ""}
                  </p>
                </Link>
                  );
                })()
              ))}
            </div>
          )}
        </section>

        {/* Notifications */}
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
              {notifications.slice(0, 5).map((n) => (
                <Link
                  key={n.id as string}
                  href={notificationMessageHref(String(n.id || ""))}
                  className={`rounded-xl px-3 py-2.5 ${
                    !n.is_read ? "bg-[var(--acct-gold-soft)]/50" : "bg-[var(--acct-surface)]"
                  } block transition-colors hover:bg-[var(--acct-line)]`}
                >
                  <p className="text-sm font-medium text-[var(--acct-ink)]">{n.title}</p>
                  <p className="mt-0.5 text-xs text-[var(--acct-muted)] line-clamp-1">
                    {n.body}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Invoices */}
      {invoices.length > 0 && (
        <section className="acct-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt size={14} className="text-[var(--acct-muted)]" />
              <p className="acct-kicker">{label} Invoices</p>
            </div>
            <Link
              href="/invoices"
              className="flex items-center gap-1 text-xs font-medium text-[var(--acct-gold)] hover:underline"
            >
              All invoices <ChevronRight size={14} />
            </Link>
          </div>
          <div className="space-y-2">
            {invoices.slice(0, 5).map((inv) => (
              (() => {
                const truth = resolveAccountLedgerCurrencyTruth(
                  inv as Record<string, unknown>,
                  {
                    country: viewerRegion?.countryCode,
                    locale: viewerRegion?.locale,
                    preferredCurrency: viewerRegion?.displayCurrency,
                  }
                );

                return (
                  <div
                    key={inv.id as string}
                    className="flex items-center justify-between rounded-xl bg-[var(--acct-surface)] px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--acct-ink)]">
                        {inv.description || `Invoice ${inv.invoice_no}`}
                      </p>
                      <p className="text-xs text-[var(--acct-muted)]">
                        {inv.invoice_no}
                        {!truth.supportsNativeSettlement &&
                        truth.pricingCurrency !== truth.settlementCurrency
                          ? ` · settles in ${truth.settlementCurrency}`
                          : ""}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">
                      {formatCurrencyAmount(Number(inv.total_kobo || 0), truth.pricingCurrency, {
                        unit: "kobo",
                        locale: truth.locale,
                      })}
                    </p>
                  </div>
                );
              })()
            ))}
          </div>
        </section>
      )}

      {/* Support */}
      {supportThreads.length > 0 && (
        <section className="acct-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LifeBuoy size={14} className="text-[var(--acct-muted)]" />
              <p className="acct-kicker">{label} Support</p>
            </div>
            <Link
              href="/support"
              className="flex items-center gap-1 text-xs font-medium text-[var(--acct-gold)] hover:underline"
            >
              All support <ChevronRight size={14} />
            </Link>
          </div>
          <div className="space-y-2">
            {supportThreads.slice(0, 3).map((t) => (
              <Link
                key={t.id}
                href={`/support/${t.id}`}
                className="flex items-center justify-between rounded-xl bg-[var(--acct-surface)] px-4 py-3 hover:bg-[var(--acct-line)] transition-colors"
              >
                <p className="text-sm font-medium text-[var(--acct-ink)]">{t.subject}</p>
                <span className="acct-chip acct-chip-blue text-[0.6rem]">{t.status}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
