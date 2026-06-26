"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Archive,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  Loader2,
  Video,
  X,
} from "lucide-react";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { getStudioPortalCopy } from "@henryco/i18n";
import { StatusBadge } from "@/components/portal/status-badge";
import { deliverableStatusToken } from "@/lib/portal/status";
import { shortDate } from "@/lib/portal/helpers";
import { approveDeliverableAction } from "@/lib/portal/actions";
import type { ClientDeliverable, ClientFileType } from "@/types/portal";

const fileIcon: Record<ClientFileType, React.ElementType> = {
  image: ImageIcon,
  pdf: FileText,
  video: Video,
  archive: Archive,
  other: FileText,
};

export function FileCard({
  deliverable,
  canApprove = true,
}: {
  deliverable: ClientDeliverable;
  canApprove?: boolean;
}) {
  const locale = useHenryCoLocale();
  const copy = getStudioPortalCopy(locale);
  const [open, setOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [approved, setApproved] = useState(deliverable.status === "approved");
  const [error, setError] = useState<string | null>(null);

  const Icon = fileIcon[deliverable.fileType] ?? FileText;
  const status = deliverableStatusToken(approved ? "approved" : deliverable.status);
  const showPreview = deliverable.fileType === "image" || deliverable.fileType === "pdf";

  async function handleApprove() {
    if (!canApprove || approved) return;
    setIsApproving(true);
    setError(null);
    const formData = new FormData();
    formData.set("deliverableId", deliverable.id);
    formData.set("projectId", deliverable.projectId);
    const result = await approveDeliverableAction(formData);
    setIsApproving(false);
    if (result.ok) {
      setApproved(true);
    } else {
      setError(copy.fileCard.approveError);
    }
  }

  return (
    <>
      <article className="portal-card p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 flex-shrink-0 place-items-center overflow-hidden rounded-xl border border-[var(--studio-line)] bg-[rgba(255,255,255,0.04)]">
            {deliverable.fileType === "image" && deliverable.thumbnailUrl ? (
              <Image
                src={deliverable.thumbnailUrl}
                alt=""
                width={48}
                height={48}
                unoptimized
                className="h-full w-full object-cover"
              />
            ) : (
              <Icon className="h-5 w-5 text-[var(--studio-ink-soft)]" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-3">
              <span className="text-[14px] font-semibold text-[var(--studio-ink)]">
                {deliverable.title}
              </span>
              {deliverable.version > 1 ? (
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
                  {copy.fileCard.versionPrefix}{deliverable.version}
                </span>
              ) : null}
            </div>
            {deliverable.description ? (
              <p className="mt-1 text-[12.5px] leading-5 text-[var(--studio-ink-soft)] line-clamp-2">
                {deliverable.description}
              </p>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11.5px] text-[var(--studio-ink-soft)]">
              <StatusBadge tone={status.tone} label={status.label} size="sm" />
              {deliverable.sharedAt ? <span>{copy.fileCard.sharedPrefix(shortDate(deliverable.sharedAt) ?? "")}</span> : null}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {showPreview && deliverable.fileUrl ? (
            <button
              type="button"
              className="portal-button portal-button-secondary"
              style={{ padding: "0.55rem 0.95rem", minHeight: 36 }}
              onClick={() => setOpen(true)}
            >
              <Eye className="h-3.5 w-3.5" />
              {copy.fileCard.preview}
            </button>
          ) : null}
          {deliverable.fileUrl ? (
            <a
              // Cross-origin URLs ignore the `download` attribute, so we
              // route the file through the studio's own proxy which
              // re-streams with Content-Disposition: attachment. Cloudinary
              // + Supabase storage hosts are allowlisted in the route.
              href={`/api/portal/download?u=${encodeURIComponent(deliverable.fileUrl)}&n=${encodeURIComponent(deliverable.title || copy.fileCard.fallbackName)}`}
              className="portal-button portal-button-secondary"
              style={{ padding: "0.55rem 0.95rem", minHeight: 36 }}
              download={deliverable.title || true}
            >
              <Download className="h-3.5 w-3.5" />
              {copy.fileCard.download}
            </a>
          ) : null}
          {!approved && canApprove && deliverable.status === "shared" ? (
            <button
              type="button"
              onClick={handleApprove}
              disabled={isApproving}
              className="portal-button portal-button-primary"
              style={{ padding: "0.55rem 0.95rem", minHeight: 36 }}
            >
              {isApproving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {copy.fileCard.approving}
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {copy.fileCard.markApproved}
                </>
              )}
            </button>
          ) : null}
          {approved ? (
            <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#8de8b3]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {copy.fileCard.approved}
            </span>
          ) : null}
        </div>

        {error ? (
          <p className="mt-2 text-[12px] text-[#ffb8b8]">{error}</p>
        ) : null}
      </article>

      {open && deliverable.fileUrl ? (
        <div
          className="portal-lightbox"
          role="dialog"
          aria-modal="true"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="portal-lightbox-frame">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="self-end rounded-full border border-[var(--studio-line-strong)] bg-[rgba(255,255,255,0.06)] p-1.5 text-[var(--studio-ink)]"
              aria-label={copy.fileCard.closePreview}
            >
              <X className="h-4 w-4" />
            </button>
            {deliverable.fileType === "image" ? (
              <Image
                src={deliverable.fileUrl}
                alt={deliverable.title}
                width={1200}
                height={900}
                unoptimized
                className="max-h-[80vh] w-auto max-w-full object-contain"
              />
            ) : (
              <iframe src={deliverable.fileUrl} title={deliverable.title} className="h-[80vh] w-full" />
            )}
            <a
              href={deliverable.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="self-end text-[12.5px] font-semibold text-[var(--studio-signal)] hover:underline"
            >
              {copy.fileCard.openInNewTab}
            </a>
          </div>
        </div>
      ) : null}
    </>
  );
}
