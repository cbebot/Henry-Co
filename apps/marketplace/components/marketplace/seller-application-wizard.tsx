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
  const [form, setForm] = useState<FormState>({
    storeName: initialApplication?.storeName || "",
    storeSlug: initialApplication?.slug || "",
    legalName: initialApplication?.legalName || "",
    phone: "",
    categoryFocus: initialApplication?.categoryFocus || "",
    story: "",
    agreementAccepted: false,
  });
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "submitted">("idle");

  useEffect(() => {
    if (
      !form.storeName &&
      !form.storeSlug &&
      !form.legalName &&
      !form.phone &&
      !form.categoryFocus &&
      !form.story &&
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
            await fetch("/api/seller-applications", {
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
            setSavedAt(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
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

    setSubmitState("idle");
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[1.9rem] border border-[var(--market-line-strong)] bg-[var(--market-paper-white)] p-5 shadow-[0_20px_52px_rgba(28,24,18,0.06)]">
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
      </div>

      <div className="rounded-[2rem] border border-[var(--market-line-strong)] bg-[var(--market-paper-white)] p-6 shadow-[0_20px_52px_rgba(28,24,18,0.06)] sm:p-8">
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
            <div className="rounded-[1.5rem] border border-dashed border-[var(--market-line-strong)] bg-[var(--market-bg-elevated)] p-5 text-sm leading-7 text-[var(--market-muted)]">
              Document handling is wired into the real application record. This phase is where KYC files, fulfillment proof, and category-quality evidence attach to the seller profile.
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
            </div>
            <div className="rounded-[1.5rem] border border-[var(--market-line)] bg-[var(--market-soft-olive)] p-5 text-sm leading-7 text-[var(--market-ink)]">
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
