"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Archive,
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  Loader2,
  Lock,
  Video,
  X,
} from "lucide-react";

import { translateSurfaceLabel, type AppLocale } from "@henryco/i18n";

import { StatusBadge } from "@/components/portal/status-badge";
import { deliverableStatusToken } from "@/lib/portal/status";
import { shortDate } from "@/lib/portal/helpers";
import type { ClientFileType } from "@/types/portal";

const fileIcon: Record<ClientFileType, React.ElementType> = {
  image: ImageIcon,
  pdf: FileText,
  video: Video,
  archive: Archive,
  other: FileText,
};

/**
 * V3-73 — sanitized, client-safe view of a deliverable. CRITICAL: this object
 * crosses the "use client" boundary and is serialized into the page payload, so
 * it carries NO raw file/thumbnail URL or public id. The card only knows whether
 * a file exists + whether it is previewable; the actual (watermarked / gated)
 * URLs are resolved exclusively through the server-side /api/studio/asset-unlock
 * boundary at click time.
 */
export type PortalDeliverableView = {
  id: string;
  title: string;
  description: string | null;
  version: number;
  status: string;
  sharedAt: string | null;
  fileType: ClientFileType;
  hasFile: boolean;
  canPreview: boolean;
};

/**
 * V3-73 — the elevated, access-controlled deliverable card.
 *
 *   - Preview (images): a server-side WATERMARKED Cloudinary URL (visible overlay
 *     + an invisible forensic identity tag, Principle 5), fetched on click. The
 *     un-watermarked original is never sent to the client.
 *   - Final download: payment-gated server-side. When `locked` the control shows a
 *     truthful "unlocks on payment" state; otherwise it requests a short-lived
 *     grant URL — the raw file URL is never handed to the client.
 */
export function PortalDeliverableCard({
  deliverable,
  locked,
  locale,
}: {
  deliverable: PortalDeliverableView;
  locked: boolean;
  locale: AppLocale;
}) {
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const [busy, setBusy] = useState<null | "preview" | "final">(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const Icon = fileIcon[deliverable.fileType] ?? FileText;
  const status = deliverableStatusToken(deliverable.status, locale);
  const canPreview = deliverable.canPreview;

  async function requestUnlock(mode: "preview" | "final"): Promise<string | null> {
    setBusy(mode);
    setError(null);
    try {
      const res = await fetch("/api/studio/asset-unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliverable_id: deliverable.id, mode }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; url?: string; error?: string };
      if (!res.ok || !data.ok || !data.url) {
        setError(
          data.error === "payment_required"
            ? t("This file unlocks once payment is confirmed.")
            : t("We couldn't open this file right now. Please try again."),
        );
        return null;
      }
      return data.url;
    } catch {
      setError(t("We couldn't open this file right now. Please try again."));
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function handlePreview() {
    const url = await requestUnlock("preview");
    if (url) setPreviewUrl(url);
  }

  async function handleDownload() {
    const url = await requestUnlock("final");
    if (url) window.location.href = url;
  }

  return (
    <>
      <article className="portal-card p-4 sm:p-5">
        <div className="flex items-start gap-3">
          {/* Thumbnail is intentionally an icon, never the raw asset URL —
              the only image the client may see is the watermarked preview
              fetched through the gated asset-unlock boundary on click. */}
          <div className="grid h-12 w-12 flex-shrink-0 place-items-center overflow-hidden rounded-xl border border-[var(--studio-line)] bg-[var(--studio-fill-faint)]">
            <Icon className="h-5 w-5 text-[var(--studio-ink-soft)]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-3">
              <span className="text-[14px] font-semibold text-[var(--studio-ink)]">
                {deliverable.title}
              </span>
              {deliverable.version > 1 ? (
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
                  v{deliverable.version}
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
              {deliverable.sharedAt ? (
                <span>· {t("Shared")} {shortDate(deliverable.sharedAt)}</span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {canPreview ? (
            <button
              type="button"
              className="portal-button portal-button-secondary"
              style={{ padding: "0.55rem 0.95rem", minHeight: 36 }}
              onClick={handlePreview}
              disabled={busy !== null}
            >
              {busy === "preview" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
              {t("Preview")}
            </button>
          ) : null}

          {deliverable.hasFile ? (
            locked ? (
              <span
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--studio-amber-line)] bg-[var(--studio-amber-soft)] px-3 py-2 text-[12px] font-semibold text-[var(--studio-amber-ink)]"
                title={t("Final files unlock once payment is confirmed.")}
              >
                <Lock className="h-3.5 w-3.5" />
                {t("Unlocks on payment")}
              </span>
            ) : (
              <button
                type="button"
                className="portal-button portal-button-primary"
                style={{ padding: "0.55rem 0.95rem", minHeight: 36 }}
                onClick={handleDownload}
                disabled={busy !== null}
              >
                {busy === "final" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                {t("Download final")}
              </button>
            )
          ) : null}
        </div>

        {error ? <p className="mt-2 text-[12px] text-[var(--studio-red-ink)]">{error}</p> : null}
        {canPreview ? (
          <p className="mt-2 text-[11px] text-[var(--studio-ink-soft)]">
            {t("Previews are watermarked with your account identity.")}
          </p>
        ) : null}
      </article>

      {previewUrl ? (
        <div
          className="portal-lightbox"
          role="dialog"
          aria-modal="true"
          onClick={(event) => {
            if (event.target === event.currentTarget) setPreviewUrl(null);
          }}
        >
          <div className="portal-lightbox-frame">
            <button
              type="button"
              onClick={() => setPreviewUrl(null)}
              className="self-end rounded-full border border-[var(--studio-line-strong)] bg-[var(--studio-fill-soft)] p-1.5 text-[var(--studio-ink)]"
              aria-label={t("Close preview")}
            >
              <X className="h-4 w-4" />
            </button>
            <Image
              src={previewUrl}
              alt={deliverable.title}
              width={1200}
              height={900}
              unoptimized
              className="max-h-[80vh] w-auto max-w-full object-contain"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
