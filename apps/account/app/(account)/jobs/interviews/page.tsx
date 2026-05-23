import Link from "next/link";
import { CircleAlert } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { HeroCard, EmptyStateCard } from "@henryco/dashboard-shell/surfaces";
import { requireAccountUser } from "@/lib/auth";
import { getAccountAppLocale } from "@/lib/locale-server";
import { getJobsModuleData } from "@/lib/jobs-module";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

function statusChip(status: string) {
  if (["post_interview"].includes(status)) return "acct-chip acct-chip-green";
  if (["scheduled"].includes(status)) return "acct-chip acct-chip-blue";
  if (["awaiting_schedule", "preparation"].includes(status)) return "acct-chip acct-chip-orange";
  return "acct-chip acct-chip-gold";
}

export default async function JobsInterviewsPage() {
  const [user, locale] = await Promise.all([requireAccountUser(), getAccountAppLocale()]);
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const data = await getJobsModuleData(user.id);

  return (
    <div className="space-y-6 acct-fade-in">
      <HeroCard
        variant="compact"
        tone={data.interviewSessions.length === 0 ? "empty" : "active"}
        eyebrow={`${t("Jobs")} · ${t("Interview Rooms")}`}
        headline={t("Interview Rooms")}
        blurb={t("Provider-ready candidate interview lanes with timing, instructions, recruiter notes, and follow-up history.")}
        ctaPrimary={{ label: t("Candidate timeline"), href: data.applicationsUrl }}
        ctaSecondary={{ label: t("Back to Jobs"), href: "/jobs" }}
      />

      {data.interviewSessions.length === 0 ? (
        <EmptyStateCard
          kicker={t("Interview Rooms")}
          title={t("No interview lanes are active yet")}
          body={t("Once a recruiter moves an application into shortlist or interview movement, the interview room will appear here with timing, preparation notes, and join readiness.")}
          cta={{ label: t("Return to Jobs"), href: "/jobs" }}
        />
      ) : (
        <section className="acct-card p-5 sm:p-6">
          <div className="grid gap-4 xl:grid-cols-2">
            {data.interviewSessions.map((session) => (
              <Link
                key={session.id}
                href={session.interviewHref}
                className="rounded-[1.6rem] border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-5 transition hover:border-[var(--acct-gold)]/30 hover:shadow-md"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className={statusChip(session.status)}>{session.status.replaceAll("_", " ")}</span>
                  <span className="acct-chip acct-chip-blue">{session.provider.replaceAll("_", " ")}</span>
                  <span className="acct-chip acct-chip-gold">{session.applicationStage.replaceAll("_", " ")}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[var(--acct-ink)]">{session.jobTitle}</h3>
                <p className="mt-1 text-sm text-[var(--acct-muted)]">{session.employerName}</p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-[var(--acct-surface)] p-4">
                    <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">{t("Timing")}</div>
                    <div className="mt-2 text-sm font-semibold text-[var(--acct-ink)]">
                      {session.scheduledAt ? formatDateTime(session.scheduledAt) : t("Pending recruiter scheduling")}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[var(--acct-surface)] p-4">
                    <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">{t("Interviewer")}</div>
                    <div className="mt-2 text-sm font-semibold text-[var(--acct-ink)]">{session.interviewerName}</div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-[var(--acct-surface)] p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--acct-ink)]">
                    <CircleAlert size={15} className="text-[var(--acct-gold)]" />
                    {t("Next step")}
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[var(--acct-ink)]">{t(session.nextStepLabel)}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--acct-muted)]">{session.preparationNotes}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
