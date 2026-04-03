"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, UploadCloud, X } from "lucide-react";

type ImageFileFieldProps = {
  name: string;
  label: string;
  hint: string;
  accept?: string;
};

export default function ImageFileField({
  name,
  label,
  hint,
  accept = "image/jpeg,image/png,image/webp",
}: ImageFileFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="grid gap-3">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
        {label}
      </div>

      <label className="group flex cursor-pointer flex-col gap-4 rounded-[1.8rem] border border-dashed border-black/12 bg-black/[0.03] p-4 transition hover:border-[color:var(--accent)]/35 hover:bg-[color:var(--accent)]/6 dark:border-white/12 dark:bg-white/[0.04]">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--accent)]/10 text-[color:var(--accent)]">
            <UploadCloud className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-zinc-950 dark:text-white">
              {file ? file.name : "Choose an image"}
            </div>
            <div className="mt-1 text-sm leading-6 text-zinc-600 dark:text-white/65">{hint}</div>
          </div>
        </div>

        {previewUrl ? (
          <div className="overflow-hidden rounded-[1.4rem] border border-black/10 bg-white/80 dark:border-white/10 dark:bg-white/[0.05]">
            <Image
              src={previewUrl}
              alt="Selected upload preview"
              width={1200}
              height={1040}
              unoptimized
              className="h-52 w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex min-h-[10rem] items-center justify-center rounded-[1.4rem] border border-black/8 bg-white/70 text-zinc-500 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/48">
            <div className="inline-flex items-center gap-2 text-sm font-medium">
              <ImagePlus className="h-4 w-4" />
              JPG, PNG, or WebP under 8MB
            </div>
          </div>
        )}

        <input
          ref={inputRef}
          name={name}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(event) => {
            const nextFile = event.target.files?.[0] ?? null;
            setFile(nextFile);
          }}
        />
      </label>

      {file ? (
        <button
          type="button"
          onClick={() => {
            setFile(null);
            if (inputRef.current) {
              inputRef.current.value = "";
            }
          }}
          className="inline-flex w-fit items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-[color:var(--accent)]/35 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
        >
          <X className="h-4 w-4" />
          Remove image
        </button>
      ) : null}
    </div>
  );
}
