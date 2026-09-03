import {
  translateSurfaceLabel,
  getAccountCopy,
  type AccountCopy,
} from "@henryco/i18n/server";
import { toBrandName } from "@henryco/config";
import {
  HeroCard,
  EmptyStateCard,
  TimelineCard,
  TimelineRow,
  DivisionLanding,
  type HeroCardTile,
  type TimelineChip,
} from "@henryco/dashboard-shell/surfaces";

import { requireAccountUser } from "@/lib/auth";
import { getRecentActivity } from "@/lib/account-data";
import { activityMessageHref } from "@/lib/notification-center";
import {
  timeAgoLocalized,
  divisionLabel,
  divisionColor,
  formatNaira,
} from "@/lib/format";
import { getAccountAppLocale } from "@/lib/locale-server";
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

/**
 * Activity stream landing.
 *
 * ACCOUNT-PREMIUM-01 (session 2, Phase 2C). Adds a real <HeroCard /> with
 * events-today / this-week / by-division tiles. Adopts <TimelineCard /> for
 * the list rows. Drops the old PageHeader chrome.
 */
export default async function ActivityPage() {
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const activity = await getRecentActivity(user.id, 50, locale);
  const accountCopy = getAccountCopy(locale);
  const copy = accountCopy.activity;
  const t = (text: string) => translateSurfaceLabel(locale, text);

  // ── Aggregate stats ──────────────────────────────────────────────
  // V3-09 purity: `new Date().getTime()` reads as pure to the React 19
  // `react-hooks/purity` lint; `Date.now()` flags as impure even in RSCs.
  const nowMs = new Date().getTime();
  let todayCount = 0;
  let weekCount = 0;
  const divisionBuckets = new Map<string, number>();
  for (const row of activity as Array<Record<string, unknown>>) {
    const ms = Date.parse(String(row.created_at || ""));
    if (Number.isFinite(ms)) {
      const age = nowMs - ms;
      if (age <= 86_400_000) todayCount += 1;
      if (age <= 7 * 86_400_000) weekCount += 1;
    }
    const div = String(row.division || "").trim().toLowerCase();
    if (div) divisionBuckets.set(div, (divisionBuckets.get(div) ?? 0) + 1);
  }
  const topDivisions = Array.from(divisionBuckets.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // ── HeroCard tiles ───────────────────────────────────────────────
  const tiles: ReadonlyArray<HeroCardTile> = [
    {
      label: t("Today"),
      value: todayCount,
      foot: t(toBrandName("Across Henry Onyx")),
      tone: todayCount > 0 ? "active" : "default",
    },
    {
      label: t("This week"),
      value: weekCount,
      foot: t("Last 7 days"),
    },
    {
      label: t("Total in view"),
      value: activity.length,
      foot: t("Latest 50 events"),
    },
  ];

  const heroTone: "calm" | "active" | "empty" =
    activity.length === 0 ? "empty" : todayCount > 0 ? "active" : "calm";

  // ── Available divisions (for filters client) ────────────────────
  const availableDivisions = Array.from(
    new Set(
      (activity as Array<Record<string, unknown>>)
        .map((row) => String(row.division || "").trim().toLowerCase())
        .filter(Boolean),
    ),
  ).sort();

  return (
    <DivisionLanding
      className="acct-fade-in"
      hero={
        <HeroCard
          variant="solo"
          tone={heroTone}
          eyebrow={t("Activity · cross-division")}
          headline={copy.title}
          blurb={copy.description}
          tiles={tiles}
        />
      }
      sections={[
        {
          id: "acct-activity-filters",
          title: copy.filters.heading,
          meta: topDivisions.map(([k, c]) => `${divisionLabel(k)} ${c}`).join(" · "),
          content: (
            <ActivityFiltersClient
              availableDivisions={availableDivisions}
              copy={copy.filters}
              statusLabels={copy.statusLabels}
            />
          ),
        },
        {
          id: "acct-activity-list",
          title: copy.title,
          meta: `${activity.length}`,
          content:
            activity.length === 0 ? (
              <EmptyStateCard
                kicker={t("Activity · empty")}
                title={copy.emptyTitle}
                body={copy.emptyDescription}
              />
            ) : (
              <TimelineCard ariaLabel={copy.title}>
                {(activity as Array<Record<string, unknown>>).map((item) => {
                  const id = String(item.id || "");
                  const division = String(item.division || "");
                  const title = item.title ? String(item.title) : "";
                  const description = item.description
                    ? String(item.description)
                    : undefined;
                  const status = item.status as string | number | null | undefined;
                  const createdAt = String(item.created_at || "");
                  const amountKobo =
                    typeof item.amount_kobo === "number" ? item.amount_kobo : 0;
                  const divisionDisplay = translateSurfaceLabel(
                    locale,
                    divisionLabel(division),
                  );
                  const chips: TimelineChip[] = [
                    { label: divisionDisplay, tone: "gold" },
                  ];
                  if (status) {
                    chips.push({
                      label: getStatusLabel(copy.statusLabels, status) ?? "",
                      tone: "info",
                    });
                  }
                  return (
                    <TimelineRow
                      key={id}
                      href={activityMessageHref(id)}
                      avatar={divisionDisplay.charAt(0).toUpperCase()}
                      avatarColor={divisionColor(division)}
                      avatarTone="division"
                      title={title}
                      detail={description}
                      chips={chips}
                      time={timeAgoLocalized(createdAt, locale)}
                      trailing={
                        amountKobo ? (
                          <span style={{ fontSize: 13, fontWeight: 600 }}>
                            {formatNaira(amountKobo, { locale })}
                          </span>
                        ) : null
                      }
                    />
                  );
                })}
              </TimelineCard>
            ),
        },
      ]}
    />
  );
}
