import { ArrowUpRight, Award, BookOpen, Sparkles, UsersRound } from "lucide-react";

import {
  translateLearnToken,
  type AssignmentRow,
  type CertificateRow,
  type LearnLocale,
  type SavedCourseRow,
  type TeacherApplication,
} from "./helpers";

type Props = {
  certificates: ReadonlyArray<CertificateRow>;
  assignments: ReadonlyArray<AssignmentRow>;
  savedCourses: ReadonlyArray<SavedCourseRow>;
  teacherApplication: TeacherApplication;
  locale: LearnLocale;
  learnOrigin: string;
  labels: {
    ariaLabel: string;
    certificatesTitle: string;
    assignmentsTitle: string;
    savedTitle: string;
    teachingTitle: string;
    statusLabel: string;
    expertiseLabel: string;
    topicsLabel: string;
    openApplicationCta: string;
    applyToTeachCta: string;
    teachingEmpty: string;
  };
};

export function LearnExtras({
  certificates,
  assignments,
  savedCourses,
  teacherApplication,
  locale,
  learnOrigin,
  labels,
}: Props) {
  const hasAnything =
    certificates.length > 0 ||
    assignments.length > 0 ||
    savedCourses.length > 0 ||
    teacherApplication !== null;
  if (!hasAnything) return null;

  return (
    <div className="acct-lrn__extras" role="list" aria-label={labels.ariaLabel}>
      {certificates.length > 0 ? (
        <section className="acct-lrn__extra" role="listitem">
          <div className="acct-lrn__extra-head">
            <span className="acct-lrn__extra-icon" data-kind="cert" aria-hidden>
              <Award size={16} />
            </span>
            <p className="acct-lrn__extra-kicker">{labels.certificatesTitle}</p>
          </div>
          <div className="acct-lrn__extra-rows">
            {certificates.slice(0, 3).map((cert) => (
              <a
                key={cert.id}
                href={cert.href}
                target="_blank"
                rel="noopener noreferrer"
                className="acct-lrn__extra-row"
              >
                <span className="acct-lrn__extra-row-title">{cert.courseTitle}</span>
                <span className="acct-lrn__extra-row-sub">{cert.certificateNo}</span>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {assignments.length > 0 ? (
        <section className="acct-lrn__extra" role="listitem">
          <div className="acct-lrn__extra-head">
            <span className="acct-lrn__extra-icon" data-kind="assign" aria-hidden>
              <UsersRound size={16} />
            </span>
            <p className="acct-lrn__extra-kicker">{labels.assignmentsTitle}</p>
          </div>
          <div className="acct-lrn__extra-rows">
            {assignments.slice(0, 3).map((a) => (
              <a
                key={a.id}
                href={a.href}
                target="_blank"
                rel="noopener noreferrer"
                className="acct-lrn__extra-row"
              >
                <span className="acct-lrn__extra-row-title">{a.courseTitle}</span>
                <span className="acct-lrn__extra-row-sub">{a.note}</span>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {savedCourses.length > 0 ? (
        <section className="acct-lrn__extra" role="listitem">
          <div className="acct-lrn__extra-head">
            <span className="acct-lrn__extra-icon" data-kind="saved" aria-hidden>
              <BookOpen size={16} />
            </span>
            <p className="acct-lrn__extra-kicker">{labels.savedTitle}</p>
          </div>
          <div className="acct-lrn__extra-rows">
            {savedCourses.slice(0, 3).map((s) => (
              <a
                key={s.id}
                href={`${learnOrigin}/courses/${s.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="acct-lrn__extra-row"
              >
                <span className="acct-lrn__extra-row-title">{s.title}</span>
                <span className="acct-lrn__extra-row-sub">{s.subtitle}</span>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {teacherApplication ? (
        <section className="acct-lrn__extra" role="listitem">
          <div className="acct-lrn__extra-head">
            <span className="acct-lrn__extra-icon" data-kind="teach" aria-hidden>
              <Sparkles size={16} />
            </span>
            <p className="acct-lrn__extra-kicker">{labels.teachingTitle}</p>
          </div>
          <div className="acct-lrn__extra-rows">
            <div className="acct-lrn__extra-row acct-lrn__extra-row--static">
              <span className="acct-lrn__extra-row-title">
                {labels.statusLabel}: {translateLearnToken(locale, teacherApplication.status)}
              </span>
              <span className="acct-lrn__extra-row-sub">
                {labels.expertiseLabel}: {teacherApplication.expertiseArea}
              </span>
              {teacherApplication.teachingTopics.length > 0 ? (
                <span className="acct-lrn__extra-row-sub">
                  {labels.topicsLabel}: {teacherApplication.teachingTopics.join(", ")}
                </span>
              ) : null}
              {teacherApplication.reviewNotes ? (
                <span className="acct-lrn__extra-row-sub">{teacherApplication.reviewNotes}</span>
              ) : null}
            </div>
            <a
              href={`${learnOrigin}/teach`}
              target="_blank"
              rel="noopener noreferrer"
              className="acct-lrn__extra-cta"
            >
              {labels.openApplicationCta} <ArrowUpRight size={14} aria-hidden />
            </a>
          </div>
        </section>
      ) : null}
    </div>
  );
}
