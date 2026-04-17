import { CheckCircle2, FileStack, Sparkles, UsersRound } from "lucide-react";
import { submitTeacherApplicationAction } from "@/lib/learn/actions";
import { getPassiveLearnViewer } from "@/lib/learn/auth";
import { getTeacherApplicationForViewer } from "@/lib/learn/data";
import { getSharedAuthUrl } from "@/lib/learn/links";
import { PendingSubmitButton } from "@/components/learn/pending-submit-button";
import { LearnPanel, LearnSectionIntro, LearnStatusBadge } from "@/components/learn/ui";

export const metadata = { title: "Teach with HenryCo - HenryCo Learn" };

const COUNTRY_OPTIONS = [
  "Nigeria",
  "Ghana",
  "Kenya",
  "South Africa",
  "United Kingdom",
  "United States",
  "Canada",
  "United Arab Emirates",
];

export default async function TeachPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const params = await searchParams;
  const viewer = await getPassiveLearnViewer();
  const application = viewer.user ? await getTeacherApplicationForViewer(viewer) : null;
  const canEdit =
    !application ||
    application.status === "changes_requested" ||
    application.status === "rejected";

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-14 sm:px-8 xl:px-10">
      <section className="learn-panel learn-hero learn-mesh rounded-[2.8rem] p-8 sm:p-10 xl:p-12">
        <div className="flex flex-wrap gap-2">
          <LearnStatusBadge label="Instructor applications" tone="signal" />
          <LearnStatusBadge label="Manual review" />
          <LearnStatusBadge label="Approval not automatic" tone="warning" />
        </div>
        <h1 className="learn-heading mt-6 text-[3rem] text-[var(--learn-ink)] sm:text-[4.4rem]">
          Teach on a platform that protects learners—and your reputation.
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--learn-ink-soft)]">
          HenryCo Learn is for practitioners who can design structured programs, explain ideas clearly, and show up professionally. We verify identity and fit before anyone goes live. Your application stays tied to one HenryCo account so review, onboarding, and any future commercial relationship stay coherent.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <LearnPanel className="rounded-[1.8rem] p-5">
            <Sparkles className="h-5 w-5 text-[var(--learn-copper)]" />
            <h2 className="mt-4 text-xl font-semibold tracking-[-0.03em] text-[var(--learn-ink)]">
              Quality expectations
            </h2>
            <p className="mt-2 text-sm leading-7 text-[var(--learn-ink-soft)]">
              Outlines, outcomes, and respect for learners’ time matter as much as charisma. We decline proposals that look generic, thin, or misaligned with HenryCo audiences.
            </p>
          </LearnPanel>
          <LearnPanel className="rounded-[1.8rem] p-5">
            <UsersRound className="h-5 w-5 text-[var(--learn-copper)]" />
            <h2 className="mt-4 text-xl font-semibold tracking-[-0.03em] text-[var(--learn-ink)]">
              Who sees your work
            </h2>
            <p className="mt-2 text-sm leading-7 text-[var(--learn-ink-soft)]">
              Programs may serve the public, internal teams, or partners. We match instructors to the audiences where their expertise is strongest and the business need is clearest.
            </p>
          </LearnPanel>
          <LearnPanel className="rounded-[1.8rem] p-5">
            <FileStack className="h-5 w-5 text-[var(--learn-copper)]" />
            <h2 className="mt-4 text-xl font-semibold tracking-[-0.03em] text-[var(--learn-ink)]">
              After you apply
            </h2>
            <p className="mt-2 text-sm leading-7 text-[var(--learn-ink-soft)]">
              Submissions are read by academy operations. We may approve, request specific revisions, or decline. Nothing is published until onboarding and content checks are complete.
            </p>
          </LearnPanel>
        </div>
      </section>

      <section className="mt-10 grid gap-6 xl:grid-cols-[0.88fr,1.12fr]">
        <LearnPanel className="rounded-[2rem]">
          <LearnSectionIntro
            kicker="Who should apply"
            title="Experienced people who can teach—not just talk."
            body="We welcome operators, trainers, and subject-matter experts who already help others succeed: marketplace leads, CX and care specialists, logistics and field managers, digital-skills coaches, and similar roles. You should be comfortable committing to a syllabus, deadlines, and learner support standards."
          />
          <div className="mt-6 space-y-4 text-sm leading-7 text-[var(--learn-ink-soft)]">
            <div className="rounded-[1.4rem] border border-[var(--learn-line)] bg-white/5 p-4">
              <p className="font-semibold text-[var(--learn-ink)]">Great fit</p>
              <p className="mt-2">
                Marketplace operators, internal training leads, care/logistics specialists,
                customer-experience experts, business operators, and practical digital-skills
                teachers.
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-[var(--learn-line)] bg-white/5 p-4">
              <p className="font-semibold text-[var(--learn-ink)]">Verification & review</p>
              <p className="mt-2">
                We validate your identity against your HenryCo profile, read your credentials and samples, and assess whether your proposed course fits our learners and quality bar. Most applications receive a decision or a request for more detail—not instant approval.
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-[var(--learn-line)] bg-white/5 p-4">
              <p className="font-semibold text-[var(--learn-ink)]">Revenue & contracts</p>
              <p className="mt-2">
                Where a program is paid, HenryCo may offer revenue share or other instructor compensation. Terms are agreed in writing after approval—they are not promised on this page and vary by program. We never ask for payment to review your application.
              </p>
            </div>
          </div>
        </LearnPanel>

        <div className="space-y-6">
          {params.submitted ? (
            <LearnPanel className="rounded-[2rem]">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-[var(--learn-mint)]" />
                <p className="text-sm font-semibold text-[var(--learn-mint-soft)]">
                  Thank you—your application is in queue for human review. Watch this page and your email for updates.
                </p>
              </div>
            </LearnPanel>
          ) : null}

          {application ? (
            <LearnPanel className="rounded-[2rem]">
              <div className="flex flex-wrap items-center gap-2">
                <LearnStatusBadge label={`Status: ${application.status.replace(/_/g, " ")}`} tone={application.status === "approved" ? "success" : application.status === "changes_requested" ? "warning" : "signal"} />
                <LearnStatusBadge label={application.expertiseArea} />
                <LearnStatusBadge label={`Payout: ${application.payoutModel.replace(/_/g, " ")}`} />
              </div>
              <h2 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">
                Existing application
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--learn-ink-soft)]">
                We keep your teaching application attached to the same HenryCo identity used across
                courses, certificates, and future academy operations.
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.4rem] border border-[var(--learn-line)] bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">
                    Topics
                  </p>
                  <p className="mt-2 text-sm text-[var(--learn-ink)]">
                    {application.teachingTopics.join(", ") || "No topics supplied yet"}
                  </p>
                </div>
                <div className="rounded-[1.4rem] border border-[var(--learn-line)] bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">
                    Updated
                  </p>
                  <p className="mt-2 text-sm text-[var(--learn-ink)]">
                    {new Date(application.updatedAt).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              {application.reviewNotes ? (
                <div className="mt-5 rounded-[1.4rem] border border-[var(--learn-line)] bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">
                    Academy notes
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--learn-ink)]">{application.reviewNotes}</p>
                </div>
              ) : null}
              {application.supportingFiles.length > 0 ? (
                <div className="mt-5 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">
                    Supporting files
                  </p>
                  {application.supportingFiles.map((file) => (
                    <a
                      key={file.publicId}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-[1.35rem] border border-[var(--learn-line)] bg-white/5 px-4 py-3 text-sm text-[var(--learn-ink)] transition hover:border-[var(--learn-line-strong)]"
                    >
                      <span>{file.name}</span>
                      <span className="text-[var(--learn-ink-soft)]">Open</span>
                    </a>
                  ))}
                </div>
              ) : null}
            </LearnPanel>
          ) : null}

          <LearnPanel className="rounded-[2rem]">
            <LearnSectionIntro
              kicker="Review stages"
              title="What happens after you click submit."
              body="There is no automatic “you’re in.” Each stage exists so learners can trust who teaches them—and so you understand what we expect before you invest more time."
            />
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                {
                  label: "1. Submitted",
                  body: "We store your answers, files, and proposal against your HenryCo identity so nothing is lost between systems.",
                },
                {
                  label: "2. Under review",
                  body: "Academy staff assess expertise, topic fit, and whether your outline meets our learner experience standards.",
                },
                {
                  label: "3. Decision",
                  body: "We approve, ask for targeted changes with written notes, or decline. Silence is not a strategy—we aim to respond clearly.",
                },
                {
                  label: "4. Onboarding",
                  body: "Approved instructors complete setup steps (access, guidelines, and where relevant commercial paperwork) before teaching publicly.",
                },
              ].map((step) => (
                <div
                  key={step.label}
                  className="rounded-[1.4rem] border border-[var(--learn-line)] bg-white/5 p-4"
                >
                  <p className="text-sm font-semibold text-[var(--learn-ink)]">{step.label}</p>
                  <p className="mt-2 text-sm leading-7 text-[var(--learn-ink-soft)]">{step.body}</p>
                </div>
              ))}
            </div>
          </LearnPanel>

          {!viewer.user ? (
            <LearnPanel className="rounded-[2rem]">
              <LearnSectionIntro
                kicker="Apply"
                title="Sign in with your HenryCo account first."
                body="We only accept teaching applications from verified account holders. That protects applicants, learners, and HenryCo from impersonation—and keeps your status visible in one dashboard."
              />
              <a
                href={getSharedAuthUrl("login", "/teach")}
                className="learn-button-primary mt-6 rounded-full px-5 py-3 text-sm font-semibold"
              >
                Sign in and apply
              </a>
            </LearnPanel>
          ) : canEdit ? (
            <LearnPanel className="rounded-[2rem]">
              <LearnSectionIntro
                kicker="Application form"
                title={application ? "Update your teaching application" : "Apply to teach with HenryCo"}
                body="Be specific. We read every field. Vague pitches or missing proof slow the process down. Honesty about your availability and experience speeds it up."
              />
              <form action={submitTeacherApplicationAction} encType="multipart/form-data" className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-[var(--learn-ink)]">Full name</label>
                  <input
                    name="fullName"
                    required
                    defaultValue={application?.fullName || viewer.user?.fullName || ""}
                    className="learn-input mt-2 rounded-2xl px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--learn-ink)]">Email</label>
                  <input
                    value={viewer.user?.email || ""}
                    readOnly
                    className="learn-input mt-2 rounded-2xl px-4 py-3 opacity-80"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--learn-ink)]">Phone</label>
                  <input
                    name="phone"
                    defaultValue={application?.phone || ""}
                    className="learn-input mt-2 rounded-2xl px-4 py-3"
                    placeholder="+234..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--learn-ink)]">Country</label>
                  <select
                    name="country"
                    defaultValue={application?.country || "Nigeria"}
                    className="learn-select mt-2 rounded-2xl px-4 py-3"
                  >
                    {COUNTRY_OPTIONS.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[var(--learn-ink)]">Expertise area</label>
                  <input
                    name="expertiseArea"
                    required
                    defaultValue={application?.expertiseArea || ""}
                    className="learn-input mt-2 rounded-2xl px-4 py-3"
                    placeholder="Marketplace operations, internal training, customer experience..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[var(--learn-ink)]">Teaching topics</label>
                  <textarea
                    name="teachingTopics"
                    required
                    defaultValue={application?.teachingTopics.join(", ") || ""}
                    rows={3}
                    className="learn-textarea mt-2 rounded-2xl px-4 py-3"
                    placeholder="Add the topics you can teach well, separated by commas or new lines."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[var(--learn-ink)]">Credentials and experience</label>
                  <textarea
                    name="credentials"
                    required
                    defaultValue={application?.credentials || ""}
                    rows={5}
                    className="learn-textarea mt-2 rounded-2xl px-4 py-3"
                    placeholder="Summarize your track record, experience, training history, certifications, and delivery credibility."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[var(--learn-ink)]">Portfolio or profile links</label>
                  <textarea
                    name="portfolioLinks"
                    defaultValue={application?.portfolioLinks.join("\n") || ""}
                    rows={3}
                    className="learn-textarea mt-2 rounded-2xl px-4 py-3"
                    placeholder="Add website, LinkedIn, sample classes, profile links, or hosted supporting material."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[var(--learn-ink)]">Sample course or topic proposal</label>
                  <textarea
                    name="courseProposal"
                    required
                    defaultValue={application?.courseProposal || ""}
                    rows={6}
                    className="learn-textarea mt-2 rounded-2xl px-4 py-3"
                    placeholder="Describe the course or topic you would teach, who it is for, what transformation it creates, and why HenryCo should trust you to lead it."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[var(--learn-ink)]">Supporting files</label>
                  <input
                    type="file"
                    name="supportingFiles"
                    multiple
                    accept=".pdf,.doc,.docx,image/png,image/jpeg,image/webp"
                    className="learn-input mt-2 rounded-2xl px-4 py-3 file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[var(--learn-ink)]"
                  />
                  <p className="mt-2 text-xs leading-6 text-[var(--learn-ink-soft)]">
                    Upload up to four files. Hosted links can still be added in the portfolio field.
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-start gap-3 rounded-[1.4rem] border border-[var(--learn-line)] px-4 py-4 text-sm text-[var(--learn-ink)]">
                    <input type="checkbox" name="agreementAccepted" required className="mt-1 h-4 w-4" />
                    <span className="leading-7 text-[var(--learn-ink-soft)]">
                      I confirm that the information is accurate, that I can deliver the subject
                      matter professionally, and that HenryCo may review the application for
                      instructor onboarding, internal enablement, or future academy partnerships.
                    </span>
                  </label>
                </div>
                <div className="md:col-span-2">
                  <PendingSubmitButton pendingLabel="Submitting your teaching application...">
                    {application ? "Update application" : "Submit application"}
                  </PendingSubmitButton>
                </div>
              </form>
            </LearnPanel>
          ) : (
            <LearnPanel className="rounded-[2rem]">
              <LearnSectionIntro
                kicker="Application in progress"
                title="We’re already reviewing this submission."
                body="You’ll hear from us—or see notes on this page—if we need anything else. While a decision is pending, the form stays closed so reviewers always work from one consistent version."
              />
            </LearnPanel>
          )}
        </div>
      </section>
    </main>
  );
}
