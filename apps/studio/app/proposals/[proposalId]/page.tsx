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
import { formatCurrency } from "@/lib/env";
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

  return (
    <main className="mx-auto max-w-[88rem] px-5 py-10 sm:px-8 lg:px-10">
      <section className="studio-panel studio-mesh rounded-[2.8rem] px-7 py-10 sm:px-10 lg:px-14">
        <div className="grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
          <div className="max-w-4xl">
            <div className="studio-kicker">Proposal room</div>
            <h1 className="studio-heading mt-4">{proposal.title}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--studio-ink-soft)]">
              {proposal.summary}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {[
                service?.name || proposal.serviceId,
                pkg?.name || "Custom scope",
                team?.name || "Assigned during sales review",
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
                <div className="text-sm font-semibold">Commercial confidence note</div>
              </div>
              <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">
                This proposal is not a vague estimate. It is a structured commercial record with scope,
                milestone, deposit, and payment continuity aligned to the same Studio workflow.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[2rem] border border-[rgba(151,244,243,0.2)] bg-[linear-gradient(180deg,rgba(8,30,38,0.92),rgba(6,16,23,0.98))] p-6">
              <div className="flex items-center gap-3 text-[var(--studio-signal)]">
                <CircleDollarSign className="h-5 w-5" />
                <div className="text-xs uppercase tracking-[0.18em]">Total investment</div>
              </div>
              <div className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[var(--studio-ink)]">
                {totalInvestment}
              </div>
              <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">
                The current total reflects scope, platform architecture, delivery pace, and commercial
                calibration for this proposal.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.7rem] border border-[var(--studio-line)] bg-black/10 p-5">
                <div className="text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">
                  Deposit checkpoint
                </div>
                <div className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--studio-ink)]">
                  {depositAmount}
                </div>
                <p className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">
                  Activates the project room, payment verification, onboarding, and the first milestone.
                </p>
              </div>
              <div className="rounded-[1.7rem] border border-[var(--studio-line)] bg-black/10 p-5">
                <div className="text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">
                  Proposal validity
                </div>
                <div className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--studio-ink)]">
                  {new Date(proposal.validUntil).toLocaleDateString("en-NG")}
                </div>
                <p className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">
                  Status is currently {proposalStatusLabel(proposal.status)}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-6 xl:grid-cols-[0.84fr_1.16fr]">
        <article className="space-y-6">
          <section className="studio-panel rounded-[1.9rem] p-6">
            <div className="studio-kicker">Commercial brief</div>
            <div className="mt-5 space-y-3">
              {[
                ["Client", lead?.customerName || "Studio client"],
                ["Company", lead?.companyName || "Private brief"],
                ["Service lane", service?.name || proposal.serviceId],
                ["Delivery team", team?.name || "HenryCo Studio match"],
                ["Budget lane", lead?.budgetBand || "Calibrated during review"],
                ["Urgency", lead?.urgency || "Standard delivery lane"],
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
                  Goals and scope
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">{brief.goals}</p>
                <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">
                  {brief.scopeNotes}
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
                  <div className="text-sm font-semibold">Custom request profile</div>
                </div>
                <div className="mt-4 grid gap-3">
                  {[
                    ["Project type", customRequest.projectType],
                    ["Platform preference", customRequest.platformPreference],
                    ["Design direction", customRequest.designDirection],
                    [
                      "Pages and interfaces",
                      customRequest.pageRequirements.join(", ") || "Tailored during scope review",
                    ],
                    [
                      "Add-ons",
                      customRequest.addonServices.join(", ") || "None selected",
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
                        References
                      </div>
                      <div className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">
                        {customRequest.inspirationSummary}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </section>

          <section className="studio-panel rounded-[1.9rem] p-6">
            <div className="studio-kicker">Decision guidance</div>
            <div className="mt-5 space-y-4">
              {[
                "Approve the commercial direction and HenryCo activates the live project room.",
                "The deposit amount below becomes the first payment checkpoint in the delivery timeline.",
                "Finance confirms payment, then onboarding, design, build, and delivery updates stay on the same Studio record.",
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
                <div className="text-sm font-semibold">What happens after approval</div>
              </div>
              <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">
                The proposal converts into a live project workspace with milestone tracking, payment
                verification, files, revisions, and support continuity on the same record.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {projectHref ? (
                <Link
                  href={projectHref}
                  className="studio-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                >
                  Open project workspace
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : viewerHasRole(viewer, ["studio_owner", "sales_consultation"]) ? (
                <form action={createProjectFromProposalAction}>
                  <input type="hidden" name="proposalId" value={proposal.id} />
                  <StudioSubmitButton
                    label="Create project workspace"
                    pendingLabel="Creating workspace..."
                  />
                </form>
              ) : (
                <Link
                  href={viewer.user ? platform.accountDashboardUrl : loginHref}
                  className="studio-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                >
                  {viewer.user ? "Open HenryCo account" : "Sign in through HenryCo account"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </section>
        </article>

        <article className="space-y-6">
          <section className="studio-panel rounded-[1.9rem] p-6">
            <div className="studio-kicker">Pricing architecture</div>
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
                  Commercial total
                </div>
                <div className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[var(--studio-ink)]">
                  {totalInvestment}
                </div>
              </div>
              <div className="text-sm leading-7 text-[var(--studio-ink-soft)] sm:max-w-sm sm:text-right">
                Deposit due now: {depositAmount}. Remaining payments stay attached to milestones, not
                a vague follow-up invoice trail.
              </div>
            </div>
          </section>

          <section className="studio-panel rounded-[1.9rem] p-6">
            <div className="flex items-center gap-3 text-[var(--studio-ink)]">
              <CalendarDays className="h-4 w-4 text-[var(--studio-signal)]" />
              <div className="text-sm font-semibold">Milestone map</div>
            </div>
            <div className="mt-5 space-y-4">
              {proposal.milestones.map((milestone, index) => (
                <div key={milestone.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--studio-line)] text-sm font-semibold text-[var(--studio-signal)]">
                      {index + 1}
                    </div>
                    {index < proposal.milestones.length - 1 ? (
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
              <div className="text-sm font-semibold">Proposal clarity notes</div>
            </div>
            <div className="mt-4 space-y-3">
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
            title="Transfer guidance is based on HenryCo’s live company account record."
            amount={proposal.depositAmount}
            currency={proposal.currency}
            statusLabel={proposalStatusLabel(proposal.status)}
            dueLabel={`Proposal valid until ${new Date(proposal.validUntil).toLocaleDateString("en-NG")}`}
            instructions="The deposit unlocks the active project room, finance verification, onboarding, and the first execution milestone. The same amount and account details continue into the live payment workspace."
            bankName={platform.paymentBankName}
            accountName={platform.paymentAccountName}
            accountNumber={platform.paymentAccountNumber}
            supportEmail={platform.paymentSupportEmail}
            supportWhatsApp={platform.paymentSupportWhatsApp}
            proofHint="If the project room is already active, upload proof inside the payment lane immediately after transfer. If not, HenryCo activates the workspace on acceptance so the exact proof path is attached to the same record."
          />

          <section className="studio-panel rounded-[1.9rem] p-6">
            <div className="flex items-center gap-3 text-[var(--studio-ink)]">
              <ShieldCheck className="h-4 w-4 text-[var(--studio-signal)]" />
              <div className="text-sm font-semibold">Shared-account continuity</div>
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--studio-ink-soft)]">
              Studio keeps the direct proposal and project rooms here, while the broader HenryCo account
              history remains the central place for account-level visibility, invoices, support context,
              and future cross-division records.
            </p>
            <div className="mt-5">
              <Link
                href={platform.accountDashboardUrl}
                className="studio-button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
              >
                Open HenryCo account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        </article>
      </section>
    </main>
  );
}
