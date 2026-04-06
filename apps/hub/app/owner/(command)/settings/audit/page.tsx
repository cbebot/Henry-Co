import Link from "next/link";
import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import { getAuditHistoryPageData } from "@/lib/owner-data";

export const dynamic = "force-dynamic";

type SearchParams = { view?: string; q?: string };

export default async function OwnerAuditPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await searchParams) || {};
  const view = sp.view === "all" ? "all" : "risk";
  const q = typeof sp.q === "string" ? sp.q : "";
  const data = await getAuditHistoryPageData({ view, q, limit: 220 });

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow="Audit Log"
        title="Sensitive activity history"
        description="Privilege, payout, wallet, and security-relevant events. Navigation audit tail appears when staff_navigation_audit is populated (future staff dashboards)."
      />

      <OwnerPanel
        title="Filters"
        description="Risk view highlights permission, security, owner, payout, and wallet events. All merges staff and platform audit_logs."
      >
        <form className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end" method="get">
          <input type="hidden" name="view" value={view} />
          <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-xs font-semibold text-[var(--acct-muted)]">
            Search
            <input
              name="q"
              defaultValue={data.query}
              placeholder="Action, entity, actor…"
              className="rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg)] px-3 py-2 text-sm text-[var(--acct-ink)] outline-none focus:border-[var(--acct-gold)]"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="rounded-xl bg-[var(--acct-gold)] px-4 py-2 text-sm font-semibold text-[var(--market-noir,#1a1814)]"
            >
              Apply
            </button>
            <Link
              href={`/owner/settings/audit?view=risk${data.query ? `&q=${encodeURIComponent(data.query)}` : ""}`}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
                view === "risk"
                  ? "border-[var(--acct-gold)] bg-[var(--acct-gold-soft)] text-[var(--acct-ink)]"
                  : "border-[var(--acct-line)] text-[var(--acct-muted)]"
              }`}
            >
              Risk only
            </Link>
            <Link
              href={`/owner/settings/audit?view=all${data.query ? `&q=${encodeURIComponent(data.query)}` : ""}`}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
                view === "all"
                  ? "border-[var(--acct-gold)] bg-[var(--acct-gold-soft)] text-[var(--acct-ink)]"
                  : "border-[var(--acct-line)] text-[var(--acct-muted)]"
              }`}
            >
              All merged
            </Link>
          </div>
        </form>
      </OwnerPanel>

      <OwnerPanel title="Audit stream" description={`Showing ${data.rows.length} row(s) · ${view} view`}>
        <div className="overflow-x-auto">
          <table className="owner-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Actor</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={`${String(row._source)}-${String(row.id)}-${String(row.created_at)}`}>
                  <td className="whitespace-nowrap text-xs uppercase tracking-wide text-[var(--acct-muted)]">
                    {String(row._source || "")}
                  </td>
                  <td>{String(row.action || row.event_type || "event")}</td>
                  <td className="max-w-[min(280px,28vw)]">
                    <div className="truncate font-medium text-[var(--acct-ink)]" title={String(row.entityLabel || "")}>
                      {"entityLabel" in row && row.entityLabel ? String(row.entityLabel) : String(row.entity || row.entity_id || "—")}
                    </div>
                    {row.entity_id ? (
                      <div className="truncate font-mono text-[0.65rem] text-[var(--acct-muted)]" title={String(row.entity_id)}>
                        ID {String(row.entity_id).slice(0, 8)}…
                      </div>
                    ) : null}
                  </td>
                  <td className="max-w-[min(240px,26vw)] text-sm">
                    <div className="truncate text-[var(--acct-ink)]" title={String(row.actorLabel || "")}>
                      {"actorLabel" in row && row.actorLabel ? String(row.actorLabel) : String(row.actor_role || row.role || "—")}
                    </div>
                  </td>
                  <td className="whitespace-nowrap text-sm text-[var(--acct-muted)]">
                    {String(row.created_at || "")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </OwnerPanel>

      {data.navigationTail.length > 0 ? (
        <OwnerPanel
          title="Navigation audit (preview)"
          description="Populated when staff sessions emit navigation events — reserved for future staff dashboard analytics."
        >
          <table className="owner-table">
            <thead>
              <tr>
                <th>Path</th>
                <th>Division</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {data.navigationTail.map((row, idx) => (
                <tr key={`nav-${idx}-${String(row.path)}-${String(row.created_at)}`}>
                  <td className="font-mono text-xs">{String(row.path || "")}</td>
                  <td>{String(row.division || "—")}</td>
                  <td className="text-sm text-[var(--acct-muted)]">{String(row.created_at || "")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </OwnerPanel>
      ) : null}
    </div>
  );
}
