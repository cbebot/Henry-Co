"use client";

import Link from "next/link";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { ButtonPendingContent } from "@henryco/ui";
import { EmptyState, InlineNotice } from "@/components/feedback";
import { SectionCard } from "@/components/workspace-shell";
import type { CandidateDocument } from "@/lib/jobs/types";

function formatFileSize(value: number | null) {
  if (!value) return "Unknown size";
  if (value < 1024 * 1024) return `${Math.max(value / 1024, 1).toFixed(0)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CandidateFilesClient({
  initialDocuments,
  uploadedFromRedirect = false,
}: {
  initialDocuments: CandidateDocument[];
  uploadedFromRedirect?: boolean;
}) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [kind, setKind] = useState("resume");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [inputKey, setInputKey] = useState(0);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    uploadedFromRedirect
      ? {
          type: "success",
          text: "Your file has been uploaded and is now part of your candidate profile.",
        }
      : null
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setMessage({ type: "error", text: "Choose a file before uploading." });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.set("kind", kind);
      formData.set("file", selectedFile, selectedFile.name);

      const response = await fetch("/api/candidate/documents", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "x-henryco-async": "1",
        },
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; message?: string; document?: CandidateDocument }
        | null;

      if (!response.ok || !payload?.ok || !payload.document) {
        throw new Error(payload?.error || "Document upload failed.");
      }

      setDocuments((current) => [payload.document!, ...current]);
      setSelectedFile(null);
      setInputKey((current) => current + 1);
      setMessage({
        type: "success",
        text: payload.message || "Document uploaded successfully.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Document upload failed.",
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4" data-live-refresh-pause="true">
      {message ? (
        <InlineNotice
          tone={message.type === "success" ? "success" : "warn"}
          title={message.type === "success" ? "Document uploaded" : "Upload failed"}
          body={message.text}
        />
      ) : null}

      <SectionCard
        title="Upload a document"
        body="Accepted formats include PDF, Word, and image files."
      >
        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="grid gap-4 md:grid-cols-[180px_1fr_auto]"
        >
          <select
            name="kind"
            value={kind}
            onChange={(event) => setKind(event.target.value)}
            className="jobs-select"
            disabled={uploading}
          >
            <option value="resume">Resume</option>
            <option value="portfolio">Portfolio</option>
            <option value="certification">Certification</option>
          </select>
          <div className="space-y-2">
            <input
              key={inputKey}
              type="file"
              name="file"
              className="jobs-input"
              disabled={uploading}
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            />
            {selectedFile ? (
              <p className="text-xs text-[var(--jobs-muted)]">
                {selectedFile.name} ready for upload.
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="submit"
              disabled={uploading}
              className="jobs-button-primary inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-70 md:w-auto"
            >
              <ButtonPendingContent
                pending={uploading}
                pendingLabel="Uploading..."
                spinnerLabel="Uploading candidate document"
              >
                Upload
              </ButtonPendingContent>
            </button>
            {uploading ? (
              <span className="inline-flex items-center gap-2 text-xs text-[var(--jobs-muted)]">
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                Uploading without leaving the page
              </span>
            ) : null}
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Your documents"
        body="Files you've uploaded to support your applications."
      >
        {documents.length === 0 ? (
          <EmptyState
            kicker="Vault is empty"
            title="Add your resume or supporting proof."
            body="A resume is the fastest way to strengthen your profile and give employers useful context."
            action={
              <Link
                href="/candidate/profile"
                className="jobs-button-secondary rounded-full px-5 py-3 text-sm font-semibold"
              >
                Review profile
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {documents.map((document) => (
              <a
                key={document.id}
                href={document.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[var(--jobs-paper-soft)] p-4 hover:bg-[var(--jobs-accent-soft)]"
              >
                <div>
                  <div className="font-semibold">{document.name}</div>
                  <div className="mt-1 text-sm text-[var(--jobs-muted)]">
                    {document.kind} | {formatFileSize(document.fileSize)} | Added{" "}
                    {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
                      new Date(document.createdAt)
                    )}
                  </div>
                </div>
                <span className="text-sm font-semibold text-[var(--jobs-accent)]">Open</span>
              </a>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
