import Link from "next/link";
import {
  ClipboardCheck,
  ShieldCheck,
  ShieldQuestion,
  TimerReset,
} from "lucide-react";
import { translateSurfaceLabel, type AppLocale } from "@henryco/i18n";
import type {
  PropertyListing,
  PropertyListingStatus,
} from "@/lib/property/types";

/**
 * V3 PASS 21 — Verification badge surfacing.
 *
 * Pulls signal from the documented verification state model
 * (/docs/property-verification-state-model.md) and renders one of four
 * editorial badges on a listing detail page:
 *
 *   - "Reviewed by Henry Onyx" — listing is in approved/published AND carries
 *     a verification trust badge. (COPY-RESET: the label claims only the
 *     staff publication review; no ownership/document check backs a
 *     "verified" claim — see docs/copy-audit/recon/claims-truth-map.md P1.)
 *   - "Managed by HenryCo" — listing has managedByHenryCo = true.
 *   - "Under review" — listing is in any review/inspection state.
 *   - "Submission stage" — listing is in draft/submitted/changes_requested.
 *
 * Each badge is a small editorial pill (no panel chrome) with a link to
 * the trust explainer.
 */

type VerificationVariant = "verified" | "managed" | "in_review" | "submission";

function classifyListing(
  listing: Pick<PropertyListing, "status" | "managedByHenryCo" | "trustBadges">
): VerificationVariant {
  if (listing.managedByHenryCo) return "managed";
  const verifiedBadge = listing.trustBadges.some((badge) => /verif/i.test(badge));
  if (verifiedBadge && (listing.status === "approved" || listing.status === "published")) {
    return "verified";
  }
  if (isReviewStatus(listing.status)) return "in_review";
  return "submission";
}

function isReviewStatus(status: PropertyListingStatus): boolean {
  return [
    "submitted",
    "awaiting_documents",
    "awaiting_eligibility",
    "inspection_requested",
    "inspection_scheduled",
    "under_review",
    "requires_correction",
    "changes_requested",
    "escalated",
  ].includes(status);
}

const COPY: Record<
  VerificationVariant,
  {
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
    tone: string;
  }
> = {
  verified: {
    label: "Reviewed by Henry Onyx",
    Icon: ShieldCheck,
    tone: "text-[var(--home-accent-text)]",
  },
  managed: {
    label: "Managed by Henry Onyx",
    Icon: ClipboardCheck,
    tone: "text-[var(--property-sage-soft)]",
  },
  in_review: {
    label: "Under review",
    Icon: TimerReset,
    tone: "text-[var(--property-ink-soft)]",
  },
  submission: {
    label: "Submission stage",
    Icon: ShieldQuestion,
    tone: "text-[var(--property-ink-muted)]",
  },
};

export function PropertyVerificationBadge({
  listing,
  locale = "en",
}: {
  listing: Pick<PropertyListing, "status" | "managedByHenryCo" | "trustBadges" | "henryOnyxVerified">;
  locale?: AppLocale;
}) {
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const variant = classifyListing(listing);
  const copy = COPY[variant];
  const Icon = copy.Icon;

  return (
    <section
      aria-labelledby="property-verification-badge"
      className="border-l-2 border-[var(--property-line)] pl-4"
    >
      <div className="flex flex-wrap items-center gap-3">
        {listing.henryOnyxVerified ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--home-accent-line,var(--property-line))] px-3 py-1 text-[11.5px] font-semibold uppercase tracking-[0.2em] text-[var(--home-accent-text)]">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            {t("Henry Onyx Verified")}
          </span>
        ) : null}
        <span
          className={`inline-flex items-center gap-2 rounded-full border border-[var(--property-line)] px-3 py-1 text-[11.5px] font-semibold uppercase tracking-[0.2em] ${copy.tone}`}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden />
          {t(copy.label)}
        </span>
        <Link
          href="/trust"
          className="text-[12px] font-semibold text-[var(--home-accent-text)] underline-offset-4 transition hover:underline"
        >
          {t("What this means")}
        </Link>
      </div>
      <h2
        id="property-verification-badge"
        className="sr-only"
      >
        {t("Property verification posture")}
      </h2>
      {listing.trustBadges.length > 0 && variant !== "submission" ? (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {listing.trustBadges.slice(0, 4).map((badge) => (
            <li
              key={badge}
              className="rounded-full border border-[var(--property-line)] px-2 py-0.5 text-[10.5px] font-medium tracking-[0.12em] text-[var(--property-ink-soft)]"
            >
              {t(badge)}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function PropertyVerificationBadgePill({
  listing,
  locale = "en",
}: {
  listing: Pick<PropertyListing, "status" | "managedByHenryCo" | "trustBadges">;
  locale?: AppLocale;
}) {
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const variant = classifyListing(listing);
  const copy = COPY[variant];
  const Icon = copy.Icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-[color:var(--home-line)] bg-[color:var(--home-surface-04)] px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] ${copy.tone}`}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {t(copy.label)}
    </span>
  );
}
