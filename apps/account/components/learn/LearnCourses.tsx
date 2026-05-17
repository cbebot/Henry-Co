import { BookOpen, CheckCircle2 } from "lucide-react";

import { formatStamp, translateLearnToken, type CourseRow, type LearnLocale } from "./helpers";

type Props = {
  courses: ReadonlyArray<CourseRow>;
  locale: LearnLocale;
  labels: {
    ariaLabel: string;
    completedAtTemplate: string;
    progressPercentTemplate: string;
    statusDelimiter: string;
  };
  limit?: number;
};

function fillTemplate(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

export function LearnCourses({ courses, locale, labels, limit = 8 }: Props) {
  const rows = courses.slice(0, limit);
  if (rows.length === 0) return null;

  return (
    <div className="acct-lrn__courses" role="list" aria-label={labels.ariaLabel}>
      {rows.map((course) => {
        const isActive = course.kind === "active";
        const Icon = isActive ? BookOpen : CheckCircle2;
        const progress = Math.min(100, Math.max(0, course.percentComplete));
        const subline = isActive
          ? `${translateLearnToken(locale, course.status)}${labels.statusDelimiter}${translateLearnToken(locale, course.paymentStatus)}`
          : course.completedAt
            ? fillTemplate(labels.completedAtTemplate, {
                date: formatStamp(course.completedAt, locale),
              })
            : translateLearnToken(locale, course.status);
        const ariaProgress = fillTemplate(labels.progressPercentTemplate, { percent: progress });

        return (
          <a
            key={course.id}
            href={course.href}
            target="_blank"
            rel="noopener noreferrer"
            className="acct-lrn__course-row"
            role="listitem"
            aria-label={`${course.title}${labels.statusDelimiter}${ariaProgress}`}
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
