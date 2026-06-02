import { henryDomainHost } from "@henryco/config";
import { translateSurfaceLabel } from "@henryco/i18n";
import {
  HeroCard,
  NextStepRow,
  DivisionLanding,
  EmptyStateCard,
  type HeroCardTile,
} from "@henryco/dashboard-shell/surfaces";

import { requireAccountUser } from "@/lib/auth";
import { getJobsModuleData } from "@/lib/jobs-module";
import { getAccountAppLocale } from "@/lib/locale-server";

import "@/components/jobs/styles.css";
import {
  ApplicationsList,
  type ApplicationRow,
} from "@/components/jobs/ApplicationsList";
import {
  ReadinessCard,
  type ChecklistRow,
} from "@/components/jobs/ReadinessCard";
import {
  SavedRolesList,
  type SavedRoleRow,
} from "@/components/jobs/SavedRolesList";

export const dynamic = "force-dynamic";

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatStamp(iso: string | null | undefined): string {
  if (!iso) return "—";
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "—";
  const d = new Date(ms);
  return `${d.getUTCDate().toString().padStart(2, "0")} ${SHORT_MONTHS[d.getUTCMonth()]}`;
}

function readinessBody(score: number): string {
  if (score >= 80) return "Profile is recruiter-ready — keep it warm with one update a week and the right offers find you.";
  if (score >= 50) return "Profile is functional. A couple of moves below will push you into the strongest recruiter view.";
  return "Profile is light. Each item below adds weight to your application signal.";
}

/**
 * Jobs landing.
 *
 * ACCOUNT-PREMIUM-01 (session 2, Phase 2B). Lifts JobsHero into the shared
 * HeroCard primitive with `progress` slot for trustScore, derives a state
 * picker, and surfaces a NextStepRow for the most engagement-likely action.
 */
export default async function JobsPage() {
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const data = await getJobsModuleData(user.id);

  const applicationsStat = data.stats.find((s) => s.id === "applications");
  const savedStat = data.stats.find((s) => s.id === "saved");

  const applications: ApplicationRow[] = (data.applications as Array<Record<string, unknown>>)
    .map((row) => ({
      id: String(row.id ?? ""),
      jobTitle: String(row.jobTitle ?? row.role ?? t("Application")),
      companyName: String(row.companyName ?? row.employerName ?? "—"),
      stageLabel: t(String(row.stageLabel ?? "In review")),
      stageKey: String(row.stage ?? row.stageKey ?? "review"),
      lastUpdateAt: String(row.lastUpdateAt ?? row.updatedAt ?? row.createdAt ?? ""),
      detailUrl: typeof row.detailUrl === "string" ? row.detailUrl : null,
    }));

  const saved: SavedRoleRow[] = (data.savedJobs as Array<Record<string, unknown>>)
    .map((row) => ({
      id: String(row.id ?? ""),
      title: String(row.jobTitle ?? row.title ?? t("Saved role")),
      companyName: String(row.companyName ?? row.employerName ?? "—"),
      location: typeof row.location === "string" ? row.location : null,
      savedAt: String(row.savedAt ?? row.createdAt ?? ""),
      url: typeof row.url === "string" ? row.url : null,
    }));

  const checklist: ChecklistRow[] = (data.profile.checklist as Array<Record<string, unknown>>)
    .map((row) => ({
      id: String(row.id ?? row.label ?? ""),
      label: String(row.label ?? ""),
      done: Boolean(row.done),
    }));

  // ── State picker ─────────────────────────────────────────────────
  const trustScore = data.profile.trustScore || 0;
  const recruiterCount = data.recruiterFeed?.length ?? 0;
  const state: "empty" | "calm" | "active" | "attention" =
    applications.length === 0 && saved.length === 0
      ? "empty"
      : applications.some((a) =>
            ["offer", "interview", "shortlisted"].includes(a.stageKey.toLowerCase()),
          )
        ? "attention"
        : applications.length > 0
          ? "active"
          : "calm";

  const headline =
    state === "empty"
      ? t("Start your job hunt.")
      : applications.length > 0
        ? applications.length === 1
          ? t("1 application in motion.")
          : `${applications.length} ${t("applications in motion.")}`
        : saved.length === 1
          ? t("1 role on your shortlist.")
          : `${saved.length} ${t("roles on your shortlist.")}`;

  const jobsHost = henryDomainHost("jobs");
  const blurb =
    state === "empty"
      ? t(
          "Browse live roles on {host}, save shortlists, and apply with one tap. Recruiter updates land in your account in real time.",
        ).replace("{host}", jobsHost)
      : t(
          "Applications, saved roles, recruiter updates, and profile signal — all mirrored from Henry Onyx Jobs into your account.",
        );

  // ── NextStepRow picker ───────────────────────────────────────────
  // Highest-priority: awaiting-response application; otherwise low profile score.
  let nextStep: React.ReactNode = null;
  const awaitingApp = applications.find((a) =>
    ["interview", "offer", "shortlisted", "awaiting_response", "review", "reviewing"].includes(
      a.stageKey.toLowerCase(),
    ),
  );
  if (awaitingApp) {
    nextStep = (
      <NextStepRow
        tone="attention"
        kicker={awaitingApp.stageLabel}
        title={`${awaitingApp.jobTitle} · ${awaitingApp.companyName}`}
        detail={t("Open the application to add a note, schedule, or accept the next step.")}
        cta={{
          label: t("Open application"),
          href: awaitingApp.detailUrl || "/jobs",
        }}
      />
    );
  } else if (state === "empty") {
    nextStep = (
      <NextStepRow
        tone="neutral"
        kicker={t("Get started")}
        title={t("Browse live roles")}
        detail={t("Save the ones that match your story and apply with one tap.")}
        cta={{ label: t("Browse roles"), href: data.browseJobsUrl, newTab: true }}
      />
    );
  } else if (trustScore < 50) {
    const itemsLeft = checklist.filter((c) => !c.done).length;
    nextStep = (
      <NextStepRow
        tone="attention"
        kicker={t("Profile readiness")}
        title={
          itemsLeft === 1
            ? t("Complete 1 item to lift your profile")
            : `${t("Complete")} ${itemsLeft} ${t("items to lift your profile")}`
        }
        detail={t(readinessBody(trustScore))}
        cta={{ label: t("Open candidate workspace"), href: data.candidateUrl, newTab: true }}
      />
    );
  }

  // ── HeroCard tiles ───────────────────────────────────────────────
  const tiles: ReadonlyArray<HeroCardTile> = [
    {
      label: t("Active applications"),
      value: applications.length,
      foot: applicationsStat?.detail ? t(applicationsStat.detail) : undefined,
      tone: applications.length > 0 ? "active" : "default",
    },
    {
      label: t("Saved roles"),
      value: saved.length,
      foot: savedStat?.detail ? t(savedStat.detail) : undefined,
    },
    {
      label: t("Recruiter updates"),
      value: recruiterCount,
      foot: t("In your jobs inbox"),
      tone: recruiterCount > 0 ? "accent" : "default",
    },
  ];

  const heroTone: "calm" | "active" | "attention" | "empty" =
    state === "empty"
      ? "empty"
      : state === "attention"
        ? "attention"
        : state === "active"
          ? "active"
          : "calm";

  return (
    <DivisionLanding
      className="acct-job acct-fade-in"
      hero={
        <HeroCard
          variant="paired"
          tone={heroTone}
          eyebrow={t("Jobs · live")}
          headline={headline}
          blurb={blurb}
          ariaLabel={t("Jobs overview")}
          ariaTilesLabel={t("Hunt summary")}
          ctaPrimary={{ label: t("Browse live roles"), href: data.browseJobsUrl, newTab: true }}
          ctaSecondary={{ label: t("Candidate workspace"), href: data.candidateUrl, newTab: true }}
          tiles={tiles}
          side={{
            kicker: t("Profile readiness"),
            title: t(data.profile.readinessLabel),
            body: t(data.profile.resumeQualityLabel),
          }}
          progress={{
            percent: trustScore,
            label: `${t("Profile readiness")} · ${trustScore}%`,
          }}
        />
      }
      nextStep={nextStep}
      sections={[
        {
          id: "acct-job-apps",
          title: t("Active applications"),
          meta: `${applications.length} ${t("live · stage-tinted chips show where each one stands")}`,
          content:
            applications.length === 0 ? (
              <EmptyStateCard
                kicker={t("Jobs · empty")}
                title={t("No live applications yet")}
                body={t(
                  "Apply to a saved role or browse fresh ones. Recruiter movement appears here in real time.",
                )}
                cta={{ label: t("Browse roles"), href: data.browseJobsUrl, newTab: true }}
              />
            ) : (
              <ApplicationsList
                applications={applications}
                emptyTitle={t("No live applications yet")}
                emptyBody={t(
                  "Apply to a saved role or browse fresh ones. Recruiter movement appears here in real time.",
                )}
                formatStamp={formatStamp}
              />
            ),
        },
        {
          id: "acct-job-readiness-saved",
          title: t("Readiness & shortlist"),
          meta: t("Profile signal · saved roles"),
          content: (
            <div className="acct-job__columns">
              <ReadinessCard
                title={t(data.profile.readinessLabel)}
                body={t(readinessBody(trustScore))}
                checklist={checklist}
              />
              <div>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "var(--acct-muted)",
                    margin: "0 0 10px",
                  }}
                >
                  {t("Saved roles")}
                </p>
                <SavedRolesList
                  saved={saved}
                  emptyTitle={t("No saved roles")}
                  emptyBody={t(
                    "Browse live roles and tap the bookmark to keep them here. We mirror them straight from {host}.",
                  ).replace("{host}", jobsHost)}
                  formatStamp={formatStamp}
                />
              </div>
            </div>
          ),
        },
      ]}
      footer={
        <p
          style={{
            fontSize: 11,
            color: "var(--acct-muted)",
            textAlign: "center",
            margin: "8px 0 0",
          }}
        >
          {t(
            "Recruiter movement, employer follow-ups, and interview scheduling sync to your Notifications inbox.",
          )}
        </p>
      }
    />
  );
}
