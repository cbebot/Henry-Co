"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ButtonPendingContent } from "@henryco/ui";
import { FileUp } from "lucide-react";

export default function FundingProofUpload({
  requestId,
  currentProofUrl,
}: {
  requestId: string;
  currentProofUrl: string | null;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      setMessage({ type: "error", text: "Select a proof file first." });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.set("proof", file);

      const response = await fetch(`/api/wallet/funding/${requestId}/proof`, {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Unable to upload proof.");
      }

      setFile(null);
      setMessage({ type: "success", text: "Proof uploaded. The HenryCo team can now review the request." });
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Unable to upload proof.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[1.55rem] border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-5"
      data-live-refresh-pause="true"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--acct-blue-soft)] text-[var(--acct-blue)]">
          <FileUp size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--acct-ink)]">Upload transfer proof</p>
          <p className="mt-1 text-sm leading-6 text-[var(--acct-muted)]">
            JPG, PNG, WebP, or PDF. Upload the bank receipt or transfer confirmation linked to this request.
          </p>
        </div>
      </div>

      {currentProofUrl ? (
        <a
          href={currentProofUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex rounded-full bg-[var(--acct-green-soft)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--acct-green)]"
        >
          Existing proof uploaded
        </a>
      ) : null}

      {message ? (
        <div
          className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-[var(--acct-green-soft)] text-[var(--acct-green)]"
              : "bg-[var(--acct-red-soft)] text-[var(--acct-red)]"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <div className="mt-4 space-y-4">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
          className="acct-input cursor-pointer"
        />
        {file ? (
          <div className="rounded-2xl bg-[var(--acct-surface)] px-4 py-3 text-sm text-[var(--acct-muted)]">
            {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
          </div>
        ) : null}
        <button
          type="submit"
          disabled={loading || !file}
          className="acct-button-primary rounded-2xl px-5 py-3"
        >
          <ButtonPendingContent pending={loading} pendingLabel="Uploading proof..." spinnerLabel="Uploading proof">
            Upload proof
          </ButtonPendingContent>
        </button>
      </div>
    </form>
  );
}
