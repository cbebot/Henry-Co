/**
 * @henryco/config/deals — V3-35 deal & campaign governance thresholds.
 *
 * One typed source for the approval and fairness numbers so the app layer,
 * the fairness cron, and the owner tiles never fork their own constants.
 * MONEY NOTE: `autoApproveMaxFixedMinor` values are INTEGER MINOR UNITS
 * (kobo/cents) keyed by ISO 4217 currency — never floats. A deal is an offer
 * artifact only; nothing here touches the payment surface.
 */

export type DealApprovalThresholds = {
  /** percent_off deals at or below this integer percent auto-approve. */
  autoApproveMaxPercent: number;
  /**
   * fixed_off deals at or below this cap (integer minor units, per currency)
   * auto-approve. A currency absent from the map NEVER auto-approves —
   * fail-closed to staff review.
   */
  autoApproveMaxFixedMinor: Readonly<Record<string, number>>;
};

export const DEAL_APPROVAL_THRESHOLDS: DealApprovalThresholds = {
  autoApproveMaxPercent: 25,
  autoApproveMaxFixedMinor: {
    // ₦25,000 in kobo.
    NGN: 2_500_000,
  },
};

export type DealFairnessConfig = {
  /**
   * Maximum share (0..1) of a scope's impressions a single creator may hold
   * inside the rolling window before a fairness alert fires.
   */
  maxCreatorImpressionShare: number;
  /** Rolling audit window, in days. */
  windowDays: number;
  /** Alerts only fire once a scope has at least this many impressions. */
  minImpressionsForAlert: number;
  /**
   * Diversity guard: maximum consecutive cards from the same creator in a
   * ranked deal list (when an alternative creator is available).
   */
  maxConsecutivePerCreator: number;
};

export const DEAL_FAIRNESS: DealFairnessConfig = {
  maxCreatorImpressionShare: 0.4,
  windowDays: 7,
  minImpressionsForAlert: 50,
  maxConsecutivePerCreator: 1,
};

/**
 * Whether a deal's terms are inside the auto-approve envelope. Anything
 * outside (unknown currency, missing values, bogo/bundle judgement calls)
 * requires staff review — fail-closed.
 */
export function isWithinAutoApproveThreshold(args: {
  dealType: "percent_off" | "fixed_off" | "bogo" | "bundle" | "spotlight";
  discountPercent?: number | null;
  discountMinor?: number | null;
  discountCurrency?: string | null;
  thresholds?: DealApprovalThresholds;
}): boolean {
  const t = args.thresholds ?? DEAL_APPROVAL_THRESHOLDS;
  switch (args.dealType) {
    case "percent_off": {
      const percent = args.discountPercent;
      return (
        typeof percent === "number" &&
        Number.isInteger(percent) &&
        percent >= 1 &&
        percent <= t.autoApproveMaxPercent
      );
    }
    case "fixed_off": {
      const minor = args.discountMinor;
      const currency = (args.discountCurrency ?? "").toUpperCase();
      const cap = t.autoApproveMaxFixedMinor[currency];
      return (
        typeof minor === "number" &&
        Number.isInteger(minor) &&
        minor > 0 &&
        typeof cap === "number" &&
        minor <= cap
      );
    }
    case "spotlight":
      // No discount artifact at all — content-safe spotlights auto-approve.
      return true;
    case "bogo":
    case "bundle":
      // Structural offers always take staff review.
      return false;
  }
}
