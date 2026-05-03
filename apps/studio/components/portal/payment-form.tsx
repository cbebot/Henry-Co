"use client";

import { useRef, useState, useTransition } from "react";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  FileText,
  Loader2,
  Sparkles,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { submitPaymentProofAction, type PaymentProofResult } from "@/lib/portal/actions";

const ACCEPT_MIME = ["image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"];
const MAX_BYTES = 10 * 1024 * 1024;

type FormState =
  | { kind: "idle" }
  | { kind: "validating" }
  | { kind: "submitting" }
  | { kind: "error"; message: string }
  | { kind: "success"; reference: string };

function bytesLabel(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

type PaymentProofRejection =
  | "missing_fields"
  | "invalid_file_type"
  | "file_too_large"
  | "invoice_not_found"
  | "upload_failed"
  | "duplicate_submission"
  | "server_error"
  | "unauthorised";

function reasonToMessage(reason: PaymentProofRejection): string {
  switch (reason) {
    case "missing_fields":
      return "Please add both a reference number and a proof of payment.";
    case "invalid_file_type":
      return "We accept PNG, JPG, WEBP, and PDF files only.";
    case "file_too_large":
      return "The proof file must be 10 MB or smaller.";
    case "invoice_not_found":
      return "We could not find this invoice. Refresh and try again.";
    case "upload_failed":
      return "The proof upload failed. Check your connection and try again.";
    case "duplicate_submission":
      return "We already received a payment with this reference. Use a different reference if this is a new transfer.";
    case "unauthorised":
      return "This invoice does not belong to your account.";
    case "server_error":
    default:
      return "Something went wrong on our side. Please try again in a moment.";
  }
}

export function PaymentForm({
  invoiceId,
  invoiceToken,
  invoiceNumber,
  amountLabel,
  onSuccess,
}: {
  invoiceId: string;
  invoiceToken: string | null;
  invoiceNumber: string;
  amountLabel: string;
  onSuccess?: (reference: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [state, setState] = useState<FormState>({ kind: "idle" });
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const submitting = pending || state.kind === "submitting" || state.kind === "validating";
  const canSubmit = !!file && reference.trim().length >= 3 && !submitting;

  function validateAndSetFile(next: File | null) {
    if (!next) {
      setFile(null);
      return;
    }
    if (!ACCEPT_MIME.includes(next.type)) {
      setState({ kind: "error", message: reasonToMessage("invalid_file_type") });
      return;
    }
    if (next.size > MAX_BYTES) {
      setState({ kind: "error", message: reasonToMessage("file_too_large") });
      return;
    }
    setFile(next);
    setState({ kind: "idle" });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || !reference.trim()) return;

    setState({ kind: "submitting" });
    const formData = new FormData();
    formData.set("invoiceId", invoiceId);
    if (invoiceToken) formData.set("invoiceToken", invoiceToken);
    formData.set("paymentReference", reference.trim());
    if (notes.trim()) formData.set("notes", notes.trim());
    formData.set("proof", file);

    startTransition(async () => {
      const result = await submitPaymentProofAction(formData);
      if (result.ok) {
        setState({ kind: "success", reference: reference.trim() });
        onSuccess?.(reference.trim());
        return;
      }
      setState({ kind: "error", message: reasonToMessage(result.reason) });
    });
  }

  if (state.kind === "success") {
    return (
      <div className="portal-card-elev p-6 sm:p-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-[rgba(141,232,179,0.45)] bg-[rgba(141,232,179,0.12)] text-[#8de8b3]">
          <Sparkles className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-2xl font-semibold tracking-[-0.02em] text-[var(--studio-ink)]">
          Payment proof received
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--studio-ink-soft)]">
          Thank you. We are verifying your transfer for invoice{" "}
          <span className="font-semibold text-[var(--studio-ink)]">{invoiceNumber}</span>{" "}
          ({amountLabel}). Your reference{" "}
          <span className="font-semibold text-[var(--studio-ink)]">{state.reference}</span>{" "}
          is on file. You will see this invoice flip to verified inside your client portal as soon
          as finance confirms — usually within one business day.
        </p>
        <div className="mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-[var(--studio-line-strong)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-[12px] font-semibold text-[var(--studio-ink-soft)]">
          <CheckCircle2 className="h-3.5 w-3.5 text-[#8de8b3]" />
          Encrypted in transit · stored securely
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="portal-card-elev space-y-5 p-5 sm:p-7">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full border border-[var(--studio-line-strong)] bg-[rgba(151,244,243,0.06)] text-[var(--studio-signal)]">
          <CreditCard className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-[var(--studio-ink)]">
            Send payment proof
          </h2>
          <p className="mt-1 text-[13px] leading-5 text-[var(--studio-ink-soft)]">
            After you transfer, attach your bank receipt or alert and the reference number that was
            generated by your bank. Finance verifies within one business day.
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="payment-reference" className="block text-[13px] font-semibold text-[var(--studio-ink)]">
          Bank reference number<span className="ml-1 text-[#ff8f8f]">*</span>
        </label>
        <input
          id="payment-reference"
          name="paymentReference"
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="characters"
          required
          minLength={3}
          maxLength={40}
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          placeholder="e.g. NIB/2026/05/001234"
          className="portal-input mt-2"
        />
        <p className="mt-1.5 text-[12px] text-[var(--studio-ink-soft)]">
          The transfer reference shown on your bank receipt or debit alert.
        </p>
      </div>

      <div>
        <label className="block text-[13px] font-semibold text-[var(--studio-ink)]">
          Proof of payment<span className="ml-1 text-[#ff8f8f]">*</span>
        </label>

        {file ? (
          <div className="mt-2 flex items-start gap-3 rounded-2xl border border-[var(--studio-line-strong)] bg-[rgba(255,255,255,0.04)] p-3 sm:p-4">
            <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl border border-[var(--studio-line)] bg-[rgba(255,255,255,0.04)] text-[var(--studio-ink)]">
              {file.type.startsWith("image/") ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt="Selected proof preview"
                  className="h-10 w-10 rounded-[inherit] object-cover"
                />
              ) : (
                <FileText className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13.5px] font-semibold text-[var(--studio-ink)]">
                {file.name}
              </div>
              <div className="mt-0.5 text-[12px] text-[var(--studio-ink-soft)]">
                {bytesLabel(file.size)} · {file.type || "Unknown type"}
              </div>
            </div>
            <button
              type="button"
              className="portal-button-ghost portal-button"
              style={{ minHeight: 36, padding: "0.4rem 0.7rem" }}
              onClick={() => {
                setFile(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              aria-label="Remove selected file"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label
            htmlFor="payment-proof"
            className="portal-dropzone mt-2"
            data-active={dragActive ? "true" : "false"}
            onDragEnter={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragActive(false);
              const next = event.dataTransfer.files?.[0] ?? null;
              if (next) validateAndSetFile(next);
            }}
          >
            <div className="grid h-12 w-12 place-items-center rounded-full border border-[var(--studio-line-strong)] bg-[rgba(151,244,243,0.06)] text-[var(--studio-signal)]">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[14px] font-semibold text-[var(--studio-ink)]">
                Drop your proof here or click to browse
              </div>
              <div className="mt-1 text-[12px] text-[var(--studio-ink-soft)]">
                PNG, JPG, WEBP, or PDF · max 10 MB
              </div>
            </div>
          </label>
        )}

        <input
          id="payment-proof"
          ref={inputRef}
          name="proof"
          type="file"
          accept={ACCEPT_MIME.join(",")}
          className="sr-only"
          onChange={(event) => validateAndSetFile(event.target.files?.[0] ?? null)}
        />
      </div>

      <div>
        <label htmlFor="payment-notes" className="block text-[13px] font-semibold text-[var(--studio-ink)]">
          Notes <span className="text-[var(--studio-ink-soft)]">(optional)</span>
        </label>
        <textarea
          id="payment-notes"
          name="notes"
          rows={2}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          maxLength={400}
          placeholder="Anything finance should know about this transfer."
          className="portal-textarea mt-2"
        />
      </div>

      {state.kind === "error" ? (
        <div className="flex items-start gap-2 rounded-2xl border border-[rgba(255,143,143,0.4)] bg-[rgba(255,143,143,0.08)] px-4 py-3 text-[13px] text-[#ffb8b8]">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{state.message}</span>
        </div>
      ) : null}

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12px] leading-5 text-[var(--studio-ink-soft)]">
          By submitting, you confirm you have transferred {amountLabel} to the verified HenryCo account
          shown on this page.
        </p>
        <button
          type="submit"
          className="portal-button portal-button-primary"
          disabled={!canSubmit}
          aria-disabled={!canSubmit}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting…
            </>
          ) : (
            "Submit payment proof"
          )}
        </button>
      </div>
    </form>
  );
}
