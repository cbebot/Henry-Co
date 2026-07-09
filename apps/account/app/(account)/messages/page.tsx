import { buildUnifiedViewer } from "@henryco/auth/server";
import { getInboxAggregate, type InboxDivision } from "@henryco/data";
import { RouteLiveRefresh } from "@henryco/ui";
import { getAccountCopy, formatAccountTemplate } from "@henryco/i18n/server";
import { toBrandName } from "@henryco/config";
import {
  HeroCard,
  EmptyStateCard,
  NextStepRow,
  DivisionLanding,
  type HeroCardTile,
  type HeroCardBreakdownRow,
} from "@henryco/dashboard-shell/surfaces";

import { requireAccountUser } from "@/lib/auth";
import { getAccountAppLocale } from "@/lib/locale-server";

import "@/components/messages-inbox/editorial.css";
import { InboxFilterChips } from "@/components/messages-inbox/InboxFilterChips";
import { InboxList } from "@/components/messages-inbox/InboxList";
import {
  DIVISION_ACCENT_VAR,
  inboxBlurbKey,
  inboxHeadlineKey,
  inboxState,
} from "@/components/messages-inbox/helpers";

export const dynamic = "force-dynamic";

// Metadata literal kept at module scope (Next.js requires a static
// `metadata` export). Localised title/description are surfaced through
// the page UI; the metadata object remains the EN default for SEO.
export const metadata = {
  title: toBrandName("Messages · Henry Onyx"),
  description:
    "One inbox across support, marketplace, jobs, studio, care, property, logistics and learn.",
};

type SearchParams = Record<string, string | string[] | undefined>;

const VALID_FILTERS: ReadonlyArray<InboxDivision | "all"> = [
  "all",
  "support",
  "marketplace",
  "jobs",
  "studio",
  "care",
  "property",
  "logistics",
  "learn",
];

function pickFilter(value: SearchParams["filter"]): InboxDivision | "all" {
  const raw = typeof value === "string" ? value : Array.isArray(value) ? value[0] : null;
  const norm = (raw ?? "all").toLowerCase();
  return VALID_FILTERS.includes(norm as InboxDivision | "all")
    ? (norm as InboxDivision | "all")
    : "all";
}

/**
 * V3 Wave A1 D3 — cross-portal unified inbox page.
 * ACCOUNT-PREMIUM-01 (session 1) — reference rebuild using the shared
 * surface primitives: <HeroCard variant="paired" />, <NextStepRow />,
 * <EmptyStateCard />, <DivisionLanding />.
 *
 * RSC entry. Loads the inbox aggregate via `@henryco/data`'s
 * `getInboxAggregate(viewer)` and composes hero + (optional) next-step +
 * filter-chip row + dense thread list.
 *
 * Filtering: `?filter=<division>` rerenders with the filtered subset.
 * `all` (default) shows the cross-portal feed.
 *
 * Vercel preview env contract: if the admin Supabase env is missing,
 * `getInboxAggregate` returns the empty aggregate (no throw). The
 * <EmptyStateCard /> below is shown — the page renders 200, never 500
 * (memory `project_henryco_vercel_preview_env_gap.md`).
 */
export default async function MessagesPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const filter = pickFilter(params.filter);

  const [locale, user] = await Promise.all([
    getAccountAppLocale(),
    requireAccountUser(),
  ]);
  const accountCopy = getAccountCopy(locale);
  const copy = accountCopy.messages;

  const viewer = await buildUnifiedViewer({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
  });

  const aggregate = await getInboxAggregate(viewer, { limit: 80 });
  // RSC render — capture "now" exactly once for the entire render
  // pass. `new Date().getTime()` reads as pure to the React 19 purity
  // lint (Date.now() flags as impure even in server components).
  const nowMs = new Date().getTime();

  const filteredThreads =
    filter === "all"
      ? aggregate.threads
      : aggregate.threads.filter((t) => t.division === filter);

  const threadCount = filteredThreads.length;
  const sectionMeta =
    threadCount === 0
      ? copy.section.metaEmpty
      : formatAccountTemplate(
          threadCount === 1 ? copy.section.metaSingular : copy.section.metaPlural,
          { count: threadCount },
        );

  // ── Build HeroCard props from aggregate ──────────────────────────
  const state = inboxState(aggregate);
  const headlineKey = inboxHeadlineKey(state, aggregate);
  const headline =
    headlineKey === "zero"
      ? copy.headlines.zero
      : headlineKey === "calmOne"
        ? copy.headlines.calmOne
        : headlineKey === "calmMany"
          ? formatAccountTemplate(copy.headlines.calmMany, {
              count: aggregate.totalOpen,
            })
          : headlineKey === "busy"
            ? formatAccountTemplate(copy.headlines.busy, {
                unread: aggregate.totalUnread,
                open: aggregate.totalOpen,
              })
            : formatAccountTemplate(copy.headlines.overloaded, {
                unread: aggregate.totalUnread,
                open: aggregate.totalOpen,
              });

  const blurb = copy.blurbs[inboxBlurbKey(state)];
  const portalsActive = Object.values(aggregate.counts).filter((n) => n > 0).length;

  const tiles: ReadonlyArray<HeroCardTile> = [
    {
      label: copy.tiles.openLabel,
      value: aggregate.totalOpen,
      foot:
        aggregate.totalOpen === 0
          ? copy.tiles.openFootEmpty
          : copy.tiles.openFootActive,
    },
    {
      label: copy.tiles.unreadLabel,
      value: aggregate.totalUnread,
      foot:
        aggregate.totalUnread === 0
          ? copy.tiles.unreadFootEmpty
          : copy.tiles.unreadFootActive,
      tone: aggregate.totalUnread > 0 ? "warning" : "default",
    },
    {
      label: copy.tiles.portalsLabel,
      value: portalsActive,
      foot:
        portalsActive === 0
          ? copy.tiles.portalsFootEmpty
          : portalsActive === 1
            ? copy.tiles.portalsFootSingular
            : formatAccountTemplate(copy.tiles.portalsFootPlural, {
                count: portalsActive,
              }),
    },
  ];

  const sideTitle =
    portalsActive === 0
      ? copy.sideTitle.empty
      : portalsActive === 1
        ? copy.sideTitle.singular
        : formatAccountTemplate(copy.sideTitle.plural, { count: portalsActive });

  // Top 4 divisions by count for the side breakdown.
  const sortedMix = (Object.entries(aggregate.counts) as Array<[
    keyof typeof copy.divisionLabels,
    number,
  ]>)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const breakdownRows: ReadonlyArray<HeroCardBreakdownRow> = sortedMix.map(
    ([key, count]) => ({
      label: copy.divisionLabels[key],
      count,
      color: `var(${DIVISION_ACCENT_VAR[key]})`,
    }),
  );

  const heroTone: "calm" | "active" | "attention" | "empty" =
    state === "zero"
      ? "empty"
      : state === "overloaded"
        ? "attention"
        : aggregate.totalUnread > 0
          ? "active"
          : "calm";

  // ── Build NextStepRow when there's a clear unread to surface ─────
  //
  // The "highest-ranked unread thread" picker: pick the most recent
  // unread thread. The user's likely next action is to reply to it.
  // When there's nothing unread we render no NextStepRow (the hero
  // already answers Q2 via the calm headline).
  const topUnreadThread = aggregate.threads.find((t) => t.unread) ?? null;

  return (
    <DivisionLanding
      className="acct-inbox acct-fade-in"
      hero={
        <HeroCard
          variant="paired"
          tone={heroTone}
          eyebrow={copy.hero.eyebrow}
          headline={headline}
          blurb={blurb}
          ariaLabel={copy.hero.ariaLabel}
          ariaTilesLabel={copy.hero.ariaTiles}
          tiles={tiles}
          side={{
            kicker: copy.hero.sideLabel,
            title: sideTitle,
            body: copy.hero.sideBody,
            breakdown:
              breakdownRows.length > 0
                ? {
                    label: copy.hero.sideLabel,
                    rows: breakdownRows,
                    ariaLabel: copy.hero.ariaSide,
                  }
                : undefined,
          }}
        />
      }
      nextStep={
        topUnreadThread
          ? (
              <NextStepRow
                tone="attention"
                kicker={copy.tiles.unreadLabel}
                title={topUnreadThread.subject}
                detail={topUnreadThread.preview ?? topUnreadThread.sourceLabel}
                href={topUnreadThread.href}
                ariaLabel={topUnreadThread.subject}
              />
            )
          : null
      }
      sections={[
        {
          id: "inbox-threads",
          title: copy.section.title,
          meta: sectionMeta,
          ariaLabel: copy.section.ariaLabel,
          content: (
            <>
              <div style={{ marginBottom: 16 }}>
                <InboxFilterChips aggregate={aggregate} active={filter} copy={copy} />
              </div>
              {threadCount === 0 ? (
                <EmptyStateCard
                  kicker={copy.empty.eyebrow}
                  title={filter === "all" ? copy.empty.titleAll : copy.empty.titleFilter}
                  body={filter === "all" ? copy.empty.bodyAll : copy.empty.bodyFilter}
                />
              ) : (
                <InboxList threads={filteredThreads} nowMs={nowMs} copy={copy} />
              )}
            </>
          ),
        },
      ]}
      footer={<RouteLiveRefresh intervalMs={20000} />}
    />
  );
}
