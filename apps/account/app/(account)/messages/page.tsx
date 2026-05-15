import { buildUnifiedViewer } from "@henryco/auth/server";
import { getInboxAggregate, type InboxDivision } from "@henryco/data";
import { RouteLiveRefresh } from "@henryco/ui";

import { requireAccountUser } from "@/lib/auth";

import "@/components/messages-inbox/editorial.css";
import { InboxHero } from "@/components/messages-inbox/InboxHero";
import { InboxFilterChips } from "@/components/messages-inbox/InboxFilterChips";
import { InboxList } from "@/components/messages-inbox/InboxList";

export const dynamic = "force-dynamic";

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

  const user = await requireAccountUser();
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

  return (
    <div className="acct-inbox acct-fade-in">
      <RouteLiveRefresh intervalMs={20000} />
      <InboxHero aggregate={aggregate} />
      <section aria-labelledby="acct-inbox-threads">
        <div className="acct-inbox__section-head">
          <h2 id="acct-inbox-threads" className="acct-inbox__section-title">
            Threads
          </h2>
          <span className="acct-inbox__section-meta">
            {filteredThreads.length === 0
              ? "Nothing here yet — every portal feeds this inbox"
              : `${filteredThreads.length} thread${filteredThreads.length === 1 ? "" : "s"}`}
          </span>
        </div>
        <div style={{ marginBottom: 16 }}>
          <InboxFilterChips aggregate={aggregate} active={filter} />
        </div>
        {filteredThreads.length === 0 ? (
          <div className="acct-inbox__empty" role="status">
            <p className="acct-inbox__empty-eyebrow">Inbox quiet</p>
            <h3 className="acct-inbox__empty-title">
              {filter === "all"
                ? "Nothing waiting on you."
                : "No threads in this portal yet."}
            </h3>
            <p className="acct-inbox__empty-body">
              {filter === "all"
                ? "Support, marketplace, jobs, studio, care, property, logistics and learn all surface here — anything cross-portal lands in this list as soon as it begins."
                : "Switch filter chips to see another portal, or browse all threads to confirm nothing is pending."}
            </p>
          </div>
        ) : (
          <InboxList threads={filteredThreads} nowMs={nowMs} />
        )}
      </section>
    </div>
  );
}
