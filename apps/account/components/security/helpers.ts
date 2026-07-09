import type { AccountTrustProfile } from "@/lib/trust";

export type SecurityHeroState = "secure" | "watch" | "risk";

export function computeHeroState(trust: AccountTrustProfile): SecurityHeroState {
  if (trust.signals.suspiciousEvents > 0) return "risk";
  if (
    !trust.signals.emailVerified ||
    trust.signals.verificationStatus === "rejected" ||
    trust.signals.duplicateEmailMatches > 0 ||
    trust.signals.duplicatePhoneMatches > 0 ||
    trust.signals.verificationStatus === "pending"
  ) {
    return "watch";
  }
  return "secure";
}

const STATUS_EYEBROW: Record<SecurityHeroState, string> = {
  secure: "Security & access · secure",
  watch: "Security & access · action recommended",
  risk: "Security & access · risk flagged",
};

const STATUS_HEADLINE: Record<SecurityHeroState, string> = {
  secure: "Your account is secure.",
  watch: "A couple of moves will tighten your account.",
  risk: "We've flagged activity that needs your eyes.",
};

const STATUS_BLURB: Record<SecurityHeroState, string> = {
  secure:
    "No suspicious events, verification is healthy, and every higher-trust action Henry Onyx offers is open to you.",
  watch:
    "Nothing is broken — but a few signals (email confirmation, identity review, duplicate contact match) would lift your trust score and unlock more lanes.",
  risk:
    "Recent events were classified as elevated risk. Review the activity stream below and rotate your password if anything looks unfamiliar.",
};

export function statusEyebrow(state: SecurityHeroState): string {
  return STATUS_EYEBROW[state];
}

export function statusHeadline(state: SecurityHeroState): string {
  return STATUS_HEADLINE[state];
}

export function statusBlurb(state: SecurityHeroState): string {
  return STATUS_BLURB[state];
}

/** Compact stamp — used in hero timestamps. Date instantiation lives in
 * helpers.ts to keep `.tsx` components clean under React 19's
 * `react-hooks/purity` rule. */
const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function formatStamp(iso: string | null | undefined): string {
  if (!iso) return "—";
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "—";
  const d = new Date(ms);
  return `${d.getUTCDate().toString().padStart(2, "0")} ${SHORT_MONTHS[d.getUTCMonth()]} · ${d
    .getUTCHours()
    .toString()
    .padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")}`;
}

export type SignalTone = "good" | "warn" | "risk" | "info" | "neutral";

export function signalToneFromBoolean(value: boolean, falseTone: SignalTone = "risk"): SignalTone {
  return value ? "good" : falseTone;
}
