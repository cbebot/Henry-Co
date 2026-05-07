"use client";

import { FileUp, X } from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";
import { cn } from "@henryco/ui/cn";

function truncateMiddle(name: string, max = 40) {
  if (name.length <= max) return name;
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")) : "";
  const base = ext ? name.slice(0, name.length - ext.length) : name;
  const budget = max - ext.length - 3;
  const head = Math.max(4, Math.floor(budget * 0.55));
  const tail = Math.max(3, budget - head);
  return `${base.slice(0, head)}…${base.slice(-tail)}${ext}`;
}

export interface PaymentFileFieldProps {
  name: string;
  title: string;
  description?: string;
  footerHint?: string;
  multiple?: boolean;
  required?: boolean;
  accept?: string;
  variant?: "full" | "compact";
  className?: string;
  /** Class name applied to the dropzone surface (overrides default). */
  dropzoneClassName?: string;
}

/**
 * PaymentFileField — drop-or-pick file input used for payment-proof
 * upload across every division. Visual language: dashed dropzone +
 * accent icon + truncated file label. Tap target ≥ 92px on compact
 * variant, 120px on full. Mirrors StudioFileField but parameterized
 * via CSS variables (--payment-surface, --payment-line, --payment-accent)
 * so each division can theme it.
 */
export function PaymentFileField({
  name,
  title,
  description,
  footerHint,
  multiple = false,
  required,
  accept,
  variant = "compact",
  className,
  dropzoneClassName,
}: PaymentFileFieldProps) {
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
    [files, multiple, syncInput],
  );

  const removeAt = useCallback(
    (index: number) => {
      syncInput(files.filter((_, i) => i !== index));
    },
    [files, syncInput],
  );

  const dropPad = variant === "compact" ? "min-h-[92px] px-4 py-5" : "min-h-[120px] px-6 py-8";
  const iconWrap = variant === "compact" ? "h-10 w-10" : "h-12 w-12";

  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <div
          id={titleId}
          className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--payment-accent,#97f4f3)]"
        >
          <FileUp className="h-3.5 w-3.5" aria-hidden />
          {title}
        </div>
        {description ? (
          <p id={hintId} className="mt-1 text-xs leading-5 text-[color:var(--payment-soft,rgba(255,255,255,0.65))]">
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
        className={cn(
          "group flex w-full flex-col items-center justify-center gap-2 rounded-[1.6rem] text-center transition outline-none",
          "border border-dashed border-[color:var(--payment-line,rgba(255,255,255,0.18))]",
          "bg-[color:var(--payment-surface,rgba(255,255,255,0.03))]",
          "[@media(hover:hover)]:hover:border-[color:var(--payment-accent,#97f4f3)]/40 [@media(hover:hover)]:hover:bg-[color:var(--payment-accent,#97f4f3)]/[0.06]",
          "focus-visible:ring-2 focus-visible:ring-[color:var(--payment-accent,#97f4f3)]/30",
          dropPad,
          dropzoneClassName,
        )}
      >
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-2xl border border-[color:var(--payment-line,rgba(255,255,255,0.18))] bg-black/15 text-[color:var(--payment-accent,#97f4f3)] transition group-hover:scale-[1.02]",
            iconWrap,
          )}
        >
          <FileUp className={variant === "compact" ? "h-4 w-4" : "h-5 w-5"} />
        </span>
        <span className="text-sm font-semibold text-[color:var(--payment-ink,white)]">
          {variant === "compact" ? "Add file" : "Tap to add files"}
        </span>
        <span className="max-w-sm text-xs leading-5 text-[color:var(--payment-soft,rgba(255,255,255,0.65))]">
          {multiple
            ? "Drag and drop here if your browser supports it — multiple files allowed."
            : "Drag and drop one file here, or tap to choose from your device."}
        </span>
      </button>

      {files.length > 0 ? (
        <ul className="space-y-2" aria-label="Files ready to upload">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${file.size}-${index}`}
              className="flex items-center gap-3 rounded-[1.2rem] border border-[color:var(--payment-line,rgba(255,255,255,0.18))] bg-black/12 px-4 py-3"
            >
              <span
                className="min-w-0 flex-1 truncate text-sm font-medium text-[color:var(--payment-ink,white)]"
                title={file.name}
              >
                {truncateMiddle(file.name)}
              </span>
              <span className="shrink-0 text-xs text-[color:var(--payment-soft,rgba(255,255,255,0.65))]">
                {file.size >= 1024 * 1024
                  ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                  : `${(file.size / 1024).toFixed(1)} KB`}
              </span>
              <button
                type="button"
                onClick={() => removeAt(index)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[color:var(--payment-line,rgba(255,255,255,0.18))] text-[color:var(--payment-soft,rgba(255,255,255,0.65))] transition hover:border-rose-400/35 hover:text-rose-200"
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-[color:var(--payment-soft,rgba(255,255,255,0.65))]">No file selected yet.</p>
      )}

      {footerHint ? (
        <p className="text-[11px] leading-5 text-[color:var(--payment-soft,rgba(255,255,255,0.65))]">{footerHint}</p>
      ) : null}
    </div>
  );
}
