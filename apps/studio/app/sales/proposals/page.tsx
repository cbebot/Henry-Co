import Link from "next/link";
import { translateSurfaceLabel } from "@henryco/i18n";
import { formatCurrency } from "@/lib/env";
import { getStudioPublicLocale } from "@/lib/locale-server";
import { StudioFormListbox } from "@/components/studio/studio-form-listbox";
import { StudioSubmitButton } from "@/components/studio/submit-button";
import { releaseStudioProposalAction, setProposalStatusAction } from "@/lib/studio/actions";
import { STUDIO_PROPOSAL_STATUS_OPTIONS } from "@/lib/studio/form-options";
import { requireStudioRoles } from "@/lib/studio/auth";
import { getStudioCatalog } from "@/lib/studio/catalog";
import { salesNav } from "@/lib/studio/navigation";
import { composeProposalReviewCard } from "@/lib/studio/proposal-review";
import { formatWorkspaceDate } from "@/lib/studio/project-workspace-copy";
import { getStudioSnapshot } from "@/lib/studio/store";
import { StudioWorkspaceShell } from "@/components/studio/workspace/shell";

export default async function SalesProposalsPage() {
  await requireStudioRoles(["studio_owner", "sales_consultation"], "/sales/proposals");
  const [snapshot, catalog, locale] = await Promise.all([
    getStudioSnapshot(),
    getStudioCatalog({ includeUnpublished: true }),
    getStudioPublicLocale(),
  ]);
  const t = (text: string) => translateSurfaceLabel(locale, text);

  // SA-D5 — held agency briefs surface FIRST, as review cards with a
  // one-tap release. Everything else keeps the existing queue behaviour.
  const inReview = snapshot.proposals.filter((proposal) => proposal.status === "in_review");
  const rest = snapshot.proposals.filter((proposal) => proposal.status !== "in_review");

  return (
    <StudioWorkspaceShell
      kicker="Proposal queue"
      title="Track sent, accepted, and expired scopes from one list."
      description="Sales can change proposal state, preserve the commercial trail, and move into project activation without leaving the Studio surface."
      nav={salesNav("/sales/proposals")}
    >
      {inReview.length > 0 ? (
        <section className="mb-8">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-lg font-semibold text-[var(--studio-ink)]">
              {t("Waiting on your release")}
            </h2>
            <span className="text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">
              {inReview.length} {t(inReview.length === 1 ? "brief" : "briefs")}
            </span>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--studio-ink-soft)]">
            {t(
              "Agency-class briefs hold here before the client sees a price. Read the card, adjust anything that needs judgment, then release — the proposal email goes out on your tap.",
            )}
          </p>
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {inReview.map((proposal) => {
              const lead = snapshot.leads.find((item) => item.id === proposal.leadId) ?? null;
              const brief = snapshot.briefs.find((item) => item.leadId === proposal.leadId) ?? null;
              const customRequest =
                snapshot.customRequests?.find((item) => item.leadId === proposal.leadId) ?? null;
              const card = composeProposalReviewCard({ proposal, lead, brief, customRequest });
              return (
                <article
                  key={proposal.id}
                  className="rounded-[1.75rem] border border-[var(--studio-accent-ring)] bg-[linear-gradient(180deg,var(--studio-accent-soft),var(--studio-bg-soft))] p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">
                        {t("In review")} · {formatWorkspaceDate(card.submittedAt)}
                      </div>
                      <h3 className="mt-2 text-xl font-semibold text-[var(--studio-ink)]">
                        {card.headline}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--studio-ink-soft)]">
                        {card.clientName}
                        {card.companyName ? ` · ${card.companyName}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-semibold text-[var(--studio-ink)]">
                        {formatCurrency(card.investment, card.currency)}
                      </div>
                      <div className="mt-1 text-xs text-[var(--studio-ink-soft)]">
                        {t("Deposit")} {formatCurrency(card.depositAmount, card.currency)} ·{" "}
                        {t("readiness")} {card.readinessScore}/100
                      </div>
                    </div>
                  </div>

                  {card.goals ? (
                    <p className="mt-4 text-sm leading-7 text-[var(--studio-ink-soft)]">
                      {card.goals}
                    </p>
                  ) : null}

                  <ul className="mt-4 space-y-2">
                    {card.signals.map((signal) => (
                      <li
                        key={signal}
                        className="rounded-[1.1rem] border border-[var(--studio-line)] bg-black/10 px-3.5 py-2.5 text-[13px] leading-6 text-[var(--studio-ink-soft)]"
                      >
                        {signal}
                      </li>
                    ))}
                  </ul>

                  {card.requiredFeatures.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {card.requiredFeatures.map((feature) => (
                        <span
                          key={feature}
                          className="rounded-full border border-[var(--studio-line)] px-3 py-1 text-xs text-[var(--studio-ink-soft)]"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <form action={releaseStudioProposalAction}>
                      <input type="hidden" name="proposalId" value={proposal.id} />
                      <input type="hidden" name="redirectPath" value="/sales/proposals" />
                      <StudioSubmitButton
                        label={t("Release to client")}
                        pendingLabel={t("Releasing…")}
                      />
                    </form>
                    <Link
                      href={`/proposals/${proposal.id}?access=${proposal.accessKey}`}
                      className="studio-button-secondary rounded-full px-5 py-3 text-sm font-semibold"
                    >
                      {t("Open full proposal")}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* TODO(wave1): multi-row proposal queue (staff). proposal.title and
          proposal.summary are Supabase-row text fields — translate each via
          Promise.all + resolveLocalizedDynamicField in a follow-up wave.
          Single-row detail surface at /proposals/[proposalId] is already
          wrapped through the cached DeepL pipeline. */}
      <section className="grid gap-4 lg:grid-cols-2">
        {rest.map((proposal) => (
          <article key={proposal.id} className="studio-panel rounded-[1.75rem] p-6">
            <h3 className="text-xl font-semibold text-[var(--studio-ink)]">{proposal.title}</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">{proposal.summary}</p>
            <p className="mt-3 text-sm text-[var(--studio-ink-soft)]">
              {catalog.services.find((item) => item.id === proposal.serviceId)?.name || proposal.serviceId} · {catalog.teams.find((item) => item.id === proposal.teamId)?.name || "Team assigned in review"}
            </p>
            <div className="mt-4 flex items-center justify-between gap-4">
              <div className="text-2xl font-semibold text-[var(--studio-ink)]">{formatCurrency(proposal.investment, proposal.currency)}</div>
              <div className="text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">
                {proposal.status.replaceAll("_", " ")}
              </div>
            </div>
            <form action={setProposalStatusAction} className="mt-5 flex flex-wrap items-end gap-2">
              <input type="hidden" name="proposalId" value={proposal.id} />
              <input type="hidden" name="redirectPath" value="/sales/proposals" />
              <div className="min-w-[11.5rem] max-w-[16rem]">
                <StudioFormListbox
                  name="status"
                  label="Proposal status"
                  initialValue={proposal.status}
                  options={STUDIO_PROPOSAL_STATUS_OPTIONS}
                />
              </div>
              <button type="submit" className="rounded-full border border-[var(--studio-line)] px-4 py-2 text-xs font-semibold text-[var(--studio-ink)]">
                Save
              </button>
            </form>
            <div className="mt-5">
              <Link href={`/proposals/${proposal.id}?access=${proposal.accessKey}`} className="studio-button-secondary rounded-full px-5 py-3 text-sm font-semibold">
                Open proposal
              </Link>
            </div>
          </article>
        ))}
      </section>
    </StudioWorkspaceShell>
  );
}
