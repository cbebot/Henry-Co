import { notFound, redirect } from "next/navigation";
import { formatCurrency } from "@/lib/env";
import {
  addDeliverableAction,
  appendProjectMessageAction,
  completeRevisionAction,
  createProjectUpdateAction,
  createRevisionAction,
  publishReviewAction,
  setMilestoneStatusAction,
  setPaymentStatusAction,
  uploadPaymentProofAction,
} from "@/lib/studio/actions";
import { getStudioViewer, viewerHasRole } from "@/lib/studio/auth";
import { getProjectWorkspace } from "@/lib/studio/data";
import { StudioSubmitButton } from "@/components/studio/submit-button";

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
      redirect(`/login?next=${encodeURIComponent(`/project/${projectId}`)}`);
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
  const isFinance = viewerHasRole(viewer, ["studio_owner", "finance"]);
  const isPm = viewerHasRole(viewer, ["studio_owner", "project_manager"]);
  const isDelivery = viewerHasRole(viewer, ["studio_owner", "developer_designer"]);
  const unpaidPayments = payments.filter((payment) => payment.status !== "paid");

  return (
    <main className="mx-auto max-w-[88rem] px-5 py-10 sm:px-8 lg:px-10">
      <section className="studio-panel studio-mesh rounded-[2.4rem] px-7 py-10 sm:px-10 lg:px-14">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl">
            <div className="studio-kicker">Project workspace</div>
            <h1 className="studio-heading mt-4">{project.title}</h1>
            <p className="mt-5 text-lg leading-8 text-[var(--studio-ink-soft)]">{project.summary}</p>
            <p className="mt-4 text-sm text-[var(--studio-signal)]">{project.nextAction}</p>
          </div>
          <div className="rounded-[1.75rem] border border-[var(--studio-line)] bg-black/10 p-5">
            <div className="text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">Status</div>
            <div className="mt-2 text-3xl font-semibold text-[var(--studio-ink)]">
              {project.status.replaceAll("_", " ")}
            </div>
            <div className="mt-2 text-sm text-[var(--studio-ink-soft)]">
              {service?.name || project.serviceId} · {team?.name || project.teamId || "Studio team"}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <article className="studio-panel rounded-[1.75rem] p-6">
          <div className="studio-kicker">Milestones</div>
          <div className="mt-5 space-y-4">
            {project.milestones.map((milestone) => (
              <div key={milestone.id} className="rounded-[1.4rem] border border-[var(--studio-line)] bg-black/10 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="font-semibold text-[var(--studio-ink)]">{milestone.name}</div>
                  <div className="text-sm text-[var(--studio-signal)]">
                    {formatCurrency(milestone.amount, proposal?.currency || "NGN")}
                  </div>
                </div>
                <p className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">{milestone.description}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[var(--studio-line)] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[var(--studio-ink-soft)]">
                    {milestone.status.replaceAll("_", " ")}
                  </span>
                  {isPm ? (
                    <form action={setMilestoneStatusAction}>
                      <input type="hidden" name="projectId" value={project.id} />
                      <input type="hidden" name="milestoneId" value={milestone.id} />
                      <input type="hidden" name="redirectPath" value={redirectPath} />
                      <input type="hidden" name="status" value={milestone.status === "planned" ? "in_progress" : milestone.status === "in_progress" ? "ready_for_review" : "approved"} />
                      <button type="submit" className="rounded-full border border-[var(--studio-line)] px-3 py-1 text-xs font-semibold text-[var(--studio-ink)]">
                        Advance milestone
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="space-y-6">
          {customRequest ? (
            <section className="studio-panel rounded-[1.75rem] p-6">
              <div className="studio-kicker">Custom brief context</div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {[
                  ["Project type", customRequest.projectType],
                  ["Platform", customRequest.platformPreference],
                  ["Design direction", customRequest.designDirection],
                  ["Pages and interfaces", customRequest.pageRequirements.join(", ") || "Tailored during scope review"],
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
            </section>
          ) : null}

          <section className="studio-panel rounded-[1.75rem] p-6">
            <div className="studio-kicker">Project updates</div>
            <div className="mt-5 space-y-4">
              {updates.length > 0 ? (
                updates.map((update) => (
                  <div key={update.id} className="rounded-[1.4rem] border border-[var(--studio-line)] bg-black/10 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="font-semibold text-[var(--studio-ink)]">{update.title}</div>
                      <div className="text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">
                        {update.kind.replaceAll("_", " ")}
                      </div>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">{update.summary}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.4rem] border border-[var(--studio-line)] bg-black/10 p-4 text-sm leading-7 text-[var(--studio-ink-soft)]">
                  No project updates have been logged yet.
                </div>
              )}
            </div>
            {isStaff ? (
              <form action={createProjectUpdateAction} className="mt-5 space-y-3">
                <input type="hidden" name="projectId" value={project.id} />
                <input type="hidden" name="redirectPath" value={redirectPath} />
                <input
                  name="title"
                  required
                  placeholder="Update title"
                  className="w-full rounded-full border border-[var(--studio-line)] bg-black/10 px-4 py-3 text-sm text-[var(--studio-ink)] outline-none placeholder:text-[var(--studio-ink-soft)]"
                />
                <input
                  name="kind"
                  defaultValue="manual_update"
                  placeholder="Update type"
                  className="w-full rounded-full border border-[var(--studio-line)] bg-black/10 px-4 py-3 text-sm text-[var(--studio-ink)] outline-none placeholder:text-[var(--studio-ink-soft)]"
                />
                <textarea
                  name="summary"
                  required
                  rows={3}
                  className="min-h-24 w-full rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 px-4 py-4 text-sm text-[var(--studio-ink)] outline-none placeholder:text-[var(--studio-ink-soft)]"
                  placeholder="Describe the movement, milestone, or operational update."
                />
                <label className="flex items-center gap-3 rounded-[1.2rem] border border-[var(--studio-line)] bg-black/10 px-4 py-3 text-sm text-[var(--studio-ink-soft)]">
                  <input type="checkbox" name="notifyClient" />
                  Notify client by email and WhatsApp if available
                </label>
                <StudioSubmitButton label="Log project update" pendingLabel="Saving update..." />
              </form>
            ) : null}
          </section>

          <section className="studio-panel rounded-[1.75rem] p-6">
            <div className="studio-kicker">Payments</div>
            <div className="mt-5 space-y-4">
              {payments.map((payment) => (
                <div key={payment.id} className="rounded-[1.4rem] border border-[var(--studio-line)] bg-black/10 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold text-[var(--studio-ink)]">{payment.label}</div>
                      <div className="mt-2 text-sm text-[var(--studio-ink-soft)]">
                        {formatCurrency(payment.amount, payment.currency)} · {payment.status.replaceAll("_", " ")}
                      </div>
                    </div>
                    {isFinance ? (
                      <form action={setPaymentStatusAction} className="flex gap-2">
                        <input type="hidden" name="paymentId" value={payment.id} />
                        <input type="hidden" name="redirectPath" value={redirectPath} />
                        <input type="hidden" name="status" value={payment.status === "paid" ? "requested" : "paid"} />
                        <button type="submit" className="rounded-full border border-[var(--studio-line)] px-3 py-1 text-xs font-semibold text-[var(--studio-ink)]">
                          {payment.status === "paid" ? "Re-open" : "Mark paid"}
                        </button>
                      </form>
                    ) : null}
                  </div>
                  {payment.status !== "paid" && !isStaff ? (
                    <form action={uploadPaymentProofAction} className="mt-4 space-y-3">
                      <input type="hidden" name="paymentId" value={payment.id} />
                      <input type="hidden" name="redirectPath" value={redirectPath} />
                      <input required type="file" name="proof" className="block w-full text-sm text-[var(--studio-ink-soft)]" />
                      <StudioSubmitButton label="Upload proof" pendingLabel="Uploading proof..." />
                    </form>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <section className="studio-panel rounded-[1.75rem] p-6">
            <div className="studio-kicker">Conversation</div>
            <div className="mt-5 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="rounded-[1.4rem] border border-[var(--studio-line)] bg-black/10 p-4">
                  <div className="text-sm font-semibold text-[var(--studio-ink)]">
                    {message.sender} · {message.senderRole}
                  </div>
                  <p className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">{message.body}</p>
                </div>
              ))}
            </div>
            <form action={appendProjectMessageAction} className="mt-5 space-y-3">
              <input type="hidden" name="projectId" value={project.id} />
              <input type="hidden" name="redirectPath" value={redirectPath} />
              <input type="hidden" name="senderRole" value={isStaff ? "team" : "client"} />
              <textarea
                name="body"
                required
                rows={4}
                className="min-h-28 w-full rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 px-4 py-4 text-sm text-[var(--studio-ink)] outline-none placeholder:text-[var(--studio-ink-soft)]"
                placeholder="Share an update, question, or next action."
              />
              {isStaff ? <input type="hidden" name="isInternal" value="" /> : null}
              <StudioSubmitButton label="Send message" pendingLabel="Sending..." />
            </form>
          </section>
        </article>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <article className="studio-panel rounded-[1.75rem] p-6">
          <div className="studio-kicker">Revisions</div>
          <div className="mt-5 space-y-4">
            {revisions.map((revision) => (
              <div key={revision.id} className="rounded-[1.4rem] border border-[var(--studio-line)] bg-black/10 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="font-semibold text-[var(--studio-ink)]">{revision.summary}</div>
                  <div className="text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">
                    {revision.status}
                  </div>
                </div>
                {isPm && revision.status !== "completed" ? (
                  <form action={completeRevisionAction} className="mt-3">
                    <input type="hidden" name="revisionId" value={revision.id} />
                    <input type="hidden" name="redirectPath" value={redirectPath} />
                    <button type="submit" className="rounded-full border border-[var(--studio-line)] px-3 py-1 text-xs font-semibold text-[var(--studio-ink)]">
                      Mark complete
                    </button>
                  </form>
                ) : null}
              </div>
            ))}
          </div>
          {!isStaff ? (
            <form action={createRevisionAction} className="mt-5 space-y-3">
              <input type="hidden" name="projectId" value={project.id} />
              <input type="hidden" name="redirectPath" value={redirectPath} />
              <textarea
                name="summary"
                required
                rows={4}
                className="min-h-28 w-full rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 px-4 py-4 text-sm text-[var(--studio-ink)] outline-none placeholder:text-[var(--studio-ink-soft)]"
                placeholder="Describe the revision clearly so it is tracked as a formal delivery item."
              />
              <StudioSubmitButton label="Request revision" pendingLabel="Logging revision..." />
            </form>
          ) : null}
        </article>

        <article className="studio-panel rounded-[1.75rem] p-6">
          <div className="studio-kicker">Files and delivery</div>
          <div className="mt-5 flex flex-wrap gap-2">
            {files.map((file) => (
              <span key={file.id} className="rounded-full border border-[var(--studio-line)] px-3 py-1 text-xs text-[var(--studio-ink-soft)]">
                {file.kind} · {file.label}
              </span>
            ))}
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
            <form action={addDeliverableAction} className="mt-5 space-y-3">
              <input type="hidden" name="projectId" value={project.id} />
              <input type="hidden" name="redirectPath" value={redirectPath} />
              <input
                name="label"
                required
                placeholder="Deliverable label"
                className="w-full rounded-full border border-[var(--studio-line)] bg-black/10 px-4 py-3 text-sm text-[var(--studio-ink)] outline-none placeholder:text-[var(--studio-ink-soft)]"
              />
              <textarea
                name="summary"
                required
                rows={3}
                className="min-h-24 w-full rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 px-4 py-4 text-sm text-[var(--studio-ink)] outline-none placeholder:text-[var(--studio-ink-soft)]"
                placeholder="Summarize what is inside this delivery package."
              />
              <input required type="file" name="deliverableFiles" multiple className="block w-full text-sm text-[var(--studio-ink-soft)]" />
              <StudioSubmitButton label="Share deliverable" pendingLabel="Sharing..." />
            </form>
          ) : null}
          {!isStaff && project.status === "delivered" && reviews.length === 0 ? (
            <form action={publishReviewAction} className="mt-6 space-y-3">
              <input type="hidden" name="projectId" value={project.id} />
              <input type="hidden" name="redirectPath" value={redirectPath} />
              <input
                name="customerName"
                required
                defaultValue={workspace.lead?.customerName || viewer.user?.fullName || ""}
                placeholder="Your name"
                className="w-full rounded-full border border-[var(--studio-line)] bg-black/10 px-4 py-3 text-sm text-[var(--studio-ink)] outline-none placeholder:text-[var(--studio-ink-soft)]"
              />
              <input
                name="company"
                placeholder="Company name"
                className="w-full rounded-full border border-[var(--studio-line)] bg-black/10 px-4 py-3 text-sm text-[var(--studio-ink)] outline-none placeholder:text-[var(--studio-ink-soft)]"
              />
              <input
                name="rating"
                type="number"
                min="1"
                max="5"
                defaultValue="5"
                className="w-full rounded-full border border-[var(--studio-line)] bg-black/10 px-4 py-3 text-sm text-[var(--studio-ink)] outline-none"
              />
              <textarea
                name="quote"
                required
                rows={4}
                className="min-h-28 w-full rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 px-4 py-4 text-sm text-[var(--studio-ink)] outline-none placeholder:text-[var(--studio-ink-soft)]"
                placeholder="Share a concise review of the Studio experience."
              />
              <StudioSubmitButton label="Publish review" pendingLabel="Publishing..." />
            </form>
          ) : null}
          {unpaidPayments.length > 0 && !isStaff ? (
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
                className="min-h-24 w-full rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 px-4 py-4 text-sm text-[var(--studio-ink)] outline-none placeholder:text-[var(--studio-ink-soft)]"
                placeholder="Need clarification, help with payment, or delivery support? Open a support thread here."
              />
              <StudioSubmitButton label="Open support thread" pendingLabel="Opening thread..." />
            </form>
          ) : null}
        </article>
      </section>
    </main>
  );
}
