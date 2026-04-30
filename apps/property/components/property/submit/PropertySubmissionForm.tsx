"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { getAccountUrl } from "@henryco/config";
import { LoaderCircle, ShieldCheck, UploadCloud } from "lucide-react";
import { ButtonPendingContent } from "@henryco/ui";
import { getSharedAccountPropertyUrl } from "@/lib/property/links";
import {
  PROPERTY_MAX_DOCUMENT_FILE_BYTES,
  PROPERTY_MAX_MEDIA_FILE_BYTES,
  getPropertyIntentOptions,
  getPropertySubmissionBlueprint,
  getPropertyServiceTypeTitle,
  type PropertySubmissionFieldSpec,
  type PropertySubmissionUploadSpec,
  type PropertyUploadFieldName,
} from "@/lib/property/submission";
import type {
  PropertyListingIntent,
  PropertyListingServiceType,
} from "@/lib/property/types";

type AreaOption = { id: string; slug: string; name: string };

type Props = {
  areas: AreaOption[];
  defaults: {
    fullName: string;
    email: string;
  };
};

type SubmissionFeedback = {
  listingId: string;
  listingSlug: string;
  listingTitle: string;
  policyStatus: string;
  policySummary: string;
  nextStepLabel: string;
  guidanceHeadline: string;
  guidanceBullets: string[];
  verificationStatus: "none" | "pending" | "verified" | "rejected";
  requiresInspection: boolean;
  requiresEnhancedKyc: boolean;
};

type SubmissionResponse = {
  ok?: boolean;
  error?: string;
  loginUrl?: string;
  message?: string;
  submission?: SubmissionFeedback;
};

const SERVICE_TYPE_OPTIONS: PropertyListingServiceType[] = [
  "rent",
  "sale",
  "shortlet",
  "land",
  "commercial",
  "agent_assisted",
  "inspection_request",
  "managed_property",
  "verified_property",
];

const EMPTY_UPLOAD_COUNTS: Record<PropertyUploadFieldName, number> = {
  media: 0,
  ownership_docs: 0,
  authority_docs: 0,
  management_docs: 0,
  identity_docs: 0,
  supporting_docs: 0,
  inspection_docs: 0,
};

function formatFileLimit(bytes: number) {
  return `${Math.round(bytes / (1024 * 1024))} MB max`;
}

function renderField(spec: PropertySubmissionFieldSpec) {
  const commonClasses =
    spec.kind === "textarea"
      ? "property-textarea mt-2 w-full rounded-2xl px-4 py-3"
      : spec.kind === "select"
        ? "property-select mt-2 w-full rounded-2xl px-4 py-3"
        : "property-input mt-2 w-full rounded-2xl px-4 py-3";

  return (
    <label key={spec.name} className="block">
      <span className="text-sm font-medium text-[var(--property-ink)]">
        {spec.label}
        {spec.required ? " *" : ""}
      </span>
      <span className="mt-1 block text-xs leading-6 text-[var(--property-ink-soft)]">
        {spec.description}
      </span>
      {spec.kind === "textarea" ? (
        <textarea
          name={spec.name}
          rows={4}
          required={spec.required}
          placeholder={spec.placeholder}
          className={commonClasses}
        />
      ) : spec.kind === "select" ? (
        <select name={spec.name} required={spec.required} className={commonClasses} defaultValue="">
          <option value="" disabled>
            Select an option
          </option>
          {(spec.options || []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          name={spec.name}
          type={spec.kind}
          required={spec.required}
          placeholder={spec.placeholder}
          className={commonClasses}
        />
      )}
    </label>
  );
}

function UploadField({
  spec,
  count,
  onCountChange,
}: {
  spec: PropertySubmissionUploadSpec;
  count: number;
  onCountChange: (count: number) => void;
}) {
  return (
    <label className="block rounded-[1.6rem] border border-[var(--property-line)] bg-black/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-[var(--property-ink)]">
            {spec.label}
            {spec.required ? " *" : ""}
          </div>
          <div className="mt-1 text-xs leading-6 text-[var(--property-ink-soft)]">
            {spec.description}
          </div>
        </div>
        <div className="rounded-full border border-[var(--property-line)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--property-ink-soft)]">
          {spec.required ? `${spec.minimumFiles}+ required` : "Optional"}
        </div>
      </div>
      <input
        name={spec.name}
        type="file"
        multiple
        accept={spec.accept}
        className="property-input mt-3 w-full rounded-2xl px-4 py-3"
        onChange={(event) => onCountChange(event.target.files?.length || 0)}
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--property-ink-soft)]">
        <span>
          {count > 0
            ? `${count} file${count === 1 ? "" : "s"} selected`
            : "No files selected yet"}
        </span>
        <span>{formatFileLimit(PROPERTY_MAX_DOCUMENT_FILE_BYTES)}</span>
      </div>
    </label>
  );
}

export function PropertySubmissionForm({ areas, defaults }: Props) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [serviceType, setServiceType] = useState<PropertyListingServiceType>("rent");
  const [intent, setIntent] = useState<PropertyListingIntent>("owner_listed");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [submissionFeedback, setSubmissionFeedback] = useState<SubmissionFeedback | null>(null);
  const [uploadCounts, setUploadCounts] = useState<Record<PropertyUploadFieldName, number>>(
    EMPTY_UPLOAD_COUNTS
  );

  const intentOptions = getPropertyIntentOptions(serviceType);
  const effectiveIntent = intentOptions.includes(intent) ? intent : intentOptions[0];
  const blueprint = getPropertySubmissionBlueprint(serviceType, effectiveIntent);

  function updateUploadCount(field: PropertyUploadFieldName, count: number) {
    setUploadCounts((current) => ({
      ...current,
      [field]: count,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setSubmitting(true);
    setMessage(null);
    setSubmissionFeedback(null);

    try {
      const response = await fetch("/api/property", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "x-henryco-async": "1",
        },
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as SubmissionResponse | null;

      if (response.status === 401 && payload?.loginUrl) {
        window.location.href = payload.loginUrl;
        return;
      }

      if (!response.ok || !payload?.ok || !payload.submission) {
        throw new Error(payload?.error || "Property submission could not be completed.");
      }

      setMessage({
        type: "success",
        text:
          payload.message ||
          "Listing submitted. HenryCo Property queued moderation and trust review.",
      });
      setSubmissionFeedback(payload.submission);
      formRef.current?.reset();
      setServiceType("rent");
      setIntent("owner_listed");
      setUploadCounts(EMPTY_UPLOAD_COUNTS);
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Property submission could not be completed.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      ref={formRef}
      action="/api/property"
      method="POST"
      encType="multipart/form-data"
      onSubmit={(event) => void handleSubmit(event)}
      className="space-y-6"
      data-live-refresh-pause="true"
    >
      <input type="hidden" name="intent" value="listing_submit" />
      <input type="hidden" name="return_to" value="/submit" />
      <input type="hidden" name="service_type" value={serviceType} />
      <input type="hidden" name="listing_intent" value={effectiveIntent} />
      <input type="hidden" name="kind" value={blueprint.kind} />

      <div className="rounded-[1.8rem] border border-[var(--property-line)] bg-black/10 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="text-lg font-semibold text-[var(--property-ink)]">
              {blueprint.serviceTitle} · {blueprint.intentTitle}
            </div>
            <p className="mt-2 text-sm leading-7 text-[var(--property-ink-soft)]">
              {blueprint.reviewHeadline}
            </p>
          </div>
          <div className="rounded-full border border-[rgba(152,179,154,0.35)] bg-[rgba(152,179,154,0.10)] px-4 py-2 text-xs font-semibold tracking-wide text-[var(--property-sage-soft)]">
            {blueprint.requiresInspection ? "Inspection-sensitive" : "Editorial review path"}
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.2rem] border border-[var(--property-line)] bg-black/10 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-soft)]">
              Documents
            </div>
            <div className="mt-2 text-sm text-[var(--property-ink)]">
              {blueprint.docsMin === 0 ? "Optional" : `${blueprint.docsMin}+ expected`}
            </div>
            <div className="mt-1 text-xs leading-6 text-[var(--property-ink-soft)]">
              Direct uploads are preferred over links for authority, identity, and management review.
            </div>
          </div>
          <div className="rounded-[1.2rem] border border-[var(--property-line)] bg-black/10 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-soft)]">
              Media
            </div>
            <div className="mt-2 text-sm text-[var(--property-ink)]">
              {blueprint.mediaMin}+ suggested for strong review
            </div>
            <div className="mt-1 text-xs leading-6 text-[var(--property-ink-soft)]">
              Better media improves approval speed, inspection preparation, and buyer trust.
            </div>
          </div>
          <div className="rounded-[1.2rem] border border-[var(--property-line)] bg-black/10 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-soft)]">
              Eligibility
            </div>
            <div className="mt-2 text-sm text-[var(--property-ink)]">
              {blueprint.requiresVerifiedIdentity ? "Verified identity expected" : "Authority-first"}
            </div>
            <div className="mt-1 text-xs leading-6 text-[var(--property-ink-soft)]">
              {blueprint.eligibilityCopy}
            </div>
          </div>
          <div className="rounded-[1.2rem] border border-[var(--property-line)] bg-black/10 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-soft)]">
              Operating path
            </div>
            <div className="mt-2 text-sm text-[var(--property-ink)]">
              {serviceType === "managed_property" ? "Managed listing" : "Non-managed listing"}
            </div>
            <div className="mt-1 text-xs leading-6 text-[var(--property-ink-soft)]">
              {blueprint.managedTrackCopy}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-[var(--property-ink)]">Service type</span>
          <select
            value={serviceType}
            onChange={(event) => {
              const nextServiceType = event.target.value as PropertyListingServiceType;
              const nextIntentOptions = getPropertyIntentOptions(nextServiceType);
              setServiceType(nextServiceType);
              if (!nextIntentOptions.includes(effectiveIntent)) {
                setIntent(nextIntentOptions[0]);
              }
            }}
            className="property-select mt-2 rounded-2xl px-4 py-3"
          >
            {SERVICE_TYPE_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {getPropertyServiceTypeTitle(value)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-[var(--property-ink)]">Submission mode</span>
          <select
            value={effectiveIntent}
            onChange={(event) => setIntent(event.target.value as PropertyListingIntent)}
            className="property-select mt-2 rounded-2xl px-4 py-3"
          >
            {intentOptions.map((value) => (
              <option key={value} value={value}>
                {getPropertySubmissionBlueprint(serviceType, value).intentTitle}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-[var(--property-ink)]">Owner or agent name</span>
          <input
            name="owner_name"
            required
            defaultValue={defaults.fullName}
            className="property-input mt-2 rounded-2xl px-4 py-3"
            placeholder="Adaeze Okonkwo"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[var(--property-ink)]">Email</span>
          <input
            name="owner_email"
            type="email"
            required
            defaultValue={defaults.email}
            className="property-input mt-2 rounded-2xl px-4 py-3"
            placeholder="owner@company.com"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[var(--property-ink)]">Phone</span>
          <input
            name="owner_phone"
            required
            className="property-input mt-2 rounded-2xl px-4 py-3"
            placeholder="+234..."
          />
        </label>
        <div className="rounded-[1.6rem] border border-[var(--property-line)] bg-black/10 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-soft)]">
            Trust routing
          </div>
          <div className="mt-2 text-sm font-semibold text-[var(--property-ink)]">
            {blueprint.kind.replaceAll("_", " ")} listing
          </div>
          <div className="mt-2 text-xs leading-6 text-[var(--property-ink-soft)]">
            HenryCo keeps this record private first, then decides whether it moves to documents,
            eligibility, inspection, or editorial review.
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-[var(--property-ink)]">Listing title</span>
          <input
            name="title"
            required
            className="property-input mt-2 rounded-2xl px-4 py-3"
            placeholder="Harbour Crest Penthouse"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[var(--property-ink)]">Area</span>
          <select name="location_slug" required className="property-select mt-2 rounded-2xl px-4 py-3">
            {areas.map((area) => (
              <option key={area.id} value={area.slug}>
                {area.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-[var(--property-ink)]">Short summary</span>
          <textarea
            name="summary"
            required
            rows={4}
            className="property-textarea mt-2 rounded-2xl px-4 py-3"
            placeholder="A decisive paragraph that frames the property well."
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[var(--property-ink)]">Description</span>
          <textarea
            name="description"
            required
            rows={4}
            className="property-textarea mt-2 rounded-2xl px-4 py-3"
            placeholder="Explain the space, occupancy reality, access conditions, and what makes the listing serious."
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className="text-sm font-medium text-[var(--property-ink)]">Location label</span>
          <input
            name="location_label"
            required
            className="property-input mt-2 rounded-2xl px-4 py-3"
            placeholder="Ikoyi, Lagos"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[var(--property-ink)]">District</span>
          <input
            name="district"
            required
            className="property-input mt-2 rounded-2xl px-4 py-3"
            placeholder="Bourdillon"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[var(--property-ink)]">Address line</span>
          <input
            name="address_line"
            required
            className="property-input mt-2 rounded-2xl px-4 py-3"
            placeholder="Street name or estate"
          />
        </label>
      </div>

      {blueprint.showPriceFields ? (
        <div className="grid gap-4 md:grid-cols-4">
          <label className="block">
            <span className="text-sm font-medium text-[var(--property-ink)]">Price</span>
            <input
              name="price"
              type="number"
              min="0"
              required
              className="property-input mt-2 rounded-2xl px-4 py-3"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-[var(--property-ink)]">Interval</span>
            <input
              name="price_interval"
              required
              className="property-input mt-2 rounded-2xl px-4 py-3"
              placeholder={serviceType === "shortlet" ? "per night" : "per year"}
            />
          </label>
          {blueprint.showBedrooms ? (
            <label className="block">
              <span className="text-sm font-medium text-[var(--property-ink)]">Beds</span>
              <input
                name="bedrooms"
                type="number"
                min="0"
                className="property-input mt-2 rounded-2xl px-4 py-3"
              />
            </label>
          ) : (
            <div className="hidden md:block" />
          )}
          {blueprint.showBathrooms ? (
            <label className="block">
              <span className="text-sm font-medium text-[var(--property-ink)]">Baths</span>
              <input
                name="bathrooms"
                type="number"
                min="0"
                className="property-input mt-2 rounded-2xl px-4 py-3"
              />
            </label>
          ) : (
            <label className="block">
              <span className="text-sm font-medium text-[var(--property-ink)]">Parking</span>
              <input
                name="parking_spaces"
                type="number"
                min="0"
                className="property-input mt-2 rounded-2xl px-4 py-3"
              />
            </label>
          )}
        </div>
      ) : (
        <div className="rounded-[1.6rem] border border-[var(--property-line)] bg-black/10 p-5 text-sm leading-7 text-[var(--property-ink-soft)]">
          This path is inspection-led rather than publication-led. HenryCo still needs the location,
          authority, and access truth before deciding whether the property can move into a public
          listing workflow.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-[var(--property-ink)]">Amenities</span>
          <textarea
            name="amenities"
            rows={3}
            className="property-textarea mt-2 rounded-2xl px-4 py-3"
            placeholder="Generator, smart security, rooftop terrace..."
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[var(--property-ink)]">Existing media URLs</span>
          <textarea
            name="gallery_urls"
            rows={3}
            className="property-textarea mt-2 rounded-2xl px-4 py-3"
            placeholder="If assets already exist online, add one URL per line."
          />
        </label>
      </div>

      {blueprint.contextFields.length > 0 ? (
        <section className="rounded-[1.8rem] border border-[var(--property-line)] bg-black/10 p-5">
          <div className="text-lg font-semibold text-[var(--property-ink)]">Path-specific details</div>
          <p className="mt-2 text-sm leading-7 text-[var(--property-ink-soft)]">
            Only the details relevant to this listing path are shown below. HenryCo uses them to
            understand authority, occupancy, inspection access, and managed handoff reality.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {blueprint.contextFields.map((field) => renderField(field))}
          </div>
        </section>
      ) : null}

      <section className="rounded-[1.8rem] border border-[var(--property-line)] bg-black/10 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-[var(--property-ink)]">Media and evidence</div>
            <p className="mt-2 text-sm leading-7 text-[var(--property-ink-soft)]">
              Upload the real evidence directly. HenryCo stores review files against the listing so
              staff can assess them without chasing pasted links.
            </p>
          </div>
          <div className="rounded-full border border-[var(--property-line)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--property-ink-soft)]">
            Async upload flow
          </div>
        </div>

        <label className="mt-5 block rounded-[1.6rem] border border-[var(--property-line)] bg-black/10 p-4">
          <div className="flex items-center gap-3 text-[var(--property-accent-strong)]">
            <UploadCloud className="h-5 w-5" />
            <div className="text-sm font-semibold text-[var(--property-ink)]">Property media</div>
          </div>
          <div className="mt-2 text-xs leading-6 text-[var(--property-ink-soft)]">
            Upload photos or image evidence. Clear front, interior, and access images make review
            faster. {formatFileLimit(PROPERTY_MAX_MEDIA_FILE_BYTES)}.
          </div>
          <input
            name="media"
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="property-input mt-3 w-full rounded-2xl px-4 py-3"
            onChange={(event) => updateUploadCount("media", event.target.files?.length || 0)}
          />
          <div className="mt-2 text-xs text-[var(--property-ink-soft)]">
            {uploadCounts.media > 0
              ? `${uploadCounts.media} media file${uploadCounts.media === 1 ? "" : "s"} selected`
              : "No media selected yet"}
          </div>
        </label>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {blueprint.uploadFields.map((spec) => (
            <UploadField
              key={spec.name}
              spec={spec}
              count={uploadCounts[spec.name]}
              onCountChange={(count) => updateUploadCount(spec.name, count)}
            />
          ))}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-[1.8rem] border border-[var(--property-line)] bg-black/10 p-5">
          <div className="text-lg font-semibold text-[var(--property-ink)]">HenryCo checks</div>
          <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--property-ink-soft)]">
            {blueprint.moderationChecks.map((item) => (
              <p key={item}>• {item}</p>
            ))}
          </div>
        </section>

        <section className="rounded-[1.8rem] border border-[var(--property-line)] bg-black/10 p-5">
          <div className="flex items-center gap-3 text-[var(--property-accent-strong)]">
            <ShieldCheck className="h-5 w-5" />
            <div className="text-lg font-semibold text-[var(--property-ink)]">What happens next</div>
          </div>
          <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--property-ink-soft)]">
            {blueprint.userChecklist.map((item) => (
              <p key={item}>• {item}</p>
            ))}
          </div>
        </section>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-[var(--property-ink-soft)]">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" name="furnished" value="1" />
          Furnished
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" name="pet_friendly" value="1" />
          Pet friendly
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" name="shortlet_ready" value="1" />
          Short-let ready
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" name="managed_by_henryco" value="1" />
          Request HenryCo management
        </label>
      </div>

      {message ? (
        <div
          className={`rounded-[1.6rem] border px-5 py-4 text-sm leading-7 ${
            message.type === "success"
              ? "border-[rgba(152,179,154,0.3)] bg-[rgba(152,179,154,0.12)] text-[var(--property-sage-soft)]"
              : "border-[rgba(201,110,93,0.3)] bg-[rgba(201,110,93,0.12)] text-[var(--property-alert)]"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      {submissionFeedback ? (
        <div className="rounded-[1.8rem] border border-[var(--property-line)] bg-black/10 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-soft)]">
                Live policy result
              </div>
              <div className="mt-2 text-lg font-semibold text-[var(--property-ink)]">
                {submissionFeedback.guidanceHeadline}
              </div>
              <p className="mt-2 text-sm leading-7 text-[var(--property-ink-soft)]">
                {submissionFeedback.policySummary}
              </p>
            </div>
            <div className="rounded-full border border-[var(--property-line)] bg-black/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--property-ink)]">
              {submissionFeedback.policyStatus.replaceAll("_", " ")}
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {submissionFeedback.guidanceBullets.map((item) => (
              <div
                key={item}
                className="rounded-[1.2rem] border border-[var(--property-line)] bg-black/10 px-4 py-4 text-sm leading-7 text-[var(--property-ink-soft)]"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={getSharedAccountPropertyUrl("listings")}
              className="property-button-primary inline-flex rounded-full px-5 py-3 text-sm font-semibold"
            >
              Open property account
            </Link>
            {submissionFeedback.verificationStatus !== "verified" ? (
              <Link
                href={getAccountUrl("/verification")}
                className="property-button-secondary inline-flex rounded-full px-5 py-3 text-sm font-semibold"
              >
                Open account verification
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      {message ? (
        <div
          className={`rounded-[1.6rem] border px-5 py-4 text-sm leading-7 ${
            message.type === "success"
              ? "border-[rgba(152,179,154,0.3)] bg-[rgba(152,179,154,0.12)] text-[var(--property-sage-soft)]"
              : "border-[rgba(201,110,93,0.3)] bg-[rgba(201,110,93,0.12)] text-[var(--property-alert)]"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      {submissionFeedback ? (
        <div className="rounded-[1.6rem] border border-[var(--property-line)] bg-black/10 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-soft)]">
                Live policy result
              </div>
              <div className="mt-2 text-lg font-semibold text-[var(--property-ink)]">
                {submissionFeedback.guidanceHeadline}
              </div>
              <p className="mt-2 text-sm leading-7 text-[var(--property-ink-soft)]">
                {submissionFeedback.policySummary}
              </p>
            </div>
            <div className="rounded-full border border-[var(--property-line)] bg-black/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--property-ink)]">
              {submissionFeedback.policyStatus.replaceAll("_", " ")}
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {submissionFeedback.guidanceBullets.map((item) => (
              <div
                key={item}
                className="rounded-[1.2rem] border border-[var(--property-line)] bg-black/10 px-4 py-4 text-sm leading-7 text-[var(--property-ink-soft)]"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={getSharedAccountPropertyUrl("listings")}
              className="property-button-primary inline-flex rounded-full px-5 py-3 text-sm font-semibold"
            >
              Open property account
            </Link>
            {submissionFeedback.verificationStatus !== "verified" ? (
              <Link
                href={getAccountUrl("/verification")}
                className="property-button-secondary inline-flex rounded-full px-5 py-3 text-sm font-semibold"
              >
                Open account verification
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          aria-busy={submitting}
          className="property-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--property-accent-strong)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1c120d] active:translate-y-[0.5px] disabled:cursor-wait disabled:opacity-80 disabled:active:translate-y-0"
        >
          <ButtonPendingContent
            pending={submitting}
            pendingLabel="Submitting listing..."
            spinnerLabel="Submitting property listing"
          >
            Submit listing
          </ButtonPendingContent>
        </button>
        <Link
          href={getSharedAccountPropertyUrl("listings")}
          className="property-button-secondary inline-flex rounded-full px-5 py-3 text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--property-accent-strong)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1c120d] active:translate-y-[0.5px]"
        >
          Open property account
        </Link>
        {submitting ? (
          <span className="inline-flex items-center gap-2 text-xs text-[var(--property-ink-soft)]">
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            Uploading media and trust files without leaving the page
          </span>
        ) : null}
      </div>
    </form>
  );
}
