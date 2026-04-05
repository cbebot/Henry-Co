"use client";

import { FileUp, X } from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";

function truncateMiddle(name: string, max = 40) {
  if (name.length <= max) return name;
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")) : "";
  const base = ext ? name.slice(0, name.length - ext.length) : name;
  const budget = max - ext.length - 3;
  const head = Math.max(4, Math.floor(budget * 0.55));
  const tail = Math.max(3, budget - head);
  return `${base.slice(0, head)}…${base.slice(-tail)}${ext}`;
}

export function StudioFileField({
  name,
  title,
  description,
  footerHint,
  multiple = false,
  required,
  accept,
  variant = "full",
}: {
  name: string;
  title: string;
  description?: string;
  footerHint?: string;
  multiple?: boolean;
  required?: boolean;
  accept?: string;
  variant?: "full" | "compact";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const titleId = useId();
  const hintId = useId();

  const syncInput = useCallback((next: File[]) => {
    setFiles(next);
    const el = inputRef.current;
    if (!el) return;
    const dt = new DataTransfer();
    next.forEach((f) => dt.items.add(f));
    el.files = dt.files;
  }, []);

  const onPick = useCallback(
    (list: FileList | null) => {
      if (!list?.length) return;
      const arr = Array.from(list);
      if (multiple) {
        syncInput([...files, ...arr]);
      } else {
        syncInput(arr.slice(0, 1));
      }
    },
    [files, multiple, syncInput]
  );

  const removeAt = useCallback(
    (index: number) => {
      syncInput(files.filter((_, i) => i !== index));
    },
    [files, syncInput]
  );

  const dropPad = variant === "compact" ? "min-h-[92px] px-4 py-5" : "min-h-[120px] px-6 py-8";
  const iconWrap = variant === "compact" ? "h-10 w-10" : "h-12 w-12";

  return (
    <div className="space-y-3">
      <div>
        <div id={titleId} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--studio-signal)]">
          <FileUp className="h-3.5 w-3.5" aria-hidden />
          {title}
        </div>
        {description ? (
          <p id={hintId} className="mt-1 text-xs leading-5 text-[var(--studio-ink-soft)]">
            {description}
          </p>
        ) : null}
      </div>

      <input
        ref={inputRef}
        name={name}
        type="file"
        multiple={multiple}
        required={required}
        accept={accept}
        className="sr-only"
        aria-labelledby={titleId}
        aria-describedby={description ? hintId : undefined}
        onChange={(e) => onPick(e.target.files)}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onPick(e.dataTransfer.files);
        }}
        className={`group flex w-full flex-col items-center justify-center gap-2 rounded-[1.6rem] border border-dashed border-[var(--studio-line-strong)] bg-[color-mix(in_srgb,var(--studio-surface)_88%,transparent)] text-center transition hover:border-[rgba(151,244,243,0.4)] hover:bg-[rgba(151,244,243,0.06)] focus:outline-none focus:ring-2 focus:ring-[rgba(88,212,210,0.25)] ${dropPad}`}
      >
        <span
          className={`inline-flex ${iconWrap} items-center justify-center rounded-2xl border border-[var(--studio-line)] bg-black/15 text-[var(--studio-signal)] transition group-hover:scale-[1.02]`}
        >
          <FileUp className={variant === "compact" ? "h-4 w-4" : "h-5 w-5"} />
        </span>
        <span className="text-sm font-semibold text-[var(--studio-ink)]">
          {variant === "compact" ? "Add file" : "Tap to add files"}
        </span>
        <span className="max-w-sm text-xs leading-5 text-[var(--studio-ink-soft)]">
          {multiple
            ? "Drag and drop here if your browser supports it—multiple files allowed."
            : "Drag and drop one file here, or tap to choose from your device."}
        </span>
      </button>

      {files.length > 0 ? (
        <ul className="space-y-2" aria-label="Files ready to upload">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${file.size}-${index}`}
              className="flex items-center gap-3 rounded-[1.2rem] border border-[var(--studio-line)] bg-black/12 px-4 py-3"
            >
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--studio-ink)]" title={file.name}>
                {truncateMiddle(file.name)}
              </span>
              <span className="shrink-0 text-xs text-[var(--studio-ink-soft)]">
                {file.size >= 1024 * 1024
                  ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                  : `${(file.size / 1024).toFixed(1)} KB`}
              </span>
              <button
                type="button"
                onClick={() => removeAt(index)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--studio-line)] text-[var(--studio-ink-soft)] transition hover:border-rose-400/35 hover:text-rose-200"
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-[var(--studio-ink-soft)]">No file selected yet.</p>
      )}

      {footerHint ? <p className="text-[11px] leading-5 text-[var(--studio-ink-soft)]">{footerHint}</p> : null}
    </div>
  );
}
