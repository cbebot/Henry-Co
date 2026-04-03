"use client";

import { useId, useState } from "react";
import { AlertCircle, ImagePlus, Loader2, UploadCloud, Video } from "lucide-react";
import { emitCareToast } from "@/components/feedback/CareToaster";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type AssetKind = "image" | "video";

function acceptForKind(kind: AssetKind) {
  return kind === "video"
    ? "video/mp4,video/webm,video/quicktime"
    : "image/jpeg,image/png,image/webp";
}

export default function CareAssetUploadField({
  label,
  name,
  value,
  folder,
  publicIdPrefix,
  hint,
  className,
  assetKind = "image",
}: {
  label: string;
  name: string;
  value?: string | null;
  folder: string;
  publicIdPrefix: string;
  hint?: string;
  className?: string;
  assetKind?: AssetKind;
}) {
  const inputId = useId();
  const [currentValue, setCurrentValue] = useState(value || "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string | null>(null);

  async function handleFileChange(file: File | null) {
    if (!file) return;

    const formData = new FormData();
    formData.set("file", file);
    formData.set("folder", folder);
    formData.set("public_id_prefix", publicIdPrefix);
    formData.set("asset_kind", assetKind);

    setUploading(true);
    setError(null);
    setStatusText(`Uploading ${assetKind} to Cloudinary...`);

    try {
      const response = await fetch("/api/owner/care-media", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            secureUrl?: string;
            error?: string;
          }
        | null;

      if (!response.ok || !payload?.ok || !payload.secureUrl) {
        const message = payload?.error || "Cloudinary upload failed.";
        setError(message);
        setStatusText(null);
        emitCareToast({
          tone: "error",
          title: `${label} upload failed`,
          description: message,
        });
        return;
      }

      setCurrentValue(payload.secureUrl);
      setStatusText(`${label} is ready and the settings field has been updated.`);
      emitCareToast({
        tone: "success",
        title: `${label} uploaded`,
        description: "The media URL has been inserted into the settings form.",
      });
    } catch {
      const message = "Network error while uploading to Cloudinary.";
      setError(message);
      setStatusText(null);
      emitCareToast({
        tone: "error",
        title: `${label} upload failed`,
        description: message,
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={cn("grid gap-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={`${inputId}-url`} className="text-sm font-semibold text-zinc-800 dark:text-white/85">
          {label}
        </label>
        <label
          htmlFor={inputId}
          className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-[color:var(--accent)]/35 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
          {uploading ? "Uploading..." : assetKind === "video" ? "Upload video" : "Upload image"}
        </label>
      </div>

      <input type="hidden" name={name} value={currentValue} />

      <input
        id={`${inputId}-url`}
        value={currentValue}
        onChange={(event) => {
          setCurrentValue(event.target.value);
          setError(null);
          setStatusText(null);
        }}
        placeholder={
          assetKind === "video"
            ? "Paste an existing Cloudinary video URL or upload a new file"
            : "Paste an existing Cloudinary image URL or upload a new file"
        }
        className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-zinc-900 shadow-sm outline-none transition focus:border-[color:var(--accent)]/50 dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white"
      />

      <input
        id={inputId}
        type="file"
        accept={acceptForKind(assetKind)}
        className="hidden"
        onChange={(event) => void handleFileChange(event.target.files?.[0] ?? null)}
      />

      <div className="rounded-[1.6rem] border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/[0.04]">
        {currentValue ? (
          <div className="overflow-hidden rounded-[1.2rem] border border-black/10 bg-white/80 dark:border-white/10 dark:bg-white/[0.05]">
            {assetKind === "video" ? (
              <video src={currentValue} controls className="h-56 w-full bg-black object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentValue} alt={`${label} preview`} className="h-48 w-full object-cover" />
            )}
          </div>
        ) : (
          <div className="flex min-h-[10rem] items-center justify-center rounded-[1.2rem] border border-dashed border-black/12 bg-white/75 text-sm font-medium text-zinc-500 dark:border-white/12 dark:bg-white/[0.05] dark:text-white/50">
            <span className="inline-flex items-center gap-2">
              {assetKind === "video" ? <Video className="h-4 w-4" /> : <ImagePlus className="h-4 w-4" />}
              {assetKind === "video"
                ? "Upload an MP4, WebM, or MOV video"
                : "Upload a JPG, PNG, or WebP image"}
            </span>
          </div>
        )}
      </div>

      {statusText ? (
        <div className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-xs leading-6 text-emerald-700 dark:text-emerald-100">
          {statusText}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-xs leading-6 text-red-700 dark:text-red-100">
          <span className="inline-flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </span>
        </div>
      ) : null}

      {hint ? (
        <div className="text-xs leading-6 text-zinc-500 dark:text-white/50">{hint}</div>
      ) : null}
    </div>
  );
}
