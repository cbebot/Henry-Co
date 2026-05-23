import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { henryDomainHost } from "@henryco/config";

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

export function JobsHero({
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
  const fillPct = Math.max(0, Math.min(100, (profileScore / SCORE_MAX) * 100));
  const headline =
    applicationCount === 0 && savedCount === 0
      ? "Start your job hunt."
      : applicationCount > 0
        ? `${applicationCount} application${applicationCount === 1 ? "" : "s"} in motion.`
        : `${savedCount} role${savedCount === 1 ? "" : "s"} on your shortlist.`;
  const blurb =
    applicationCount === 0 && savedCount === 0
      ? `Browse live roles on ${henryDomainHost("jobs")}, save shortlists, and apply with one tap. Recruiter updates land in your account in real time.`
      : "Applications, saved roles, recruiter updates, and profile signal — all mirrored from HenryCo Jobs into your account.";
  return (
    <section className="acct-job__hero" aria-label="Jobs overview">
      <div className="acct-job__hero-inner">
        <div>
          <span className="acct-job__eyebrow">
            <span className="acct-job__eyebrow-dot" aria-hidden />
            Jobs · live
          </span>
          <h1 className="acct-job__headline">{headline}</h1>
          <p className="acct-job__blurb">{blurb}</p>
          <div className="acct-job__hero-ctas">
            <a className="acct-job__cta acct-job__cta--primary" href={browseJobsUrl} target="_blank" rel="noopener noreferrer">
              Browse live roles <ArrowUpRight size={14} aria-hidden />
            </a>
            <Link className="acct-job__cta acct-job__cta--ghost" href="/jobs/interviews">
              Interview rooms <ArrowUpRight size={14} aria-hidden />
            </Link>
            <a className="acct-job__cta acct-job__cta--ghost" href={candidateUrl} target="_blank" rel="noopener noreferrer">
              Candidate workspace <ArrowUpRight size={14} aria-hidden />
            </a>
          </div>
          <div className="acct-job__hero-tiles" role="list" aria-label="Hunt summary">
            <div className="acct-job__hero-tile" role="listitem">
              <span className="acct-job__hero-tile-label">Active applications</span>
              <span className="acct-job__hero-tile-value">{applicationCount}</span>
              <span className="acct-job__hero-tile-foot">{applicationDetail}</span>
            </div>
            <div className="acct-job__hero-tile" role="listitem">
              <span className="acct-job__hero-tile-label">Saved roles</span>
              <span className="acct-job__hero-tile-value">{savedCount}</span>
              <span className="acct-job__hero-tile-foot">{savedDetail}</span>
            </div>
            <div className="acct-job__hero-tile" role="listitem">
              <span className="acct-job__hero-tile-label">Recruiter updates</span>
              <span className="acct-job__hero-tile-value">{recruiterUpdateCount}</span>
              <span className="acct-job__hero-tile-foot">In your jobs inbox</span>
            </div>
          </div>
        </div>
        <aside className="acct-job__hero-side" aria-label="Profile readiness">
          <p className="acct-job__hero-side-label">Profile readiness</p>
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
