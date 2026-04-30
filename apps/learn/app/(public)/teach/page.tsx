import { CheckCircle2, FileStack, Sparkles, UsersRound } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n/server";
import { submitTeacherApplicationAction } from "@/lib/learn/actions";
import { getLearnViewer } from "@/lib/learn/auth";
import { getTeacherApplicationForViewer } from "@/lib/learn/data";
import { getSharedAuthUrl } from "@/lib/learn/links";
import { getLearnPublicLocale } from "@/lib/locale-server";
import { PendingSubmitButton } from "@/components/learn/pending-submit-button";
import { LearnStatusBadge } from "@/components/learn/ui";

export async function generateMetadata() {
  const locale = await getLearnPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return { title: t("Teach with HenryCo") };
}

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
  const locale = await getLearnPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const viewer = await getLearnViewer();
  const application = viewer.user ? await getTeacherApplicationForViewer(viewer) : null;
  const canEdit =
    !application ||
    application.status === "changes_requested" ||
    application.status === "rejected";

  const pillars = [
    {
      icon: Sparkles,
      title: t("Quality expectations"),
      body: t(
        "Outlines, outcomes, and respect for learners’ time matter as much as charisma. We decline proposals that look generic, thin, or misaligned with HenryCo audiences.",
      ),
    },
    {
      icon: UsersRound,
      title: t("Who sees your work"),
      body: t(
        "Programs may serve the public, internal teams, or partners. We match instructors to the audiences where their expertise is strongest and the business need is clearest.",
      ),
    },
    {
      icon: FileStack,
      title: t("After you apply"),
      body: t(
        "Submissions are read by academy operations. We may approve, request specific revisions, or decline. Nothing is published until onboarding and content checks are complete.",
      ),
    },
  ] as const;

  const fitNotes = [
    {
      label: t("Great fit"),
      body: t(
        "Marketplace operators, internal training leads, care/logistics specialists, customer-experience experts, business operators, and practical digital-skills teachers.",
      ),
    },
    {
      label: t("Verification & review"),
      body: t(
        "We validate your identity against your HenryCo profile, read your credentials and samples, and assess whether your proposed course fits our learners and quality bar. Most applications receive a decision or a request for more detail—not instant approval.",
      ),
    },
    {
      label: t("Revenue & contracts"),
      body: t(
        "Where a program is paid, HenryCo may offer revenue share or other instructor compensation. Terms are agreed in writing after approval—they are not promised on this page and vary by program. We never ask for payment to review your application.",
      ),
    },
  ];

  const reviewStages = [
    {
      step: "01",
      label: t("Submitted"),
      body: t(
        "We store your answers, files, and proposal against your HenryCo identity so nothing is lost between systems.",
      ),
    },
    {
      step: "02",
      label: t("Under review"),
      body: t(
        "Academy staff assess expertise, topic fit, and whether your outline meets our learner experience standards.",
      ),
    },
    {
      step: "03",
      label: t("Decision"),
      body: t(
        "We approve, ask for targeted changes with written notes, or decline. Silence is not a strategy—we aim to respond clearly.",
      ),
    },
    {
      step: "04",
      label: t("Onboarding"),
      body: t(
        "Approved instructors complete setup steps (access, guidelines, and where relevant commercial paperwork) before teaching publicly.",
      ),
    },
  ];

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-14 sm:px-8 xl:px-10">
      <section>
        <div className="flex flex-wrap gap-2">
          <LearnStatusBadge label={t("Instructor applications")} tone="signal" />
          <LearnStatusBadge label={t("Manual review")} />
          <LearnStatusBadge label={t("Approval not automatic")} tone="warning" />
        </div>
        <h1 className="mt-6 max-w-4xl text-balance text-[2.2rem] font-semibold leading-[1.06] tracking-[-0.025em] text-[var(--learn-ink)] sm:text-[2.9rem] md:text-[3.3rem]">
          {t("Teach on a platform that protects learners—and your reputation.")}
        </h1>
        <p className="mt-5 max-w-3xl text-pretty text-base leading-[1.7] text-[var(--learn-ink-soft)]">
          {t(
            "HenryCo Learn is for practitioners who can design structured programs, explain ideas clearly, and show up professionally. We verify identity and fit before anyone goes live. Your application stays tied to one HenryCo account so review, onboarding, and any future commercial relationship stay coherent.",
          )}
        </p>
      </section>

      <section className="mt-12">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--learn-mint-soft)]">
          {t("How HenryCo Learn treats teaching")}
        </p>
        <ul className="mt-8 grid gap-10 md:grid-cols-3 md:divide-x md:divide-[var(--learn-line)]">
          {pillars.map((item, i) => {
            const Icon = item.icon;
            return (
              <li key={item.title} className={i > 0 ? "md:pl-10" : ""}>
                <Icon className="h-5 w-5 text-[var(--learn-copper)]" aria-hidden />
                <h2 className="mt-4 text-lg font-semibold tracking-tight text-[var(--learn-ink)]">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-7 text-[var(--learn-ink-soft)]">{item.body}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-14 grid gap-12 xl:grid-cols-[0.95fr,1.05fr] xl:divide-x xl:divide-[var(--learn-line)]">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--learn-mint-soft)]">
            {t("Who should apply")}
          </p>
          <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--learn-ink)] sm:text-[1.85rem]">
            {t("Experienced people who can teach—not just talk.")}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--learn-ink-soft)]">
            {t(
              "We welcome operators, trainers, and subject-matter experts who already help others succeed: marketplace leads, CX and care specialists, logistics and field managers, digital-skills coaches, and similar roles. You should be comfortable committing to a syllabus, deadlines, and learner support standards.",
            )}
          </p>
          <ul className="mt-6 divide-y divide-[var(--learn-line)] border-y border-[var(--learn-line)]">
            {fitNotes.map((note) => (
              <li key={note.label} className="py-4">
                <p className="text-sm font-semibold tracking-tight text-[var(--learn-ink)]">
                  {note.label}
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--learn-ink-soft)]">{note.body}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-12 xl:pl-12">
          {params.submitted ? (
            <div className="border-l-2 border-[var(--learn-mint-soft)]/55 pl-5">
              <p className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-mint-soft)]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t("Submitted")}
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--learn-ink-soft)]">
                {t(
                  "Thank you—your application is in queue for human review. Watch this page and your email for updates.",
                )}
              </p>
            </div>
          ) : null}

          {application ? (
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <LearnStatusBadge
                  label={`Status: ${application.status.replace(/_/g, " ")}`}
                  tone={
                    application.status === "approved"
                      ? "success"
                      : application.status === "changes_requested"
                        ? "warning"
                        : "signal"
                  }
                />
                <LearnStatusBadge label={application.expertiseArea} />
                <LearnStatusBadge
                  label={`Payout: ${application.payoutModel.replace(/_/g, " ")}`}
                />
              </div>
              <h3 className="mt-5 text-balance text-[1.35rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--learn-ink)] sm:text-[1.55rem]">
                {t("Existing application")}
              </h3>
              <p className="mt-3 text-sm leading-7 text-[var(--learn-ink-soft)]">
                {t(
                  "We keep your teaching application attached to the same HenryCo identity used across courses, certificates, and future academy operations.",
                )}
              </p>
              <dl className="mt-5 divide-y divide-[var(--learn-line)] border-y border-[var(--learn-line)]">
                <div className="flex items-baseline gap-3 py-3">
                  <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
                    {t("Topics")}
                  </dt>
                  <dd className="ml-auto max-w-md text-right text-sm leading-7 text-[var(--learn-ink)]">
                    {application.teachingTopics.join(", ") || t("No topics supplied yet")}
                  </dd>
                </div>
                <div className="flex items-baseline gap-3 py-3">
                  <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
                    {t("Updated")}
                  </dt>
                  <dd className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--learn-ink)]">
                    {new Date(application.updatedAt).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </dd>
                </div>
              </dl>
              {application.reviewNotes ? (
                <div className="mt-5 border-l-2 border-[var(--learn-mint-soft)]/55 pl-5">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-mint-soft)]">
                    {t("Academy notes")}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--learn-ink)]">
                    {application.reviewNotes}
                  </p>
                </div>
              ) : null}
              {application.supportingFiles.length > 0 ? (
                <div className="mt-6">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
                    {t("Supporting files")}
                  </p>
                  <ul className="mt-3 divide-y divide-[var(--learn-line)] border-y border-[var(--learn-line)]">
                    {application.supportingFiles.map((file) => (
                      <li key={file.publicId}>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-3 py-3 text-sm text-[var(--learn-ink)] transition hover:text-[var(--learn-mint-soft)]"
                        >
                          <span>{file.name}</span>
                          <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">
                            {t("Open")}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}

          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--learn-mint-soft)]">
              {t("Review stages")}
            </p>
            <h3 className="mt-3 text-balance text-[1.35rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--learn-ink)] sm:text-[1.55rem]">
              {t("What happens after you click submit.")}
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--learn-ink-soft)]">
              {t(
                "There is no automatic “you’re in.” Each stage exists so learners can trust who teaches them—and so you understand what we expect before you invest more time.",
              )}
            </p>
            <ol className="mt-6 divide-y divide-[var(--learn-line)] border-y border-[var(--learn-line)]">
              {reviewStages.map((stage) => (
                <li
                  key={stage.step}
                  className="grid gap-3 py-4 sm:grid-cols-[auto,1fr] sm:gap-6"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-mint-soft)]">
                    {stage.step}
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold tracking-tight text-[var(--learn-ink)]">
                      {stage.label}
                    </h4>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--learn-ink-soft)]">
                      {stage.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {!viewer.user ? (
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--learn-mint-soft)]">
                {t("Apply")}
              </p>
              <h3 className="mt-3 text-balance text-[1.35rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--learn-ink)] sm:text-[1.55rem]">
                {t("Sign in with your HenryCo account first.")}
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--learn-ink-soft)]">
                {t(
                  "We only accept teaching applications from verified account holders. That protects applicants, learners, and HenryCo from impersonation—and keeps your status visible in one dashboard.",
                )}
              </p>
              <a
                href={getSharedAuthUrl("login", "/teach")}
                className="learn-button-primary mt-5 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
              >
                {t("Sign in and apply")}
              </a>
            </div>
          ) : canEdit ? (
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--learn-mint-soft)]">
                {t("Application form")}
              </p>
              <h3 className="mt-3 text-balance text-[1.35rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--learn-ink)] sm:text-[1.55rem]">
                {application
                  ? t("Update your teaching application")
                  : t("Apply to teach with HenryCo")}
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--learn-ink-soft)]">
                {t(
                  "Be specific. We read every field. Vague pitches or missing proof slow the process down. Honesty about your availability and experience speeds it up.",
                )}
              </p>
              <form
                action={submitTeacherApplicationAction}
                encType="multipart/form-data"
                className="mt-6 grid gap-4 md:grid-cols-2"
              >
                <div>
                  <label className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
                    {t("Full name")}
                  </label>
                  <input
                    name="fullName"
                    required
                    defaultValue={application?.fullName || viewer.user?.fullName || ""}
                    className="learn-input mt-2 w-full rounded-2xl px-4 py-3"
                  />
                </div>
                <div>
                  <label className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
                    {t("Email")}
                  </label>
                  <input
                    value={viewer.user?.email || ""}
                    readOnly
                    className="learn-input mt-2 w-full rounded-2xl px-4 py-3 opacity-80"
                  />
                </div>
                <div>
                  <label className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
                    {t("Phone")}
                  </label>
                  <input
                    name="phone"
                    defaultValue={application?.phone || ""}
                    className="learn-input mt-2 w-full rounded-2xl px-4 py-3"
                    placeholder="+234..."
                  />
                </div>
                <div>
                  <label className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
                    {t("Country")}
                  </label>
                  <select
                    name="country"
                    defaultValue={application?.country || "Nigeria"}
                    className="learn-select mt-2 w-full rounded-2xl px-4 py-3"
                  >
                    {COUNTRY_OPTIONS.map((country) => (
                      <option key={country} value={country}>
                        {t(country)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
                    {t("Expertise area")}
                  </label>
                  <input
                    name="expertiseArea"
                    required
                    defaultValue={application?.expertiseArea || ""}
                    className="learn-input mt-2 w-full rounded-2xl px-4 py-3"
                    placeholder={t(
                      "Marketplace operations, internal training, customer experience...",
                    )}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
                    {t("Teaching topics")}
                  </label>
                  <textarea
                    name="teachingTopics"
                    required
                    defaultValue={application?.teachingTopics.join(", ") || ""}
                    rows={3}
                    className="learn-textarea mt-2 w-full rounded-2xl px-4 py-3"
                    placeholder={t(
                      "Add the topics you can teach well, separated by commas or new lines.",
                    )}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
                    {t("Credentials and experience")}
                  </label>
                  <textarea
                    name="credentials"
                    required
                    defaultValue={application?.credentials || ""}
                    rows={5}
                    className="learn-textarea mt-2 w-full rounded-2xl px-4 py-3"
                    placeholder={t(
                      "Summarize your track record, experience, training history, certifications, and delivery credibility.",
                    )}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
                    {t("Portfolio or profile links")}
                  </label>
                  <textarea
                    name="portfolioLinks"
                    defaultValue={application?.portfolioLinks.join("\n") || ""}
                    rows={3}
                    className="learn-textarea mt-2 w-full rounded-2xl px-4 py-3"
                    placeholder={t(
                      "Add website, LinkedIn, sample classes, profile links, or hosted supporting material.",
                    )}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
                    {t("Sample course or topic proposal")}
                  </label>
                  <textarea
                    name="courseProposal"
                    required
                    defaultValue={application?.courseProposal || ""}
                    rows={6}
                    className="learn-textarea mt-2 w-full rounded-2xl px-4 py-3"
                    placeholder={t(
                      "Describe the course or topic you would teach, who it is for, what transformation it creates, and why HenryCo should trust you to lead it.",
                    )}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
                    {t("Supporting files")}
                  </label>
                  <input
                    type="file"
                    name="supportingFiles"
                    multiple
                    accept=".pdf,.doc,.docx,image/png,image/jpeg,image/webp"
                    className="learn-input mt-2 w-full rounded-2xl px-4 py-3 file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[var(--learn-ink)]"
                  />
                  <p className="mt-2 text-xs leading-6 text-[var(--learn-ink-soft)]">
                    {t(
                      "Upload up to four files. Hosted links can still be added in the portfolio field.",
                    )}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-start gap-3 border-t border-[var(--learn-line)] pt-4 text-sm text-[var(--learn-ink)]">
                    <input
                      type="checkbox"
                      name="agreementAccepted"
                      required
                      className="mt-1 h-4 w-4"
                    />
                    <span className="leading-7 text-[var(--learn-ink-soft)]">
                      {t(
                        "I confirm that the information is accurate, that I can deliver the subject matter professionally, and that HenryCo may review the application for instructor onboarding, internal enablement, or future academy partnerships.",
                      )}
                    </span>
                  </label>
                </div>
                <div className="md:col-span-2">
                  <PendingSubmitButton
                    pendingLabel={t("Submitting your teaching application...")}
                  >
                    {application ? t("Update application") : t("Submit application")}
                  </PendingSubmitButton>
                </div>
              </form>
            </div>
          ) : (
            <div className="border-l-2 border-[var(--learn-mint-soft)]/55 pl-5">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-mint-soft)]">
                {t("Application in progress")}
              </p>
              <h3 className="mt-2 text-base font-semibold tracking-tight text-[var(--learn-ink)]">
                {t("We’re already reviewing this submission.")}
              </h3>
              <p className="mt-2 text-sm leading-7 text-[var(--learn-ink-soft)]">
                {t(
                  "You’ll hear from us—or see notes on this page—if we need anything else. While a decision is pending, the form stays closed so reviewers always work from one consistent version.",
                )}
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
