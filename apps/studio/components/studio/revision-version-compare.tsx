"use client";

import { useState } from "react";

import { getStudioCopy } from "@henryco/i18n";
import type { AppLocale } from "@henryco/i18n";

export type RevisionVersion = {
  version: number;
  status: string;
  beforePublicId: string | null;
  afterPublicId: string | null;
  summary: string;
  reviewerNotes?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
};

export type RevisionVersionCompareProps = {
  versions: RevisionVersion[];
  locale?: AppLocale;
  cloudinaryCloudName?: string | null;
};

function buildCloudinaryUrl(publicId: string | null, cloudName: string | null | undefined): string | null {
  if (!publicId || !cloudName) return null;
  const safeId = publicId.startsWith("http") ? publicId : `image/upload/${publicId}`;
  if (safeId.startsWith("http")) return safeId;
  return `https://res.cloudinary.com/${cloudName}/${safeId}`;
}

/**
 * V3 PASS 21 — <RevisionVersionCompare>.
 *
 * Side-by-side before/after panel for a revision cycle. Driven by the
 * studio_revisions.version + before_public_id + after_public_id fields.
 * When no after exists yet (open / in-review), the right panel shows
 * an empty state. Image hover shows status pill.
 */
export function RevisionVersionCompare({
  versions,
  locale = "en",
  cloudinaryCloudName = null,
}: RevisionVersionCompareProps) {
  const copy = getStudioCopy(locale);
  const [activeVersion, setActiveVersion] = useState<number>(
    versions[0]?.version ?? 1
  );
  const active = versions.find((v) => v.version === activeVersion) ?? versions[0];

  if (!active) {
    return (
      <div className="rounded-2xl border border-[color:var(--hc-line)] bg-[color:var(--hc-paper-elev)] p-8 text-center">
        <p className="hc-body-muted">{copy.revisions.emptyTitle}</p>
        <p className="hc-body-muted mt-1 text-xs">{copy.revisions.emptyBody}</p>
      </div>
    );
  }

  const beforeUrl = buildCloudinaryUrl(active.beforePublicId, cloudinaryCloudName);
  const afterUrl = buildCloudinaryUrl(active.afterPublicId, cloudinaryCloudName);
  const statusLabel =
    active.status === "approved"
      ? copy.revisions.statusApproved
      : active.status === "rejected"
        ? copy.revisions.statusRejected
        : active.status === "review"
          ? copy.revisions.statusReview
          : copy.revisions.statusOpen;

  return (
    <section
      className="rounded-2xl border border-[color:var(--hc-line)] bg-[color:var(--hc-paper-elev)] p-5"
      data-testid="revision-version-compare"
    >
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="hc-kicker">{copy.revisions.versionCompareTitle}</p>
          <h3 className="hc-heading-3 mt-1">
            {copy.revisions.versionLabel} {active.version}
          </h3>
        </div>
        <span
          className="rounded-full border border-[color:var(--hc-line)] bg-[color:var(--hc-paper)] px-3 py-1 text-xs font-semibold text-[color:var(--hc-ink-soft)]"
          data-status={active.status}
        >
          {statusLabel}
        </span>
      </header>

      {versions.length > 1 ? (
        <nav className="mb-4 flex flex-wrap gap-2" aria-label="Versions">
          {versions.map((v) => {
            const isActive = v.version === activeVersion;
            return (
              <button
                key={v.version}
                type="button"
                onClick={() => setActiveVersion(v.version)}
                data-active={isActive}
                className="rounded-full border border-[color:var(--hc-line)] bg-[color:var(--hc-paper)] px-3 py-1 text-xs font-medium text-[color:var(--hc-ink)] data-[active=true]:border-[color:var(--hc-accent)] data-[active=true]:bg-[color:var(--hc-accent-soft)] data-[active=true]:text-[color:var(--hc-accent-text)]"
              >
                v{v.version}
              </button>
            );
          })}
        </nav>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <figure className="rounded-xl border border-[color:var(--hc-line)] bg-[color:var(--hc-paper)] p-3">
          <figcaption className="hc-label mb-2">
            {copy.revisions.versionCompareBefore}
          </figcaption>
          {beforeUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={beforeUrl}
              alt={copy.revisions.versionCompareBefore}
              className="w-full rounded-md object-contain"
              loading="lazy"
            />
          ) : (
            <p className="hc-body-muted py-12 text-center text-xs">—</p>
          )}
        </figure>
        <figure className="rounded-xl border border-[color:var(--hc-line)] bg-[color:var(--hc-paper)] p-3">
          <figcaption className="hc-label mb-2">
            {copy.revisions.versionCompareAfter}
          </figcaption>
          {afterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={afterUrl}
              alt={copy.revisions.versionCompareAfter}
              className="w-full rounded-md object-contain"
              loading="lazy"
            />
          ) : (
            <p className="hc-body-muted py-12 text-center text-xs">—</p>
          )}
        </figure>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="hc-label">{copy.revisions.summaryLabel}</dt>
          <dd className="hc-body mt-1 whitespace-pre-line">{active.summary}</dd>
        </div>
        {active.reviewerNotes ? (
          <div>
            <dt className="hc-label">{copy.revisions.reviewerNotesLabel}</dt>
            <dd className="hc-body mt-1 whitespace-pre-line">{active.reviewerNotes}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
