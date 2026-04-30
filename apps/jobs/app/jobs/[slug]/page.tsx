import Link from "next/link";
import { notFound } from "next/navigation";
import { Bell, CheckCircle2, CircleAlert, Clock3, ShieldCheck } from "lucide-react";
import { EmptyState, InlineNotice } from "@/components/feedback";
import { JobCard } from "@/components/job-card";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { PublicShell } from "@/components/public-shell";
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
      <div className="mx-auto max-w-7xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
        <section>
          <div className="flex flex-wrap gap-2">
            <span className="jobs-chip">{job.employerName}</span>
            <span className="jobs-chip">{job.categoryName}</span>
            <span className="jobs-chip capitalize">{job.workMode}</span>
            <span className="jobs-chip">{job.employmentType}</span>
            {job.employerTrustScore >= 70 ? (
              <span className="jobs-chip">High trust employer</span>
            ) : null}
            {job.employerResponseSlaHours ? (
              <span className="jobs-chip">~{job.employerResponseSlaHours}h typical reply</span>
            ) : null}
            {job.internal ? <span className="jobs-chip">Internal HenryCo</span> : null}
          </div>

          <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:items-end">
            <div>
              <h1 className="jobs-display max-w-3xl text-balance">{job.title}</h1>
              <p className="mt-5 max-w-3xl text-pretty text-base leading-8 text-[var(--jobs-muted)]">
                {job.summary}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[var(--jobs-muted)]">
                <span className="text-[var(--jobs-ink)]">{job.location}</span>
                <span className="text-[var(--jobs-line)]">·</span>
                <span>{job.team}</span>
                <span className="text-[var(--jobs-line)]">·</span>
                <span>{job.seniority}</span>
                <span className="text-[var(--jobs-line)]">·</span>
                <span>{job.salaryLabel || "Compensation discussed in process"}</span>
              </div>
            </div>

            <ul className="grid gap-3 text-sm">
              <li className="flex items-baseline gap-3 border-b border-[var(--jobs-line)] py-3">
                <ShieldCheck className="h-3.5 w-3.5 text-[var(--jobs-accent)]" aria-hidden />
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--jobs-muted)]">
                  Employer trust
                </span>
                <span
                  className={`ml-auto text-right text-sm font-semibold tracking-tight ${
                    job.employerVerification === "verified"
                      ? "text-[var(--jobs-accent)]"
                      : "text-[var(--jobs-ink)]"
                  }`}
                >
                  {job.employerVerification === "verified" ? "Verified" : "Pending review"}
                </span>
              </li>
              <li className="flex items-baseline gap-3 border-b border-[var(--jobs-line)] py-3">
                <Clock3 className="h-3.5 w-3.5 text-[var(--jobs-accent)]" aria-hidden />
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--jobs-muted)]">
                  Typical reply
                </span>
                <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--jobs-ink)]">
                  {job.employerResponseSlaHours
                    ? `~${job.employerResponseSlaHours} hours`
                    : "Not specified"}
                </span>
              </li>
              <li className="flex items-baseline gap-3 border-b border-[var(--jobs-line)] py-3 last:border-b-0">
                <CheckCircle2 className="h-3.5 w-3.5 text-[var(--jobs-accent)]" aria-hidden />
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--jobs-muted)]">
                  Applicants
                </span>
                <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--jobs-ink)]">
                  {job.applicationCount}
                </span>
              </li>
            </ul>
          </div>
        </section>

        <nav
          aria-label="Page sections"
          className="sticky top-4 z-20 -mx-4 overflow-x-auto border-y border-[var(--jobs-line)] bg-[var(--jobs-paper)] px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
        >
          <div className="flex min-w-max gap-2">
            {sectionLinks.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="rounded-full border border-[var(--jobs-line)] bg-transparent px-3.5 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-[var(--jobs-muted)] transition hover:border-[var(--jobs-accent)] hover:text-[var(--jobs-ink)]"
              >
                {section.label}
              </a>
            ))}
          </div>
        </nav>

        <div className="grid gap-12 lg:grid-cols-[1fr_380px] lg:gap-16">
          <div className="space-y-12">
            <section id="overview" className="scroll-mt-28">
              <p className="jobs-kicker text-[10.5px] uppercase tracking-[0.22em]">Overview</p>
              <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--jobs-ink)] sm:text-[1.85rem]">
                What this role is
              </h2>
              <p className="mt-4 max-w-3xl whitespace-pre-wrap text-sm leading-8 text-[var(--jobs-muted)]">
                {job.description}
              </p>
            </section>

            <section id="fit" className="scroll-mt-28">
              <p className="jobs-kicker text-[10.5px] uppercase tracking-[0.22em]">Who this is for</p>
              <p className="mt-4 max-w-3xl text-sm leading-8 text-[var(--jobs-muted)]">
                This is a{" "}
                <strong className="font-semibold text-[var(--jobs-ink)]">{job.seniority}</strong>{" "}
                role on the{" "}
                <strong className="font-semibold text-[var(--jobs-ink)]">{job.team}</strong> team at{" "}
                {job.employerName}, working{" "}
                <span className="capitalize">{job.workMode}</span> from{" "}
                <strong className="font-semibold text-[var(--jobs-ink)]">{job.location}</strong>.
                The lists below spell out what you will own and what we need to see in your
                background. If that sounds like you — and the pay band works for your life — this is
                worth a thoughtful application.
              </p>
            </section>

            <section className="grid gap-12 lg:grid-cols-2 lg:divide-x lg:divide-[var(--jobs-line)]">
              <div id="responsibilities" className="scroll-mt-28">
                <p className="jobs-kicker text-[10.5px] uppercase tracking-[0.22em]">
                  Responsibilities
                </p>
                <ul className="mt-5 space-y-3 text-sm leading-7 text-[var(--jobs-muted)]">
                  {job.responsibilities.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--jobs-accent)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div id="requirements" className="scroll-mt-28 lg:pl-12">
                <p className="jobs-kicker text-[10.5px] uppercase tracking-[0.22em]">
                  Requirements
                </p>
                <ul className="mt-5 space-y-3 text-sm leading-7 text-[var(--jobs-muted)]">
                  {job.requirements.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--jobs-accent)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section id="benefits" className="scroll-mt-28">
              <p className="jobs-kicker text-[10.5px] uppercase tracking-[0.22em]">
                Benefits &amp; what they want you to know
              </p>
              <ul className="mt-5 divide-y divide-[var(--jobs-line)] border-y border-[var(--jobs-line)]">
                {[...job.benefits, ...job.trustHighlights].map((item) => (
                  <li
                    key={item}
                    className="py-4 text-sm leading-7 text-[var(--jobs-muted)]"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section id="compensation" className="scroll-mt-28">
              <p className="jobs-kicker text-[10.5px] uppercase tracking-[0.22em]">
                Compensation &amp; how to show up
              </p>
              <div className="mt-5 grid gap-12 lg:grid-cols-2 lg:divide-x lg:divide-[var(--jobs-line)]">
                <div>
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--jobs-muted)]">
                    Pay
                  </p>
                  <p className="mt-2 text-lg font-semibold tracking-tight text-[var(--jobs-ink)]">
                    {job.salaryLabel ||
                      (job.salaryMin && job.salaryMax
                        ? `${job.currency} ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}`
                        : "Discussed with the hiring team")}
                  </p>
                  <p className="mt-3 max-w-md text-sm leading-7 text-[var(--jobs-muted)]">
                    When employers share a range, we show it here so you are not walking into
                    interviews blind. If it says “discussed,” bring your expectations in the
                    application — we pass them to the team with your note.
                  </p>
                </div>
                <div className="lg:pl-12">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--jobs-muted)]">
                    Strong applications
                  </p>
                  <p className="mt-2 text-base font-semibold tracking-tight text-[var(--jobs-ink)]">
                    Specific beats generic.
                  </p>
                  <p className="mt-3 max-w-md text-sm leading-7 text-[var(--jobs-muted)]">
                    A short, specific note about why this role fits you beats a generic cover
                    letter. Mention proof you have done similar work, when you can start, and
                    anything that affects location or travel.
                  </p>
                </div>
              </div>
            </section>

            <section id="work-mode" className="scroll-mt-28">
              <p className="jobs-kicker text-[10.5px] uppercase tracking-[0.22em]">
                Location and work mode
              </p>
              <ul className="mt-5 grid gap-10 md:grid-cols-3 md:divide-x md:divide-[var(--jobs-line)]">
                <li>
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--jobs-muted)]">
                    Location
                  </p>
                  <p className="mt-2 text-base font-semibold tracking-tight text-[var(--jobs-ink)]">
                    {job.location}
                  </p>
                </li>
                <li className="md:pl-10">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--jobs-muted)]">
                    Work mode
                  </p>
                  <p className="mt-2 text-base font-semibold capitalize tracking-tight text-[var(--jobs-ink)]">
                    {job.workMode}
                  </p>
                </li>
                <li className="md:pl-10">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--jobs-muted)]">
                    Team
                  </p>
                  <p className="mt-2 text-base font-semibold tracking-tight text-[var(--jobs-ink)]">
                    {job.team}
                  </p>
                </li>
              </ul>
            </section>

            <section id="company-context" className="scroll-mt-28">
              <p className="jobs-kicker text-[10.5px] uppercase tracking-[0.22em]">
                About the team
              </p>
              <div className="mt-5 grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:divide-x lg:divide-[var(--jobs-line)]">
                <p className="max-w-2xl text-sm leading-8 text-[var(--jobs-muted)]">
                  {job.employerName} lists this role on HenryCo so candidates get a clear process —
                  not just a PDF and a prayer. You will see verification status, how many people
                  have applied, and (when shared) how quickly they try to reply.
                </p>
                <div className="lg:pl-12">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--jobs-muted)]">
                    Team snapshot
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--jobs-muted)]">
                    {job.internal
                      ? "This is an internal HenryCo opening — you go through the same stages as external roles, with our own team on the other side."
                      : `${job.employerName} is growing the ${job.team} team and is looking for someone with ${job.seniority.toLowerCase()} experience.`}
                  </p>
                </div>
              </div>
            </section>

            <section id="hiring-process" className="scroll-mt-28">
              <p className="jobs-kicker text-[10.5px] uppercase tracking-[0.22em]">
                What happens after you apply
              </p>
              <p className="mt-3 max-w-3xl text-sm leading-8 text-[var(--jobs-muted)]">
                Every application gets a stage you can read in your candidate hub — no more
                wondering if your CV vanished. The steps below are what this employer asked us to
                show for this role; your own timeline may skip or repeat steps, but updates stay in
                one place.
              </p>
              <ol className="mt-6 divide-y divide-[var(--jobs-line)] border-y border-[var(--jobs-line)]">
                {job.pipelineStages.map((stage, index) => (
                  <li
                    key={stage}
                    className="grid gap-3 py-4 sm:grid-cols-[auto,1fr] sm:gap-6"
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--jobs-accent)]">
                      Step {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm font-semibold capitalize tracking-tight text-[var(--jobs-ink)]">
                      {stage.replace(/[_-]+/g, " ")}
                    </span>
                  </li>
                ))}
              </ol>
              <div className="mt-6 border-l-2 border-[var(--jobs-accent)]/55 pl-5">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--jobs-accent)]">
                  <Clock3 className="mr-1 inline h-3.5 w-3.5 align-[-2px]" /> Where updates appear
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--jobs-muted)]">
                  Shortlist moves, interview invites, and offer steps show up in{" "}
                  <Link
                    href="/candidate/applications"
                    className="font-semibold text-[var(--jobs-accent)] underline-offset-4 hover:underline"
                  >
                    Applications
                  </Link>{" "}
                  and in your HenryCo account activity when we send notifications.
                </p>
              </div>
            </section>

            <section id="interview-stages" className="scroll-mt-28">
              <p className="jobs-kicker text-[10.5px] uppercase tracking-[0.22em]">
                Interview stages (plain English)
              </p>
              <ol className="mt-5 divide-y divide-[var(--jobs-line)] border-y border-[var(--jobs-line)]">
                {job.pipelineStages.map((stage, index) => (
                  <li
                    key={stage}
                    className="grid gap-3 py-5 sm:grid-cols-[auto,1fr,auto] sm:items-start sm:gap-6"
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--jobs-accent)]">
                      Stage {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold capitalize tracking-tight text-[var(--jobs-ink)]">
                        {stage.replace(/[_-]+/g, " ")}
                      </h3>
                      <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--jobs-muted)]">
                        {index === 0
                          ? "Someone reads your application against the role — expect a little wait if volume is high."
                          : index === job.pipelineStages.length - 1
                            ? "Final conversations, decision, and a clear outcome either way."
                            : "Deeper conversations or tasks so both sides can judge fit with real examples."}
                      </p>
                    </div>
                    <span className="jobs-chip self-start">Stage {index + 1}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <aside className="space-y-10 lg:sticky lg:top-28 lg:self-start">
            <div>
              <p className="jobs-kicker text-[10.5px] uppercase tracking-[0.22em]">
                Save or apply
              </p>
              <h2 className="mt-3 text-balance text-[1.35rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--jobs-ink)] sm:text-[1.55rem]">
                Saving is private. Applying sends your profile.
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--jobs-muted)]">
                Saving is private — employers are not notified. Applying sends this role, your
                profile, and your note to the hiring team. Either action uses your HenryCo account
                so nothing gets lost between devices.
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
                <div className="mt-5 border-t border-[var(--jobs-line)] pt-5">
                  <div className="flex items-center justify-between gap-3">
                    <StatusPill
                      label={existingJourney.stageLabel}
                      tone={toneForStage(existingJourney.application.stage)}
                    />
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
                  <p className="mt-4 text-sm leading-7 text-[var(--jobs-muted)]">
                    {existingJourney.recruiterActionBody}
                  </p>
                  <p className="mt-2 text-xs text-[var(--jobs-muted)]">
                    Updated{" "}
                    {formatDateTime(
                      existingJourney.recruiterActionAt || existingJourney.application.createdAt,
                    )}
                  </p>
                </div>
              ) : null}

              <form action={toggleSavedJobAction} className="mt-5">
                <input type="hidden" name="jobSlug" value={job.slug} />
                <input type="hidden" name="returnTo" value={`/jobs/${job.slug}`} />
                <PendingSubmitButton
                  tone="secondary"
                  pendingLabel={savedState ? "Updating…" : "Saving…"}
                  className="w-full"
                >
                  {savedState ? "Remove from saved jobs" : "Save for later"}
                </PendingSubmitButton>
              </form>

              {viewer.user ? (
                existingJourney ? (
                  <div className="mt-4 space-y-3">
                    <a
                      href="/candidate/applications"
                      className="jobs-button-primary inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
                    >
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
                    <input
                      name="salaryExpectation"
                      className="jobs-input"
                      placeholder="Pay expectation (optional but helpful)"
                    />
                    <PendingSubmitButton
                      pendingLabel="Sending application…"
                      className="w-full"
                    >
                      Submit application
                    </PendingSubmitButton>
                  </form>
                )
              ) : (
                <div className="mt-4 space-y-3 border-l-2 border-[var(--jobs-accent)]/55 pl-5 text-sm text-[var(--jobs-ink)]">
                  <p>
                    <a
                      href={loginUrl}
                      className="font-semibold text-[var(--jobs-accent)] underline-offset-4 hover:underline"
                    >
                      Sign in
                    </a>{" "}
                    to save or apply — we bring you back to this role after your HenryCo login.
                  </p>
                  <p className="text-[var(--jobs-muted)]">
                    New here?{" "}
                    <a
                      href={signupUrl}
                      className="font-semibold text-[var(--jobs-accent)] underline-offset-4 hover:underline"
                    >
                      Create a free account
                    </a>{" "}
                    first, then return to this page.
                  </p>
                </div>
              )}

              {viewer.user && incompleteChecklist.length > 0 ? (
                <div className="mt-6 border-t border-[var(--jobs-line)] pt-5">
                  <p className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--jobs-warning)]">
                    <Bell className="h-3.5 w-3.5" />
                    Profile gaps affecting this application
                  </p>
                  <ul className="mt-3 divide-y divide-[var(--jobs-line)] border-y border-[var(--jobs-line)]">
                    {incompleteChecklist.map((item) => (
                      <li key={item.id}>
                        <a
                          href={item.href}
                          className="group flex items-start gap-3 py-3 transition hover:opacity-95"
                        >
                          <CircleAlert className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--jobs-warning)]" />
                          <div>
                            <p className="text-sm font-semibold text-[var(--jobs-ink)] group-hover:text-[var(--jobs-accent)]">
                              {item.label}
                            </p>
                            <p className="mt-1 text-sm leading-6 text-[var(--jobs-muted)]">
                              {item.detail}
                            </p>
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <div id="employer-trust" className="scroll-mt-28">
              <p className="jobs-kicker text-[10.5px] uppercase tracking-[0.22em]">
                Employer trust
              </p>
              <p className="mt-3 text-sm font-semibold text-[var(--jobs-ink)]">{job.employerName}</p>
              <ul className="mt-4 divide-y divide-[var(--jobs-line)] border-y border-[var(--jobs-line)]">
                <li className="flex items-baseline gap-3 py-3">
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--jobs-muted)]">
                    Status
                  </span>
                  <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--jobs-ink)]">
                    {job.employerVerification === "verified" ? "Verified" : "Under review"}
                  </span>
                </li>
                <li className="flex items-baseline gap-3 py-3">
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--jobs-muted)]">
                    Applicants
                  </span>
                  <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--jobs-ink)]">
                    {job.applicationCount}
                  </span>
                </li>
              </ul>
              <p className="mt-4 text-sm leading-7 text-[var(--jobs-muted)]">
                Our trust indicators are based on profile quality, verification status, and hiring
                behaviour — not a paid badge, but a better starting point than an anonymous board
                post.
                {job.employerResponseSlaHours
                  ? ` This employer aims to respond within about ${job.employerResponseSlaHours} hours.`
                  : ""}
              </p>
              <Link
                href={`/employers/${job.employerSlug}`}
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--jobs-accent)] underline-offset-4 hover:underline"
              >
                View employer page
              </Link>
            </div>

            {viewer.user && candidateData && candidateData.profile?.trustScore != null ? (
              <div>
                <p className="jobs-kicker text-[10.5px] uppercase tracking-[0.22em]">
                  Candidate readiness
                </p>
                <p className="mt-3 text-sm leading-7 text-[var(--jobs-muted)]">
                  Your current Jobs trust score is{" "}
                  <span className="font-semibold text-[var(--jobs-ink)]">
                    {candidateData.profile.trustScore}
                  </span>
                  . {candidateData.profile.readinessLabel}.
                </p>
                <ul className="mt-4 divide-y divide-[var(--jobs-line)] border-y border-[var(--jobs-line)]">
                  {candidateData.profileChecklist.slice(0, 3).map((item) => (
                    <li key={item.id}>
                      <a
                        href={item.href}
                        className="group flex items-start gap-3 py-3 transition hover:opacity-95"
                      >
                        {item.complete ? (
                          <CheckCircle2 className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--jobs-success)]" />
                        ) : (
                          <CircleAlert className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--jobs-warning)]" />
                        )}
                        <div>
                          <p className="text-sm font-semibold text-[var(--jobs-ink)] group-hover:text-[var(--jobs-accent)]">
                            {item.label}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-[var(--jobs-muted)]">
                            {item.detail}
                          </p>
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
                <a
                  href="/candidate/profile"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--jobs-accent)] underline-offset-4 hover:underline"
                >
                  Improve profile strength
                </a>
              </div>
            ) : null}
          </aside>
        </div>

        {related.length > 0 ? (
          <section>
            <div className="mb-6 flex items-end justify-between gap-4 border-b border-[var(--jobs-line)] pb-4">
              <div>
                <p className="jobs-kicker text-[10.5px] uppercase tracking-[0.22em]">
                  Related roles
                </p>
                <h2 className="mt-2 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--jobs-ink)] sm:text-[1.85rem]">
                  Similar roles you might like
                </h2>
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
              <Link
                href="/jobs"
                className="jobs-button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
              >
                Browse all roles
              </Link>
            }
          />
        )}
      </div>
    </PublicShell>
  );
}
