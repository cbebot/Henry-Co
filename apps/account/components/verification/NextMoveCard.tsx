import { ChevronRight } from "lucide-react";
import Link from "next/link";

type Props = {
  requirements: string[];
};

export function NextMoveCard({ requirements }: Props) {
  const items =
    requirements.length > 0
      ? requirements
      : ["You're already in the highest trust lane the shared verification surface exposes."];
  return (
    <div className="acct-ver__next" aria-labelledby="acct-ver-next-head">
      <p
        id="acct-ver-next-head"
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--acct-muted)",
          margin: 0,
        }}
      >
        Next strongest move
      </p>
      {items.map((item) => (
        <div className="acct-ver__next-row" key={item}>
          <span className="acct-ver__next-row-icon" aria-hidden>
            <ChevronRight size={14} aria-hidden />
          </span>
          <span className="acct-ver__next-row-text">{item}</span>
        </div>
      ))}
      <div className="acct-ver__next-actions">
        <Link className="acct-ver__next-link" href="/documents">
          Review documents
        </Link>
        <Link className="acct-ver__next-link" href="/support/new">
          Contact support
        </Link>
      </div>
    </div>
  );
}
