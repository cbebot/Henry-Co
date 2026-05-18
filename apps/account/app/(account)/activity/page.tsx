import Link from "next/link";
import { Activity } from "lucide-react";
import { translateSurfaceLabel, getAccountCopy, type AccountCopy } from "@henryco/i18n/server";
import { requireAccountUser } from "@/lib/auth";
import { getRecentActivity } from "@/lib/account-data";
import { activityMessageHref } from "@/lib/notification-center";
import { timeAgoLocalized, divisionLabel, divisionColor, formatNaira } from "@/lib/format";
import { getAccountAppLocale } from "@/lib/locale-server";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/layout/EmptyState";
import { ActivityFiltersClient } from "@/components/branded-documents/ActivityFiltersClient";

export const dynamic = "force-dynamic";

function getStatusLabel(
  statusLabels: AccountCopy["activity"]["statusLabels"],
  value: string | number | null,
) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return null;

  const labels = statusLabels as Record<string, string>;
  return labels[normalized] || String(value);
}

export default async function ActivityPage() {
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const activity = await getRecentActivity(user.id, 50, locale);
  const accountCopy = getAccountCopy(locale);
  const copy = accountCopy.activity;

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title={copy.title}
        description={copy.description}
        icon={Activity}
      />

      <ActivityFiltersClient
        availableDivisions={Array.from(
          new Set(
            (activity as Array<Record<string, unknown>>)
              .map((row) => String(row.division || "").trim().toLowerCase())
              .filter(Boolean)
          )
        ).sort()}
        copy={copy.filters}
        statusLabels={copy.statusLabels}
      />

      {activity.length === 0 ? (
        <EmptyState
          icon={Activity}
          title={copy.emptyTitle}
          description={copy.emptyDescription}
        />
      ) : (
        <div className="acct-card divide-y divide-[var(--acct-line)]">
          {activity.map((item: Record<string, unknown>) => {
            const id = String(item.id || "");
            const division = String(item.division || "");
            const title = item.title ? String(item.title) : "";
            const description = item.description ? String(item.description) : "";
            const status = item.status as string | number | null | undefined;
            const createdAt = String(item.created_at || "");
            const amountKobo = typeof item.amount_kobo === "number" ? item.amount_kobo : 0;
            return (
              <Link
                key={id}
                href={activityMessageHref(id)}
                className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-[var(--acct-bg-elevated)]"
              >
                <div
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-semibold text-white"
                  style={{ backgroundColor: divisionColor(division) }}
                >
                  {divisionLabel(division).charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--acct-ink)]">{title}</p>
                  {description && (
                    <p className="mt-0.5 text-sm text-[var(--acct-muted)]">{description}</p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="acct-chip acct-chip-gold text-[0.65rem]">
                      {translateSurfaceLabel(locale, divisionLabel(division))}
                    </span>
                    {status ? (
                      <span className="acct-chip acct-chip-blue text-[0.65rem]">
                        {getStatusLabel(copy.statusLabels, status)}
                      </span>
                    ) : null}
                    <span className="text-[0.65rem] text-[var(--acct-muted)]">
                      {timeAgoLocalized(createdAt, locale)}
                    </span>
                  </div>
                </div>
                {amountKobo ? (
                  <p className="shrink-0 text-sm font-semibold text-[var(--acct-ink)]">
                    {formatNaira(amountKobo, { locale })}
                  </p>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
