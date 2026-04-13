"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type ProductGalleryProps = {
  images: string[];
  title: string;
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1600&q=80";

export function ProductGallery({ images, title }: ProductGalleryProps) {
  const safeImages = images.length ? images : [FALLBACK_IMAGE];
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const isOpen = lightboxIndex !== null;

  const open = useCallback((index: number) => setLightboxIndex(index), []);
  const close = useCallback(() => setLightboxIndex(null), []);

  const next = useCallback(() => {
    setLightboxIndex((current) => {
      if (current === null) return current;
      return (current + 1) % safeImages.length;
    });
  }, [safeImages.length]);

  const prev = useCallback(() => {
    setLightboxIndex((current) => {
      if (current === null) return current;
      return (current - 1 + safeImages.length) % safeImages.length;
    });
  }, [safeImages.length]);

  useEffect(() => {
    if (!isOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") next();
      if (event.key === "ArrowLeft") prev();
    };

    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, close, next, prev]);

  return (
    <>
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => open(0)}
          className="market-panel group block w-full overflow-hidden rounded-[2.3rem] text-left"
          aria-label={`Open ${title} in full screen`}
        >
          <div className="relative aspect-[4/4.55]">
            <Image
              src={safeImages[0]}
              alt={title}
              fill
              sizes="(max-width: 1280px) 100vw, 54vw"
              className="object-cover transition duration-500 group-hover:scale-[1.02]"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(4,7,13,0.72)] via-transparent to-transparent" />
            <div className="absolute bottom-4 right-4 rounded-full border border-[var(--market-line)] bg-[rgba(4,7,13,0.55)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--market-paper-white)] backdrop-blur">
              Click to zoom
            </div>
          </div>
        </button>

        {safeImages.length > 1 ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {safeImages.slice(1, 4).map((image, index) => (
              <button
                type="button"
                key={`${image}-${index}`}
                onClick={() => open(index + 1)}
                className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] transition hover:border-[var(--market-brass)]"
                aria-label={`View image ${index + 2} of ${title}`}
              >
                <Image
                  src={image}
                  alt={`${title} ${index + 2}`}
                  fill
                  sizes="33vw"
                  className="object-cover"
                />
              </button>
            ))}
            {safeImages.length > 4 ? (
              <button
                type="button"
                onClick={() => open(4)}
                className="market-paper flex aspect-[4/3] items-center justify-center rounded-[1.5rem] text-sm font-semibold uppercase tracking-[0.18em] text-[var(--market-paper-white)]"
              >
                +{safeImages.length - 4} more
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {isOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title} image viewer`}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(4,7,13,0.92)] p-4 backdrop-blur-lg"
          onClick={close}
        >
          <div
            className="relative max-h-[92vh] w-full max-w-[1200px]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={close}
              className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--market-line)] bg-[rgba(4,7,13,0.65)] text-[var(--market-paper-white)] hover:bg-[rgba(4,7,13,0.85)]"
              aria-label="Close image viewer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2rem] border border-[var(--market-line)] bg-[rgba(4,7,13,0.55)]">
              <Image
                src={safeImages[lightboxIndex!]}
                alt={`${title} image ${lightboxIndex! + 1}`}
                fill
                sizes="(max-width: 1280px) 100vw, 1200px"
                className="object-contain"
              />
            </div>

            {safeImages.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={prev}
                  className="absolute left-4 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--market-line)] bg-[rgba(4,7,13,0.65)] text-[var(--market-paper-white)] hover:bg-[rgba(4,7,13,0.85)]"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="absolute right-4 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--market-line)] bg-[rgba(4,7,13,0.65)] text-[var(--market-paper-white)] hover:bg-[rgba(4,7,13,0.85)]"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>

                <div className="mt-4 flex items-center justify-center gap-2">
                  {safeImages.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setLightboxIndex(index)}
                      className={`h-2 rounded-full transition-all ${
                        index === lightboxIndex
                          ? "w-8 bg-[var(--market-paper-white)]"
                          : "w-2 bg-[rgba(255,255,255,0.35)]"
                      }`}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
