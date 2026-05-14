import { stageTone } from "./helpers";

export type ApplicationRow = {
  id: string;
  jobTitle: string;
  companyName: string;
  stageLabel: string;
  stageKey: string;
  lastUpdateAt: string;
  detailUrl: string | null;
};

type Props = {
  applications: ReadonlyArray<ApplicationRow>;
  emptyTitle: string;
  emptyBody: string;
  formatStamp: (iso: string) => string;
};

export function ApplicationsList({ applications, emptyTitle, emptyBody, formatStamp }: Props) {
  if (applications.length === 0) {
    return (
      <div className="acct-job__empty">
        <strong>{emptyTitle}</strong>
        {emptyBody}
      </div>
    );
  }
  return (
    <div className="acct-job__list" role="list" aria-label="Active applications">
      {applications.map((app) => {
        const initials = (app.companyName || app.jobTitle).slice(0, 2).toUpperCase();
        const tone = stageTone(app.stageKey);
        const body = (
          <>
            <span className="acct-job__row-icon" data-tone={tone} aria-hidden>
              {initials}
            </span>
            <div className="acct-job__row-meta">
              <span className="acct-job__row-title">{app.jobTitle}</span>
              <span className="acct-job__row-sub">
                {app.companyName} · last update {formatStamp(app.lastUpdateAt)}
              </span>
            </div>
            <span className="acct-job__chip" data-tone={tone}>
              {app.stageLabel}
            </span>
            <span aria-hidden style={{ color: "var(--acct-muted)", fontSize: 14 }}>
              ›
            </span>
          </>
        );
        return app.detailUrl ? (
          <a
            key={app.id}
            href={app.detailUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="acct-job__row"
            role="listitem"
            aria-label={`${app.jobTitle} at ${app.companyName}, ${app.stageLabel}`}
          >
            {body}
          </a>
        ) : (
          <div className="acct-job__row" key={app.id} role="listitem">
            {body}
          </div>
        );
      })}
    </div>
  );
}
