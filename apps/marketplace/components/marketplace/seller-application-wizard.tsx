"use client";

import Link from "next/link";
import { startTransition, useEffect, useMemo, useState } from "react";
import { CheckCircle2, FileCheck2, ShieldCheck, UploadCloud } from "lucide-react";
import { HenryCoActivityIndicator } from "@henryco/ui";
import { useMarketplaceRuntime } from "@/components/marketplace/runtime-provider";
import type {
  MarketplaceSellerDocumentRecord,
  MarketplaceVendorApplication,
} from "@/lib/marketplace/types";

type SellerWizardStep = "start" | "verification" | "review";

type SellerApplicationWizardProps = {
  step: SellerWizardStep;
  initialApplication: MarketplaceVendorApplication | null;
};

type FormState = {
  storeName: string;
  storeSlug: string;
  legalName: string;
  phone: string;
  categoryFocus: string;
  story: string;
  documents: Record<string, MarketplaceSellerDocumentRecord>;
  agreementAccepted: boolean;
};

type DocumentKey = "businessRegistration" | "founderIdentity" | "payoutProof";

const stepOrder: SellerWizardStep[] = ["start", "verification", "review"];

const documentRequirements: Array<{
  key: DocumentKey;
  label: string;
  help: string;
  required: boolean;
}> = [
  {
    key: "businessRegistration",
    label: "Business registration or operating proof",
    help: "Recommended. This accelerates approval for registered entities and reduces follow-up.",
    required: false,
  },
  {
    key: "founderIdentity",
    label: "Founder identity / KYC document",
    help: "Required before trust review can close. Upload a clear government-issued ID or approved KYC file.",
    required: true,
  },
  {
    key: "payoutProof",
    label: "Payout account proof",
    help: "Required before payout-sensitive seller permissions can unlock.",
    required: true,
  },
];

function nextStep(step: SellerWizardStep) {
  return stepOrder[Math.min(stepOrder.indexOf(step) + 1, stepOrder.length - 1)];
}

function previousStep(step: SellerWizardStep) {
  return stepOrder[Math.max(stepOrder.indexOf(step) - 1, 0)];
}

function normalizeDocuments(
  draftDocuments: unknown,
  fallbackDocuments: Record<string, MarketplaceSellerDocumentRecord> | undefined
) {
  const source =
    draftDocuments && typeof draftDocuments === "object" && !Array.isArray(draftDocuments)
      ? (draftDocuments as Record<string, unknown>)
      : fallbackDocuments || {};

  return Object.entries(source).reduce<Record<string, MarketplaceSellerDocumentRecord>>((accumulator, [key, value]) => {
    if (typeof value === "string" && value.trim()) {
      accumulator[key] = {
        kind:
          key === "businessRegistration" || key === "founderIdentity" || key === "payoutProof"
            ? key
            : "other",
        name: value.split("/").pop() || `${key}.pdf`,
        fileUrl: value,
        mimeType: null,
        size: null,
        publicId: null,
        uploadedAt: new Date().toISOString(),
        status: "uploaded",
      };
      return accumulator;
    }

    if (!value || typeof value !== "object" || Array.isArray(value)) return accumulator;
    const document = value as Partial<MarketplaceSellerDocumentRecord>;
    if (!document.fileUrl || !document.name) return accumulator;
    accumulator[key] = {
      kind:
        document.kind === "businessRegistration" ||
        document.kind === "founderIdentity" ||
        document.kind === "payoutProof" ||
        document.kind === "other"
          ? document.kind
          : key === "businessRegistration" || key === "founderIdentity" || key === "payoutProof"
            ? key
            : "other",
      name: document.name,
      fileUrl: document.fileUrl,
      mimeType: document.mimeType || null,
      size: typeof document.size === "number" ? document.size : null,
      publicId: document.publicId || null,
      uploadedAt: document.uploadedAt || new Date().toISOString(),
      status:
        document.status === "uploaded" ||
        document.status === "under_review" ||
        document.status === "approved" ||
        document.status === "rejected"
          ? document.status
          : "uploaded",
    };
    return accumulator;
  }, {});
}

function formatSize(bytes: number | null) {
  if (!bytes || bytes <= 0) return null;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function SellerApplicationWizard({
  step,
  initialApplication,
}: SellerApplicationWizardProps) {
  const { pushToast } = useMarketplaceRuntime();
  const initialDraft = initialApplication?.draftPayload ?? {};
  const [form, setForm] = useState<FormState>({
    storeName: String(initialDraft.storeName || initialApplication?.storeName || ""),
    storeSlug: String(initialDraft.storeSlug || initialApplication?.slug || ""),
    legalName: String(initialDraft.legalName || initialApplication?.legalName || ""),
    phone: String(initialDraft.phone || initialApplication?.phone || ""),
    categoryFocus: String(initialDraft.categoryFocus || initialApplication?.categoryFocus || ""),
    story: String(initialDraft.story || initialApplication?.story || ""),
    documents: normalizeDocuments(initialDraft.documents, initialApplication?.documents),
    agreementAccepted: Boolean(initialApplication?.agreementAcceptedAt),
  });
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "submitted">("idle");
  const [uploadingKeys, setUploadingKeys] = useState<DocumentKey[]>([]);
  const [error, setError] = useState<string | null>(null);

  const missingCriticalDocuments = useMemo(
    () =>
      documentRequirements
        .filter((item) => item.required && !form.documents[item.key]?.fileUrl)
        .map((item) => item.label),
    [form.documents]
  );

  useEffect(() => {
    if (
      !form.storeName &&
      !form.storeSlug &&
      !form.legalName &&
      !form.phone &&
      !form.categoryFocus &&
      !form.story &&
      Object.keys(form.documents).length === 0 &&
      !form.agreementAccepted &&
      !initialApplication
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      startTransition(() => {
        void (async () => {
          setSaving(true);
          try {
            const response = await fetch("/api/seller-applications", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                mode: "draft",
                progressStep: step,
                ...form,
              }),
            });
            if (!response.ok) {
              const payload = (await response.json().catch(() => null)) as { error?: string } | null;
              throw new Error(payload?.error || "Draft save failed.");
            }
            setError(null);
            setSavedAt(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
          } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Draft save failed.");
          } finally {
            setSaving(false);
          }
        })();
      });
    }, 650);

    return () => {
      window.clearTimeout(timer);
    };
  }, [form, initialApplication, step]);

  async function submitApplication() {
    setSubmitState("submitting");
    setError(null);
    const response = await fetch("/api/seller-applications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: "submit",
        progressStep: "review",
        ...form,
      }),
    });

    if (response.ok) {
      setSubmitState("submitted");
      pushToast("Seller application submitted", "success", "HenryCo review has started.");
      window.location.href = "/account/seller-application?submitted=1";
      return;
    }

    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    const message = payload?.error || "Application submission failed.";
    setError(message);
    pushToast("Submission blocked", "error", message);
    setSubmitState("idle");
  }

  async function handleDocumentUpload(key: DocumentKey, file: File | null) {
    if (!file) return;

    setUploadingKeys((current) => [...current, key]);
    setError(null);
    try {
      const payload = new FormData();
      payload.set("kind", key);
      payload.set("document", file, file.name);

      const response = await fetch("/api/seller-applications/documents", {
        method: "POST",
        body: payload,
      });

      const result = (await response.json().catch(() => null)) as
        | { error?: string; document?: MarketplaceSellerDocumentRecord }
        | null;

      if (!response.ok || !result?.document) {
        throw new Error(result?.error || "Upload failed.");
      }

      setForm((current) => ({
        ...current,
        documents: {
          ...current.documents,
          [key]: result.document!,
        },
      }));
      pushToast("Document uploaded", "success", file.name);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Upload failed.";
      setError(message);
      pushToast("Upload failed", "error", message);
    } finally {
      setUploadingKeys((current) => current.filter((item) => item !== key));
    }
  }

  return (
    <div className="space-y-6">
      <div className="market-panel rounded-[1.9rem] p-5">
        <div className="flex flex-wrap items-center gap-3">
          {stepOrder.map((item, index) => (
            <div
              key={item}
              className={`inline-flex items-center gap-3 rounded-full px-4 py-2 text-sm font-semibold ${
                step === item
                  ? "bg-[var(--market-noir)] text-[var(--market-paper-white)]"
                  : "bg-[var(--market-bg-elevated)] text-[var(--market-muted)]"
              }`}
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-current/12 text-xs">
                {index + 1}
              </span>
              {item === "start" ? "Store identity" : item === "verification" ? "Verification" : "Review"}
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm leading-7 text-[var(--market-muted)]">
          {saving ? "Saving draft..." : savedAt ? `Draft saved at ${savedAt}.` : "Drafts autosave while you work."}
        </p>
        {error ? (
          <p className="mt-2 rounded-full bg-[rgba(126,33,18,0.08)] px-4 py-2 text-sm font-medium text-[var(--market-alert)]">
            {error}
          </p>
        ) : null}
      </div>

      <div className="market-panel rounded-[2rem] p-6 sm:p-8">
        {step === "start" ? (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[var(--market-ink)]">Store name</span>
                <input
                  value={form.storeName}
                  onChange={(event) => setForm((current) => ({ ...current, storeName: event.target.value }))}
                  className="market-input rounded-[1.2rem] px-4 py-3"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[var(--market-ink)]">Store slug</span>
                <input
                  value={form.storeSlug}
                  onChange={(event) => setForm((current) => ({ ...current, storeSlug: event.target.value }))}
                  className="market-input rounded-[1.2rem] px-4 py-3"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[var(--market-ink)]">Legal business name</span>
                <input
                  value={form.legalName}
                  onChange={(event) => setForm((current) => ({ ...current, legalName: event.target.value }))}
                  className="market-input rounded-[1.2rem] px-4 py-3"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[var(--market-ink)]">Operating phone</span>
                <input
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  className="market-input rounded-[1.2rem] px-4 py-3"
                />
              </label>
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-semibold text-[var(--market-ink)]">Category focus</span>
                <input
                  value={form.categoryFocus}
                  onChange={(event) => setForm((current) => ({ ...current, categoryFocus: event.target.value }))}
                  className="market-input rounded-[1.2rem] px-4 py-3"
                  placeholder="Premium home, founder office, elevated style..."
                />
              </label>
            </div>
            <div className="rounded-[1.6rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] p-5 text-sm leading-7 text-[var(--market-muted)]">
              Store identity is what the moderation and owner review queue will see first. Keep the name, legal entity,
              and category focus precise so approval and trust-routing do not stall.
            </div>
          </div>
        ) : null}

        {step === "verification" ? (
          <div className="space-y-5">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-[var(--market-ink)]">Store story and trust angle</span>
                <textarea
                  value={form.story}
                  onChange={(event) => setForm((current) => ({ ...current, story: event.target.value }))}
                  className="market-textarea rounded-[1.5rem] px-4 py-3"
                  rows={10}
                  placeholder="Explain what you sell, why buyers should trust the store, and the service standard you can maintain."
                />
              </label>
              <div className="rounded-[1.6rem] border border-[var(--market-line)] bg-[var(--market-bg-elevated)] p-5">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.05)] text-[var(--market-brass)]">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--market-paper-white)]">Verification posture</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--market-muted)]">Live trust gating</p>
                  </div>
                </div>
                <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--market-muted)]">
                  <p>Founder identity and payout proof are mandatory before submission can enter the serious review lane.</p>
                  <p>Business registration is recommended for faster approval and fewer clarification requests.</p>
                  <p>Uploaded evidence is recorded into HenryCo documents and linked to the seller moderation workflow.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              {documentRequirements.map((item) => {
                const document = form.documents[item.key];
                const uploading = uploadingKeys.includes(item.key);
                const sizeLabel = formatSize(document?.size ?? null);
                // Stable per-tile id so the visible upload button (a label
                // with htmlFor) reliably opens the file picker. The previous
                // structure wrapped everything (including a Review-file <a>
                // when a document was already uploaded) in a single <label>,
                // which on some browsers swallowed the file-input click.
                const inputId = `seller-doc-${item.key}`;

                return (
                  <div
                    key={item.key}
                    className="group rounded-[1.6rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--market-paper-white)]">{item.label}</p>
                        <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">{item.help}</p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                          item.required
                            ? "bg-[rgba(255,171,151,0.12)] text-[var(--market-alert)]"
                            : "bg-[rgba(117,209,255,0.12)] text-[var(--market-sky)]"
                        }`}
                      >
                        {item.required ? "Required" : "Recommended"}
                      </span>
                    </div>

                    <div className="mt-4 rounded-[1.35rem] border border-[var(--market-line)] bg-[var(--market-bg-elevated)] p-4">
                      {document ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[var(--market-success)]">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-sm font-semibold">Uploaded</span>
                          </div>
                          <p className="text-sm font-medium text-[var(--market-paper-white)]">{document.name}</p>
                          <p className="text-xs text-[var(--market-muted)]">
                            {document.status.replace(/_/g, " ")}
                            {sizeLabel ? ` · ${sizeLabel}` : ""}
                          </p>
                          <a
                            href={document.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--market-brass)]"
                          >
                            <FileCheck2 className="h-4 w-4" />
                            Review file
                          </a>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[var(--market-muted)]">
                            <UploadCloud className="h-4 w-4" />
                            <span className="text-sm font-semibold">No file uploaded yet</span>
                          </div>
                          <p className="text-xs leading-6 text-[var(--market-muted)]">
                            Accepted formats: JPG, PNG, WebP, PDF. Max 10 MB.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4">
                      <label
                        htmlFor={inputId}
                        className="market-button-secondary inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
                      >
                        {uploading ? (
                          <>
                            <HenryCoActivityIndicator size="sm" label="Uploading seller document" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <UploadCloud className="h-4 w-4" />
                            {document ? "Replace file" : "Upload file"}
                          </>
                        )}
                      </label>
                      <input
                        id={inputId}
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                        className="sr-only"
                        disabled={uploading}
                        onChange={(event) => {
                          const selected = event.target.files?.[0] ?? null;
                          void handleDocumentUpload(item.key, selected);
                          event.target.value = "";
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <label className="flex items-start gap-3 rounded-[1.4rem] border border-[var(--market-line)] bg-[var(--market-bg-elevated)] px-4 py-4">
              <input
                checked={form.agreementAccepted}
                onChange={(event) =>
                  setForm((current) => ({ ...current, agreementAccepted: event.target.checked }))
                }
                type="checkbox"
              />
              <span className="text-sm leading-7 text-[var(--market-ink)]">
                I accept HenryCo Marketplace moderation, trust, payout-protection, and response-standard requirements.
              </span>
            </label>
          </div>
        ) : null}

        {step === "review" ? (
          <div className="space-y-5">
            <div className="rounded-[1.5rem] border border-[var(--market-line)] bg-[var(--market-bg-elevated)] p-5">
              <p className="text-sm font-semibold text-[var(--market-ink)]">{form.storeName || "Store name pending"}</p>
              <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">
                {form.categoryFocus || "Category focus not added yet"}
              </p>
              <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">
                {form.story || "Store story still needs to be completed before submission."}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {documentRequirements.map((item) => {
                  const document = form.documents[item.key];
                  return (
                    <div key={item.key} className="market-soft rounded-[1.3rem] px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--market-muted)]">
                        {item.label}
                      </p>
                      <p className="mt-2 text-sm font-medium break-all text-[var(--market-ink)]">
                        {document?.name || "Pending"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {missingCriticalDocuments.length > 0 ? (
              <div className="rounded-[1.5rem] border border-[rgba(255,171,151,0.24)] bg-[rgba(126,33,18,0.08)] p-5 text-sm leading-7 text-[var(--market-alert)]">
                Submission is still blocked until the required proof set is complete: {missingCriticalDocuments.join(", ")}.
              </div>
            ) : null}

            <div className="rounded-[1.5rem] border border-[var(--market-line)] bg-[var(--market-soft-olive)] p-5 text-sm leading-7 text-[var(--market-paper-white)]">
              Submission routes the application into the live moderation queue, records the verification evidence in HenryCo
              documents, and triggers owner/admin alerts. Publishing access stays locked until approval is complete.
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={
              step === "start"
                ? "/account/seller-application"
                : `/account/seller-application/${previousStep(step)}`
            }
            className="market-button-secondary rounded-full px-5 py-3 text-sm font-semibold"
          >
            {step === "start" ? "Back" : "Previous"}
          </Link>

          <div className="flex flex-wrap gap-3">
            {step !== "review" ? (
              <Link
                href={`/account/seller-application/${nextStep(step)}`}
                className="market-button-primary rounded-full px-5 py-3 text-sm font-semibold"
              >
                Continue
              </Link>
            ) : (
              <button
                type="button"
                disabled={
                  !form.storeName ||
                  !form.legalName ||
                  missingCriticalDocuments.length > 0 ||
                  submitState === "submitting"
                }
                onClick={() => void submitApplication()}
                className="market-button-primary rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-60"
              >
                {submitState === "submitting"
                  ? "Submitting..."
                  : submitState === "submitted"
                    ? "Submitted"
                    : "Submit seller application"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
