"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Camera,
  FileCheck,
  LoaderCircle,
  MapPin,
} from "lucide-react";
import { ButtonPendingContent } from "@henryco/ui";

type KycQueueItem = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  documentType: string;
  status: string;
  submittedAt: string;
  reviewedAt: string | null;
  fileUrl: string | null;
};

const DOC_TYPE_LABEL: Record<string, string> = {
  government_id: "Government ID",
  selfie: "Selfie with ID",
  address_proof: "Proof of address",
  business_cert: "Business certificate",
};

const DOC_TYPE_ICON: Record<string, typeof FileCheck> = {
  government_id: FileCheck,
  selfie: Camera,
  address_proof: MapPin,
  business_cert: Building2,
};

function formatDate(iso: string) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default function KycReviewQueueClient({
  initialQueue,
}: {
  initialQueue: KycQueueItem[];
}) {
  const router = useRouter();
  const [queue, setQueue] = useState(initialQueue);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  async function handleReview(item: KycQueueItem, decision: "approved" | "rejected") {
    const note = (notes[item.id] || "").trim();

    if (decision === "rejected" && !note) {
      setMessage({
        type: "error",
        text: `Add a review note before marking ${DOC_TYPE_LABEL[item.documentType] || item.documentType} as needing more information.`,
      });
      return;
    }

    setBusyKey(`${item.id}:${decision}`);
    setMessage(null);

    try {
      const response = await fetch("/api/kyc/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "x-henryco-async": "1",
        },
        body: JSON.stringify({
          submissionId: item.id,
          decision,
          note,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; message?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Review could not be saved.");
      }

      setQueue((current) => current.filter((entry) => entry.id !== item.id));
      setNotes((current) => {
        const next = { ...current };
        delete next[item.id];
        return next;
      });
      setMessage({
        type: "success",
        text:
          payload?.message ||
          (decision === "approved"
            ? `${item.userName} was approved and notified.`
            : `${item.userName} was asked for more information and notified.`),
      });
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Review could not be saved.",
      });
    } finally {
      setBusyKey(null);
    }
  }

  if (queue.length === 0) {
    return (
      <div className="space-y-3">
        {message ? (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              message.type === "success"
                ? "border-[var(--staff-success-soft)] bg-[var(--staff-success-soft)] text-[var(--staff-success)]"
                : "border-[var(--staff-critical-soft)] bg-[var(--staff-critical-soft)] text-[var(--staff-critical)]"
            }`}
          >
            {message.text}
          </div>
        ) : null}
        <p className="text-sm text-[var(--staff-muted)]">
          No pending KYC submissions. All documents have been reviewed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {message ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-[var(--staff-success-soft)] bg-[var(--staff-success-soft)] text-[var(--staff-success)]"
              : "border-[var(--staff-critical-soft)] bg-[var(--staff-critical-soft)] text-[var(--staff-critical)]"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      {queue.map((item) => {
        const Icon = DOC_TYPE_ICON[item.documentType] || FileCheck;
        const approving = busyKey === `${item.id}:approved`;
        const rejecting = busyKey === `${item.id}:rejected`;
        const busy = approving || rejecting;

        return (
          <div
            key={item.id}
            className="rounded-xl border border-[var(--staff-line)] bg-[var(--staff-surface)] p-4"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--staff-accent-soft)]">
                <Icon className="h-5 w-5 text-[var(--staff-accent)]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--staff-ink)]">{item.userName}</p>
                    <p className="text-xs text-[var(--staff-muted)]">{item.userEmail}</p>
                  </div>
                  <span className="rounded-full bg-[var(--staff-accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--staff-accent)]">
                    {DOC_TYPE_LABEL[item.documentType] || item.documentType}
                  </span>
                </div>
                <p className="mt-2 text-xs text-[var(--staff-muted)]">
                  Submitted {formatDate(item.submittedAt)} · User ID: {item.userId.slice(0, 8)}...
                </p>
                <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--staff-muted)]">
                      Review note
                    </span>
                    <textarea
                      value={notes[item.id] || ""}
                      onChange={(event) =>
                        setNotes((current) => ({ ...current, [item.id]: event.target.value }))
                      }
                      disabled={busy}
                      rows={3}
                      className="mt-2 w-full rounded-xl border border-[var(--staff-line)] bg-white px-3 py-3 text-sm text-[var(--staff-ink)] outline-none"
                      placeholder="Add a reason, missing detail, or approval context."
                    />
                  </label>

                  <div className="flex flex-col gap-2 lg:items-end">
                    {item.fileUrl ? (
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex rounded-full bg-[var(--staff-accent-soft)] px-3 py-2 text-xs font-semibold text-[var(--staff-accent)] hover:opacity-80"
                      >
                        View document
                      </a>
                    ) : (
                      <span className="inline-flex rounded-full bg-[var(--staff-warning-soft)] px-3 py-2 text-xs font-semibold text-[var(--staff-warning)]">
                        No document file
                      </span>
                    )}

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleReview(item, "approved")}
                      className="inline-flex min-w-[180px] items-center justify-center rounded-full bg-[var(--staff-success-soft)] px-4 py-2 text-xs font-semibold text-[var(--staff-success)] disabled:opacity-60"
                    >
                      <ButtonPendingContent
                        pending={approving}
                        pendingLabel="Approving..."
                        spinnerLabel="Approving verification"
                      >
                        Approve
                      </ButtonPendingContent>
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleReview(item, "rejected")}
                      className="inline-flex min-w-[180px] items-center justify-center rounded-full bg-[var(--staff-critical-soft)] px-4 py-2 text-xs font-semibold text-[var(--staff-critical)] disabled:opacity-60"
                    >
                      <ButtonPendingContent
                        pending={rejecting}
                        pendingLabel="Saving..."
                        spinnerLabel="Requesting more information"
                      >
                        Needs more information
                      </ButtonPendingContent>
                    </button>

                    {busy ? (
                      <span className="inline-flex items-center gap-2 text-xs text-[var(--staff-muted)]">
                        <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                        Updating without reloading the page
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
