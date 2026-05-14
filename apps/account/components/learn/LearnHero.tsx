import { ArrowUpRight } from "lucide-react";

import {
  buildHeroCopy,
  heroState,
  type LearnLocale,
  type LearnStats,
} from "./helpers";

type Props = {
  stats: LearnStats;
  learnOrigin: string;
  locale: LearnLocale;
  labels: {
    eyebrow: string;
    sideKicker: string;
    sideTitle: string;
    sideBody: string;
    breakdownLabel: string;
    tileLabels: {
      active: string;
      completed: string;
      certificates: string;
      assignments: string;
    };
    tileFoot: {
      activeEmpty: string;
      activeWith: string;
      completedEmpty: string;
      completedWith: string;
      certificatesEmpty: string;
      certificatesWith: string;
      assignmentsEmpty: string;
      assignmentsWith: string;
    };
    breakdownNames: {
      active: string;
      assigned: string;
      certificates: string;
      saved: string;
    };
  };
};

export function LearnHero({ stats, learnOrigin, locale, labels }: Props) {
  const state = heroState(stats);
  const copy = buildHeroCopy(state, stats, learnOrigin, locale);

  const breakdown = [
    { key: "active",       label: labels.breakdownNames.active,       count: stats.metrics.activeCourses,    color: "var(--acct-gold)" },
    { key: "assigned",     label: labels.breakdownNames.assigned,     count: stats.metrics.assignedLearning, color: "var(--acct-blue)" },
    { key: "certificates", label: labels.breakdownNames.certificates, count: stats.metrics.certificates,     color: "var(--acct-green)" },
    { key: "saved",        label: labels.breakdownNames.saved,        count: stats.metrics.savedCourses,     color: "var(--acct-purple)" },
  ].filter((row) => row.count > 0);

  return (
    <section className="acct-lrn__hero" data-state={state} aria-label={labels.eyebrow}>
      <div className="acct-lrn__hero-inner">
        <div>
          <span className="acct-lrn__eyebrow">
            <span className="acct-lrn__eyebrow-dot" aria-hidden />
            {labels.eyebrow}
          </span>
          <h1 className="acct-lrn__headline">{copy.headline}</h1>
          <p className="acct-lrn__blurb">{copy.blurb}</p>
          <div className="acct-lrn__hero-ctas">
            <a
              className="acct-lrn__cta acct-lrn__cta--primary"
              href={copy.ctaPrimary.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {copy.ctaPrimary.label} <ArrowUpRight size={14} aria-hidden />
            </a>
            <a
              className="acct-lrn__cta acct-lrn__cta--ghost"
              href={copy.ctaSecondary.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {copy.ctaSecondary.label} <ArrowUpRight size={14} aria-hidden />
            </a>
          </div>
          <div className="acct-lrn__hero-tiles" role="list" aria-label={labels.eyebrow}>
            <div className="acct-lrn__hero-tile" role="listitem">
              <span className="acct-lrn__hero-tile-label">{labels.tileLabels.active}</span>
              <span className="acct-lrn__hero-tile-value">{stats.metrics.activeCourses}</span>
              <span className="acct-lrn__hero-tile-foot">
                {stats.metrics.activeCourses === 0 ? labels.tileFoot.activeEmpty : labels.tileFoot.activeWith}
              </span>
            </div>
            <div className="acct-lrn__hero-tile" role="listitem">
              <span className="acct-lrn__hero-tile-label">{labels.tileLabels.completed}</span>
              <span className="acct-lrn__hero-tile-value">{stats.metrics.completedCourses}</span>
              <span className="acct-lrn__hero-tile-foot">
                {stats.metrics.completedCourses === 0 ? labels.tileFoot.completedEmpty : labels.tileFoot.completedWith}
              </span>
            </div>
            <div className="acct-lrn__hero-tile" role="listitem">
              <span className="acct-lrn__hero-tile-label">{labels.tileLabels.certificates}</span>
              <span className="acct-lrn__hero-tile-value">{stats.metrics.certificates}</span>
              <span className="acct-lrn__hero-tile-foot">
                {stats.metrics.certificates === 0 ? labels.tileFoot.certificatesEmpty : labels.tileFoot.certificatesWith}
              </span>
            </div>
            <div className="acct-lrn__hero-tile" role="listitem">
              <span className="acct-lrn__hero-tile-label">{labels.tileLabels.assignments}</span>
              <span className="acct-lrn__hero-tile-value">{stats.metrics.assignedLearning}</span>
              <span className="acct-lrn__hero-tile-foot">
                {stats.metrics.assignedLearning === 0 ? labels.tileFoot.assignmentsEmpty : labels.tileFoot.assignmentsWith}
              </span>
            </div>
          </div>
        </div>
        <aside className="acct-lrn__hero-side" aria-label={labels.sideKicker}>
          <p className="acct-lrn__hero-side-label">{labels.sideKicker}</p>
          <p className="acct-lrn__hero-side-title">{labels.sideTitle}</p>
          <p className="acct-lrn__hero-side-body">{labels.sideBody}</p>
          {breakdown.length > 0 ? (
            <div className="acct-lrn__hero-breakdown" aria-label={labels.breakdownLabel}>
              <p className="acct-lrn__hero-breakdown-label">{labels.breakdownLabel}</p>
              {breakdown.map((row) => (
                <div key={row.key} className="acct-lrn__hero-breakdown-row">
                  <span className="acct-lrn__hero-breakdown-name">
                    <span
                      className="acct-lrn__hero-breakdown-dot"
                      style={{ background: row.color }}
                      aria-hidden
                    />
                    {row.label}
                  </span>
                  <span className="acct-lrn__hero-breakdown-count">{row.count}</span>
                </div>
              ))}
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
