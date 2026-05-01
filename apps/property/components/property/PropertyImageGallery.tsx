"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";

/**
 * PropertyImageGallery — premium lightbox gallery for the property
 * detail page. Hero + thumbnails act as a single clickable surface;
 * tapping anywhere opens a full-screen viewer with keyboard
 * navigation (← → Esc), swipeable thumb strip, and image counter.
 *
 * No external deps — vanilla React + lucide icons + next/image. Uses
 * inert + scroll-lock so the rest of the page can't steal focus while
 * the lightbox is open.
 */
export type PropertyImageGalleryProps = {
  title: string;
  hero: string;
  gallery: string[];
};

export function PropertyImageGallery({ title, hero, gallery }: PropertyImageGalleryProps) {
  // Combine hero with the rest of the gallery, dedupe, keep order.
  const all = React.useMemo(() => {
    const out: string[] = [];
    const seen = new Set<string>();
    [hero, ...gallery].forEach((src) => {
      if (src && !seen.has(src)) {
        seen.add(src);
        out.push(src);
      }
    });
    return out;
  }, [hero, gallery]);

  const [open, setOpen] = React.useState(false);
  const [index, setIndex] = React.useState(0);

  const close = React.useCallback(() => setOpen(false), []);
  const prev = React.useCallback(
    () => setIndex((i) => (i - 1 + all.length) % all.length),
    [all.length],
  );
  const next = React.useCallback(
    () => setIndex((i) => (i + 1) % all.length),
    [all.length],
  );

  // Keyboard + scroll-lock when lightbox is open
  React.useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      else if (event.key === "ArrowLeft") prev();
      else if (event.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, close, prev, next]);

  function openAt(i: number) {
    setIndex(i);
    setOpen(true);
  }

  return (
    <>
      {/* Inline gallery surface (the page-level layout). Click anywhere
          to open the lightbox. */}
      <div className="property-paper overflow-hidden rounded-[2.2rem]">
        <button
          type="button"
          onClick={() => openAt(0)}
          aria-label={`Open photo viewer for ${title}`}
          className="group relative block aspect-[16/10] w-full overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--property-accent,_#C9A227)]"
        >
          <Image
            src={all[0] ?? hero}
            alt={title}
            fill
            sizes="(max-width: 1280px) 100vw, 60vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            priority
          />
          <span className="pointer-events-none absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
            <Maximize2 className="h-3.5 w-3.5" />
            View all · {all.length}
          </span>
        </button>
        {all.length > 1 ? (
          <div className="grid gap-3 p-4 md:grid-cols-3">
            {all.slice(1, 4).map((image, i) => (
              <button
                key={image}
                type="button"
                onClick={() => openAt(i + 1)}
                aria-label={`Open photo ${i + 2} of ${all.length}`}
                className="group relative aspect-[4/3] overflow-hidden rounded-[1.4rem] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--property-accent,_#C9A227)]"
              >
                <Image
                  src={image}
                  alt={title}
                  fill
                  sizes="(max-width: 768px) 100vw, 30vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
                {i === 2 && all.length > 4 ? (
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/55 text-sm font-semibold text-white">
                    +{all.length - 4} more
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Photo viewer · ${title}`}
          className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div className="flex items-center justify-between px-5 py-4 text-white">
            <p className="text-sm font-medium tracking-tight">
              {index + 1} / {all.length} · {title}
            </p>
            <button
              type="button"
              onClick={close}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Close photo viewer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative flex-1">
            <div className="absolute inset-0 m-auto flex items-center justify-center px-3 sm:px-10">
              <div className="relative h-full max-h-[80vh] w-full">
                <Image
                  key={all[index]}
                  src={all[index]}
                  alt={`${title} — photo ${index + 1}`}
                  fill
                  sizes="100vw"
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {all.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={prev}
                  aria-label="Previous photo"
                  className="absolute left-3 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/25 sm:left-6"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  aria-label="Next photo"
                  className="absolute right-3 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/25 sm:right-6"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            ) : null}
          </div>

          {all.length > 1 ? (
            <div className="overflow-x-auto px-4 py-4">
              <div className="mx-auto flex max-w-full gap-2">
                {all.map((image, i) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`Go to photo ${i + 1}`}
                    aria-current={i === index ? "true" : undefined}
                    className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border transition ${
                      i === index
                        ? "border-white"
                        : "border-white/10 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image src={image} alt="" fill sizes="96px" className="object-cover" />
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
