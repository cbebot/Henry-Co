import Link from "next/link";
import { ArrowRight, CalendarDays, Layers3, ShieldCheck } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { formatCurrency } from "@/lib/env";
import { StudioPaymentGuide } from "@/components/studio/payment-guide";
import { StudioSubmitButton } from "@/components/studio/submit-button";
import { createProjectFromProposalAction } from "@/lib/studio/actions";
import { getStudioViewer, viewerHasRole } from "@/lib/studio/auth";
import { getProposalWorkspace } from "@/lib/studio/data";
import { getStudioLoginUrl } from "@/lib/studio/links";
import { buildProposalPricingBreakdown } from "@/lib/studio/pricing";

function proposalStatusLabel(status: string) {
  return status.replaceAll("_", " ");
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

  const { proposal, lead, brief, customRequest, service, package: pkg, team, project, platform } =
    workspace;
  const pricingBreakdown = buildProposalPricingBreakdown({
    proposal,
    service,
    package: pkg,
    brief,
    customRequest,
  });
  const loginHref = getStudioLoginUrl(`/proposals/${proposal.id}`);
  const projectHref = project ? `/project/${project.id}?access=${project.accessKey}` : null;
  const investmentCards = [
    {
      label: "Total investment",
      value: formatCurrency(proposal.investment, proposal.currency),
      detail: "Commercial total for the current recorded scope.",
    },
    {
      label: "Deposit checkpoint",
      value: formatCurrency(proposal.depositAmount, proposal.currency),
      detail: "Matches the first milestone and project activation rail.",
    },
    {
      label: "Proposal validity",
      value: new Date(proposal.validUntil).toLocaleDateString("en-NG"),
      detail: proposalStatusLabel(proposal.status),
    },
  ];

  return (
    <main className="mx-auto max-w-[88rem] px-5 py-10 sm:px-8 lg:px-10">
      <section className="studio-panel studio-mesh rounded-[2.6rem] px-7 py-10 sm:px-10 lg:px-14">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-4xl">
            <div className="studio-kicker">Proposal room</div>
            <h1 className="studio-heading mt-4">{proposal.title}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--studio-ink-soft)]">
              {proposal.summary}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-full border border-[var(--studio-line)] px-4 py-2 text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">
                {service?.name || proposal.serviceId}
              </span>
              <span className="rounded-full border border-[var(--studio-line)] px-4 py-2 text-xs uppercase tracking-[0.16em] text-[var(--studio-ink-soft)]">
                {pkg?.name || "Custom scope"}
              </span>
              <span className="rounded-full border border-[var(--studio-line)] px-4 py-2 text-xs uppercase tracking-[0.16em] text-[var(--studio-ink-soft)]">
                {team?.name || "Assigned during sales review"}
              </span>
            </div>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-3 xl:w-[32rem] xl:grid-cols-1">
            {investmentCards.map((card) => (
              <div
                key={card.label}
                className="rounded-[1.6rem] border border-[var(--studio-line)] bg-black/10 p-5"
              >
                <div className="text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">
                  {card.label}
                </div>
                <div className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--studio-ink)]">
                  {card.value}
                </div>
                <div className="mt-2 text-sm leading-6 text-[var(--studio-ink-soft)]">
                  {card.detail}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <article className="space-y-6">
          <section className="studio-panel rounded-[1.9rem] p-6">
            <div className="studio-kicker">Commercial brief</div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
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
                  className="rounded-[1.4rem] border border-[var(--studio-line)] bg-black/10 p-4"
                >
                  <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--studio-signal)]">
                    {label}
                  </div>
                  <div className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {brief ? (
              <div className="mt-5 rounded-[1.4rem] border border-[var(--studio-line)] bg-black/10 p-5">
                <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--studio-signal)]">
                  Goals and scope
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">{brief.goals}</p>
                <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">{brief.scopeNotes}</p>
              </div>
            ) : null}

            {customRequest ? (
              <div className="mt-5 rounded-[1.4rem] border border-[var(--studio-line)] bg-black/10 p-5">
                <div className="flex items-center gap-3 text-[var(--studio-ink)]">
                  <Layers3 className="h-4 w-4 text-[var(--studio-signal)]" />
                  <div className="text-sm font-semibold">Custom request profile</div>
                </div>
                <div className="mt-4 space-y-2 text-sm leading-7 text-[var(--studio-ink-soft)]">
                  <div>Project type: {customRequest.projectType}</div>
                  <div>Platform preference: {customRequest.platformPreference}</div>
                  <div>Design direction: {customRequest.designDirection}</div>
                  {customRequest.pageRequirements.length > 0 ? (
                    <div>Pages and interfaces: {customRequest.pageRequirements.join(", ")}</div>
                  ) : null}
                  {customRequest.addonServices.length > 0 ? (
                    <div>Add-ons: {customRequest.addonServices.join(", ")}</div>
                  ) : null}
                  {customRequest.inspirationSummary ? (
                    <div>References: {customRequest.inspirationSummary}</div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </section>

          <section className="studio-panel rounded-[1.9rem] p-6">
            <div className="studio-kicker">What happens next</div>
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
            <div className="studio-kicker">Scope and pricing structure</div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {pricingBreakdown.map((line) => (
                <div
                  key={`${line.label}-${line.amount}`}
                  className="rounded-[1.4rem] border border-[var(--studio-line)] bg-black/10 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-base font-semibold text-[var(--studio-ink)]">
                        {line.label}
                      </div>
                      {line.detail ? (
                        <div className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">
                          {line.detail}
                        </div>
                      ) : null}
                    </div>
                    <div className="text-sm font-semibold text-[var(--studio-signal)]">
                      {formatCurrency(line.amount, proposal.currency)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {proposal.milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="rounded-[1.4rem] border border-[var(--studio-line)] bg-black/10 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="font-semibold text-[var(--studio-ink)]">{milestone.name}</div>
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
              ))}
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 p-5">
              <div className="flex items-center gap-3 text-[var(--studio-ink)]">
                <ShieldCheck className="h-4 w-4 text-[var(--studio-signal)]" />
                <div className="text-sm font-semibold">Proposal clarity notes</div>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--studio-ink-soft)]">
                {proposal.comparisonNotes.map((note) => (
                  <div key={note}>• {note}</div>
                ))}
              </div>
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
              <CalendarDays className="h-4 w-4 text-[var(--studio-signal)]" />
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
