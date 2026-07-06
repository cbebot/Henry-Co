"use client";

/**
 * ReadingMode — long-form lesson reader.
 *
 * V3 PASS 21 contract:
 *   • Table-of-contents derived from h2/h3 anchors
 *   • Scroll position persistence (localStorage keyed by lesson id)
 *   • Reading-time estimate (200 wpm)
 *   • Serif type + line-height 1.6, max-width measure — mobile friendly
 */

import { useEffect, useMemo, useRef, useState } from "react";

export type ReadingModeProps = {
  lessonId: string;
  /** Pre-rendered HTML body (from markdown source) */
  html: string;
  /** Localized labels (i18n integration handled by caller) */
  labels: {
    tableOfContents: string;
    readingTime: string;
    minutes: string;
    resumeAt: string;
  };
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function extractHeadingsFromHtml(html: string): Array<{ id: string; text: string; level: number }> {
  if (typeof window === "undefined") return [];
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  const headings: Array<{ id: string; text: string; level: number }> = [];
  wrapper.querySelectorAll("h2, h3").forEach((heading) => {
    const text = heading.textContent?.trim() ?? "";
    if (!text) return;
    const level = Number(heading.tagName.replace("H", ""));
    headings.push({ id: slugify(text), text, level });
  });
  return headings;
}

function estimateReadingMinutesFromHtml(html: string): number {
  if (typeof window === "undefined") return 1;
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  const text = wrapper.textContent ?? "";
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(wordCount / 200));
}

function readStoredScroll(key: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(key);
    if (!stored) return null;
    const value = Number(stored);
    if (Number.isFinite(value) && value > 200) return value;
    return null;
  } catch {
    return null;
  }
}

export function ReadingMode({ lessonId, html, labels }: ReadingModeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const storageKey = `learn:reading-scroll:${lessonId}`;

  // Derive headings + reading time lazily from html — pure, no effects.
  const headings = useMemo(() => extractHeadingsFromHtml(html), [html]);
  const readingMinutes = useMemo(() => estimateReadingMinutesFromHtml(html), [html]);

  // Lazy state initialiser reads stored scroll once on mount — no setState in effect.
  const [resumeFrom, setResumeFrom] = useState<number | null>(() => readStoredScroll(storageKey));

  // Anchor IDs are written to DOM imperatively (DOM sync, not React state).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.querySelectorAll("h2, h3").forEach((heading) => {
      const text = heading.textContent?.trim() ?? "";
      if (!text || heading.id) return;
      heading.id = slugify(text);
    });
  }, [html]);

  // Persist scroll position to localStorage on scroll.
  useEffect(() => {
    let raf = 0;
    function handleScroll() {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        try {
          window.localStorage.setItem(storageKey, String(window.scrollY));
        } catch {
          // ignore
        }
      });
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [storageKey]);

  const handleResume = () => {
    if (resumeFrom == null) return;
    window.scrollTo({ top: resumeFrom, behavior: "smooth" });
    setResumeFrom(null);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[0.85fr,1.15fr] xl:grid-cols-[0.7fr,1.3fr]">
      {/* TOC sidebar */}
      <aside className="order-2 self-start lg:sticky lg:top-24 lg:order-1">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-copper)]">
          {labels.tableOfContents}
        </p>
        <p className="mt-2 text-xs text-[var(--learn-ink-soft)]">
          {readingMinutes} {labels.minutes} · {labels.readingTime}
        </p>
        {resumeFrom != null ? (
          <button
            type="button"
            onClick={handleResume}
            className="mt-3 w-full rounded-full border border-[var(--learn-mint-soft)]/40 bg-[var(--learn-mint-soft)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--learn-ink)]"
          >
            {labels.resumeAt}
          </button>
        ) : null}
        {headings.length > 0 ? (
          <ul className="mt-4 space-y-2 border-l border-[var(--learn-line)] pl-3 text-sm">
            {headings.map((heading) => (
              <li key={heading.id} className={heading.level === 3 ? "ml-3" : ""}>
                <a
                  href={`#${heading.id}`}
                  className="block text-[var(--learn-ink-soft)] hover:text-[var(--learn-ink)]"
                >
                  {heading.text}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </aside>

      {/* Body — markdown is pre-sanitised at the data layer (LearnMarkdown). */}
      <article
        ref={containerRef}
        className="order-1 max-w-[68ch] hc-font-reading text-[17px] leading-[1.7] text-[var(--learn-ink)] lg:order-2"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
