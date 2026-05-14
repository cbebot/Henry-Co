"use client";

import {
  Building2,
  Camera,
  CheckCircle2,
  FileCheck,
  LoaderCircle,
  MapPin,
  Upload,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";

import type {
  VerificationState,
  VerificationSubmission,
} from "@/lib/verification";
import {
  formatStamp,
  submissionChipLabel,
  submissionChipTone,
} from "./helpers";

const REQUIRED_DOC_TYPES = ["government_id", "selfie"] as const;
const OPTIONAL_DOC_TYPES = ["address_proof", "business_cert"] as const;

const DOC_TITLE: Record<string, string> = {
  government_id: "Government-issued ID",
  selfie: "Selfie with ID",
  address_proof: "Proof of address",
  business_cert: "Business registration",
};

const DOC_DESC: Record<string, string> = {
  government_id:
    "National ID, passport, or driver's licence — the page with your full name + photo + document number visible.",
  selfie:
    "A selfie holding the same ID. Lets reviewers confirm liveness and document ownership in one shot.",
  address_proof:
    "Utility bill, bank statement, or official letter from the last three months that matches your saved address.",
  business_cert:
    "CAC certificate, business registration, or equivalent operating proof — used for seller and employer review lanes.",
};

const DOC_ICON: Record<string, LucideIcon> = {
  government_id: FileCheck,
  selfie: Camera,
  address_proof: MapPin,
  business_cert: Building2,
};

type Props = {
  initialVerification: VerificationState;
};

function buildSubmissionMap(submissions: VerificationSubmission[]) {
  const map = new Map<string, VerificationSubmission>();
  for (const item of submissions) {
    if (!map.has(item.documentType)) map.set(item.documentType, item);
  }
  return map;
}

type Message = { tone: "success" | "error"; text: string } | null;

export default function DocumentSubmissionsClient({ initialVerification }: Props) {
  const router = useRouter();
  const [verification, setVerification] = useState(initialVerification);
  const [message, setMessage] = useState<Message>(null);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const submissionsByType = useMemo(
    () => buildSubmissionMap(verification.submissions),
    [verification.submissions],
  );

  async function handleUpload(documentType: string, file: File | null, input: HTMLInputElement) {
    if (!file) return;
    setUploadingType(documentType);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.set("document_type", documentType);
      formData.set("file", file, file.name);
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: { Accept: "application/json", "x-henryco-async": "1" },
        body: formData,
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            error?: string;
            message?: string;
            verification?: VerificationState;
            submission?: VerificationSubmission;
          }
        | null;
      if (!response.ok || !payload?.verification || !payload.submission) {
        setMessage({
          tone: "error",
          text:
            payload?.error ||
            "We couldn't add that file to the review queue. Try again in a moment, or contact support if it keeps happening.",
        });
        return;
      }
      const nextSubmissions = [
        payload.submission,
        ...verification.submissions.filter(
          (item) =>
            item.documentType !== payload.submission?.documentType ||
            (item.status !== "pending" && item.status !== "rejected"),
        ),
      ];
      setVerification({ ...payload.verification, submissions: nextSubmissions });
      setMessage({
        tone: "success",
        text: payload.message || `${file.name} added to the review queue.`,
      });
      input.value = "";
      router.refresh();
    } catch {
      setMessage({
        tone: "error",
        text: "We couldn't reach the verification service. Check your connection and try again.",
      });
    } finally {
      setUploadingType(null);
    }
  }

  return (
    <div className="acct-ver__docs" data-live-refresh-pause="true">
      {message ? (
        <div className="acct-ver__toast" data-tone={message.tone} role="status" aria-live="polite">
          {message.tone === "success" ? (
            <CheckCircle2 size={16} aria-hidden />
          ) : null}
          <span>{message.text}</span>
        </div>
      ) : null}
      {REQUIRED_DOC_TYPES.map((type) => (
        <DocumentRow
          key={type}
          type={type}
          required
          submission={submissionsByType.get(type)}
          uploading={uploadingType === type}
          onUpload={handleUpload}
        />
      ))}
      {OPTIONAL_DOC_TYPES.map((type) => (
        <DocumentRow
          key={type}
          type={type}
          required={false}
          submission={submissionsByType.get(type)}
          uploading={uploadingType === type}
          onUpload={handleUpload}
        />
      ))}
    </div>
  );
}

function DocumentRow({
  type,
  required,
  submission,
  uploading,
  onUpload,
}: {
  type: string;
  required: boolean;
  submission: VerificationSubmission | undefined;
  uploading: boolean;
  onUpload: (
    documentType: string,
    file: File | null,
    input: HTMLInputElement,
  ) => void | Promise<void>;
}) {
  const Icon = DOC_ICON[type] || FileCheck;
  const status = submission?.status;
  const tone = submissionChipTone(status, required);
  const label = submissionChipLabel(status, required);
  const inputId = `acct-ver-upload-${type}`;
  return (
    <article
      className="acct-ver__doc"
      data-status={status || "unsubmitted"}
      data-required={required ? "true" : "false"}
    >
      <header className="acct-ver__doc-head">
        <div className="acct-ver__doc-id">
          <span className="acct-ver__doc-icon" aria-hidden>
            <Icon size={18} aria-hidden />
          </span>
          <div className="acct-ver__doc-meta">
            <span className="acct-ver__doc-title">{DOC_TITLE[type] || type}</span>
            <span className="acct-ver__doc-desc">{DOC_DESC[type]}</span>
          </div>
        </div>
        <span className="acct-ver__chip" data-tone={tone}>
          {label}
        </span>
      </header>
      {status === "rejected" && submission?.reviewerNote ? (
        <div className="acct-ver__doc-note" role="status">
          <span className="acct-ver__doc-note-text">{submission.reviewerNote}</span>
        </div>
      ) : null}
      <footer className="acct-ver__doc-foot">
        <div className="acct-ver__doc-stamps">
          {submission?.submittedAt ? (
            <span className="acct-ver__doc-stamp">
              <FileCheck size={11} aria-hidden /> Submitted {formatStamp(submission.submittedAt)}
            </span>
          ) : (
            <span className="acct-ver__doc-stamp">
              {required ? "Required for review." : "Optional reinforcement."}
            </span>
          )}
          {submission?.reviewedAt ? (
            <span className="acct-ver__doc-stamp">
              <CheckCircle2 size={11} aria-hidden /> Reviewed {formatStamp(submission.reviewedAt)}
            </span>
          ) : null}
        </div>
        <div className="acct-ver__upload-row">
          {uploading ? (
            <span className="acct-ver__upload-busy" role="status" aria-live="polite">
              <LoaderCircle size={14} aria-hidden /> Uploading without leaving the page
            </span>
          ) : null}
          <label htmlFor={inputId} className="acct-ver__upload-action" data-busy={uploading ? "true" : undefined}>
            <Upload size={14} aria-hidden />
            {submission ? "Replace file" : "Upload file"}
          </label>
          <input
            id={inputId}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            className="acct-ver__upload-input"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              void onUpload(type, file, event.target);
            }}
          />
        </div>
      </footer>
    </article>
  );
}
