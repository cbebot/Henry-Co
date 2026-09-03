"use client";

import { useCallback, useRef, useState } from "react";
import { ImagePlus, LoaderCircle, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Labels = {
  drop: string;
  replace: string;
  remove: string;
  uploading: string;
  failed: string;
};

/**
 * Direct image upload for vendor forms — replaces the old "paste an image URL" text
 * inputs. Uploads on select to /api/marketplace/images (authed, validated, public
 * bucket) and carries the returned `media://` ref in a hidden input under the SAME
 * form field name, so the existing form intents persist it with zero server churn.
 * All copy arrives translated via `labels` (pages own their `t`).
 */
export function ImageUploadField({
  name,
  scope,
  label,
  hint,
  initialUrl,
  labels,
}: {
  name: string;
  scope: "product" | "store";
  label: string;
  hint?: string;
  initialUrl?: string | null;
  labels: Labels;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [ref, setRef] = useState<string>("");
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = useCallback(() => inputRef.current?.click(), []);

  const onFile = useCallback(
    async (file: File | null) => {
      if (!file) return;
      setBusy(true);
      setError(null);
      const local = URL.createObjectURL(file);
      setPreview(local);
      try {
        const body = new FormData();
        body.set("image", file);
        body.set("scope", scope);
        const res = await fetch("/api/marketplace/images", { method: "POST", body });
        const json = (await res.json()) as {
          ok: boolean;
          ref?: string;
          url?: string | null;
          error?: string;
        };
        if (!json.ok || !json.ref) throw new Error(json.error || "upload_failed");
        setRef(json.ref);
        if (json.url) setPreview(json.url);
      } catch {
        setError(labels.failed);
        setPreview(initialUrl ?? null);
        setRef("");
      } finally {
        URL.revokeObjectURL(local);
        setBusy(false);
      }
    },
    [initialUrl, labels.failed, scope],
  );

  const clear = useCallback(() => {
    setRef("");
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  return (
    <div>
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
        {label}
      </span>
      {/* What the form posts: the media:// ref (empty = unchanged/removed). */}
      <input type="hidden" name={name} value={ref} />
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => void onFile(event.target.files?.[0] ?? null)}
      />
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={pick}
          disabled={busy}
          aria-label={preview ? labels.replace : labels.drop}
          className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[var(--market-line-strong)] bg-[color:var(--market-fill-faint)] text-[var(--market-muted)] transition hover:text-[var(--market-paper-white)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--market-brass)] disabled:opacity-60"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- object-URL / storage preview
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-5 w-5" aria-hidden />
          )}
          {busy ? (
            <span className="absolute inset-0 grid place-items-center bg-black/40">
              <LoaderCircle className="h-5 w-5 animate-spin text-white" aria-label={labels.uploading} />
            </span>
          ) : null}
        </button>
        <div className="min-w-0 space-y-1.5">
          {hint ? <p className="text-[12px] leading-5 text-[var(--market-muted)]">{hint}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={pick}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--market-line)] px-3 py-1.5 text-[11.5px] font-semibold text-[var(--market-paper-white)] transition hover:border-[var(--market-line-strong)]"
            >
              <RefreshCw className="h-3 w-3" aria-hidden />
              {preview ? labels.replace : labels.drop}
            </button>
            {preview ? (
              <button
                type="button"
                onClick={clear}
                disabled={busy}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border border-[var(--market-line)] px-3 py-1.5 text-[11.5px] font-semibold text-[var(--market-muted)] transition hover:text-[var(--market-paper-white)]",
                )}
              >
                <X className="h-3 w-3" aria-hidden />
                {labels.remove}
              </button>
            ) : null}
          </div>
          {error ? (
            <p className="text-[12px] leading-5 text-[color:var(--market-warn,#b45309)]">{error}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
