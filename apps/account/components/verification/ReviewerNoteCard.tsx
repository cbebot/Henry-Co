import { AlertTriangle } from "lucide-react";

type Props = {
  note: string;
};

export function ReviewerNoteCard({ note }: Props) {
  return (
    <div className="acct-ver__note" role="status">
      <span className="acct-ver__note-icon" aria-hidden>
        <AlertTriangle size={14} aria-hidden />
      </span>
      <div style={{ minWidth: 0 }}>
        <p className="acct-ver__note-label">Reviewer note</p>
        <p className="acct-ver__note-body">{note}</p>
      </div>
    </div>
  );
}
