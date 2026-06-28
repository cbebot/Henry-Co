import { Clock, Globe, ShieldCheck } from "lucide-react";

import { getAccountHeroesCopy } from "@henryco/i18n";
import { getAccountAppLocale } from "@/lib/locale-server";
import type { AccountTrustProfile } from "@/lib/trust";
import {
  computeHeroState,
  statusBlurb,
  statusEyebrow,
  statusHeadline,
} from "./helpers";

type Props = {
  trust: AccountTrustProfile;
  trustTierLabel: string;
  nextTierLabel: string | null;
  regionalLine: string;
  email: string | null;
  accountAgeDays: number;
};

const SCORE_MAX = 100;

export async function SecurityHero({
  trust,
  trustTierLabel,
  nextTierLabel,
  regionalLine,
  email,
  accountAgeDays,
}: Props) {
  const locale = await getAccountAppLocale();
  const copy = getAccountHeroesCopy(locale).securityHero;
  const state = computeHeroState(trust);
  const fillPct = Math.max(0, Math.min(100, (trust.score / SCORE_MAX) * 100));
  return (
    <section className="acct-sec__hero" data-state={state} aria-label={copy.heroAria}>
      <div className="acct-sec__hero-inner">
        <div>
          <span className="acct-sec__eyebrow">
            <span className="acct-sec__eyebrow-dot" aria-hidden />
            {statusEyebrow(state)}
          </span>
          <h1 className="acct-sec__headline">{statusHeadline(state)}</h1>
          <p className="acct-sec__hero-blurb">{statusBlurb(state)}</p>
          <div className="acct-sec__hero-stamps">
            <span>
              <ShieldCheck size={12} aria-hidden /> {trustTierLabel}
            </span>
            {email ? (
              <span>
                <Globe size={12} aria-hidden /> {email}
              </span>
            ) : null}
            <span>
              <Clock size={12} aria-hidden />{" "}
              {(accountAgeDays === 1 ? copy.accountActiveSingular : copy.accountActivePlural).replace(
                "{count}",
                String(accountAgeDays),
              )}
            </span>
          </div>
          {trust.signals.suspiciousEvents > 0 ? (
            <p
              style={{
                margin: "14px 0 0",
                fontSize: 12,
                color: "color-mix(in srgb, var(--acct-bg-soft) 75%, transparent)",
              }}
            >
              {(trust.signals.suspiciousEvents === 1 ? copy.flaggedSingular : copy.flaggedPlural).replace(
                "{count}",
                String(trust.signals.suspiciousEvents),
              )}{" "}
              · {copy.flaggedSuffix}
            </p>
          ) : null}
        </div>
        <aside className="acct-sec__hero-side" aria-label={copy.trustSignalAria}>
          <div className="acct-sec__hero-score">
            <div className="acct-sec__hero-score-head">
              <div>
                <p className="acct-sec__hero-score-label">{copy.trustScore}</p>
                <p className="acct-sec__hero-score-tier">{trustTierLabel}</p>
              </div>
              {nextTierLabel ? (
                <p
                  className="acct-sec__hero-score-tier"
                  aria-label={copy.nextTierAria.replace("{tier}", nextTierLabel)}
                >
                  {copy.nextTier} {nextTierLabel}
                </p>
              ) : null}
            </div>
            <p className="acct-sec__hero-score-value" aria-live="polite">
              {trust.score}
              <span className="acct-sec__hero-score-value-out">/ {SCORE_MAX}</span>
            </p>
            <div
              style={{
                width: "100%",
                height: 8,
                borderRadius: 999,
                background: "color-mix(in srgb, var(--acct-bg-soft) 14%, transparent)",
                overflow: "hidden",
                position: "relative",
              }}
              aria-hidden
            >
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "inherit",
                  background:
                    "linear-gradient(90deg, color-mix(in srgb, var(--acct-bg-soft) 80%, transparent) 0%, var(--acct-bg-soft) 100%)",
                  transform: `scaleX(${fillPct / 100})`,
                  transformOrigin: "left",
                }}
              />
            </div>
            <p className="acct-sec__hero-score-foot">{regionalLine}</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
