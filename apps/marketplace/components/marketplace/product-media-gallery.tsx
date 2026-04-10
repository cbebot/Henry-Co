"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, Play, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ProductMediaGalleryProps = {
  title: string;
  gallery: string[];
};

function isVideoUrl(url: string) {
  return /(?:\/video\/upload\/|\.mp4$|\.webm$|\.ogg$|\.mov$)/i.test(url);
}

function renderMedia(url: string, title: string, priority = false) {
  if (isVideoUrl(url)) {
    return (
      <video
        controls
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
        poster=""
      >
        <source src={url} />
        {title}
      </video>
    );
  }

  return (
    <Image
      src={url}
      alt={title}
      fill
      priority={priority}
      sizes="(max-width: 1280px) 100vw, 54vw"
      className="object-cover"
    />
  );
}

export function ProductMediaGallery({ title, gallery }: ProductMediaGalleryProps) {
  const media = gallery.length
    ? gallery
    : ["https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1600&q=80"];
  const [activeIndex, setActiveIndex] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "ArrowRight") setActiveIndex((current) => (current + 1) % media.length);
      if (event.key === "ArrowLeft") setActiveIndex((current) => (current - 1 + media.length) % media.length);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [media.length, open]);

  const activeUrl = media[activeIndex] || media[0];

  return (
    <>
      <div className="space-y-4">
        <article className="market-panel overflow-hidden rounded-[2.3rem]">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group relative block aspect-[4/4.55] w-full text-left"
          >
            {renderMedia(activeUrl, title, true)}
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(4,7,13,0.78)] via-[rgba(4,7,13,0.06)] to-transparent transition group-hover:from-[rgba(4,7,13,0.62)]" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5">
              <div className="max-w-[70%]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgba(255,255,255,0.72)]">
                  {isVideoUrl(activeUrl) ? "Product video" : "Gallery preview"}
                </p>
                <p className="mt-2 text-sm leading-6 text-[rgba(255,255,255,0.82)]">
                  Tap to open the full-screen viewer and inspect materials, finish, and detail.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(2,4,10,0.62)] px-4 py-2 text-sm font-semibold text-[var(--market-paper-white)] backdrop-blur-xl">
                {isVideoUrl(activeUrl) ? <Play className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
                Open viewer
              </span>
            </div>
          </button>
        </article>

        {media.length > 1 ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {media.slice(0, 6).map((item, index) => (
              <button
                key={`${item}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "relative aspect-[4/3] overflow-hidden rounded-[1.5rem] border bg-[rgba(255,255,255,0.04)] text-left transition",
                  activeIndex === index
                    ? "border-[var(--market-brass)] ring-1 ring-[rgba(221,182,120,0.28)]"
                    : "border-[var(--market-line)]"
                )}
              >
                {renderMedia(item, `${title} ${index + 1}`)}
                {isVideoUrl(item) ? (
                  <span className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(2,4,10,0.62)] text-[var(--market-paper-white)]">
                    <Play className="h-4 w-4" />
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {open ? (
        <div className="fixed inset-0 z-[90] bg-[rgba(3,5,10,0.92)] backdrop-blur-xl">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-4 border-b border-[rgba(255,255,255,0.08)] px-4 py-4 sm:px-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgba(255,255,255,0.56)]">
                  HenryCo product viewer
                </p>
                <h2 className="mt-1 text-lg font-semibold text-[var(--market-paper-white)]">{title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(255,255,255,0.1)] text-[var(--market-paper-white)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative flex-1 px-4 py-4 sm:px-6 sm:py-6">
              <div className="relative h-full overflow-hidden rounded-[2rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)]">
                {renderMedia(activeUrl, title)}
              </div>

              {media.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveIndex((current) => (current - 1 + media.length) % media.length)}
                    className="absolute left-7 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(3,5,10,0.72)] text-[var(--market-paper-white)]"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveIndex((current) => (current + 1) % media.length)}
                    className="absolute right-7 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(3,5,10,0.72)] text-[var(--market-paper-white)]"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              ) : null}
            </div>

            {media.length > 1 ? (
              <div className="grid max-h-[18vh] grid-cols-3 gap-3 overflow-x-auto border-t border-[rgba(255,255,255,0.08)] px-4 py-4 sm:grid-cols-6 sm:px-6">
                {media.map((item, index) => (
                  <button
                    key={`${item}-viewer-${index}`}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={cn(
                      "relative aspect-[4/3] overflow-hidden rounded-[1.25rem] border bg-[rgba(255,255,255,0.04)]",
                      activeIndex === index ? "border-[var(--market-brass)]" : "border-[rgba(255,255,255,0.08)]"
                    )}
                  >
                    {renderMedia(item, `${title} ${index + 1}`)}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
