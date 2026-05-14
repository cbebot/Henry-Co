import { BookOpen, CheckCircle2 } from "lucide-react";

import { formatStamp, translateLearnToken, type CourseRow, type LearnLocale } from "./helpers";

type Props = {
  courses: ReadonlyArray<CourseRow>;
  locale: LearnLocale;
  limit?: number;
};

export function LearnCourses({ courses, locale, limit = 8 }: Props) {
  const rows = courses.slice(0, limit);
  if (rows.length === 0) return null;

  return (
    <div className="acct-lrn__courses" role="list" aria-label="Courses">
      {rows.map((course) => {
        const isActive = course.kind === "active";
        const Icon = isActive ? BookOpen : CheckCircle2;
        const progress = Math.min(100, Math.max(0, course.percentComplete));
        const subline = isActive
          ? `${translateLearnToken(locale, course.status)} · ${translateLearnToken(locale, course.paymentStatus)}`
          : course.completedAt
            ? `${locale === "fr" ? "Terminé" : "Completed"} ${formatStamp(course.completedAt, locale)}`
            : translateLearnToken(locale, course.status);

        return (
          <a
            key={course.id}
            href={course.href}
            target="_blank"
            rel="noopener noreferrer"
            className="acct-lrn__course-row"
            role="listitem"
            aria-label={`${course.title} · ${progress}%`}
          >
            <span className="acct-lrn__course-icon" data-kind={course.kind} aria-hidden>
              <Icon size={16} />
            </span>
            <div className="acct-lrn__course-meta">
              <div className="acct-lrn__course-titlebar">
                <span className="acct-lrn__course-title">{course.title}</span>
                <span className="acct-lrn__course-pct">{progress}%</span>
              </div>
              <p className="acct-lrn__course-sub">{course.subtitle}</p>
              <div className="acct-lrn__progress" aria-hidden>
                <div className="acct-lrn__progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <p className="acct-lrn__course-foot">{subline}</p>
            </div>
          </a>
        );
      })}
    </div>
  );
}
