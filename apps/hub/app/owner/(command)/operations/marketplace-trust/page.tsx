import { COMPANY, toBrandName } from "@henryco/config";
import { getMarketplaceTrustCopy, type MarketplaceTrustCopy, type MarketplaceTrustReasonKey } from "@henryco/i18n/server";
import { OwnerNotice, OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import { getHubPublicLocale } from "@/lib/locale-server";
import { readMarketplaceTrust, type GateDecisionRow, type OpenHideRow } from "@/lib/marketplace-trust";
import { requireOwner } from "@/lib/owner-auth";
import { resolveHiddenListing } from "./actions";

export const dynamic = "force-dynamic";

type OwnerCopy = MarketplaceTrustCopy["owner"];

function reasonLabels(copy: MarketplaceTrustCopy, reasons: string[], brand: string): string[] {
  return reasons
    .map((code) => copy.reasons[code as MarketplaceTrustReasonKey]?.label)
    .filter((label): label is string => typeof label === "string" && label.length > 0)
    .map((label) => label.replace("{brand}", brand));
}

function hideReasons(copy: MarketplaceTrustCopy, hide: OpenHideRow, brand: string): string[] {
  const labels = reasonLabels(copy, hide.reasons, brand);
  if (labels.length > 0) return labels;
  if (hide.kind === "reports") return [copy.hide.reportsReason];
  if (hide.kind === "risk") return [copy.hide.riskReason];
  return [copy.status.hidden];
}

function outcomeLabel(copy: OwnerCopy, outcome: GateDecisionRow["outcome"]): string {
  if (outcome === "publish") return copy.outcomePublish;
  if (outcome === "hold") return copy.outcomeHold;
  return copy.outcomeReject;
}

function sourceLabel(copy: OwnerCopy, source: string): string {
  switch (source) {
    case "policy_engine":
      return copy.sourceEngine;
    case "staff_review":
      return copy.sourceStaff;
    case "platform_catalog":
      return copy.sourceCatalogue;
    case "backfill":
    case "pre_guard_backfill":
      return copy.sourceBackfill;
    case "rescan":
      return copy.sourceRescan;
    default:
      return copy.sourceEngine;
  }
}

/**
 * V3-MKT-TRUST-01 — the owner's view of the marketplace publish gate (Register-D).
 *
 * What the gate decided, and what it took down that is waiting for a person.
 * Restore and uphold are the ordinary product approval and rejection.
 */
export default async function OwnerMarketplaceTrustPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Defense in depth: the (command) layout gates the group, but these reads use
  // the service-role client, so owner access is re-asserted here.
  await requireOwner();
  const [locale, view, params] = await Promise.all([
    getHubPublicLocale(),
    readMarketplaceTrust(),
    searchParams ?? Promise.resolve({} as Record<string, string | string[] | undefined>),
  ]);
  const copy = getMarketplaceTrustCopy(locale);
  const owner = copy.owner;
  const brand = toBrandName(COMPANY.group.name);
  const when = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
  const done = typeof params.done === "string" ? params.done : null;

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader eyebrow={`${brand} · ${owner.kicker}`} title={owner.title} description={owner.body} />

      {done === "restored" ? <OwnerNotice tone="good" title={owner.restored} body={owner.body} /> : null}
      {done === "upheld" ? <OwnerNotice tone="info" title={owner.upheld} body={owner.body} /> : null}
      {done === "failed" ? <OwnerNotice tone="critical" title={owner.actionFailed} body={owner.body} /> : null}
      {done === "staff-role" ? (
        <OwnerNotice tone="warning" title={owner.actionFailed} body={owner.staffRoleRequired} />
      ) : null}

      {!view.available ? (
        <OwnerNotice tone="warning" title={owner.title} body={owner.unavailable} />
      ) : (
        <>
          <OwnerPanel title={owner.hidesTitle}>
            {view.hides.length === 0 ? (
              <p className="mt-4 text-sm text-[var(--acct-muted)]">{owner.hidesEmpty}</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {view.hides.map((hide) => (
                  <li
                    key={hide.id}
                    className="rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--acct-ink)]">{hide.title}</p>
                        <p className="mt-1 text-xs text-[var(--acct-muted)]">
                          {[hide.store, hide.slug].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <time dateTime={hide.createdAt} className="text-xs tabular-nums text-[var(--acct-muted)]">
                        {when.format(new Date(hide.createdAt))}
                      </time>
                    </div>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {hideReasons(copy, hide, brand).map((label) => (
                        <li
                          key={label}
                          className="rounded-full border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] px-2.5 py-1 text-[11px] font-semibold text-[var(--acct-ink)]"
                        >
                          {label}
                        </li>
                      ))}
                    </ul>
                    <form action={resolveHiddenListing} className="mt-4 flex flex-wrap items-center gap-3">
                      <input type="hidden" name="product_id" value={hide.productId} />
                      <input
                        name="note"
                        maxLength={500}
                        placeholder={owner.notePlaceholder}
                        aria-label={owner.notePlaceholder}
                        className="min-w-[14rem] flex-1 rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] px-3 py-2 text-sm text-[var(--acct-ink)] placeholder:text-[var(--acct-muted)]"
                      />
                      <button
                        type="submit"
                        name="decision"
                        value="restore"
                        className="rounded-full border border-[var(--owner-accent)] px-4 py-2 text-xs font-semibold text-[var(--owner-accent)] transition-colors hover:bg-[var(--owner-accent-soft)]"
                      >
                        {owner.restore}
                      </button>
                      <button
                        type="submit"
                        name="decision"
                        value="uphold"
                        className="rounded-full border border-[var(--acct-line)] px-4 py-2 text-xs font-semibold text-[var(--acct-ink)] transition-colors hover:bg-[var(--acct-bg-elevated)]"
                      >
                        {owner.uphold}
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </OwnerPanel>

          <OwnerPanel title={owner.decisionsTitle}>
            {view.decisions.length === 0 ? (
              <p className="mt-4 text-sm text-[var(--acct-muted)]">{owner.decisionsEmpty}</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--acct-line)] text-[11px] uppercase tracking-wider text-[var(--acct-muted)]">
                      <th scope="col" className="py-2 pr-4 font-semibold">{owner.columnListing}</th>
                      <th scope="col" className="py-2 pr-4 font-semibold">{owner.columnOutcome}</th>
                      <th scope="col" className="py-2 pr-4 font-semibold">{owner.columnReasons}</th>
                      <th scope="col" className="py-2 pr-4 font-semibold">{owner.columnSource}</th>
                      <th scope="col" className="py-2 font-semibold">{owner.columnWhen}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {view.decisions.map((decision) => (
                      <tr key={decision.id} className="border-b border-[var(--acct-line)] align-top last:border-b-0">
                        <td className="py-3 pr-4 text-[var(--acct-ink)]">
                          <span className="block max-w-[16rem] truncate font-medium">{decision.slug}</span>
                          {decision.subjectType === "seller" ? (
                            <span className="text-xs text-[var(--acct-muted)]">{owner.subjectStore}</span>
                          ) : null}
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              decision.outcome === "publish"
                                ? "bg-[var(--acct-green-soft)] text-[var(--acct-green-text)]"
                                : decision.outcome === "hold"
                                  ? "bg-[var(--acct-orange-soft)] text-[var(--acct-orange-text)]"
                                  : "bg-[var(--acct-red-soft)] text-[var(--acct-red-text)]"
                            }`}
                          >
                            {outcomeLabel(owner, decision.outcome)}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-[var(--acct-muted)]">
                          {reasonLabels(copy, decision.reasons, brand).join(copy.result.reasonSeparator)}
                        </td>
                        <td className="py-3 pr-4 text-[var(--acct-muted)]">{sourceLabel(owner, decision.source)}</td>
                        <td className="py-3 text-xs tabular-nums text-[var(--acct-muted)]">
                          <time dateTime={decision.createdAt}>{when.format(new Date(decision.createdAt))}</time>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </OwnerPanel>
        </>
      )}
    </div>
  );
}
