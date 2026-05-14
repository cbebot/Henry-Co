import { CheckCircle2 } from "lucide-react";

type Props = {
  whereYouAre: {
    kicker: string;
    title: string;
    body: string;
    reasons: ReadonlyArray<string>;
  };
  whatUnlocksNext: {
    kicker: string;
    title: string;
    body: string;
    requirements: ReadonlyArray<string>;
  };
};

export function TrustGuide({ whereYouAre, whatUnlocksNext }: Props) {
  return (
    <div className="acct-sec__guide">
      <div className="acct-sec__guide-col">
        <p className="acct-sec__guide-kicker" data-tone="good">
          {whereYouAre.kicker}
        </p>
        <h3 className="acct-sec__guide-title">{whereYouAre.title}</h3>
        <p className="acct-sec__guide-body">{whereYouAre.body}</p>
        {whereYouAre.reasons.length > 0 ? (
          <ul className="acct-sec__guide-list">
            {whereYouAre.reasons.map((reason) => (
              <li key={reason}>
                <CheckCircle2 size={14} aria-hidden /> {reason}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="acct-sec__guide-col">
        <p className="acct-sec__guide-kicker" data-tone="warn">
          {whatUnlocksNext.kicker}
        </p>
        <h3 className="acct-sec__guide-title">{whatUnlocksNext.title}</h3>
        <p className="acct-sec__guide-body">{whatUnlocksNext.body}</p>
        {whatUnlocksNext.requirements.length > 0 ? (
          <ul className="acct-sec__guide-list">
            {whatUnlocksNext.requirements.map((requirement) => (
              <li key={requirement}>
                <CheckCircle2 size={14} aria-hidden style={{ color: "var(--sec-warn)" }} /> {requirement}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
