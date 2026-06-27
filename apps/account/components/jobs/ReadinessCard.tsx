import { CheckCircle2, Circle } from "lucide-react";
import { getAccountHeroesCopy } from "@henryco/i18n";
import { getAccountAppLocale } from "@/lib/locale-server";

export type ChecklistRow = {
  id: string;
  label: string;
  done: boolean;
};

type Props = {
  title: string;
  body: string;
  checklist: ReadonlyArray<ChecklistRow>;
};

export async function ReadinessCard({ title, body, checklist }: Props) {
  const locale = await getAccountAppLocale();
  const copy = getAccountHeroesCopy(locale).readinessCard;
  return (
    <div className="acct-job__readiness" aria-label={copy.cardAria}>
      <h3 className="acct-job__readiness-title">{title}</h3>
      <p className="acct-job__readiness-body">{body}</p>
      <ul className="acct-job__checklist" role="list">
        {checklist.map((item) => (
          <li className="acct-job__checklist-item" key={item.id} role="listitem">
            <span className="acct-job__checklist-icon" data-done={item.done ? "true" : "false"} aria-hidden>
              {item.done ? <CheckCircle2 size={14} aria-hidden /> : <Circle size={14} aria-hidden />}
            </span>
            <span className="acct-job__checklist-text" data-done={item.done ? "true" : "false"}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
