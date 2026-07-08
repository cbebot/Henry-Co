"use client";

/**
 * StoryNewsletterEarn — the first production adoption of an interaction
 * engine (Engine 7, Newsletter Earn) outside the dev gallery.
 *
 * Doctrine gating is the TESTED predicate, not ad-hoc JSX: the capture
 * surfaces only past 70% scroll on this content page, never twice in a
 * session, never more than weekly (localStorage cross-session marker).
 * Subscribe posts to the real /api/newsletter/subscribe with
 * sourceSurface attribution. Copy reuses the already-translated
 * newsletter namespace — zero new i18n keys.
 */

import { useEffect, useState } from "react";
import { NewsletterEarn, shouldSurfaceCapture } from "@henryco/interactions";

const ASKED_AT_KEY = "hc-v3-nl-earn-asked-at";
const SESSION_KEY = "hc-v3-nl-earn-session";

export interface StoryNewsletterLabels {
  valueStatement: string;
  placeholder: string;
  submit: string;
  submitting: string;
  success: string;
}

export function StoryNewsletterEarn({
  labels,
  locale,
}: {
  labels: StoryNewsletterLabels;
  locale: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const onScroll = () => {
      const doc = document.documentElement;
      const total = doc.scrollHeight - doc.clientHeight;
      const depth = total <= 0 ? 100 : Math.round(((window.scrollY || 0) / total) * 100);

      let lastAskedAt: number | null = null;
      let askedThisSession = false;
      try {
        const raw = localStorage.getItem(ASKED_AT_KEY);
        lastAskedAt = raw ? Number(raw) || null : null;
        askedThisSession = sessionStorage.getItem(SESSION_KEY) === "1";
      } catch {
        /* storage unavailable → predicate runs uncapped for this view */
      }

      if (
        shouldSurfaceCapture(
          { primarySucceeded: false, scrollDepth: depth, lastAskedAt, askedThisSession },
          Date.now(),
        )
      ) {
        setVisible(true);
        try {
          localStorage.setItem(ASKED_AT_KEY, String(Date.now()));
          sessionStorage.setItem(SESSION_KEY, "1");
        } catch {
          /* best-effort caps */
        }
        window.removeEventListener("scroll", onScroll);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [visible]);

  if (!visible) return null;

  const subscribe = async (email: string) => {
    const res = await fetch("/api/newsletter/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, locale, sourceSurface: "v3_story" }),
    });
    if (!res.ok) {
      const err = new Error("subscribe failed");
      err.name = "subscribe_failed";
      throw err;
    }
  };

  return (
    <NewsletterEarn
      surfaceId="v3_story"
      onSubscribe={subscribe}
      labels={{
        valueStatement: labels.valueStatement,
        placeholder: labels.placeholder,
        submit: labels.submit,
        cta: {
          inflight: labels.submitting,
          success: labels.success,
          // Non-destructive CTA: retry re-runs the submit verb; confirm/
          // cancel never render for the primary variant.
          retry: labels.submit,
          confirm: labels.submit,
          cancel: "",
        },
      }}
    />
  );
}
