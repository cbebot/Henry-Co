import Link from "next/link";
import { notFound } from "next/navigation";
import { Bell, CheckCircle2, CircleAlert, Clock3 } from "lucide-react";
import { EmptyState, InlineNotice } from "@/components/feedback";
import { JobCard } from "@/components/job-card";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { PublicShell } from "@/components/public-shell";
import { TrustPassportPanel } from "@/components/trust-passport";
import { StatusPill } from "@/components/workspace-shell";
import { getSharedAccountLoginUrl, getSharedAccountSignupUrl } from "@/lib/account";
import { getJobsViewer } from "@/lib/auth";
import { getCandidateDashboardData, getJobPostBySlug, getJobPosts } from "@/lib/jobs/data";
import { submitApplicationAction, toggleSavedJobAction } from "@/app/actions";

export const dynamic = "force-dynamic";

function toneForStage(stage: string) {
  if (stage === "hired" || stage === "offer") return "good" as const;
  if (stage === "shortlisted" || stage === "interview") return "warn" as const;
  if (stage === "rejected") return "danger" as const;
  return "neutral" as const;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const [job, jobs, viewer, query] = await Promise.all([
    getJobPostBySlug(slug),
    getJobPosts(),
    getJobsViewer(),
    searchParams ?? Promise.resolve({} as Record<string, string | string[] | undefined>),
  ]);

  if (!job) {
    notFound();
  }

  const candidateData = viewer.user ? await getCandidateDashboardData(viewer.user.id) : null;
  const existingJourney =
    candidateData?.applicationJourneys.find((journey) => journey.application.jobSlug === job.slug) ?? null;
  const related = jobs.filter((item) => item.categorySlug === job.categorySlug && item.slug !== job.slug).slice(0, 3);
  const loginUrl = getSharedAccountLoginUrl(`/jobs/${job.slug}`);
  const signupUrl = getSharedAccountSignupUrl(`/jobs/${job.slug}`);
  const savedState = candidateData?.savedJobs.some((saved) => saved.job.slug === job.slug) ?? false;
  const incompleteChecklist = candidateData?.profileChecklist.filter((item) => !item.complete).slice(0, 3) ?? [];
  const saved = query.saved === "1";
  const removed = query.saved === "0";
  const sectionLinks = [
    { id: "overview", label: "Overview" },
    { id: "fit", label: "Who it fits" },
    { id: "responsibilities", label: "Responsibilities" },
    { id: "requirements", label: "Requirements" },
    { id: "benefits", label: "Benefits" },
    { id: "compensation", label: "Compensation" },
    { id: "work-mode", label: "Work mode" },
    { id: "company-context", label: "Company context" },
    { id: "hiring-process", label: "Hiring process" },
    { id: "interview-stages", label: "Interview stages" },
    { id: "employer-trust", label: "Employer trust" },
  ];

  return (
    <PublicShell
      primaryCta={
        viewer.user
          ? { label: "Candidate hub", href: "/candidate" }
          : { label: "Sign in to apply", href: loginUrl }
      }
      secondaryCta={{ label: "How applying works", href: "/help#apply" }}
    >
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <section className="jobs-panel rounded-[2.6rem] p-7 sm:p-9">
          <div className="flex flex-wrap gap-2">
            <span className="jobs-chip">{job.employerName}</span>
            <span className="jobs-chip">{job.categoryName}</span>
            <span className="jobs-chip capitalize">{job.workMode}</span>
            <span className="jobs-chip">{job.employmentType}</span>
            {job.employerTrustScore >= 70 ? <span className="jobs-chip">High trust employer</span> : null}
            {job.employerResponseSlaHours ? (
              <span className="jobs-chip">~{job.employerResponseSlaHours}h typical reply</span>
            ) : null}
            {job.internal ? <span className="jobs-chip">Internal HenryCo</span> : null}
          </div>

          <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div>
              <h1 className="jobs-heading">{job.title}</h1>
              <p className="mt-4 max-w-3xl text-sm leading-8 text-[var(--jobs-muted)]">{job.summary}</p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm text-[var(--jobs-muted)]">
                <span>{job.location}</span>
                <span>{job.team}</span>
                <span>{job.seniority}</span>
                <span>{job.salaryLabel || "Compensation discussed in process"}</span>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded-[1.8rem] bg-[var(--jobs-paper-soft)] p-5">
                <div className="jobs-kicker">Employer trust</div>
                <div className="mt-3 text-lg font-semibold capitalize">
                  {job.employerVerification === "verified" ? "Verified" : "Pending review"}
                </div>
                <p className="mt-2 text-sm leading-7 text-[var(--jobs-muted)]">
                  {job.employerVerification === "verified"
                    ? "This employer has passed our review — you can be confident the company is real."
                    : "Verification is in progress. We still review individual posts for quality and safety."}
                </p>
              </div>
              <div className="rounded-[1.8rem] bg-[var(--jobs-paper-soft)] p-5">
                <div className="jobs-kicker">Response time</div>
                <div className="mt-3 text-lg font-semibold">
                  {job.employerResponseSlaHours ? `~${job.employerResponseSlaHours} hours` : "Not specified"}
                </div>
                <p className="mt-2 text-sm leading-7 text-[var(--jobs-muted)]">
                  {job.applicationCount} application{job.applicationCount === 1 ? "" : "s"} so far. Stages stay visible in your candidate hub so you always know where you stand.
                </p>
              </div>
            </div>
          </div>
        </section>

        <nav className="jobs-sticky-subnav sticky top-4 z-20 overflow-x-auto rounded-[1.6rem] border border-[var(--jobs-line)] px-3 py-3 backdrop-blur-md">
          <div className="flex min-w-max gap-2">
            {sectionLinks.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="rounded-full bg-[var(--jobs-paper-soft)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--jobs-muted)] transition hover:bg-[var(--jobs-accent-soft)] hover:text-[var(--jobs-ink)]"
              >
                {section.label}
              </a>
            ))}
          </div>
        </nav>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <section id="overview" className="jobs-panel scroll-mt-24 rounded-[2rem] p-6">
              <h2 className="jobs-section-title">What this role is</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-8 text-[var(--jobs-muted)]">{job.description}</p>
            </section>

            <section id="fit" className="jobs-panel scroll-mt-24 rounded-[2rem] p-6">
              <h2 className="jobs-section-title">Who this is for</h2>
              <p className="mt-3 text-sm leading-8 text-[var(--jobs-muted)]">
                This is a <strong className="font-semibold text-[var(--jobs-ink)]">{job.seniority}</strong> role on the{" "}
                <strong className="font-semibold text-[var(--jobs-ink)]">{job.team}</strong> team at {job.employerName},
                working <span className="capitalize">{job.workMode}</span> from <strong className="font-semibold text-[var(--jobs-ink)]">{job.location}</strong>. The lists below spell out what you will own and what we need to see in your
                background. If that sounds like you—and the pay band works for your life—this is worth a thoughtful
                application.
              </p>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div id="responsibilities" className="jobs-panel scroll-mt-24 rounded-[2rem] p-6">
                <h2 className="jobs-section-title">Responsibilities</h2>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--jobs-muted)]">
                  {job.responsibilities.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div id="requirements" className="jobs-panel scroll-mt-24 rounded-[2rem] p-6">
                <h2 className="jobs-section-title">Requirements</h2>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--jobs-muted)]">
                  {job.requirements.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            </section>

            <section id="benefits" className="jobs-panel scroll-mt-24 rounded-[2rem] p-6">
              <h2 className="jobs-section-title">Benefits & what they want you to know</h2>
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                {[...job.benefits, ...job.trustHighlights].map((item) => (
                  <div key={item} className="rounded-[1.4rem] bg-[var(--jobs-paper-soft)] p-4 text-sm leading-7 text-[var(--jobs-muted)]">
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section id="compensation" className="jobs-panel scroll-mt-24 rounded-[2rem] p-6">
              <h2 className="jobs-section-title">Compensation & how to show up</h2>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-[1.5rem] bg-[var(--jobs-paper-soft)] p-5">
                  <div className="jobs-kicker">Pay</div>
                  <div className="mt-3 text-lg font-semibold">
                    {job.salaryLabel ||
                      (job.salaryMin && job.salaryMax
                        ? `${job.currency} ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}`
                        : "Discussed with the hiring team")}
                  </div>
                  <p className="mt-2 text-sm leading-7 text-[var(--jobs-muted)]">
                    When employers share a range, we show it here so you are not walking into interviews blind. If it
                    says “discussed,” bring your expectations in the application—we pass them to the team with your note.
                  </p>
                </div>
                <div className="rounded-[1.5rem] bg-[var(--jobs-paper-soft)] p-5">
                  <div className="jobs-kicker">Strong applications</div>
                  <p className="mt-3 text-sm leading-7 text-[var(--jobs-muted)]">
                    A short, specific note about why this role fits you beats a generic cover letter. Mention proof you
                    have done similar work, when you can start, and anything that affects location or travel.
                  </p>
                </div>
              </div>
            </section>

            <section id="work-mode" className="jobs-panel scroll-mt-24 rounded-[2rem] p-6">
              <h2 className="jobs-section-title">Location and work mode</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-[1.5rem] bg-[var(--jobs-paper-soft)] p-5">
                  <div className="jobs-kicker">Location</div>
                  <div className="mt-3 text-lg font-semibold">{job.location}</div>
                </div>
                <div className="rounded-[1.5rem] bg-[var(--jobs-paper-soft)] p-5">
                  <div className="jobs-kicker">Work mode</div>
                  <div className="mt-3 text-lg font-semibold capitalize">{job.workMode}</div>
                </div>
                <div className="rounded-[1.5rem] bg-[var(--jobs-paper-soft)] p-5">
                  <div className="jobs-kicker">Team</div>
                  <div className="mt-3 text-lg font-semibold">{job.team}</div>
                </div>
              </div>
            </section>

            <section id="company-context" className="jobs-panel scroll-mt-24 rounded-[2rem] p-6">
              <h2 className="jobs-section-title">About the team</h2>
              <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-[1.5rem] bg-[var(--jobs-paper-soft)] p-5">
                  <p className="text-sm leading-7 text-[var(--jobs-muted)]">
                    {job.employerName} lists this role on HenryCo so candidates get a clear process—not just a PDF and a
                    prayer. You will see verification status, how many people have applied, and (when shared) how quickly
                    they try to reply.
                  </p>
                </div>
                <div className="rounded-[1.5rem] bg-[var(--jobs-paper-soft)] p-5">
                  <div className="jobs-kicker">Team snapshot</div>
                  <p className="mt-3 text-sm leading-7 text-[var(--jobs-muted)]">
                    {job.internal
                      ? "This is an internal HenryCo opening—you go through the same stages as external roles, with our own team on the other side."
                      : `${job.employerName} is growing the ${job.team} team and is looking for someone with ${job.seniority.toLowerCase()} experience.`}
                  </p>
                </div>
              </div>
            </section>

            <section id="hiring-process" className="jobs-panel scroll-mt-24 rounded-[2rem] p-6">
              <h2 className="jobs-section-title">What happens after you apply</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--jobs-muted)]">
                Every application gets a stage you can read in your candidate hub—no more wondering if your CV vanished.
                The steps below are what this employer asked us to show for this role; your own timeline may skip or
                repeat steps, but updates stay in one place.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {job.pipelineStages.map((stage, index) => (
                  <span key={stage} className="rounded-full bg-[var(--jobs-paper-soft)] px-4 py-2 text-xs font-semibold">
                    {index + 1}. {stage.replace(/[_-]+/g, " ")}
                  </span>
                ))}
              </div>
              <div className="mt-5 rounded-[1.5rem] bg-[var(--jobs-paper-soft)] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Clock3 className="h-4 w-4 text-[var(--jobs-accent)]" />
                  Where updates appear
                </div>
                <p className="mt-2 text-sm leading-7 text-[var(--jobs-muted)]">
                  Shortlist moves, interview invites, and offer steps show up in{" "}
                  <Link href="/candidate/applications" className="font-semibold text-[var(--jobs-accent)] underline">
                    Applications
                  </Link>{" "}
                  and in your HenryCo account activity when we send notifications.
                </p>
              </div>
            </section>

            <section id="interview-stages" className="jobs-panel scroll-mt-24 rounded-[2rem] p-6">
              <h2 className="jobs-section-title">Interview stages (plain English)</h2>
              <div className="mt-4 grid gap-3">
                {job.pipelineStages.map((stage, index) => (
                  <div key={stage} className="rounded-[1.4rem] bg-[var(--jobs-paper-soft)] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-sm font-semibold">{index + 1}. {stage.replace(/[_-]+/g, " ")}</div>
                      <span className="jobs-chip">Stage {index + 1}</span>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-[var(--jobs-muted)]">
                      {index === 0
                        ? "Someone reads your application against the role—expect a little wait if volume is high."
                        : index === job.pipelineStages.length - 1
                          ? "Final conversations, decision, and a clear outcome either way."
                          : "Deeper conversations or tasks so both sides can judge fit with real examples."}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <div className="jobs-panel rounded-[2rem] p-6">
              <h2 className="jobs-section-title">Save or apply</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--jobs-muted)]">
                Saving is private—employers are not notified. Applying sends this role, your profile, and your note to the
                hiring team. Either action uses your HenryCo account so nothing gets lost between devices.
              </p>

              <div className="mt-5 space-y-3">
                {saved ? (
                  <InlineNotice
                    tone="success"
                    title="Saved to your list"
                    body="You will find this role under Saved jobs in your candidate hub whenever you are ready to apply."
                  />
                ) : null}
                {removed ? (
                  <InlineNotice
                    title="Removed from saved"
                    body="You can save it again anytime—your application history, if any, stays separate."
                  />
                ) : null}
                {viewer.user && !candidateData?.profile ? (
                  <InlineNotice
                    tone="warn"
                    title="Complete your profile first"
                    body="A stronger Jobs profile improves recruiter confidence and gives your application more proof."
                  />
                ) : null}
                {existingJourney ? (
                  <InlineNotice
                    tone="success"
                    title="You already applied here"
                    body={`Status: ${existingJourney.stageLabel}. Open Applications for the latest note from the team.`}
                  />
                ) : null}
              </div>

              {existingJourney ? (
                <div className="mt-5 rounded-[1.5rem] bg-[var(--jobs-paper-soft)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <StatusPill label={existingJourney.stageLabel} tone={toneForStage(existingJourney.application.stage)} />
                    <span className="jobs-chip">{existingJourney.progressPercent}% complete</span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--jobs-line)]">
                    <div
                      className={`h-full rounded-full ${
                        existingJourney.stageTone === "good"
                          ? "bg-[var(--jobs-success)]"
                          : existingJourney.stageTone === "warn"
                            ? "bg-[var(--jobs-warning)]"
                            : existingJourney.stageTone === "danger"
                              ? "bg-[var(--jobs-danger)]"
                              : "bg-[var(--jobs-accent)]"
                      }`}
                      style={{ width: `${existingJourney.progressPercent}%` }}
                    />
                  </div>
                  <div className="mt-4 text-sm leading-7 text-[var(--jobs-muted)]">{existingJourney.recruiterActionBody}</div>
                  <div className="mt-2 text-xs text-[var(--jobs-muted)]">
                    Updated {formatDateTime(existingJourney.recruiterActionAt || existingJourney.application.createdAt)}
                  </div>
                </div>
              ) : null}

              <form action={toggleSavedJobAction} className="mt-5">
                <input type="hidden" name="jobSlug" value={job.slug} />
                <input type="hidden" name="returnTo" value={`/jobs/${job.slug}`} />
                <PendingSubmitButton tone="secondary" pendingLabel={savedState ? "Updating…" : "Saving…"} className="w-full">
                  {savedState ? "Remove from saved jobs" : "Save for later"}
                </PendingSubmitButton>
              </form>

              {viewer.user ? (
                existingJourney ? (
                  <div className="mt-4 space-y-3">
                    <a href="/candidate/applications" className="jobs-button-primary inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold">
                      Open application timeline
                    </a>
                  </div>
                ) : (
                  <form action={submitApplicationAction} className="mt-4 space-y-3">
                    <input type="hidden" name="jobSlug" value={job.slug} />
                    <input type="hidden" name="returnTo" value={`/jobs/${job.slug}`} />
                    <textarea
                      name="coverNote"
                      className="jobs-textarea min-h-32"
                      placeholder="In a few sentences: why this role, why now, and proof you have done this work before."
                    />
                    <input
                      name="availability"
                      className="jobs-input"
                      placeholder="When could you start? Any notice period?"
                    />
                    <input name="salaryExpectation" className="jobs-input" placeholder="Pay expectation (optional but helpful)" />
                    <PendingSubmitButton pendingLabel="Sending application…" className="w-full">
                      Submit application
                    </PendingSubmitButton>
                  </form>
                )
              ) : (
                <div className="mt-4 space-y-3 rounded-2xl bg-[var(--jobs-accent-soft)] p-4 text-sm text-[var(--jobs-ink)]">
                  <p>
                    <a href={loginUrl} className="font-semibold underline">
                      Sign in
                    </a>{" "}
                    to save or apply—we bring you back to this role after your HenryCo login.
                  </p>
                  <p className="text-[var(--jobs-muted)]">
                    New here?{" "}
                    <a href={signupUrl} className="font-semibold text-[var(--jobs-accent)] underline">
                      Create a free account
                    </a>{" "}
                    first, then return to this page.
                  </p>
                </div>
              )}

              {viewer.user && incompleteChecklist.length > 0 ? (
                <div className="mt-5 rounded-[1.5rem] bg-[var(--jobs-paper-soft)] p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Bell className="h-4 w-4 text-[var(--jobs-warning)]" />
                    Profile gaps affecting this application
                  </div>
                  <div className="mt-3 space-y-3">
                    {incompleteChecklist.map((item) => (
                      <a key={item.id} href={item.href} className="flex items-start gap-3 rounded-[1.2rem] bg-white/80 p-3 transition hover:bg-white">
                        <CircleAlert className="mt-0.5 h-4 w-4 text-[var(--jobs-warning)]" />
                        <div>
                          <div className="text-sm font-semibold">{item.label}</div>
                          <div className="mt-1 text-sm leading-6 text-[var(--jobs-muted)]">{item.detail}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div id="employer-trust" className="jobs-panel scroll-mt-24 rounded-[2rem] p-6">
              <h2 className="jobs-section-title">Employer trust</h2>
              <p className="mt-2 text-sm font-semibold">{job.employerName}</p>
              <div className="mt-4">
                <TrustPassportPanel
                  title="Role trust"
                  body={`Trust here comes from the employer record, moderation state, pay clarity, and how structured the hiring workflow is.${job.employerResponseSlaHours ? ` ${job.employerName} aims to respond within about ${job.employerResponseSlaHours} hours.` : ""}`}
                  passport={job.trustPassport}
                  limit={4}
                />
              </div>
              <Link href={`/employers/${job.employerSlug}`} className="mt-4 inline-flex text-sm font-semibold text-[var(--jobs-accent)]">
                View employer page
              </Link>
            </div>

            {viewer.user && candidateData && candidateData.profile?.trustScore != null ? (
              <div className="jobs-panel rounded-[2rem] p-6">
                <h2 className="jobs-section-title">Candidate readiness</h2>
                <p className="mt-2 text-sm leading-7 text-[var(--jobs-muted)]">
                  Your current Jobs trust score is {candidateData.profile.trustScore}. {candidateData.profile.readinessLabel}.
                </p>
                <div className="mt-4 space-y-3">
                  {candidateData.profileChecklist.slice(0, 3).map((item) => (
                    <a key={item.id} href={item.href} className="flex items-start gap-3 rounded-[1.2rem] bg-[var(--jobs-paper-soft)] p-3 transition hover:bg-[var(--jobs-accent-soft)]">
                      {item.complete ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-[var(--jobs-success)]" />
                      ) : (
                        <CircleAlert className="mt-0.5 h-4 w-4 text-[var(--jobs-warning)]" />
                      )}
                      <div>
                        <div className="text-sm font-semibold">{item.label}</div>
                        <div className="mt-1 text-sm leading-6 text-[var(--jobs-muted)]">{item.detail}</div>
                      </div>
                    </a>
                  ))}
                </div>
                <a href="/candidate/profile" className="mt-4 inline-flex text-sm font-semibold text-[var(--jobs-accent)]">
                  Improve profile strength
                </a>
              </div>
            ) : null}
          </aside>
        </div>

        {related.length > 0 ? (
          <section>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="jobs-kicker">Related roles</p>
                <h2 className="mt-3 jobs-heading">Similar roles you might like</h2>
              </div>
            </div>
            <div className="grid gap-5 lg:grid-cols-3">
              {related.map((relatedJob) => (
                <JobCard key={relatedJob.slug} job={relatedJob} />
              ))}
            </div>
          </section>
        ) : (
          <EmptyState
            kicker="More soon"
            title="No sibling roles in this category yet."
            body="This listing is the only one here for now. Widen your search on the main board or save this role while you think."
            action={
              <Link href="/jobs" className="jobs-button-secondary rounded-full px-5 py-3 text-sm font-semibold">
                Browse all roles
              </Link>
            }
          />
        )}
      </div>
    </PublicShell>
  );
}
