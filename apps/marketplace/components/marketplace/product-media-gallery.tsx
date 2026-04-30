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
        <article className="overflow-hidden rounded-[1.8rem] border border-[var(--market-line)] bg-[rgba(0,0,0,0.06)]">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group relative block aspect-[4/4.55] w-full text-left"
            aria-label={`Open ${title} viewer`}
          >
            {renderMedia(activeUrl, title, true)}
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(4,7,13,0.62)] via-[rgba(4,7,13,0.0)] to-transparent transition group-hover:from-[rgba(4,7,13,0.5)]" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-white/72">
                {isVideoUrl(activeUrl) ? "Product video" : `Image ${activeIndex + 1} of ${media.length}`}
              </p>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-[rgba(2,4,10,0.55)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white backdrop-blur-md transition group-hover:border-white/30">
                {isVideoUrl(activeUrl) ? <Play className="h-3.5 w-3.5" /> : <Expand className="h-3.5 w-3.5" />}
                Viewer
              </span>
            </div>
          </button>
        </article>

        {media.length > 1 ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {media.slice(0, 6).map((item, index) => (
              <button
                key={`${item}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Show image ${index + 1}`}
                aria-current={activeIndex === index}
                className={cn(
                  "relative aspect-[4/3] overflow-hidden rounded-[1.2rem] border text-left transition hover:-translate-y-0.5",
                  activeIndex === index
                    ? "border-[var(--market-brass)]"
                    : "border-[var(--market-line)] hover:border-[var(--market-brass)]/55",
                )}
              >
                {renderMedia(item, `${title} ${index + 1}`)}
                {activeIndex === index ? (
                  <span className="absolute inset-0 ring-1 ring-inset ring-[rgba(221,182,120,0.4)]" />
                ) : null}
                {isVideoUrl(item) ? (
                  <span className="absolute right-2.5 top-2.5 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-[rgba(2,4,10,0.62)] text-white">
                    <Play className="h-3.5 w-3.5" />
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
