import { AlertTriangle } from "lucide-react";
import { getAccountMiscExtraCopy } from "@henryco/i18n";
import { getAccountAppLocale } from "@/lib/locale-server";

type Props = {
  note: string;
};

export async function ReviewerNoteCard({ note }: Props) {
  const locale = await getAccountAppLocale();
  const copy = getAccountMiscExtraCopy(locale).reviewerNote;
  return (
    <div className="acct-ver__note" role="status">
      <span className="acct-ver__note-icon" aria-hidden>
        <AlertTriangle size={14} aria-hidden />
      </span>
      <div style={{ minWidth: 0 }}>
        <p className="acct-ver__note-label">{copy.label}</p>
        <p className="acct-ver__note-body">{note}</p>
      </div>
    </div>
  );
}
