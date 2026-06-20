"use client";

import { useMemo, useState } from "react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { NG_STATES, NG_ZONE_LABELS, type NgZone } from "@henryco/config";
import {
  resolveCoveredStates,
  tierCeiling,
  normalizeTier,
  describeReachSummary,
  type ReachKind,
} from "@/lib/checkout/delivery-reach";

/** The three offerable reaches, narrowest → widest (matches the tier ladder). */
const REACH_ORDER: ReadonlyArray<{ kind: Exclude<ReachKind, "states">; rank: number }> = [
  { kind: "own_state", rank: 0 },
  { kind: "own_zone", rank: 1 },
  { kind: "nationwide", rank: 2 },
];
const CEILING_RANK: Record<"own_state" | "own_zone" | "nationwide", number> = {
  own_state: 0,
  own_zone: 1,
  nationwide: 2,
};

export type DeliveryPromiseFieldsProps = {
  /** The seller's KYC verification_level (bronze/silver/gold/henryco/…) — the reach ceiling. */
  tier: string | null;
  /** Current promise values to prefill (null when none yet). */
  current: {
    reachKind: ReachKind;
    originState: string | null;
    minOrderNaira: number | null;
    isActive: boolean;
  } | null;
  /** When false (flag off / dormant), the controls preview but cannot be saved. */
  disabled?: boolean;
};

/**
 * V3-DELIVERY-COMPLETE-01 (T5) — the interactive body of the seller "Delivery
 * Promise" card. Renders the reach control GATED to the seller's verified tier, a
 * dispatch-state picker, an optional minimum order, an active toggle, and a LIVE
 * preview of exactly what buyers will see — all from the SAME pure reach engine the
 * checkout uses, so the preview can never over-promise what the sale would honor.
 *
 * The covered states are NOT submitted; the server recomputes them from
 * (reach_kind + origin_state + tier) so the client cannot forge coverage. These
 * inputs carry `name` attributes so the wrapping MarketplaceActionForm posts them.
 */
export function DeliveryPromiseFields({ tier, current, disabled = false }: DeliveryPromiseFieldsProps) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  const ceiling = tierCeiling(tier);
  const ceilingRank = CEILING_RANK[ceiling];
  const normalized = normalizeTier(tier);

  const initialReach: "own_state" | "own_zone" | "nationwide" =
    current?.reachKind === "own_zone" || current?.reachKind === "nationwide"
      ? current.reachKind
      : "own_state";

  const [reachKind, setReachKind] = useState<"own_state" | "own_zone" | "nationwide">(
    CEILING_RANK[initialReach] <= ceilingRank ? initialReach : ceiling,
  );
  const [originState, setOriginState] = useState<string>(current?.originState ?? "");
  const [minOrder, setMinOrder] = useState<string>(
    current?.minOrderNaira != null ? String(current.minOrderNaira) : "",
  );
  const [isActive, setIsActive] = useState<boolean>(current?.isActive ?? true);

  // The live preview is computed through the real reach engine, clamped to tier.
  const preview = useMemo(() => {
    if (!originState) return { scope: "none" as const };
    const covered = resolveCoveredStates({ reachKind, originState, tier }).coveredStates;
    return describeReachSummary(covered);
  }, [reachKind, originState, tier]);

  const previewSentence = (() => {
    if (preview.scope === "none") return t("Pick your dispatch state to preview your delivery reach.");
    const reachText =
      preview.scope === "nationwide"
        ? t("Free delivery nationwide")
        : preview.scope === "zone"
          ? `${t("Free delivery across")} ${NG_ZONE_LABELS[preview.zone as NgZone]}`
          : `${t("Free delivery to")} ${preview.count} ${t("states")}`;
    const minNaira = Number(minOrder);
    if (minOrder && Number.isFinite(minNaira) && minNaira > 0) {
      return `${reachText} — ${t("on orders from")} ₦${minNaira.toLocaleString()}`;
    }
    return reachText;
  })();

  const reachLabel: Record<"own_state" | "own_zone" | "nationwide", string> = {
    own_state: t("My state"),
    own_zone: t("My geopolitical zone"),
    nationwide: t("Nationwide"),
  };
  const unlockLabel: Record<"own_zone" | "nationwide", string> = {
    own_zone: t("Unlock at Silver verification"),
    nationwide: t("Unlock at Gold verification"),
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="market-kicker">{t("Delivery promise")}</p>
        <p className="mt-2 text-sm leading-6 text-[var(--market-muted)]">
          {t("Offer free delivery to the buyers you can reach. Your reach grows as your store earns verification.")}
        </p>
      </div>

      {/* Reach — gated to the verified tier */}
      <fieldset className="space-y-2" disabled={disabled}>
        <legend className="text-xs uppercase tracking-[0.18em] text-[var(--market-muted)]">
          {t("Reach")}
        </legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {REACH_ORDER.map(({ kind, rank }) => {
            const locked = rank > ceilingRank;
            const active = reachKind === kind;
            return (
              <label
                key={kind}
                className={[
                  "flex cursor-pointer flex-col gap-1 rounded-2xl border px-4 py-3 text-sm transition",
                  active
                    ? "border-[var(--market-brass)] bg-[var(--market-nav-active)]"
                    : "border-[var(--market-line)] bg-[var(--market-fill-faint)]",
                  locked ? "cursor-not-allowed opacity-55" : "",
                ].join(" ")}
              >
                <span className="flex items-center gap-2 font-semibold text-[var(--market-ink)]">
                  <input
                    type="radio"
                    name="reach_kind"
                    value={kind}
                    checked={active}
                    disabled={locked || disabled}
                    onChange={() => setReachKind(kind)}
                    className="accent-[var(--market-brass)]"
                  />
                  {reachLabel[kind]}
                </span>
                {locked ? (
                  <span className="text-[11px] uppercase tracking-[0.16em] text-[var(--market-muted)]">
                    {kind === "own_zone" ? unlockLabel.own_zone : unlockLabel.nationwide}
                  </span>
                ) : null}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.18em] text-[var(--market-muted)]">
            {t("Dispatch state")}
          </span>
          <select
            name="origin_state"
            value={originState}
            onChange={(event) => setOriginState(event.target.value)}
            disabled={disabled}
            required
            className="market-input w-full rounded-2xl px-4 py-3"
          >
            <option value="">{t("Select your state")}</option>
            {NG_STATES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.18em] text-[var(--market-muted)]">
            {t("Minimum order (₦, optional)")}
          </span>
          <input
            name="min_order_naira"
            type="number"
            min={0}
            inputMode="numeric"
            value={minOrder}
            onChange={(event) => setMinOrder(event.target.value)}
            disabled={disabled}
            placeholder={t("No minimum")}
            className="market-input w-full rounded-2xl px-4 py-3"
          />
        </label>
      </div>

      <label className="flex items-center gap-3 text-sm text-[var(--market-ink)]">
        <input
          type="checkbox"
          name="is_active"
          value="on"
          checked={isActive}
          onChange={(event) => setIsActive(event.target.checked)}
          disabled={disabled}
          className="h-4 w-4 accent-[var(--market-brass)]"
        />
        {t("Promise is live")}
      </label>

      {/* Live preview — exactly what buyers will see */}
      <div className="rounded-2xl border border-[var(--market-line)] bg-[var(--market-fill-faint)] px-4 py-3">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--market-muted)]">{t("Buyers will see")}</p>
        <p className="mt-1 text-sm font-semibold text-[var(--market-ink)]">{previewSentence}</p>
        <p className="mt-1 text-[11px] text-[var(--market-muted)]">
          {t("Your verified reach")}: {reachLabel[ceiling]}
          {normalized === "bronze" ? ` · ${t("Earn verification to reach further.")}` : ""}
        </p>
      </div>
    </div>
  );
}
