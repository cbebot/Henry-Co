"use client";

import Link from "next/link";
import { startTransition, useEffect, useState } from "react";
import type { MarketplaceVendorApplication } from "@/lib/marketplace/types";

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
  documents: Record<string, string>;
  agreementAccepted: boolean;
};

const stepOrder: SellerWizardStep[] = ["start", "verification", "review"];

function nextStep(step: SellerWizardStep) {
  return stepOrder[Math.min(stepOrder.indexOf(step) + 1, stepOrder.length - 1)];
}

function previousStep(step: SellerWizardStep) {
  return stepOrder[Math.max(stepOrder.indexOf(step) - 1, 0)];
}

export function SellerApplicationWizard({
  step,
  initialApplication,
}: SellerApplicationWizardProps) {
  const initialDraft = initialApplication?.draftPayload ?? {};
  const [form, setForm] = useState<FormState>({
    storeName: String(initialDraft.storeName || initialApplication?.storeName || ""),
    storeSlug: String(initialDraft.storeSlug || initialApplication?.slug || ""),
    legalName: String(initialDraft.legalName || initialApplication?.legalName || ""),
    phone: String(initialDraft.phone || initialApplication?.phone || ""),
    categoryFocus: String(initialDraft.categoryFocus || initialApplication?.categoryFocus || ""),
    story: String(initialDraft.story || initialApplication?.story || ""),
    documents:
      initialDraft.documents && typeof initialDraft.documents === "object"
        ? (initialDraft.documents as Record<string, string>)
        : initialApplication?.documents || {},
    agreementAccepted: Boolean(initialApplication?.agreementAcceptedAt),
  });
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "submitted">("idle");
  const [error, setError] = useState<string | null>(null);

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
      window.location.href = "/account/seller-application?submitted=1";
      return;
    }

    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    setError(payload?.error || "Application submission failed.");
    setSubmitState("idle");
  }

  function updateDocument(key: string, value: string) {
    setForm((current) => ({
      ...current,
      documents: {
        ...current.documents,
        [key]: value,
      },
    }));
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
        ) : null}

        {step === "verification" ? (
          <div className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-[var(--market-ink)]">Store story and trust angle</span>
              <textarea
                value={form.story}
                onChange={(event) => setForm((current) => ({ ...current, story: event.target.value }))}
                className="market-textarea rounded-[1.5rem] px-4 py-3"
                rows={7}
                placeholder="Explain what you sell, why buyers should trust the store, and the service standard you can maintain."
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[var(--market-ink)]">Business registration document URL</span>
                <input
                  value={form.documents.businessRegistration || ""}
                  onChange={(event) => updateDocument("businessRegistration", event.target.value)}
                  className="market-input rounded-[1.2rem] px-4 py-3"
                  placeholder="https://..."
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[var(--market-ink)]">Founder ID / KYC document URL</span>
                <input
                  value={form.documents.founderIdentity || ""}
                  onChange={(event) => updateDocument("founderIdentity", event.target.value)}
                  className="market-input rounded-[1.2rem] px-4 py-3"
                  placeholder="https://..."
                />
              </label>
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-semibold text-[var(--market-ink)]">Payout account proof URL</span>
                <input
                  value={form.documents.payoutProof || ""}
                  onChange={(event) => updateDocument("payoutProof", event.target.value)}
                  className="market-input rounded-[1.2rem] px-4 py-3"
                  placeholder="https://..."
                />
              </label>
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
                I accept HenryCo Marketplace moderation, trust, and response-standard requirements.
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
                {[
                  ["Business registration", form.documents.businessRegistration || "Pending"],
                  ["Founder ID", form.documents.founderIdentity || "Pending"],
                  ["Payout proof", form.documents.payoutProof || "Pending"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="market-soft rounded-[1.3rem] px-4 py-4"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--market-muted)]">
                      {label}
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--market-ink)] break-all">{value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-[var(--market-line)] bg-[var(--market-soft-olive)] p-5 text-sm leading-7 text-[var(--market-paper-white)]">
              Submission routes the application into the live moderation queue and triggers owner/admin alerts. Publishing access remains locked until approval is complete.
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
                disabled={!form.storeName || !form.legalName || submitState === "submitting"}
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
