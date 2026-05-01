import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatCurrency } from "@/lib/env";
import { StudioFileField } from "@/components/studio/studio-file-field";
import { ProjectCollapsiblePanel } from "@/components/studio/project-collapsible-panel";
import { ProjectPaymentsStack } from "@/components/studio/project-payments-stack";
import { ProjectProgressTimeline } from "@/components/studio/project-progress-timeline";
import { ProjectStatusRail } from "@/components/studio/project-status-rail";
import { ProjectTeamUpdateComposer } from "@/components/studio/project-team-update-composer";
import { ProjectWorkspaceHero } from "@/components/studio/project-workspace-hero";
import { friendlyMilestoneStatus, friendlyRevisionStatus } from "@/lib/studio/project-workspace-copy";
import {
  addDeliverableAction,
  appendProjectMessageAction,
  completeRevisionAction,
  createRevisionAction,
  publishReviewAction,
  setMilestoneStatusAction,
} from "@/lib/studio/actions";
import { getStudioViewer, viewerHasRole } from "@/lib/studio/auth";
import { getProjectWorkspace } from "@/lib/studio/data";
import { getStudioAccountUrl, getStudioLoginUrl } from "@/lib/studio/links";
import { buildPaymentOverview, buildProposalPricingBreakdown } from "@/lib/studio/pricing";
import { StudioSubmitButton } from "@/components/studio/submit-button";

function truncateFileLabel(label: string, max = 36) {
  if (label.length <= max) return label;
  const ext = label.includes(".") ? label.slice(label.lastIndexOf(".")) : "";
  const base = ext ? label.slice(0, label.length - ext.length) : label;
  const budget = max - ext.length - 1;
  return `${base.slice(0, Math.max(6, budget - 3))}…${ext}`;
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ access?: string }>;
}) {
  const viewer = await getStudioViewer();
  const { projectId } = await params;
  const { access } = await searchParams;
  const workspace = await getProjectWorkspace({
    projectId,
    accessKey: access || null,
    viewer,
  });

  if (!workspace) {
    if (!viewer.user && !access) {
      redirect(getStudioLoginUrl(`/project/${projectId}`));
    }
    notFound();
  }

  const {
    project,
    proposal,
    team,
    service,
    payments,
    files,
    deliverables,
    revisions,
    messages,
    reviews,
    customRequest,
    updates,
    platform,
  } = workspace;
  const redirectPath = `/project/${project.id}?access=${project.accessKey}`;
  const isStaff = viewerHasRole(viewer, [
    "studio_owner",
    "sales_consultation",
    "project_manager",
    "developer_designer",
    "client_success",
    "finance",
  ]);
  const isPm = viewerHasRole(viewer, ["studio_owner", "project_manager"]);
  const isDelivery = viewerHasRole(viewer, ["studio_owner", "developer_designer"]);
  const unpaidPayments = payments.filter((payment) => payment.status !== "paid");
  const paymentOverview = buildPaymentOverview({
    proposal,
    project,
    payments,
    milestones: project.milestones,
  });
  const proposalCurrency = proposal?.currency || "NGN";
  const pricingBreakdown = proposal
    ? buildProposalPricingBreakdown({
        proposal,
        service,
        package: workspace.package,
        brief: workspace.brief,
        customRequest,
        requestConfig: workspace.requestConfig,
      })
    : [
        {
          label: "Active project scope",
          amount: paymentOverview.total,
          detail: "Commercial total derived from the current project payment record.",
        },
      ];
  const isFinance = viewerHasRole(viewer, ["studio_owner", "finance"]);
  const paymentPriority = unpaidPayments.length > 0;
  const accountUrl = getStudioAccountUrl();
  const onboardingGateActive =
    project.status === "pending_deposit" ||
    payments.some((p) => p.status !== "paid" && p.status !== "cancelled");
  const useCollapsibleSecondary = !isStaff && onboardingGateActive;

  let clientCta: { href: string; label: string; sub?: string } | null = null;
  if (!isStaff && onboardingGateActive) {
    const openInvoice = payments.some((p) => p.status === "requested" || p.status === "overdue");
    const verifying = payments.some((p) => p.status === "processing");
    if (openInvoice) {
      clientCta = {
        href: "#studio-payment-checkpoint",
        label: "Pay & upload proof",
        sub: "This secures your slot so we can start onboarding and schedule build work with confidence.",
      };
    } else if (verifying) {
      clientCta = {
        href: "#studio-payment-checkpoint",
        label: "View payment status",
        sub: "Finance is verifying your proof—this workspace updates as soon as it clears.",
      };
    } else {
      clientCta = {
        href: "#studio-payment-checkpoint",
        label: "Open payment checkpoint",
        sub: "Complete the step below to move from planning into active delivery.",
      };
    }
  }

  const milestoneSectionInner = (
    <>
      {!useCollapsibleSecondary ? (
        <p className="mb-5 max-w-2xl text-sm leading-7 text-[var(--studio-ink-soft)]">
          Your project is divided into clear milestones. Each one maps to a deliverable and a payment checkpoint.
        </p>
      ) : null}
      <div className="space-y-4">
        {project.milestones.map((milestone) => (
          <div
            key={milestone.id}
            className="rounded-[1.4rem] border border-[var(--studio-line)] bg-[color-mix(in_srgb,var(--studio-surface)_90%,transparent)] p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="font-semibold text-[var(--studio-ink)]">{milestone.name}</div>
                <p className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">{milestone.description}</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-[var(--studio-signal)]">
                  {formatCurrency(milestone.amount, proposalCurrency)}
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[rgba(151,244,243,0.2)] bg-black/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--studio-signal)]">
                {friendlyMilestoneStatus(milestone.status)}
              </span>
              {isPm ? (
                <form action={setMilestoneStatusAction}>
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="milestoneId" value={milestone.id} />
                  <input type="hidden" name="redirectPath" value={redirectPath} />
                  <input
                    type="hidden"
                    name="status"
                    value={
                      milestone.status === "planned"
                        ? "in_progress"
                        : milestone.status === "in_progress"
                          ? "ready_for_review"
                          : "approved"
                    }
                  />
                  <button
                    type="submit"
                    className="rounded-full border border-[var(--studio-line)] px-4 py-1.5 text-xs font-semibold text-[var(--studio-ink)] transition hover:border-[rgba(151,244,243,0.28)]"
                  >
                    Advance milestone
                  </button>
                </form>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </>
  );

  const customSectionInner = customRequest ? (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {[
          ["Project type", customRequest.projectType],
          ["Platform", customRequest.platformPreference],
          ["Design direction", customRequest.designDirection],
          ["Pages and interfaces", customRequest.pageRequirements.join(", ") || "Refined during scope review"],
          ["Add-ons", customRequest.addonServices.join(", ") || "None selected"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[1.4rem] border border-[var(--studio-line)] bg-black/10 p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">{label}</div>
            <div className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">{value}</div>
          </div>
        ))}
      </div>
      {customRequest.inspirationSummary ? (
        <div className="mt-4 rounded-[1.4rem] border border-[var(--studio-line)] bg-black/10 p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">References and direction</div>
          <p className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">{customRequest.inspirationSummary}</p>
        </div>
      ) : null}
    </>
  ) : null;

  return (
    <main className="mx-auto max-w-[88rem] px-5 py-8 sm:px-8 lg:px-10">
      <ProjectWorkspaceHero
        project={project}
        serviceName={service?.name || project.serviceId}
        teamLine={team?.name || project.teamId || "HenryCo Studio"}
        proposalCurrency={proposalCurrency}
        paymentOverview={{
          outstanding: paymentOverview.outstanding,
          paid: paymentOverview.paid,
          approvedMilestones: paymentOverview.approvedMilestones,
          totalMilestones: paymentOverview.totalMilestones,
          nextPayment: paymentOverview.nextPayment ? { label: paymentOverview.nextPayment.label } : null,
        }}
        viewer={viewer}
        accountUrl={accountUrl}
        redirectPath={redirectPath}
        isStaff={isStaff}
        clientCta={clientCta}
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,17rem)_1fr] lg:items-start">
        <ProjectStatusRail
          unpaidPayments={unpaidPayments}
          payments={payments}
          projectStatus={project.status}
        />

        <div className="min-w-0 space-y-6 sm:space-y-8">
          {paymentPriority ? (
            <ProjectPaymentsStack
              payments={payments}
              paymentOverview={paymentOverview}
              pricingBreakdown={pricingBreakdown}
              proposalCurrency={proposalCurrency}
              platform={platform}
              redirectPath={redirectPath}
              access={access || ""}
              isFinance={isFinance}
              isStaff={isStaff}
              variant="priority"
              sectionId="studio-payment-checkpoint"
            />
          ) : null}

          <section className="overflow-hidden rounded-[1.85rem] border border-[rgba(151,244,243,0.12)] bg-[color-mix(in_srgb,var(--studio-surface)_92%,transparent)]">
            <div className="border-b border-[var(--studio-line)] px-6 py-7 sm:px-8">
              <div className="studio-kicker">Progress</div>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--studio-ink)] sm:text-[1.65rem]">
                Your project timeline
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--studio-ink-soft)]">
                {onboardingGateActive && !isStaff
                  ? "Updates from your team will appear here once onboarding begins. Complete your payment above to get started."
                  : "A clear log of milestones, decisions, and progress from your team — everything in one place."}
              </p>
            </div>
            <div className="px-6 pb-8 pt-2 sm:px-8">
              <ProjectProgressTimeline updates={updates} />
            </div>
          </section>

          <ProjectCollapsiblePanel
            defaultOpen={messages.length > 0}
            badge="Conversation"
            title="Project messages"
            subtitle={
              messages.length > 0
                ? `${messages.length} message${messages.length === 1 ? "" : "s"} in the thread.`
                : "Send your first message to your project team."
            }
          >
            <div className="space-y-4">
              {messages.length > 0 ? (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className="rounded-[1.4rem] border border-[var(--studio-line)] bg-[color-mix(in_srgb,var(--studio-surface)_88%,transparent)] p-5"
                  >
                    <div className="text-sm font-semibold text-[var(--studio-ink)]">
                      {message.sender}
                      <span className="font-normal text-[var(--studio-ink-soft)]"> · {message.senderRole}</span>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">{message.body}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.4rem] border border-dashed border-[var(--studio-line)] bg-black/5 px-6 py-10 text-center">
                  <p className="text-sm font-medium text-[var(--studio-ink)]">No messages yet</p>
                  <p className="mt-1 text-sm text-[var(--studio-ink-soft)]">Send a message to start the conversation with your project team.</p>
                </div>
              )}
            </div>
            <form action={appendProjectMessageAction} className="mt-6 space-y-3">
              <input type="hidden" name="projectId" value={project.id} />
              <input type="hidden" name="redirectPath" value={redirectPath} />
              <input type="hidden" name="accessKey" value={access || ""} />
              <input type="hidden" name="senderRole" value={isStaff ? "team" : "client"} />
              <textarea
                name="body"
                required
                rows={4}
                className="studio-textarea min-h-28 w-full rounded-[1.5rem] px-4 py-4"
                placeholder="Write your message…"
              />
              {isStaff ? <input type="hidden" name="isInternal" value="" /> : null}
              <StudioSubmitButton label="Send message" pendingLabel="Sending…" />
            </form>
          </ProjectCollapsiblePanel>

          {isStaff ? <ProjectTeamUpdateComposer projectId={project.id} redirectPath={redirectPath} /> : null}

          {useCollapsibleSecondary ? (
            <ProjectCollapsiblePanel
              defaultOpen={false}
              badge="Delivery plan"
              title="Milestones & checkpoints"
              subtitle="Expand to view your full project roadmap and delivery checkpoints."
            >
              {milestoneSectionInner}
            </ProjectCollapsiblePanel>
          ) : (
            <article className="studio-panel rounded-[1.85rem] border border-[var(--studio-line)] p-6 sm:p-8">
              <div className="studio-kicker">Milestones</div>
              {milestoneSectionInner}
            </article>
          )}

          {customRequest ? (
            useCollapsibleSecondary ? (
              <ProjectCollapsiblePanel
                defaultOpen={false}
                badge="Scope"
                title="What you asked us to build"
                subtitle="A summary of your original project requirements."
              >
                {customSectionInner}
              </ProjectCollapsiblePanel>
            ) : (
              <section className="studio-panel rounded-[1.85rem] border border-[var(--studio-line)] p-6 sm:p-8">
                <div className="studio-kicker">What you asked us to build</div>
                <div className="mt-6">{customSectionInner}</div>
              </section>
            )
          ) : null}

          {!paymentPriority ? (
            <ProjectPaymentsStack
              payments={payments}
              paymentOverview={paymentOverview}
              pricingBreakdown={pricingBreakdown}
              proposalCurrency={proposalCurrency}
              platform={platform}
              redirectPath={redirectPath}
              access={access || ""}
              isFinance={isFinance}
              isStaff={isStaff}
              variant="summary"
            />
          ) : null}

          <section className="grid gap-6 lg:grid-cols-2">
            <article className="studio-panel rounded-[1.75rem] p-6">
              <div className="studio-kicker">Revisions</div>
              <p className="mt-2 text-sm text-[var(--studio-ink-soft)]">Change requests are tracked here so nothing is lost.</p>
              <div className="mt-5 space-y-4">
                {revisions.length > 0 ? (
                  revisions.map((revision) => (
                    <div key={revision.id} className="rounded-[1.4rem] border border-[var(--studio-line)] bg-black/10 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="font-semibold text-[var(--studio-ink)]">{revision.summary}</div>
                        <div className="text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">{friendlyRevisionStatus(revision.status)}</div>
                      </div>
                      {isPm && revision.status !== "completed" ? (
                        <form action={completeRevisionAction} className="mt-3">
                          <input type="hidden" name="revisionId" value={revision.id} />
                          <input type="hidden" name="redirectPath" value={redirectPath} />
                          <button
                            type="submit"
                            className="rounded-full border border-[var(--studio-line)] px-3 py-1 text-xs font-semibold text-[var(--studio-ink)]"
                          >
                            Mark complete
                          </button>
                        </form>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.4rem] border border-dashed border-[var(--studio-line)] bg-black/5 p-6 text-center">
                    <p className="text-sm font-medium text-[var(--studio-ink)]">No revisions requested</p>
                    <p className="mt-1 text-sm text-[var(--studio-ink-soft)]">If you need something changed, describe it below.</p>
                  </div>
                )}
              </div>
              {!isStaff ? (
                <form action={createRevisionAction} className="mt-6 space-y-3">
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="redirectPath" value={redirectPath} />
                  <input type="hidden" name="accessKey" value={access || ""} />
                  <textarea
                    name="summary"
                    required
                    rows={4}
                    className="studio-textarea min-h-28 w-full rounded-[1.5rem] px-4 py-4"
                    placeholder="Describe what you'd like changed — one request per submission keeps things clear."
                  />
                  <StudioSubmitButton label="Open revision ticket" pendingLabel="Saving…" />
                </form>
              ) : null}
            </article>

            <article className="studio-panel rounded-[1.75rem] p-6">
              <div className="studio-kicker">Files and delivery</div>
              <p className="mt-2 text-sm text-[var(--studio-ink-soft)]">
                Deliverables, assets, and handoff files attached to your project.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {files.length > 0 ? (
                  files.map((file) => (
                    <span
                      key={file.id}
                      title={`${file.kind} · ${file.label}`}
                      className="inline-flex max-w-full items-center rounded-full border border-[var(--studio-line)] px-3 py-1 text-xs text-[var(--studio-ink-soft)]"
                    >
                      <span className="truncate">
                        {file.kind} · {truncateFileLabel(file.label)}
                      </span>
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-[var(--studio-ink-soft)]">No files attached yet.</span>
                )}
              </div>
              <div className="mt-6 space-y-4">
                {deliverables.map((deliverable) => (
                  <div key={deliverable.id} className="rounded-[1.4rem] border border-[var(--studio-line)] bg-black/10 p-4">
                    <div className="font-semibold text-[var(--studio-ink)]">{deliverable.label}</div>
                    <p className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">{deliverable.summary}</p>
                  </div>
                ))}
              </div>
              {isDelivery ? (
                <form action={addDeliverableAction} className="mt-6 space-y-3">
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="redirectPath" value={redirectPath} />
                  <input name="label" required placeholder="Package label" className="studio-input w-full rounded-full px-4 py-3" />
                  <textarea
                    name="summary"
                    required
                    rows={3}
                    className="studio-textarea min-h-24 w-full rounded-[1.5rem] px-4 py-4"
                    placeholder="What is inside this delivery?"
                  />
                  <StudioFileField
                    name="deliverableFiles"
                    multiple
                    required
                    title="Delivery package"
                    description="Zip, PDF, images, or source exports—attach everything for this milestone in one go."
                    footerHint="Remove any row before sharing if you picked the wrong file; you can upload again if needed."
                  />
                  <StudioSubmitButton label="Share deliverable" pendingLabel="Sharing…" />
                </form>
              ) : null}
              {!isStaff && project.status === "delivered" && reviews.length === 0 ? (
                <form action={publishReviewAction} className="mt-6 space-y-3">
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="redirectPath" value={redirectPath} />
                  <input type="hidden" name="accessKey" value={access || ""} />
                  <input
                    name="customerName"
                    required
                    defaultValue={workspace.lead?.customerName || viewer.user?.fullName || ""}
                    placeholder="Your name"
                    className="studio-input w-full rounded-full px-4 py-3"
                  />
                  <input name="company" placeholder="Company name" className="studio-input w-full rounded-full px-4 py-3" />
                  <input name="rating" type="number" min="1" max="5" defaultValue="5" className="studio-input w-full rounded-full px-4 py-3" />
                  <textarea
                    name="quote"
                    required
                    rows={4}
                    className="studio-textarea min-h-28 w-full rounded-[1.5rem] px-4 py-4"
                    placeholder="How was the experience working with HenryCo Studio?"
                  />
                  <StudioSubmitButton label="Publish review" pendingLabel="Publishing…" />
                </form>
              ) : null}
              {unpaidPayments.length > 0 && !isStaff && viewer.user ? (
                <form action="/api/support/create" method="post" className="mt-6 space-y-3">
                  <input type="hidden" name="redirectTo" value={redirectPath} />
                  <input type="hidden" name="subject" value={`Support request for ${project.title}`} />
                  <input type="hidden" name="category" value="project" />
                  <input type="hidden" name="priority" value="normal" />
                  <input type="hidden" name="referenceType" value="studio_project" />
                  <input type="hidden" name="referenceId" value={project.id} />
                  <textarea
                    name="body"
                    required
                    rows={3}
                    className="studio-textarea min-h-24 w-full rounded-[1.5rem] px-4 py-4"
                    placeholder="Describe your question or concern — we'll respond in your account."
                  />
                  <StudioSubmitButton label="Open support thread" pendingLabel="Opening…" />
                </form>
              ) : unpaidPayments.length > 0 && !isStaff ? (
                <div className="mt-6 rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 p-5">
                  <div className="text-sm font-semibold text-[var(--studio-ink)]">Need help with your payment?</div>
                  <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">
                    Contact our finance team directly, or sign in to your HenryCo account for full support.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {platform.paymentSupportEmail ? (
                      <a href={`mailto:${platform.paymentSupportEmail}`} className="studio-button-secondary inline-flex rounded-full px-4 py-3 text-sm font-semibold">
                        Email finance
                      </a>
                    ) : null}
                    <Link href={platform.accountDashboardUrl} className="studio-button-primary inline-flex rounded-full px-4 py-3 text-sm font-semibold">
                      Open HenryCo account
                    </Link>
                  </div>
                </div>
              ) : null}
            </article>
          </section>
        </div>
      </div>
    </main>
  );
}
