"use client";

import { File as FileIcon, FileText, Film, RotateCw, X } from "lucide-react";
import { cn } from "@henryco/ui/cn";
import type { ComposerAttachment } from "../types";
import { formatMb } from "../util/validateAttachment";

export type AttachmentPreviewProps = {
  attachments: ComposerAttachment[];
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  variant?: "inline" | "carousel";
  removeLabel?: string;
  retryLabel?: string;
  className?: string;
};

function KindGlyph({ kind }: { kind: ComposerAttachment["kind"] }) {
  const className = "h-4 w-4";
  if (kind === "video") return <Film className={className} aria-hidden />;
  if (kind === "pdf" || kind === "doc")
    return <FileText className={className} aria-hidden />;
  return <FileIcon className={className} aria-hidden />;
}

function ProgressRing({ progress }: { progress: number }) {
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, progress) / 100) * circumference;
  return (
    <svg
      className="h-7 w-7 -rotate-90 text-[color:var(--composer-accent,#0E7C86)]"
      viewBox="0 0 32 32"
      aria-hidden
    >
      <circle
        cx="16"
        cy="16"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.18"
        strokeWidth="3"
      />
      <circle
        cx="16"
        cy="16"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 220ms ease-out" }}
      />
    </svg>
  );
}

export function AttachmentPreview({
  attachments,
  onRemove,
  onRetry,
  variant = "inline",
  removeLabel = "Remove attachment",
  retryLabel = "Retry upload",
  className,
}: AttachmentPreviewProps) {
  if (attachments.length === 0) return null;

  const isCarousel = variant === "carousel";

  return (
    <ul
      className={cn(
        "flex gap-2 px-1",
        isCarousel
          ? "snap-x snap-mandatory overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          : "flex-wrap",
        className
      )}
      aria-label="Attached files"
    >
      {attachments.map((att) => {
        const isImage = att.kind === "image" && att.previewUrl;
        const failed = att.status === "failed";
        const uploading =
          att.status === "uploading" || att.status === "pending";

        return (
          <li
            key={att.id}
            className={cn(
              "group relative flex shrink-0 snap-start overflow-hidden",
              "rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white text-zinc-900",
              "shadow-[0_4px_14px_-6px_rgba(15,23,42,0.16),0_1px_3px_rgba(15,23,42,0.04)]",
              "transition-[transform,box-shadow,border-color] duration-200 ease-out",
              "hover:-translate-y-[1px] hover:shadow-[0_10px_22px_-8px_rgba(15,23,42,0.22),0_1px_3px_rgba(15,23,42,0.05)]",
              "dark:border-white/10 dark:bg-white/[0.06] dark:text-white",
              isCarousel ? "h-20 min-w-[5rem]" : "h-16",
              failed && "border-red-300/60 dark:border-red-400/40",
              att.status === "uploaded" &&
                "border-[color:var(--composer-accent,#0E7C86)]/22"
            )}
            data-status={att.status}
          >
            {isImage ? (
              <div
                className={cn(
                  "relative flex items-center justify-center",
                  isCarousel ? "h-20 w-20" : "h-16 w-16"
                )}
              >
                <img
                  src={att.previewUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  draggable={false}
                />
                {uploading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                    <ProgressRing progress={att.progress} />
                  </div>
                ) : null}
              </div>
            ) : (
              <div
                className={cn(
                  "relative flex flex-col justify-between gap-1 px-3 py-2",
                  isCarousel ? "h-20 w-44" : "h-16 max-w-[14rem]"
                )}
              >
                <div className="flex items-center gap-2 text-[13px] font-medium leading-tight">
                  <KindGlyph kind={att.kind} />
                  <span className="truncate" title={att.name}>
                    {att.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-white/55">
                  <span>{formatMb(att.size)}</span>
                  {uploading ? (
                    <span className="text-[color:var(--composer-accent,#0E7C86)]">
                      {att.progress > 0 ? `${Math.round(att.progress)}%` : "Uploading…"}
                    </span>
                  ) : null}
                  {failed ? (
                    <span className="text-red-500">{att.error || "Failed"}</span>
                  ) : null}
                </div>
                {uploading ? (
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-black/5 dark:bg-white/10">
                    <div
                      className="h-full bg-[color:var(--composer-accent,#0E7C86)] transition-[width] duration-200 ease-out"
                      style={{ width: `${Math.min(100, att.progress)}%` }}
                    />
                  </div>
                ) : null}
              </div>
            )}

            <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-100 transition-opacity duration-150 [@media(hover:hover)]:opacity-0 group-hover:[@media(hover:hover)]:opacity-100 group-focus-within:[@media(hover:hover)]:opacity-100">
              {failed ? (
                <button
                  type="button"
                  onClick={() => onRetry(att.id)}
                  aria-label={retryLabel}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-zinc-700 shadow-[0_2px_6px_rgba(15,23,42,0.18)] ring-1 ring-black/5 transition hover:scale-105 dark:bg-zinc-900 dark:text-white dark:ring-white/10"
                >
                  <RotateCw className="h-3 w-3" aria-hidden />
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => onRemove(att.id)}
                aria-label={removeLabel}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-zinc-700 shadow-[0_2px_6px_rgba(15,23,42,0.18)] ring-1 ring-black/5 transition hover:scale-105 dark:bg-zinc-900 dark:text-white dark:ring-white/10"
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
