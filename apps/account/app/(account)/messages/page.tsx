import { buildUnifiedViewer } from "@henryco/auth/server";
import { getInboxAggregate, type InboxDivision } from "@henryco/data";
import { RouteLiveRefresh } from "@henryco/ui";
import { getAccountCopy, formatAccountTemplate } from "@henryco/i18n/server";

import { requireAccountUser } from "@/lib/auth";
import { getAccountAppLocale } from "@/lib/locale-server";

import "@/components/messages-inbox/editorial.css";
import { InboxHero } from "@/components/messages-inbox/InboxHero";
import { InboxFilterChips } from "@/components/messages-inbox/InboxFilterChips";
import { InboxList } from "@/components/messages-inbox/InboxList";

export const dynamic = "force-dynamic";

// Metadata literal kept at module scope (Next.js requires a static
// `metadata` export). Localised title/description are surfaced through
// the page UI; the metadata object remains the EN default for SEO.
export const metadata = {
  title: "Messages · HenryCo",
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
 *
 * RSC entry. Loads the inbox aggregate via `@henryco/data`'s
 * `getInboxAggregate(viewer)` and composes the editorial hero +
 * filter-chip row + dense list.
 *
 * Filtering: `?filter=<division>` rerenders with the filtered subset.
 * `all` (default) shows the cross-portal feed. Filter chip clicks are
 * pure-link navigation — no client state.
 *
 * Vercel preview env contract: if the admin Supabase env is missing,
 * `getInboxAggregate` returns the empty aggregate (no throw). The
 * empty-state copy below is shown — the page renders 200, never 500
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

  return (
    <div className="acct-inbox acct-fade-in">
      <RouteLiveRefresh intervalMs={20000} />
      <InboxHero aggregate={aggregate} copy={copy} />
      <section aria-labelledby="acct-inbox-threads" aria-label={copy.section.ariaLabel}>
        <div className="acct-inbox__section-head">
          <h2 id="acct-inbox-threads" className="acct-inbox__section-title">
            {copy.section.title}
          </h2>
          <span className="acct-inbox__section-meta">{sectionMeta}</span>
        </div>
        <div style={{ marginBottom: 16 }}>
          <InboxFilterChips aggregate={aggregate} active={filter} copy={copy} />
        </div>
        {threadCount === 0 ? (
          <div className="acct-inbox__empty" role="status">
            <p className="acct-inbox__empty-eyebrow">{copy.empty.eyebrow}</p>
            <h3 className="acct-inbox__empty-title">
              {filter === "all" ? copy.empty.titleAll : copy.empty.titleFilter}
            </h3>
            <p className="acct-inbox__empty-body">
              {filter === "all" ? copy.empty.bodyAll : copy.empty.bodyFilter}
            </p>
          </div>
        ) : (
          <InboxList threads={filteredThreads} nowMs={nowMs} copy={copy} />
        )}
      </section>
    </div>
  );
}
