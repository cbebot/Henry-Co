import Link from "next/link";
import {
  PropertyEmptyState,
  PropertyMetricCard,
  PropertyStatusBadge,
  PropertyWorkspaceShell,
} from "@/components/property/ui";
import { requirePropertyRoles } from "@/lib/property/auth";
import { getPropertyGovernanceWorkspaceData } from "@/lib/property/data";
import { getPropertyListingStatusSummary } from "@/lib/property/governance";
import { getWorkspaceNavigation } from "@/lib/property/navigation";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const DECISION_OPTIONS = [
  { value: "approved", label: "Approve for publication" },
  { value: "published", label: "Publish now" },
  { value: "requires_correction", label: "Request corrections" },
  { value: "changes_requested", label: "Request more information" },
  { value: "blocked", label: "Block listing" },
  { value: "escalated", label: "Escalate for higher review" },
  { value: "rejected", label: "Reject submission" },
] as const;

const INSPECTION_OPTIONS = [
  { value: "requested", label: "Requested" },
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "waived", label: "Waived" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

function humanize(value: string) {
  return value.replaceAll("_", " ");
}

function summarizeDocuments(
  docs: Array<{ kind: string; name: string }>
): Array<{ kind: string; count: number; sample: string }> {
  return Array.from(
    new Map(
      docs.map((doc) => [
        doc.kind,
        {
          kind: doc.kind,
          count: docs.filter((item) => item.kind === doc.kind).length,
          sample: doc.name,
        },
      ])
    ).values()
  );
}

export default async function AdminListingsPage() {
  await requirePropertyRoles(["property_admin", "moderation", "listing_manager"], "/admin/listings");
  const data = await getPropertyGovernanceWorkspaceData();

  const awaitingDocuments = data.queue.filter((listing) => listing.status === "awaiting_documents").length;
  const awaitingEligibility = data.queue.filter((listing) => listing.status === "awaiting_eligibility").length;
  const inspectionBacklog = data.queue.filter((listing) =>
    ["inspection_requested", "inspection_scheduled"].includes(listing.status)
  ).length;

  return (
    <PropertyWorkspaceShell
      kicker="Admin"
      title="Listing governance queue"
      description="Review trust evidence, inspection readiness, and policy holds before anything reaches the public property surface."
      nav={getWorkspaceNavigation("/admin")}
      actions={
        <div className="flex flex-wrap gap-3">
          <Link
            href="/operations"
            className="property-button-secondary inline-flex rounded-full px-5 py-3 text-sm font-semibold"
          >
            Open inspection ops
          </Link>
          <Link
            href="/trust"
            className="property-button-secondary inline-flex rounded-full px-5 py-3 text-sm font-semibold"
          >
            Review trust policy copy
          </Link>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-4">
        <PropertyMetricCard
          label="Queue"
          value={String(data.queue.length)}
          hint="Listings currently held somewhere in the governance pipeline."
        />
        <PropertyMetricCard
          label="Docs hold"
          value={String(awaitingDocuments)}
          hint="Listings blocked on authority, ownership, or supporting evidence."
        />
        <PropertyMetricCard
          label="Eligibility hold"
          value={String(awaitingEligibility)}
          hint="Listings waiting on identity, duplicate-contact review, or trust eligibility."
        />
        <PropertyMetricCard
          label="Inspection"
          value={String(inspectionBacklog)}
          hint="Listings that still need an inspection decision before publication can continue."
        />
      </div>

      <section className="property-panel rounded-[2rem] p-6 sm:p-8">
        <div className="property-kicker">Action queue</div>
        {data.queue.length === 0 ? (
          <div className="mt-5">
            <PropertyEmptyState
              title="No listings are waiting right now."
              body="New property submissions, document holds, and inspection-sensitive listings will appear here when governance work is required."
            />
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            {data.queue.map((listing) => {
              const application = data.applicationsByListingId.get(listing.id);
              const inspection = data.inspectionsByListingId.get(listing.id);
              const contactReview = data.contactReviewMap.get(listing.id);
              const latestEvent = data.policyEventsByListingId.get(listing.id)?.[0] || null;
              const documentSummary = summarizeDocuments(application?.verificationDocs || []);
              const contextEntries = Object.entries(application?.submissionContext || {});

              return (
                <article
                  key={listing.id}
                  className="rounded-[1.8rem] border border-[var(--property-line)] bg-black/10 p-5"
                >
                  <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
                    <div className="space-y-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-[18rem]">
                          <div className="text-lg font-semibold text-[var(--property-ink)]">
                            {listing.title}
                          </div>
                          <div className="mt-1 text-sm text-[var(--property-ink-soft)]">
                            {listing.locationLabel} · {humanize(listing.serviceType)} · risk {listing.riskScore}/100
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <PropertyStatusBadge status={listing.status} />
                            {inspection ? <PropertyStatusBadge status={`inspection_${inspection.status}`} /> : null}
                            {listing.managedByHenryCo ? <PropertyStatusBadge status="managed" /> : null}
                          </div>
                        </div>
                        <div className="text-right text-xs text-[var(--property-ink-soft)]">
                          <div>Updated {formatDate(listing.updatedAt)}</div>
                          <div className="mt-1">Owner: {listing.ownerName || listing.ownerEmail || "Unknown"}</div>
                        </div>
                      </div>

                      <div className="rounded-[1.4rem] border border-[var(--property-line)] bg-black/10 p-4 text-sm leading-7 text-[var(--property-ink-soft)]">
                        <div className="font-semibold text-[var(--property-ink)]">
                          {getPropertyListingStatusSummary(listing.status)}
                        </div>
                        {listing.policySummary ? <p className="mt-2">{listing.policySummary}</p> : null}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-[1.4rem] border border-[var(--property-line)] bg-black/10 p-4">
                          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-soft)]">
                            Trust evidence
                          </div>
                          {documentSummary.length ? (
                            <div className="mt-3 space-y-2 text-sm text-[var(--property-ink-soft)]">
                              {documentSummary.map((doc) => (
                                <div key={doc.kind} className="rounded-2xl border border-[var(--property-line)] px-3 py-3">
                                  <div className="font-semibold text-[var(--property-ink)]">
                                    {humanize(doc.kind)}
                                  </div>
                                  <div className="mt-1 text-xs leading-6">
                                    {doc.count} file{doc.count === 1 ? "" : "s"} · sample: {doc.sample}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-3 text-sm leading-7 text-[var(--property-ink-soft)]">
                              No uploaded trust evidence has been recorded yet.
                            </p>
                          )}
                        </div>

                        <div className="rounded-[1.4rem] border border-[var(--property-line)] bg-black/10 p-4">
                          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-soft)]">
                            Contact collision review
                          </div>
                          {contactReview?.reviewRequired ? (
                            <div className="mt-3 space-y-2 text-sm leading-7 text-[var(--property-alert)]">
                              {contactReview.notes.map((note) => (
                                <p key={note}>• {note}</p>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-3 text-sm leading-7 text-[var(--property-ink-soft)]">
                              No duplicate-contact signal is currently blocking this listing.
                            </p>
                          )}
                          <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--property-ink-soft)]">
                            <span className="rounded-full border border-[var(--property-line)] px-3 py-1">
                              email overlaps: {contactReview?.emailMatches || 0}
                            </span>
                            <span className="rounded-full border border-[var(--property-line)] px-3 py-1">
                              phone overlaps: {contactReview?.phoneMatches || 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      {contextEntries.length ? (
                        <div className="rounded-[1.4rem] border border-[var(--property-line)] bg-black/10 p-4">
                          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-soft)]">
                            Submission context
                          </div>
                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            {contextEntries.map(([key, value]) => (
                              <div key={key} className="rounded-2xl border border-[var(--property-line)] px-3 py-3">
                                <div className="text-xs uppercase tracking-[0.14em] text-[var(--property-ink-soft)]">
                                  {humanize(key)}
                                </div>
                                <div className="mt-2 text-sm leading-7 text-[var(--property-ink)]">
                                  {value}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <div className="rounded-[1.4rem] border border-[var(--property-line)] bg-black/10 p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-soft)]">
                          Latest policy event
                        </div>
                        {latestEvent ? (
                          <div className="mt-3 space-y-2 text-sm leading-7 text-[var(--property-ink-soft)]">
                            <p>
                              <span className="font-semibold text-[var(--property-ink)]">
                                {humanize(latestEvent.eventType)}
                              </span>{" "}
                              · {formatDate(latestEvent.createdAt)}
                            </p>
                            {latestEvent.reason ? <p>{latestEvent.reason}</p> : null}
                          </div>
                        ) : (
                          <p className="mt-3 text-sm leading-7 text-[var(--property-ink-soft)]">
                            No policy history recorded yet.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <section className="rounded-[1.6rem] border border-[var(--property-line)] bg-black/10 p-4">
                        <div className="text-sm font-semibold text-[var(--property-ink)]">
                          Inspection control
                        </div>
                        <p className="mt-1 text-xs leading-6 text-[var(--property-ink-soft)]">
                          Schedule, waive, complete, or fail the inspection rail before publication.
                        </p>
                        <form action="/api/property" method="POST" className="mt-4 space-y-3">
                          <input type="hidden" name="intent" value="inspection_update" />
                          <input type="hidden" name="return_to" value="/admin/listings" />
                          <input type="hidden" name="listing_id" value={listing.id} />
                          <input type="hidden" name="inspection_id" value={inspection?.id || ""} />

                          <label className="block">
                            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-soft)]">
                              Inspection status
                            </span>
                            <select
                              name="status"
                              defaultValue={inspection?.status || "requested"}
                              className="property-select mt-2 w-full rounded-2xl px-4 py-3"
                            >
                              {INSPECTION_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="block">
                            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-soft)]">
                              Scheduled time
                            </span>
                            <input
                              type="datetime-local"
                              name="scheduled_for"
                              defaultValue={toDateTimeLocal(inspection?.scheduledFor)}
                              className="property-input mt-2 w-full rounded-2xl px-4 py-3"
                            />
                          </label>

                          <label className="block">
                            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-soft)]">
                              Access notes
                            </span>
                            <textarea
                              name="location_notes"
                              rows={3}
                              defaultValue={inspection?.locationNotes || ""}
                              className="property-textarea mt-2 w-full rounded-2xl px-4 py-3"
                              placeholder="Caretaker reality, access code, estate rules, location truth..."
                            />
                          </label>

                          <label className="block">
                            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-soft)]">
                              Outcome notes
                            </span>
                            <textarea
                              name="outcome_notes"
                              rows={3}
                              defaultValue={inspection?.outcomeNotes || ""}
                              className="property-textarea mt-2 w-full rounded-2xl px-4 py-3"
                              placeholder="What HenryCo verified, what failed, or why the inspection was waived."
                            />
                          </label>

                          <button
                            type="submit"
                            className="property-button inline-flex rounded-full px-5 py-3 text-sm font-semibold"
                          >
                            Save inspection state
                          </button>
                        </form>
                      </section>

                      <section className="rounded-[1.6rem] border border-[var(--property-line)] bg-black/10 p-4">
                        <div className="text-sm font-semibold text-[var(--property-ink)]">
                          Governance decision
                        </div>
                        <p className="mt-1 text-xs leading-6 text-[var(--property-ink-soft)]">
                          Publish only when trust, documents, and inspection truth are coherent.
                        </p>
                        <form action="/api/property" method="POST" className="mt-4 space-y-3">
                          <input type="hidden" name="intent" value="listing_decision" />
                          <input type="hidden" name="return_to" value="/admin/listings" />
                          <input type="hidden" name="listing_id" value={listing.id} />

                          <label className="block">
                            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-soft)]">
                              Decision
                            </span>
                            <select
                              name="decision"
                              defaultValue="requires_correction"
                              className="property-select mt-2 w-full rounded-2xl px-4 py-3"
                            >
                              {DECISION_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="block">
                            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-soft)]">
                              Staff note
                            </span>
                            <textarea
                              name="note"
                              rows={4}
                              className="property-textarea mt-2 w-full rounded-2xl px-4 py-3"
                              placeholder="What is missing, what has been cleared, or why this needs escalation."
                            />
                          </label>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <label className="inline-flex items-center gap-2 text-sm text-[var(--property-ink-soft)]">
                              <input type="checkbox" name="featured" value="1" defaultChecked={listing.featured} />
                              Keep featured
                            </label>
                            <label className="inline-flex items-center gap-2 text-sm text-[var(--property-ink-soft)]">
                              <input type="checkbox" name="promoted" value="1" defaultChecked={listing.promoted} />
                              Keep promoted
                            </label>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            <button
                              type="submit"
                              className="property-button inline-flex rounded-full px-5 py-3 text-sm font-semibold"
                            >
                              Apply decision
                            </button>
                            <Link
                              href={`/property/${listing.slug}`}
                              className="property-button-secondary inline-flex rounded-full px-5 py-3 text-sm font-semibold"
                            >
                              View public detail
                            </Link>
                          </div>
                        </form>
                      </section>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </PropertyWorkspaceShell>
  );
}
