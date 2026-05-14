import { ArrowUpRight, Bookmark } from "lucide-react";

export type SavedRoleRow = {
  id: string;
  title: string;
  companyName: string;
  location: string | null;
  savedAt: string;
  url: string | null;
};

type Props = {
  saved: ReadonlyArray<SavedRoleRow>;
  emptyTitle: string;
  emptyBody: string;
  formatStamp: (iso: string) => string;
};

export function SavedRolesList({ saved, emptyTitle, emptyBody, formatStamp }: Props) {
  if (saved.length === 0) {
    return (
      <div className="acct-job__empty">
        <strong>{emptyTitle}</strong>
        {emptyBody}
      </div>
    );
  }
  return (
    <div className="acct-job__list" role="list" aria-label="Saved roles">
      {saved.map((role) => {
        const body = (
          <>
            <span className="acct-job__row-icon" data-tone="info" aria-hidden>
              <Bookmark size={16} aria-hidden />
            </span>
            <div className="acct-job__row-meta">
              <span className="acct-job__row-title">{role.title}</span>
              <span className="acct-job__row-sub">
                {role.companyName}
                {role.location ? ` · ${role.location}` : ""} · saved {formatStamp(role.savedAt)}
              </span>
            </div>
            <span aria-hidden style={{ color: "var(--acct-muted)" }}>
              <ArrowUpRight size={14} aria-hidden />
            </span>
            <span aria-hidden style={{ color: "var(--acct-muted)", fontSize: 14 }}>
              ›
            </span>
          </>
        );
        return role.url ? (
          <a
            key={role.id}
            href={role.url}
            target="_blank"
            rel="noopener noreferrer"
            className="acct-job__row"
            role="listitem"
            aria-label={`${role.title} at ${role.companyName}`}
          >
            {body}
          </a>
        ) : (
          <div className="acct-job__row" key={role.id} role="listitem">
            {body}
          </div>
        );
      })}
    </div>
  );
}
