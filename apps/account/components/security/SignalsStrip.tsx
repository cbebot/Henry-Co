import { getAccountHeroesCopy } from "@henryco/i18n";
import { getAccountAppLocale } from "@/lib/locale-server";
import type { SignalTone } from "./helpers";

export type Signal = {
  label: string;
  value: string;
  tone: SignalTone;
  foot?: string;
};

type Props = {
  signals: ReadonlyArray<Signal>;
};

export async function SignalsStrip({ signals }: Props) {
  const locale = await getAccountAppLocale();
  const copy = getAccountHeroesCopy(locale).signalsStrip;
  return (
    <div className="acct-sec__signals" role="list" aria-label={copy.listLabel}>
      {signals.map((s) => (
        <div className="acct-sec__signal" role="listitem" key={s.label}>
          <span className="acct-sec__signal-label">{s.label}</span>
          <span className="acct-sec__signal-value" data-tone={s.tone}>
            {s.value}
          </span>
          {s.foot ? <span className="acct-sec__signal-foot">{s.foot}</span> : null}
        </div>
      ))}
    </div>
  );
}
