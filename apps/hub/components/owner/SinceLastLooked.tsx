import { cookies } from "next/headers";
import { Sparkles, UserPlus, TrendingUp } from "lucide-react";
import { translateSurfaceLabel, type AppLocale } from "@henryco/i18n";
import { getSinceLastLooked } from "@/lib/owner-command/since-last-looked";
import { formatCurrencyAmount, timeAgo } from "@/lib/format";
import MarkOwnerSeen from "./MarkOwnerSeen";

/**
 * SinceLastLooked — the "while you were away" greeting (OCC-3b, W1).
 *
 * Reads the previous heartbeat cookie and, only when the owner has genuinely
 * been away (gap past the threshold) AND something actually moved, greets them
 * with the delta: new signups and money settled since. The heartbeat is stamped
 * by <MarkOwnerSeen/>, always mounted so the marker advances even when the band
 * stays hidden (continuous presence has no "while away" story to tell).
 */

const GAP_MS = 20 * 60 * 1000;

export default async function SinceLastLooked({ locale }: { locale: AppLocale }) {
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const store = await cookies();
  const heartbeat = store.get("hc-owner-heartbeat")?.value ?? null;
  const parsed = heartbeat ? Date.parse(heartbeat) : NaN;
  const away = Number.isFinite(parsed) && Date.now() - parsed > GAP_MS;

  const delta = away ? await getSinceLastLooked(new Date(parsed).toISOString()) : null;
  const hasMovement = Boolean(delta && (delta.newSignups > 0 || delta.settledMinor > 0));

  return (
    <>
      <MarkOwnerSeen />
      {delta && hasMovement ? (
        <div className="acct-card flex flex-wrap items-center gap-x-5 gap-y-2 border-l-2 border-l-[var(--acct-gold)] px-5 py-3.5">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--acct-ink)]">
            <Sparkles className="h-4 w-4 text-[var(--owner-accent)]" aria-hidden />
            {t("Since you were last here")}
            <span className="font-normal text-[var(--acct-muted)]">
              {timeAgo(delta.sinceIso)}
            </span>
          </span>
          {delta.newSignups > 0 ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-[var(--acct-ink)]">
              <UserPlus className="h-4 w-4 text-[var(--acct-muted)]" aria-hidden />
              <span className="font-semibold tabular-nums">{delta.newSignups.toLocaleString()}</span>
              {delta.newSignups === 1 ? t("new signup") : t("new signups")}
            </span>
          ) : null}
          {delta.settledMinor > 0 ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-[var(--acct-ink)]">
              <TrendingUp className="h-4 w-4 text-[var(--acct-muted)]" aria-hidden />
              <span className="font-semibold tabular-nums">
                {formatCurrencyAmount(delta.settledMinor, "NGN", { unit: "kobo" })}
              </span>
              {t("settled")}
              {delta.capped ? <span className="text-[var(--acct-muted)]">{t("(or more)")}</span> : null}
            </span>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
