import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CircleDollarSign,
  Layers3,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { resolveLocalizedDynamicField } from "@henryco/i18n/server";
import { getStudioClientPagesCopy } from "@henryco/i18n";
import { formatCurrency } from "@/lib/env";
import { getStudioPublicLocale } from "@/lib/locale-server";
import { StudioPaymentGuide } from "@/components/studio/payment-guide";
import { StudioSubmitButton } from "@/components/studio/submit-button";
import { createProjectFromProposalAction } from "@/lib/studio/actions";
import { getStudioViewer, viewerHasRole } from "@/lib/studio/auth";
import { getProposalWorkspace } from "@/lib/studio/data";
import { getStudioLoginUrl } from "@/lib/studio/links";
import { briefDomainSummary } from "@/lib/studio/brief-domain-summary";
import { buildProposalPricingBreakdown } from "@/lib/studio/pricing";
import { friendlyProposalStatus } from "@/lib/studio/project-workspace-copy";

function proposalStatusLabel(status: string) {
  return friendlyProposalStatus(status);
}

export default async function ProposalDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ proposalId: string }>;
  searchParams: Promise<{ access?: string }>;
}) {
  const viewer = await getStudioViewer();
  const { proposalId } = await params;
  const { access } = await searchParams;
  const workspace = await getProposalWorkspace({
    proposalId,
    accessKey: access || null,
    viewer,
  });

  if (!workspace) {
    if (!viewer.user && !access) {
      redirect(getStudioLoginUrl(`/proposals/${proposalId}`));
    }
    notFound();
  }

  const {
    proposal,
    lead,
    brief,
    customRequest,
    service,
    package: pkg,
    team,
    project,
    platform,
    requestConfig,
  } = workspace;
  const pricingBreakdown = buildProposalPricingBreakdown({
    proposal,
    service,
    package: pkg,
    brief,
    customRequest,
    requestConfig,
  });
  const loginHref = getStudioLoginUrl(`/proposals/${proposal.id}`);
  const projectHref = project ? `/project/${project.id}?access=${project.accessKey}` : null;
  const totalInvestment = formatCurrency(proposal.investment, proposal.currency);
  const depositAmount = formatCurrency(proposal.depositAmount, proposal.currency);
  const domainRecap = briefDomainSummary(brief);

  // WAVE1 — wrap Supabase-row text fields through resolveLocalizedDynamicField
  // so non-EN locales hit the cached DeepL pipeline (and any `_i18n` /
  // `locale_overrides` cells when the mapped rows expose them). Single-row
  // detail page, so the DeepL cost is acceptable. Milestone descriptions
  // ship through Promise.all alongside the proposal fields.
  const locale = await getStudioPublicLocale();
  const copy = getStudioClientPagesCopy(locale);
  const [
    localizedTitle,
    localizedSummary,
    localizedBriefGoals,
    localizedBriefScope,
    localizedCustomProjectType,
    localizedCustomPlatform,
    localizedCustomDesign,
    localizedCustomInspiration,
    localizedMilestones,
  ] = await Promise.all([
    resolveLocalizedDynamicField({
      record: proposal as unknown as Record<string, unknown>,
      field: "title",
      locale,
      fallback: proposal.title ?? "",
      machineTranslate: locale !== "en",
    }),
    resolveLocalizedDynamicField({
      record: proposal as unknown as Record<string, unknown>,
      field: "summary",
      locale,
      fallback: proposal.summary ?? "",
      machineTranslate: locale !== "en",
    }),
    brief
      ? resolveLocalizedDynamicField({
          record: brief as unknown as Record<string, unknown>,
          field: "goals",
          locale,
          fallback: brief.goals ?? "",
          machineTranslate: locale !== "en",
        })
      : Promise.resolve(""),
    brief
      ? resolveLocalizedDynamicField({
          record: brief as unknown as Record<string, unknown>,
          field: "scopeNotes",
          locale,
          fallback: brief.scopeNotes ?? "",
          machineTranslate: locale !== "en",
        })
      : Promise.resolve(""),
    customRequest
      ? resolveLocalizedDynamicField({
          record: customRequest as unknown as Record<string, unknown>,
          field: "projectType",
          locale,
          fallback: customRequest.projectType ?? "",
          machineTranslate: locale !== "en",
        })
      : Promise.resolve(""),
    customRequest
      ? resolveLocalizedDynamicField({
          record: customRequest as unknown as Record<string, unknown>,
          field: "platformPreference",
          locale,
          fallback: customRequest.platformPreference ?? "",
          machineTranslate: locale !== "en",
        })
      : Promise.resolve(""),
    customRequest
      ? resolveLocalizedDynamicField({
          record: customRequest as unknown as Record<string, unknown>,
          field: "designDirection",
          locale,
          fallback: customRequest.designDirection ?? "",
          machineTranslate: locale !== "en",
        })
      : Promise.resolve(""),
    customRequest
      ? resolveLocalizedDynamicField({
          record: customRequest as unknown as Record<string, unknown>,
          field: "inspirationSummary",
          locale,
          fallback: customRequest.inspirationSummary ?? "",
          machineTranslate: locale !== "en",
        })
      : Promise.resolve(""),
    Promise.all(
      proposal.milestones.map(async (milestone) => {
        const [milestoneName, milestoneDescription] = await Promise.all([
          resolveLocalizedDynamicField({
            record: milestone as unknown as Record<string, unknown>,
            field: "name",
            locale,
            fallback: milestone.name ?? "",
            machineTranslate: locale !== "en",
          }),
          resolveLocalizedDynamicField({
            record: milestone as unknown as Record<string, unknown>,
            field: "description",
            locale,
            fallback: milestone.description ?? "",
            machineTranslate: locale !== "en",
          }),
        ]);
        return { ...milestone, name: milestoneName, description: milestoneDescription };
      }),
    ),
  ]);

  return (
    <main className="mx-auto max-w-[88rem] px-5 py-10 sm:px-8 lg:px-10">
      <section className="studio-panel studio-mesh rounded-[2.8rem] px-7 py-10 sm:px-10 lg:px-14">
        <div className="grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
          <div className="max-w-4xl">
            <div className="studio-kicker">{copy.proposal.proposalRoom}</div>
            <h1 className="studio-heading mt-4">{localizedTitle}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--studio-ink-soft)]">
              {localizedSummary}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {[
                service?.name || proposal.serviceId,
                pkg?.name || copy.proposal.customScope,
                team?.name || copy.proposal.assignedDuringReview,
                proposalStatusLabel(proposal.status),
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[var(--studio-line)] px-4 py-2 text-xs uppercase tracking-[0.16em] text-[var(--studio-ink-soft)]"
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-8 rounded-[1.75rem] border border-[var(--studio-line)] bg-black/10 p-5">
              <div className="flex items-center gap-3 text-[var(--studio-ink)]">
                <ShieldCheck className="h-4 w-4 text-[var(--studio-signal)]" />
                <div className="text-sm font-semibold">{copy.proposal.confidenceNoteTitle}</div>
              </div>
              <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">
                {copy.proposal.confidenceNoteBody}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[2rem] border border-[rgba(151,244,243,0.2)] bg-[linear-gradient(180deg,rgba(8,30,38,0.92),rgba(6,16,23,0.98))] p-6">
              <div className="flex items-center gap-3 text-[var(--studio-signal)]">
                <CircleDollarSign className="h-5 w-5" />
                <div className="text-xs uppercase tracking-[0.18em]">{copy.proposal.totalInvestment}</div>
              </div>
              <div className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[var(--studio-ink)]">
                {totalInvestment}
              </div>
              <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">
                {copy.proposal.totalInvestmentBody}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.7rem] border border-[var(--studio-line)] bg-black/10 p-5">
                <div className="text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">
                  {copy.proposal.depositCheckpoint}
                </div>
                <div className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--studio-ink)]">
                  {depositAmount}
                </div>
                <p className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">
                  {copy.proposal.depositCheckpointBody}
                </p>
              </div>
              <div className="rounded-[1.7rem] border border-[var(--studio-line)] bg-black/10 p-5">
                <div className="text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">
                  {copy.proposal.proposalValidity}
                </div>
                <div className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--studio-ink)]">
                  {new Date(proposal.validUntil).toLocaleDateString("en-NG")}
                </div>
                <p className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">
                  {copy.proposal.statusIsCurrently.replace(
                    "{status}",
                    proposalStatusLabel(proposal.status),
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-6 xl:grid-cols-[0.84fr_1.16fr]">
        <article className="space-y-6">
          <section className="studio-panel rounded-[1.9rem] p-6">
            <div className="studio-kicker">{copy.proposal.commercialBrief}</div>
            <div className="mt-5 space-y-3">
              {[
                [copy.proposal.labelClient, lead?.customerName || copy.proposal.valueStudioClient],
                [copy.proposal.labelCompany, lead?.companyName || copy.proposal.valuePrivateBrief],
                [copy.proposal.labelServiceLane, service?.name || proposal.serviceId],
                [copy.proposal.labelDeliveryTeam, team?.name || copy.proposal.valueStudioMatch],
                [copy.proposal.labelBudgetLane, lead?.budgetBand || copy.proposal.valueCalibratedReview],
                [copy.proposal.labelUrgency, lead?.urgency || copy.proposal.valueStandardDelivery],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex flex-col gap-2 rounded-[1.35rem] border border-[var(--studio-line)] bg-black/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--studio-signal)]">
                    {label}
                  </div>
                  <div className="max-w-[28rem] text-sm leading-7 text-[var(--studio-ink-soft)] sm:text-right">
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {brief ? (
              <div className="mt-5 rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 p-5">
                <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--studio-signal)]">
                  {copy.proposal.goalsAndScope}
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">{localizedBriefGoals}</p>
                <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">
                  {localizedBriefScope}
                </p>
              </div>
            ) : null}

            {domainRecap ? (
              <div className="mt-5 rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 p-5">
                <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--studio-signal)]">
                  {domainRecap.title}
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">{domainRecap.body}</p>
              </div>
            ) : null}

            {customRequest ? (
              <div className="mt-5 rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 p-5">
                <div className="flex items-center gap-3 text-[var(--studio-ink)]">
                  <Layers3 className="h-4 w-4 text-[var(--studio-signal)]" />
                  <div className="text-sm font-semibold">{copy.proposal.customRequestProfile}</div>
                </div>
                <div className="mt-4 grid gap-3">
                  {[
                    [copy.proposal.labelProjectType, localizedCustomProjectType],
                    [copy.proposal.labelPlatformPreference, localizedCustomPlatform],
                    [copy.proposal.labelDesignDirection, localizedCustomDesign],
                    [
                      copy.proposal.labelPagesInterfaces,
                      // TODO(wave1): multi-row list members (pageRequirements
                      // entries) — translate each entry through DeepL in a
                      // later wave so the comma-joined string can be wrapped.
                      customRequest.pageRequirements.join(", ") || copy.proposal.valueTailoredScope,
                    ],
                    [
                      copy.proposal.labelAddons,
                      // TODO(wave1): multi-row list members (addonServices
                      // entries) — translate each entry through DeepL in a
                      // later wave so the comma-joined string can be wrapped.
                      customRequest.addonServices.join(", ") || copy.proposal.valueNoneSelected,
                    ],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-[1.2rem] border border-[var(--studio-line)] px-4 py-4">
                      <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--studio-signal)]">
                        {label}
                      </div>
                      <div className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">
                        {value}
                      </div>
                    </div>
                  ))}
                  {customRequest.inspirationSummary ? (
                    <div className="rounded-[1.2rem] border border-[var(--studio-line)] px-4 py-4">
                      <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--studio-signal)]">
                        {copy.proposal.references}
                      </div>
                      <div className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">
                        {localizedCustomInspiration}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </section>

          <section className="studio-panel rounded-[1.9rem] p-6">
            <div className="studio-kicker">{copy.proposal.decisionGuidance}</div>
            <div className="mt-5 space-y-4">
              {[
                copy.proposal.step1,
                copy.proposal.step2,
                copy.proposal.step3,
              ].map((step, index) => (
                <div key={step} className="flex gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--studio-line)] text-xs font-semibold text-[var(--studio-signal)]">
                    {index + 1}
                  </div>
                  <div className="text-sm leading-7 text-[var(--studio-ink-soft)]">{step}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 p-5">
              <div className="flex items-center gap-3 text-[var(--studio-ink)]">
                <Sparkles className="h-4 w-4 text-[var(--studio-signal)]" />
                <div className="text-sm font-semibold">{copy.proposal.afterApprovalTitle}</div>
              </div>
              <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">
                {copy.proposal.afterApprovalBody}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {projectHref ? (
                <Link
                  href={projectHref}
                  className="studio-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                >
                  {copy.proposal.openProjectWorkspace}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : viewerHasRole(viewer, ["studio_owner", "sales_consultation"]) ? (
                <form action={createProjectFromProposalAction}>
                  <input type="hidden" name="proposalId" value={proposal.id} />
                  <StudioSubmitButton
                    label={copy.proposal.createProjectWorkspace}
                    pendingLabel={copy.proposal.creatingWorkspace}
                  />
                </form>
              ) : (
                <Link
                  href={viewer.user ? platform.accountDashboardUrl : loginHref}
                  className="studio-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                >
                  {viewer.user ? copy.proposal.openHenryCoAccount : copy.proposal.signInThroughAccount}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </section>
        </article>

        <article className="space-y-6">
          <section className="studio-panel rounded-[1.9rem] p-6">
            <div className="studio-kicker">{copy.proposal.pricingArchitecture}</div>
            <div className="mt-5 space-y-3">
              {pricingBreakdown.map((line) => (
                <div
                  key={`${line.label}-${line.amount}`}
                  className="flex flex-col gap-3 rounded-[1.35rem] border border-[var(--studio-line)] bg-black/10 px-4 py-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div>
                    <div className="text-base font-semibold text-[var(--studio-ink)]">{line.label}</div>
                    {line.detail ? (
                      <div className="mt-2 max-w-2xl text-sm leading-7 text-[var(--studio-ink-soft)]">
                        {line.detail}
                      </div>
                    ) : null}
                  </div>
                  <div className="text-sm font-semibold text-[var(--studio-signal)]">
                    {formatCurrency(line.amount, proposal.currency)}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-col gap-3 rounded-[1.5rem] border border-[rgba(151,244,243,0.2)] bg-[linear-gradient(180deg,rgba(8,30,38,0.72),rgba(6,16,23,0.96))] p-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--studio-signal)]">
                  {copy.proposal.commercialTotal}
                </div>
                <div className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[var(--studio-ink)]">
                  {totalInvestment}
                </div>
              </div>
              <div className="text-sm leading-7 text-[var(--studio-ink-soft)] sm:max-w-sm sm:text-right">
                {copy.proposal.depositDueNow.replace("{amount}", depositAmount)}
              </div>
            </div>
          </section>

          <section className="studio-panel rounded-[1.9rem] p-6">
            <div className="flex items-center gap-3 text-[var(--studio-ink)]">
              <CalendarDays className="h-4 w-4 text-[var(--studio-signal)]" />
              <div className="text-sm font-semibold">{copy.proposal.milestoneMap}</div>
            </div>
            <div className="mt-5 space-y-4">
              {localizedMilestones.map((milestone, index) => (
                <div key={milestone.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--studio-line)] text-sm font-semibold text-[var(--studio-signal)]">
                      {index + 1}
                    </div>
                    {index < localizedMilestones.length - 1 ? (
                      <div className="mt-2 h-full min-h-10 w-px bg-[var(--studio-line)]" />
                    ) : null}
                  </div>
                  <div className="flex-1 rounded-[1.35rem] border border-[var(--studio-line)] bg-black/10 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="text-base font-semibold text-[var(--studio-ink)]">
                        {milestone.name}
                      </div>
                      <div className="text-sm font-semibold text-[var(--studio-signal)]">
                        {formatCurrency(milestone.amount, proposal.currency)}
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">
                      {milestone.description}
                    </p>
                    <div className="mt-3 text-[11px] uppercase tracking-[0.16em] text-[var(--studio-ink-soft)]">
                      {milestone.dueLabel}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="studio-panel rounded-[1.9rem] p-6">
            <div className="flex items-center gap-3 text-[var(--studio-ink)]">
              <ShieldCheck className="h-4 w-4 text-[var(--studio-signal)]" />
              <div className="text-sm font-semibold">{copy.proposal.clarityNotes}</div>
            </div>
            <div className="mt-4 space-y-3">
              {/* TODO(wave1): comparisonNotes is a string[] not a row-shape —
                  iterate and translate each entry through DeepL in a later
                  wave so we can wrap the per-note text. */}
              {proposal.comparisonNotes.map((note) => (
                <div
                  key={note}
                  className="rounded-[1.3rem] border border-[var(--studio-line)] bg-black/10 px-4 py-4 text-sm leading-7 text-[var(--studio-ink-soft)]"
                >
                  {note}
                </div>
              ))}
            </div>
          </section>

          <StudioPaymentGuide
            title={copy.proposal.transferGuidanceTitle}
            amount={proposal.depositAmount}
            currency={proposal.currency}
            statusLabel={proposalStatusLabel(proposal.status)}
            dueLabel={copy.proposal.validUntilLabel.replace(
              "{date}",
              new Date(proposal.validUntil).toLocaleDateString("en-NG"),
            )}
            instructions={copy.proposal.transferInstructions}
            bankName={platform.paymentBankName}
            accountName={platform.paymentAccountName}
            accountNumber={platform.paymentAccountNumber}
            supportEmail={platform.paymentSupportEmail}
            supportWhatsApp={platform.paymentSupportWhatsApp}
            proofHint={copy.proposal.proofHint}
          />

          <section className="studio-panel rounded-[1.9rem] p-6">
            <div className="flex items-center gap-3 text-[var(--studio-ink)]">
              <ShieldCheck className="h-4 w-4 text-[var(--studio-signal)]" />
              <div className="text-sm font-semibold">{copy.proposal.continuityTitle}</div>
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--studio-ink-soft)]">
              {copy.proposal.continuityBody}
            </p>
            <div className="mt-5">
              <Link
                href={platform.accountDashboardUrl}
                className="studio-button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
              >
                {copy.proposal.openHenryCoAccount}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        </article>
      </section>
    </main>
  );
}
