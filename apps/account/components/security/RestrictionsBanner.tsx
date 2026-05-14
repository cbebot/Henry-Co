import { AlertTriangle, ShieldCheck } from "lucide-react";

type Props = {
  blocked: ReadonlyArray<string>;
  clearLabel: string;
  restrictedKicker: string;
  clearKicker: string;
};

export function RestrictionsBanner({
  blocked,
  clearLabel,
  restrictedKicker,
  clearKicker,
}: Props) {
  if (blocked.length === 0) {
    return (
      <div className="acct-sec__restrict" data-tone="clear" role="status">
        <span className="acct-sec__restrict-icon" aria-hidden>
          <ShieldCheck size={14} aria-hidden />
        </span>
        <div className="acct-sec__restrict-body">
          <p className="acct-sec__restrict-kicker">{clearKicker}</p>
          <p className="acct-sec__restrict-text">{clearLabel}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="acct-sec__restrict" data-tone="risk" role="status">
      <span className="acct-sec__restrict-icon" aria-hidden>
        <AlertTriangle size={14} aria-hidden />
      </span>
      <div className="acct-sec__restrict-body">
        <p className="acct-sec__restrict-kicker">{restrictedKicker}</p>
        <ul className="acct-sec__restrict-list">
          {blocked.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
