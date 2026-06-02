"use client";

import {
  forwardRef,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ChangeEvent,
  type DragEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import Link from "next/link";
import { ChevronLeft, Loader2, Plus, Trash2, Upload } from "lucide-react";

/**
 * Shared form + chrome primitives for every Owner-CMS editing surface. One
 * source of truth so Pages, Brand, Divisions, People, Homepage, and FAQs are
 * visually and architecturally identical. Token-styled; no surface-specific
 * logic lives here.
 */

const INPUT =
  "w-full rounded-xl border border-[var(--hc-line)] bg-[var(--hc-surface)] px-3.5 py-2.5 text-sm text-[var(--hc-ink)] outline-none transition-all placeholder:text-[var(--hc-ink-muted)] focus:border-[var(--hc-accent)] focus:ring-2 focus:ring-[var(--hc-accent-soft)]";

export type ToastMessage = { ok: boolean; text: string } | null;

export function Field({
  label,
  hint,
  htmlFor,
  error,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-[var(--hc-ink)]">{label}</span>
        {hint ? <span className="text-xs text-[var(--hc-ink-muted)]">{hint}</span> : null}
      </span>
      <span className="mt-1.5 block">{children}</span>
      {error ? <span className="mt-1 block text-xs font-medium text-rose-600">{error}</span> : null}
    </label>
  );
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className, ...props }, ref) {
    return <input ref={ref} {...props} className={`${INPUT} ${className ?? ""}`} />;
  }
);

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function TextArea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        {...props}
        className={`${INPUT} min-h-[104px] resize-y leading-6 ${className ?? ""}`}
      />
    );
  }
);

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`${INPUT} ${className ?? ""}`}>
      {children}
    </select>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-[var(--hc-line)] bg-[var(--hc-surface)] px-4 py-3 text-left transition-colors hover:border-[var(--hc-accent)]"
    >
      <span>
        <span className="block text-sm font-medium text-[var(--hc-ink)]">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs text-[var(--hc-ink-muted)]">{description}</span>
        ) : null}
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-[var(--hc-accent)]" : "bg-[var(--hc-line)]"
        }`}
        aria-hidden
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? "left-[1.375rem]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

/** Editor for a plain string[] (e.g. division highlights). */
export function TextList({
  values,
  onChange,
  placeholder,
  addLabel = "Add item",
}: {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  addLabel?: string;
}) {
  return (
    <div className="space-y-2">
      {values.map((value, index) => (
        <div key={index} className="flex items-center gap-2">
          <TextInput
            value={value}
            placeholder={placeholder}
            onChange={(e) => {
              const next = values.slice();
              next[index] = e.target.value;
              onChange(next);
            }}
          />
          <DangerIconButton
            onClick={() => onChange(values.filter((_, i) => i !== index))}
            aria-label="Remove item"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </DangerIconButton>
        </div>
      ))}
      <GhostButton type="button" onClick={() => onChange([...values, ""])}>
        <Plus className="h-4 w-4" aria-hidden /> {addLabel}
      </GhostButton>
    </div>
  );
}

export function Card({
  title,
  desc,
  actions,
  children,
}: {
  title?: string;
  desc?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--hc-line)] bg-[var(--hc-surface)] p-5 sm:p-6">
      {title ? (
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--hc-accent-text)]">
              {title}
            </h2>
            {desc ? <p className="mt-1 text-sm text-[var(--hc-ink-muted)]">{desc}</p> : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      ) : null}
      <div className={title ? "mt-4 space-y-4" : "space-y-4"}>{children}</div>
    </section>
  );
}

export function StatusPill({
  tone,
  children,
}: {
  tone: "published" | "live" | "draft" | "muted";
  children: ReactNode;
}) {
  const cls = {
    published: "bg-emerald-100 text-emerald-700",
    live: "bg-emerald-100 text-emerald-700",
    draft: "bg-amber-100 text-amber-700",
    muted: "bg-[var(--owner-accent-soft)] text-[var(--hc-accent-text)]",
  }[tone];
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>{children}</span>;
}

export function EditorHeader({
  backHref,
  backLabel = "Back",
  title,
  status,
  actions,
  description,
}: {
  backHref?: string;
  backLabel?: string;
  title: string;
  status?: ReactNode;
  actions?: ReactNode;
  description?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      {backHref ? (
        <Link
          href={backHref}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[var(--hc-ink-muted)] transition-colors hover:text-[var(--hc-ink)]"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden /> {backLabel}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--hc-ink)]">{title}</h1>
          {status}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      {description ? (
        <p className="max-w-2xl text-sm leading-6 text-[var(--hc-ink-muted)]">{description}</p>
      ) : null}
    </div>
  );
}

/** Sticky bottom action bar. Pass the action buttons as children (right-aligned). */
export function SaveBar({
  dirty,
  message,
  children,
}: {
  dirty: boolean;
  message?: ToastMessage;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--hc-line)] bg-[var(--hc-surface)] lg:left-[var(--owner-sidebar-width)]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-6 py-3 lg:px-10">
        <span className="flex items-center gap-2 text-sm">
          <span
            className={`h-2 w-2 rounded-full ${dirty ? "bg-amber-500" : "bg-emerald-500"}`}
            aria-hidden
          />
          <span className="text-[var(--hc-ink-muted)]">
            {dirty ? "Unsaved changes" : "All changes saved"}
          </span>
        </span>
        {message ? (
          <span
            className={`text-sm font-medium ${message.ok ? "text-emerald-600" : "text-rose-600"}`}
          >
            {message.text}
          </span>
        ) : null}
        <div className="ml-auto flex items-center gap-2">{children}</div>
      </div>
    </div>
  );
}

export function Spinner() {
  return <Loader2 className="h-4 w-4 animate-spin" aria-hidden />;
}

export function PrimaryButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[var(--hc-accent)] px-4 text-sm font-semibold text-[#1a1408] transition-colors hover:bg-[var(--hc-accent-strong)] disabled:cursor-not-allowed disabled:opacity-60 ${className ?? ""}`}
    />
  );
}

export function SecondaryButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[var(--hc-line)] px-4 text-sm font-semibold text-[var(--hc-ink)] transition-colors hover:border-[var(--hc-accent)] disabled:cursor-not-allowed disabled:opacity-50 ${className ?? ""}`}
    />
  );
}

export function GhostButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center gap-1.5 rounded-xl border border-dashed border-[var(--hc-line)] px-3.5 py-2.5 text-sm font-medium text-[var(--hc-ink-soft)] transition-colors hover:border-[var(--hc-accent)] hover:text-[var(--hc-ink)] disabled:opacity-60 ${className ?? ""}`}
    />
  );
}

export function IconButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`rounded-lg p-1.5 text-[var(--hc-ink-muted)] transition-colors hover:bg-[var(--hc-accent-soft)] hover:text-[var(--hc-ink)] disabled:opacity-40 disabled:hover:bg-transparent ${className ?? ""}`}
    />
  );
}

export function DangerIconButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`rounded-lg p-1.5 text-[var(--hc-ink-muted)] transition-colors hover:bg-rose-500/10 hover:text-rose-600 disabled:opacity-40 ${className ?? ""}`}
    />
  );
}

type UploadSignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
};

/**
 * Real direct image upload. Requests a signed Cloudinary upload from our
 * owner-gated /api/upload route, uploads the file straight to Cloudinary, and
 * returns the secure URL via onChange. A URL field stays as a manual fallback.
 */
export function ImageUpload({
  label,
  value,
  onChange,
  folder = "henryco/cms",
  hint,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showUrl, setShowUrl] = useState(false);

  async function upload(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const signRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder }),
      });
      if (!signRes.ok) {
        const j = (await signRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || "Could not start the upload.");
      }
      const sign = (await signRes.json()) as UploadSignature;
      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sign.apiKey);
      form.append("timestamp", String(sign.timestamp));
      form.append("folder", sign.folder);
      form.append("signature", sign.signature);
      const upRes = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`, {
        method: "POST",
        body: form,
      });
      const data = (await upRes.json().catch(() => ({}))) as {
        secure_url?: string;
        error?: { message?: string };
      };
      if (!upRes.ok || !data.secure_url) {
        throw new Error(data.error?.message || "The image upload failed.");
      }
      onChange(data.secure_url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The image upload failed.");
    } finally {
      setBusy(false);
    }
  }

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void upload(file);
    e.target.value = "";
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void upload(file);
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-[var(--hc-ink)]">{label}</span>
        {hint ? <span className="text-xs text-[var(--hc-ink-muted)]">{hint}</span> : null}
      </div>
      <input ref={inputRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          if (!busy) inputRef.current?.click();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`mt-1.5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
          dragOver
            ? "border-[var(--hc-accent)] bg-[var(--hc-accent-soft)]"
            : "border-[var(--hc-line)] bg-[var(--hc-bg-soft)] hover:border-[var(--hc-accent)]"
        }`}
      >
        {value ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="h-28 w-auto max-w-full rounded-lg object-contain" />
            {busy ? (
              <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
                <Loader2 className="h-5 w-5 animate-spin text-white" aria-hidden />
              </span>
            ) : null}
          </div>
        ) : busy ? (
          <Loader2 className="h-7 w-7 animate-spin text-[var(--hc-accent-text)]" aria-hidden />
        ) : (
          <Upload className="h-7 w-7 text-[var(--hc-ink-muted)]" aria-hidden />
        )}
        <div className="text-sm leading-5">
          <span className="font-medium text-[var(--hc-ink)]">
            {value ? "Replace image" : "Upload from your device"}
          </span>
          <span className="text-[var(--hc-ink-muted)]">
            {" "}
            — drag &amp; drop, or click to choose a photo or file
          </span>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="font-medium text-[var(--hc-ink-muted)] transition-colors hover:text-rose-600"
          >
            Remove
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setShowUrl((s) => !s)}
          className="font-medium text-[var(--hc-ink-muted)] transition-colors hover:text-[var(--hc-accent-text)]"
        >
          {showUrl ? "Hide link option" : "Or paste a link"}
        </button>
        {error ? <span className="font-medium text-rose-600">{error}</span> : null}
      </div>
      {showUrl ? (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          className="mt-2 w-full rounded-lg border border-[var(--hc-line)] bg-[var(--hc-surface)] px-2.5 py-1.5 text-xs text-[var(--hc-ink)] outline-none transition-colors focus:border-[var(--hc-accent)]"
        />
      ) : null}
    </div>
  );
}
