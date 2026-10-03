// V3-MKT-TRUST-01 — turning a verdict into words. PURE.
//
// The gate speaks in codes; the seller reads sentences. This is the one place
// the two meet: a reason code is looked up in the typed copy for the request's
// locale and its placeholders are filled from the store's real numbers. Nothing
// here invents text — an unknown code is dropped, never echoed.

import { COMPANY, toBrandName } from "@henryco/config";
import {
  formatMarketplaceTrustTemplate,
  getMarketplaceTrustCopy,
  type AppLocale,
  type MarketplaceTrustCopy,
  type MarketplaceTrustReasonKey,
} from "@henryco/i18n/server";
import { formatVendorMoney } from "../vendor/money";
import { blockingReasons, isGateReasonCode, type GateOutcome, type GateReasonCode } from "./reasons";
import type { ProbationCaps } from "./seller-state";

export interface GateNotice {
  title: string;
  body: string;
  tone: "success" | "info" | "error";
}

export function trustBrand(): string {
  return toBrandName(COMPANY.group.name);
}

/** Placeholder values for one reason, from the caps the database reported. */
function paramsFor(
  code: GateReasonCode,
  caps: ProbationCaps | null,
  locale: AppLocale,
): Record<string, string | number> {
  const params: Record<string, string | number> = { brand: trustBrand() };
  if (!caps) return params;
  if (code === "probation_listing_cap") params.cap = caps.maxLiveListings;
  if (code === "probation_daily_cap") params.cap = caps.maxNewListingsPerDay;
  // Listing prices are whole naira; the formatter takes kobo.
  if (code === "probation_price_cap") params.amount = formatVendorMoney(caps.maxPrice * 100, locale);
  return params;
}

export interface DescribedReason {
  code: GateReasonCode;
  label: string;
  fix: string;
}

/** Localized label + next step for each code, in the gate's stable order. */
export function describeReasons(input: {
  reasons: ReadonlyArray<string>;
  caps: ProbationCaps | null;
  locale: AppLocale;
  copy?: MarketplaceTrustCopy;
  /** Include signal-class codes (advice). Off by default: they are not problems. */
  includeSignals?: boolean;
}): DescribedReason[] {
  const copy = input.copy ?? getMarketplaceTrustCopy(input.locale);
  const known = input.reasons.filter(isGateReasonCode);
  const ordered = input.includeSignals
    ? [...blockingReasons(known), ...known.filter((code) => !blockingReasons(known).includes(code))]
    : blockingReasons(known);
  return ordered.map((code) => {
    const entry = copy.reasons[code as MarketplaceTrustReasonKey];
    const params = paramsFor(code, input.caps, input.locale);
    return {
      code,
      label: formatMarketplaceTrustTemplate(entry.label, params),
      fix: formatMarketplaceTrustTemplate(entry.fix, params),
    };
  });
}

/** The toast/banner a seller sees after pressing Publish. */
export function gateNotice(input: {
  locale: AppLocale;
  outcome: GateOutcome;
  reasons: ReadonlyArray<string>;
  /** The listing was already live and this was an edit. */
  liveEdit: boolean;
  /** The edit was not applied and the previous version is still live. */
  keptLive?: boolean;
  caps: ProbationCaps | null;
}): GateNotice {
  const copy = getMarketplaceTrustCopy(input.locale);
  if (input.outcome === "publish") {
    return input.liveEdit
      ? { title: copy.result.updatedTitle, body: copy.result.updatedBody, tone: "success" }
      : { title: copy.result.publishedTitle, body: copy.result.publishedBody, tone: "success" };
  }

  const described = describeReasons({ reasons: input.reasons, caps: input.caps, locale: input.locale, copy });
  // A hold names what is being checked; a refusal names what to change.
  const reasons =
    input.outcome === "hold"
      ? described.map((reason) => reason.label).join(copy.result.reasonSeparator)
      : described.map((reason) => reason.fix).join(" ");

  if (input.keptLive) {
    return {
      title: copy.result.keptLiveTitle,
      body: formatMarketplaceTrustTemplate(
        input.outcome === "hold" ? copy.result.keptLiveHeldBody : copy.result.keptLiveRejectedBody,
        { reasons },
      ),
      tone: "error",
    };
  }
  if (input.outcome === "hold") {
    return {
      title: copy.result.heldTitle,
      body: formatMarketplaceTrustTemplate(copy.result.heldBody, { reasons }),
      tone: "info",
    };
  }
  return {
    title: copy.result.rejectedTitle,
    body: formatMarketplaceTrustTemplate(copy.result.rejectedBody, { reasons }),
    tone: "error",
  };
}
