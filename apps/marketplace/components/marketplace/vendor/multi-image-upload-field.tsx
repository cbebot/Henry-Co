"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { ImagePlus, LoaderCircle, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Labels = {
  /** Empty-state prompt on the first add tile. */
  addFirst: string;
  /** Add-more tile. */
  add: string;
  uploading: string;
  failed: string;
  remove: string;
  makeCover: string;
  /** Badge on the first (cover) image. */
  cover: string;
  /** Hint under the grid. */
  coverHint: string;
};

type Item = { id: string; value: string; preview: string };

let seq = 0;
const nextId = () => `img-${Date.now().toString(36)}-${(seq += 1)}`;

/**
 * Multi-image upload for vendor product forms. The platform's product gallery already
 * supports many images with a cover; this brings the WRITE path up to it. Vendors add
 * several photos at once, remove any, and pick which one is the cover — the FIRST image
 * is the product's sample/cover, the rest sit behind it in the gallery. The ordered list
 * of media values is serialized into a single hidden input (JSON) under `name`, so the
 * existing product upsert persists it with one added field; an empty array leaves the
 * current photos untouched (draft-safe). All copy arrives translated via `labels`.
 */
export function MultiImageUploadField({
  name,
  scope,
  label,
  hint,
  initial,
  max = 8,
  labels,
}: {
  name: string;
  scope: "product" | "store";
  label: string;
  hint?: string;
  /** Existing image values (display URLs on edit) — become both the preview and the kept value. */
  initial?: string[];
  max?: number;
  labels: Labels;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [items, setItems] = useState<Item[]>(() =>
    (initial ?? [])
      .filter((url): url is string => Boolean(url))
      .slice(0, max)
      .map((url) => ({ id: nextId(), value: url, preview: url })),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const serialized = useMemo(() => JSON.stringify(items.map((item) => item.value)), [items]);
  const atCapacity = items.length >= max;

  const pick = useCallback(() => inputRef.current?.click(), []);

  const onFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const files = Array.from(fileList);
      setError(null);
      setBusy(true);
      try {
        for (const file of files) {
          // Respect the cap even mid-batch.
          let full = false;
          setItems((prev) => {
            full = prev.length >= max;
            return prev;
          });
          if (full) break;

          const body = new FormData();
          body.set("image", file);
          body.set("scope", scope);
          const res = await fetch("/api/marketplace/images", { method: "POST", body });
          const json = (await res.json().catch(() => null)) as {
            ok?: boolean;
            ref?: string;
            url?: string | null;
            error?: string;
          } | null;
          if (!json?.ok || !json.ref) {
            setError(labels.failed);
            continue;
          }
          const value = json.ref;
          const preview = json.url || json.ref;
          setItems((prev) => (prev.length >= max ? prev : [...prev, { id: nextId(), value, preview }]));
        }
      } finally {
        setBusy(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [labels.failed, max, scope],
  );

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const makeCover = useCallback((id: string) => {
    setItems((prev) => {
      const idx = prev.findIndex((item) => item.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      const [chosen] = next.splice(idx, 1);
      next.unshift(chosen);
      return next;
    });
  }, []);

  return (
    <div>
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
        {label}
      </span>
      {/* What the form posts: an ordered JSON array of media values (first = cover). */}
      <input type="hidden" name={name} value={serialized} />
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        onChange={(event) => void onFiles(event.target.files)}
      />

      {hint ? <p className="mt-1.5 text-[12px] leading-5 text-[var(--market-muted)]">{hint}</p> : null}

      <div className="mt-3 flex flex-wrap gap-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="group relative h-24 w-24 overflow-hidden rounded-2xl border border-[var(--market-line-strong)] bg-[color:var(--market-fill-faint)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- object-URL / storage preview */}
            <img src={item.preview} alt="" className="h-full w-full object-cover" />

            {index === 0 ? (
              <span className="absolute left-1 top-1 rounded-full bg-[var(--market-brass)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-black/85">
                {labels.cover}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => makeCover(item.id)}
                aria-label={labels.makeCover}
                title={labels.makeCover}
                className="absolute left-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/55 text-white opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100"
              >
                <Star className="h-3.5 w-3.5" aria-hidden />
              </button>
            )}

            <button
              type="button"
              onClick={() => remove(item.id)}
              aria-label={labels.remove}
              title={labels.remove}
              className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/55 text-white opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        ))}

        {atCapacity ? null : (
          <button
            type="button"
            onClick={pick}
            disabled={busy}
            aria-label={items.length === 0 ? labels.addFirst : labels.add}
            className={cn(
              "grid h-24 w-24 shrink-0 place-items-center rounded-2xl border border-dashed border-[var(--market-line-strong)] bg-[color:var(--market-fill-faint)] text-[var(--market-muted)] transition hover:text-[var(--market-paper-white)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--market-brass)] disabled:opacity-60",
            )}
          >
            {busy ? (
              <LoaderCircle className="h-5 w-5 animate-spin" aria-label={labels.uploading} />
            ) : (
              <span className="flex flex-col items-center gap-1">
                <ImagePlus className="h-5 w-5" aria-hidden />
                <span className="text-[10px] font-semibold">
                  {items.length === 0 ? labels.addFirst : labels.add}
                </span>
              </span>
            )}
          </button>
        )}
      </div>

      <p className="mt-2 text-[11px] leading-5 text-[var(--market-muted)]">{labels.coverHint}</p>
      {error ? (
        <p className="mt-1 text-[12px] leading-5 text-[color:var(--market-warn,#b45309)]">{error}</p>
      ) : null}
    </div>
  );
}
