import { translateSurfaceLabel } from "@henryco/i18n";
import { requireAccountUser } from "@/lib/auth";
import { getJobsModuleData } from "@/lib/jobs-module";
import { getAccountAppLocale } from "@/lib/locale-server";

import "@/components/jobs/styles.css";
import {
  ApplicationsList,
  type ApplicationRow,
} from "@/components/jobs/ApplicationsList";
import { JobsHero } from "@/components/jobs/JobsHero";
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

  return (
    <div className="acct-job acct-fade-in">
      <JobsHero
        applicationCount={applications.length}
        applicationDetail={applicationsStat?.detail || ""}
        savedCount={saved.length}
        savedDetail={savedStat?.detail || ""}
        profileScore={data.profile.trustScore}
        profileTier={data.profile.readinessLabel}
        profileFoot={data.profile.resumeQualityLabel}
        recruiterUpdateCount={data.recruiterFeed?.length ?? 0}
        candidateUrl={data.candidateUrl}
        browseJobsUrl={data.browseJobsUrl}
      />

      <section aria-labelledby="acct-job-apps">
        <div className="acct-job__section-head">
          <h2 id="acct-job-apps" className="acct-job__section-title">
            {t("Active applications")}
          </h2>
          <span className="acct-job__section-meta">
            {applications.length} {t("live · stage-tinted chips show where each one stands")}
          </span>
        </div>
        <ApplicationsList
          applications={applications}
          emptyTitle={t("No live applications yet")}
          emptyBody={t("Apply to a saved role or browse fresh ones. Recruiter movement appears here in real time.")}
          formatStamp={formatStamp}
        />
      </section>

      <section aria-labelledby="acct-job-readiness-saved">
        <div className="acct-job__section-head">
          <h2 id="acct-job-readiness-saved" className="acct-job__section-title">
            {t("Readiness & shortlist")}
          </h2>
          <span className="acct-job__section-meta">
            {t("Profile signal · saved roles")}
          </span>
        </div>
        <div className="acct-job__columns">
          <ReadinessCard
            title={t(data.profile.readinessLabel)}
            body={t(readinessBody(data.profile.trustScore))}
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
              emptyBody={t("Browse live roles and tap the bookmark to keep them here. We mirror them straight from jobs.henrycogroup.com.")}
              formatStamp={formatStamp}
            />
          </div>
        </div>
      </section>

      <p
        style={{
          fontSize: 11,
          color: "var(--acct-muted)",
          textAlign: "center",
          margin: "8px 0 0",
        }}
      >
        {t("Recruiter movement, employer follow-ups, and interview scheduling sync to your Notifications inbox.")}
      </p>
    </div>
  );
}
