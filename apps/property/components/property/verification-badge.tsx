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
 *   - "Verified property" — listing is in approved/published AND carries
 *     a verification trust badge.
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
    summary: string;
    Icon: React.ComponentType<{ className?: string }>;
    tone: string;
  }
> = {
  verified: {
    label: "Verified property",
    summary:
      "HenryCo has verified ownership, documents, and access. The listing carries the full trust posture before publication.",
    Icon: ShieldCheck,
    tone: "text-[var(--property-accent-strong)]",
  },
  managed: {
    label: "Managed by HenryCo",
    summary:
      "Operations sit with HenryCo after move-in. Viewings, screening, and maintenance run on the same audit ledger as marketing.",
    Icon: ClipboardCheck,
    tone: "text-[var(--property-sage-soft)]",
  },
  in_review: {
    label: "Under review",
    summary:
      "The trust pipeline is active. Documents, eligibility, or inspection are still being reconciled before this listing can publish.",
    Icon: TimerReset,
    tone: "text-[var(--property-ink-soft)]",
  },
  submission: {
    label: "Submission stage",
    summary:
      "Editorial review has not started yet. Owner-facing surfaces show this badge until the listing enters the moderation queue.",
    Icon: ShieldQuestion,
    tone: "text-[var(--property-ink-muted)]",
  },
};

export function PropertyVerificationBadge({
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
    <section
      aria-labelledby="property-verification-badge"
      className="border-l-2 border-[var(--property-line)] pl-4"
    >
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center gap-2 rounded-full border border-[var(--property-line)] px-3 py-1 text-[11.5px] font-semibold uppercase tracking-[0.2em] ${copy.tone}`}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden />
          {t(copy.label)}
        </span>
        <Link
          href="/trust"
          className="text-[12px] font-semibold text-[var(--property-accent-strong)] underline-offset-4 transition hover:underline"
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
      <p className="mt-3 max-w-md text-[13.5px] leading-7 text-[var(--property-ink-soft)]">
        {t(copy.summary)}
      </p>
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
      className={`inline-flex items-center gap-1.5 rounded-full border border-[var(--property-line)] bg-black/15 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] ${copy.tone}`}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {t(copy.label)}
    </span>
  );
}
