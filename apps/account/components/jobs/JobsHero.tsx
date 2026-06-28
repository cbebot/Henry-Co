import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { henryDomainHost } from "@henryco/config";
import { getAccountHeroesCopy } from "@henryco/i18n";
import { getAccountAppLocale } from "@/lib/locale-server";

type Props = {
  applicationCount: number;
  applicationDetail: string;
  savedCount: number;
  savedDetail: string;
  profileScore: number;
  profileTier: string;
  profileFoot: string;
  recruiterUpdateCount: number;
  candidateUrl: string;
  browseJobsUrl: string;
};

const SCORE_MAX = 100;

export async function JobsHero({
  applicationCount,
  applicationDetail,
  savedCount,
  savedDetail,
  profileScore,
  profileTier,
  profileFoot,
  recruiterUpdateCount,
  candidateUrl,
  browseJobsUrl,
}: Props) {
  const locale = await getAccountAppLocale();
  const copy = getAccountHeroesCopy(locale).jobsHero;
  const fillPct = Math.max(0, Math.min(100, (profileScore / SCORE_MAX) * 100));
  const headline =
    applicationCount === 0 && savedCount === 0
      ? copy.headlineStart
      : applicationCount > 0
        ? `${applicationCount} ${applicationCount === 1 ? copy.headlineApplicationsSingular : copy.headlineApplicationsPlural}`
        : `${savedCount} ${savedCount === 1 ? copy.headlineSavedSingular : copy.headlineSavedPlural}`;
  const blurb =
    applicationCount === 0 && savedCount === 0
      ? copy.blurbEmpty.replace("{host}", henryDomainHost("jobs"))
      : copy.blurbActive;
  return (
    <section className="acct-job__hero" aria-label={copy.heroAria}>
      <div className="acct-job__hero-inner">
        <div>
          <span className="acct-job__eyebrow">
            <span className="acct-job__eyebrow-dot" aria-hidden />
            {copy.eyebrow}
          </span>
          <h1 className="acct-job__headline">{headline}</h1>
          <p className="acct-job__blurb">{blurb}</p>
          <div className="acct-job__hero-ctas">
            <a className="acct-job__cta acct-job__cta--primary" href={browseJobsUrl} target="_blank" rel="noopener noreferrer">
              {copy.browseRoles} <ArrowUpRight size={14} aria-hidden />
            </a>
            <Link className="acct-job__cta acct-job__cta--ghost" href="/jobs/interviews">
              {copy.interviewRooms} <ArrowUpRight size={14} aria-hidden />
            </Link>
            <a className="acct-job__cta acct-job__cta--ghost" href={candidateUrl} target="_blank" rel="noopener noreferrer">
              {copy.candidateWorkspace} <ArrowUpRight size={14} aria-hidden />
            </a>
          </div>
          <div className="acct-job__hero-tiles" role="list" aria-label={copy.summaryAria}>
            <div className="acct-job__hero-tile" role="listitem">
              <span className="acct-job__hero-tile-label">{copy.activeApplications}</span>
              <span className="acct-job__hero-tile-value">{applicationCount}</span>
              <span className="acct-job__hero-tile-foot">{applicationDetail}</span>
            </div>
            <div className="acct-job__hero-tile" role="listitem">
              <span className="acct-job__hero-tile-label">{copy.savedRoles}</span>
              <span className="acct-job__hero-tile-value">{savedCount}</span>
              <span className="acct-job__hero-tile-foot">{savedDetail}</span>
            </div>
            <div className="acct-job__hero-tile" role="listitem">
              <span className="acct-job__hero-tile-label">{copy.recruiterUpdates}</span>
              <span className="acct-job__hero-tile-value">{recruiterUpdateCount}</span>
              <span className="acct-job__hero-tile-foot">{copy.recruiterUpdatesFoot}</span>
            </div>
          </div>
        </div>
        <aside className="acct-job__hero-side" aria-label={copy.profileReadinessAria}>
          <p className="acct-job__hero-side-label">{copy.profileReadinessLabel}</p>
          <p className="acct-job__hero-side-value">
            {profileScore}
            <span className="acct-job__hero-side-value-out">/ {SCORE_MAX}</span>
          </p>
          <div className="acct-job__hero-side-bar" aria-hidden>
            <span
              className="acct-job__hero-side-bar-fill"
              style={{ transform: `scaleX(${fillPct / 100})` }}
            />
          </div>
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "color-mix(in srgb, var(--acct-bg-soft) 85%, transparent)",
              margin: 0,
            }}
          >
            {profileTier}
          </p>
          <p className="acct-job__hero-side-foot">{profileFoot}</p>
        </aside>
      </div>
    </section>
  );
}
