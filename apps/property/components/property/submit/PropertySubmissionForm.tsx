"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getAccountUrl } from "@henryco/config";
import { LoaderCircle } from "lucide-react";
import { ButtonPendingContent } from "@henryco/ui";
import { getSharedAccountPropertyUrl } from "@/lib/property/links";

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

type ServiceType =
  | "rent"
  | "sale"
  | "shortlet"
  | "land"
  | "commercial"
  | "agent_assisted"
  | "inspection_request"
  | "managed_property"
  | "verified_property";

type Intent =
  | "owner_listed"
  | "agent_listed"
  | "agent_assisted"
  | "inspection_request"
  | "managed_property"
  | "verified_property";

function requiredForService(serviceType: ServiceType) {
  switch (serviceType) {
    case "sale":
    case "land":
    case "commercial":
    case "managed_property":
    case "verified_property":
      return { docsMin: 2, mediaMin: 6, inspectionLikely: true };
    case "shortlet":
      return { docsMin: 1, mediaMin: 8, inspectionLikely: true };
    case "inspection_request":
      return { docsMin: 0, mediaMin: 0, inspectionLikely: true };
    case "agent_assisted":
      return { docsMin: 1, mediaMin: 5, inspectionLikely: false };
    case "rent":
    default:
      return { docsMin: 1, mediaMin: 5, inspectionLikely: false };
  }
}

function kindForService(serviceType: ServiceType) {
  switch (serviceType) {
    case "shortlet":
      return "shortlet";
    case "commercial":
      return "commercial";
    case "managed_property":
      return "managed";
    case "sale":
      return "sale";
    case "land":
      return "land";
    case "rent":
    case "agent_assisted":
    case "verified_property":
    case "inspection_request":
    default:
      return "rent";
  }
}

function titleForService(serviceType: ServiceType) {
  switch (serviceType) {
    case "rent":
      return "Residential rent";
    case "sale":
      return "Residential sale";
    case "shortlet":
      return "Short-let";
    case "land":
      return "Land";
    case "commercial":
      return "Commercial";
    case "agent_assisted":
      return "Agent-assisted listing";
    case "inspection_request":
      return "Inspection request";
    case "managed_property":
      return "Managed property (HenryCo ops)";
    case "verified_property":
      return "Verified property (trust badge)";
    default:
      return serviceType;
  }
}

function intentLabel(intent: Intent) {
  switch (intent) {
    case "owner_listed":
      return "Owner-listed";
    case "agent_listed":
      return "Agent-listed";
    case "agent_assisted":
      return "Agent-assisted (HenryCo support)";
    case "inspection_request":
      return "Inspection request";
    case "managed_property":
      return "Managed property";
    case "verified_property":
      return "Verified property";
    default:
      return intent;
  }
}

export function PropertySubmissionForm({ areas, defaults }: Props) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [serviceType, setServiceType] = useState<ServiceType>("rent");
  const [intent, setIntent] = useState<Intent>("owner_listed");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [submissionFeedback, setSubmissionFeedback] = useState<SubmissionFeedback | null>(null);
  const [selectedMediaCount, setSelectedMediaCount] = useState(0);
  const [selectedVerificationCount, setSelectedVerificationCount] = useState(0);

  const requirements = useMemo(() => requiredForService(serviceType), [serviceType]);
  const computedKind = useMemo(() => kindForService(serviceType), [serviceType]);

  const intentOptions: Intent[] = useMemo(() => {
    if (serviceType === "inspection_request") return ["inspection_request"];
    if (serviceType === "managed_property") return ["managed_property", "owner_listed", "agent_listed"];
    if (serviceType === "verified_property") return ["verified_property", "owner_listed", "agent_listed"];
    if (serviceType === "agent_assisted") return ["agent_assisted", "owner_listed", "agent_listed"];
    return ["owner_listed", "agent_listed", "agent_assisted"];
  }, [serviceType]);

  useEffect(() => {
    if (!intentOptions.includes(intent)) {
      setIntent(intentOptions[0]);
    }
  }, [intent, intentOptions]);

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

      const payload = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            error?: string;
            message?: string;
            submission?: SubmissionFeedback;
          }
        | null;

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
      setSelectedMediaCount(0);
      setSelectedVerificationCount(0);
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
      className="space-y-5"
      data-live-refresh-pause="true"
    >
      <input type="hidden" name="intent" value="listing_submit" />
      <input type="hidden" name="return_to" value="/submit" />

      <input type="hidden" name="service_type" value={serviceType} />
      <input type="hidden" name="listing_intent" value={intent} />
      <input type="hidden" name="kind" value={computedKind} />

      <div className="rounded-[1.6rem] border border-[var(--property-line)] bg-black/10 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-[var(--property-ink)]">Submission guidance</div>
            <p className="mt-1 text-sm leading-7 text-[var(--property-ink-soft)]">
              HenryCo reviews every submission before it goes live. Higher-risk listing types can require
              stronger documents, eligibility checks, or a physical inspection.
            </p>
          </div>
          <div className="rounded-full border border-[rgba(152,179,154,0.35)] bg-[rgba(152,179,154,0.10)] px-4 py-2 text-xs font-semibold tracking-wide text-[var(--property-sage-soft)]">
            {requirements.inspectionLikely ? "Inspection possible" : "Review first"}
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-[1.2rem] border border-[var(--property-line)] bg-black/10 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-soft)]">
              Documents
            </div>
            <div className="mt-2 text-sm text-[var(--property-ink)]">
              {requirements.docsMin === 0 ? "Optional" : `${requirements.docsMin}+ required`}
            </div>
            <div className="mt-1 text-xs text-[var(--property-ink-soft)]">
              Proof of ownership, agent mandate, or corporate lease docs.
            </div>
          </div>
          <div className="rounded-[1.2rem] border border-[var(--property-line)] bg-black/10 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-soft)]">
              Media
            </div>
            <div className="mt-2 text-sm text-[var(--property-ink)]">
              {requirements.mediaMin === 0 ? "Optional" : `${requirements.mediaMin}+ recommended`}
            </div>
            <div className="mt-1 text-xs text-[var(--property-ink-soft)]">
              Clear photos and a calm sequence improve approval speed.
            </div>
          </div>
          <div className="rounded-[1.2rem] border border-[var(--property-line)] bg-black/10 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-soft)]">
              Eligibility
            </div>
            <div className="mt-2 text-sm text-[var(--property-ink)]">Wallet floor, inspection, or approved identity</div>
            <div className="mt-1 text-xs text-[var(--property-ink-soft)]">
              Higher-risk listings can pause in eligibility review until account verification or inspection truth is in place.
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-[var(--property-ink)]">Service type</span>
          <select
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value as ServiceType)}
            className="property-select mt-2 rounded-2xl px-4 py-3"
          >
            {(
              [
                "rent",
                "sale",
                "shortlet",
                "land",
                "commercial",
                "agent_assisted",
                "inspection_request",
                "managed_property",
                "verified_property",
              ] as ServiceType[]
            ).map((value) => (
              <option key={value} value={value}>
                {titleForService(value)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-[var(--property-ink)]">Submission mode</span>
          <select
            value={intent}
            onChange={(e) => setIntent(e.target.value as Intent)}
            className="property-select mt-2 rounded-2xl px-4 py-3"
          >
            {intentOptions.map((value) => (
              <option key={value} value={value}>
                {intentLabel(value)}
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
            System routing
          </div>
          <div className="mt-2 text-sm text-[var(--property-ink)]">
            {titleForService(serviceType)}
          </div>
          <div className="mt-1 text-xs text-[var(--property-ink-soft)]">
            Stored as kind: <span className="font-semibold text-[var(--property-ink)]">{computedKind}</span>
          </div>
        </div>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-[var(--property-ink)]">Listing title</span>
        <input
          name="title"
          required
          className="property-input mt-2 rounded-2xl px-4 py-3"
          placeholder="Harbour Crest Penthouse"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-[var(--property-ink)]">Short summary</span>
          <textarea
            name="summary"
            required
            rows={4}
            className="property-textarea mt-2 rounded-2xl px-4 py-3"
            placeholder="One decisive paragraph that frames the property well."
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[var(--property-ink)]">Description</span>
          <textarea
            name="description"
            required
            rows={4}
            className="property-textarea mt-2 rounded-2xl px-4 py-3"
            placeholder="Tell HenryCo what matters about the space, occupancy fit, and readiness."
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
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
      </div>

      <label className="block">
        <span className="text-sm font-medium text-[var(--property-ink)]">Address line</span>
        <input
          name="address_line"
          required
          className="property-input mt-2 rounded-2xl px-4 py-3"
          placeholder="Street name or estate"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-4">
        <label className="block">
          <span className="text-sm font-medium text-[var(--property-ink)]">Price</span>
          <input
            name="price"
            type="number"
            min="0"
            required={serviceType !== "inspection_request"}
            className="property-input mt-2 rounded-2xl px-4 py-3"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[var(--property-ink)]">Interval</span>
          <input
            name="price_interval"
            required={serviceType !== "inspection_request"}
            className="property-input mt-2 rounded-2xl px-4 py-3"
            placeholder={serviceType === "shortlet" ? "per night" : "per year"}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[var(--property-ink)]">Beds</span>
          <input
            name="bedrooms"
            type="number"
            min="0"
            className="property-input mt-2 rounded-2xl px-4 py-3"
            disabled={serviceType === "commercial" || serviceType === "land" || serviceType === "inspection_request"}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[var(--property-ink)]">Baths</span>
          <input
            name="bathrooms"
            type="number"
            min="0"
            className="property-input mt-2 rounded-2xl px-4 py-3"
            disabled={serviceType === "land" || serviceType === "inspection_request"}
          />
        </label>
      </div>

      {serviceType === "land" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-[var(--property-ink)]">Plot size (sqm)</span>
            <input name="size_sqm" type="number" min="0" className="property-input mt-2 rounded-2xl px-4 py-3" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-[var(--property-ink)]">Title status (optional)</span>
            <input
              name="title_status"
              className="property-input mt-2 rounded-2xl px-4 py-3"
              placeholder="C of O, Governor's consent, excision..."
            />
          </label>
        </div>
      ) : null}

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
            placeholder="One URL per line if assets already exist online."
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-[var(--property-ink)]">Upload media</span>
          <input
            name="media"
            type="file"
            multiple
            accept="image/*"
            className="property-input mt-2 rounded-2xl px-4 py-3"
            onChange={(event) => setSelectedMediaCount(event.target.files?.length || 0)}
          />
          {selectedMediaCount > 0 ? (
            <p className="mt-2 text-xs text-[var(--property-ink-soft)]">
              {selectedMediaCount} media file{selectedMediaCount === 1 ? "" : "s"} ready for upload.
            </p>
          ) : null}
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[var(--property-ink)]">Verification documents</span>
          <input
            name="verification_docs"
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            className="property-input mt-2 rounded-2xl px-4 py-3"
            onChange={(event) => setSelectedVerificationCount(event.target.files?.length || 0)}
          />
          {selectedVerificationCount > 0 ? (
            <p className="mt-2 text-xs text-[var(--property-ink-soft)]">
              {selectedVerificationCount} verification file
              {selectedVerificationCount === 1 ? "" : "s"} ready for trust review.
            </p>
          ) : null}
        </label>
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

      <div className="rounded-[1.6rem] border border-[var(--property-line)] bg-black/10 p-5 text-sm leading-7 text-[var(--property-ink-soft)]">
        <div className="text-[var(--property-ink)] font-semibold">What happens next</div>
        <ul className="mt-2 list-disc pl-5">
          <li>We create a private submission record and attach your documents and media.</li>
          <li>Policy checks determine whether documents, eligibility, or inspection must happen before publication.</li>
          <li>Our moderators review copy, pricing clarity, and readiness before approving a public listing.</li>
        </ul>
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
          className="property-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-wait disabled:opacity-80"
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
          className="property-button-secondary inline-flex rounded-full px-5 py-3 text-sm font-semibold"
        >
          Open property account
        </Link>
        {submitting ? (
          <span className="inline-flex items-center gap-2 text-xs text-[var(--property-ink-soft)]">
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            Uploading media and verification files without leaving the page
          </span>
        ) : null}
      </div>
    </form>
  );
}
