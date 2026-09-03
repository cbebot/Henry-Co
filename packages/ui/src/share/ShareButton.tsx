"use client";

/**
 * V3-04 (S5) — ShareButton.
 *
 * A single share affordance used across shareable surfaces (property
 * listing, marketplace product, jobs role, learn course). It:
 *
 *   1. Prefers the native Web Share API (`navigator.share`) so mobile
 *      users get the OS share sheet; falls back to clipboard copy with a
 *      transient "Copied" confirmation when Web Share is unavailable.
 *   2. Tags the shared URL with `?ref=share&from=<hashed-sharer>` via
 *      `withShareAttribution` (the `from` hash is computed server-side by
 *      `hashSharerId` and passed in as `sharerHash` — the raw user-id
 *      never reaches the browser).
 *   3. Emits `henry.share.clicked` telemetry (S8) with the surface +
 *      method + whether attribution was attached.
 *
 * i18n: every visible string goes through `translateSurfaceLabel`
 * against the active locale (namespace: surface labels). No hardcoded
 * user-facing copy.
 *
 * Domain abstraction: this component does NOT build the URL itself —
 * the caller passes an already-canonical absolute URL (from the
 * `@henryco/seo/deeplinks` builders), so the domain stays abstract.
 */

import { useCallback, useMemo, useState } from "react";
import { Check, Link2, Share2 } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useOptionalHenryCoLocale } from "@henryco/i18n/react";
import { emitEvent } from "@henryco/observability/events";
import { withShareAttribution } from "@henryco/seo/deeplinks";
import { cn } from "../cn";

export type ShareButtonProps = {
  /**
   * The canonical absolute URL to share. MUST come from a
   * `@henryco/seo/deeplinks` builder (e.g. `buildPropertyListingLink`)
   * so the domain is config-derived, never hardcoded.
   */
  url: string;
  /** Title for the native share sheet (e.g. the listing / product name). */
  title: string;
  /** Optional descriptive text for the native share sheet. */
  text?: string;
  /**
   * Division / surface the share originated from, for telemetry
   * (e.g. "property_listing", "marketplace_product"). Free-form string.
   */
  surface: string;
  /**
   * Pre-computed sharer fingerprint from `hashSharerId` (server-side).
   * When provided, the shared URL is tagged `?ref=share&from=<hash>` so
   * the receiving page can credit the sharer. Omit for an anonymous
   * (un-attributed) share.
   */
  sharerHash?: string | null;
  /** Visual variant. "button" = filled pill; "ghost" = subtle; "icon" = icon-only. */
  variant?: "button" | "ghost" | "icon";
  /** Override the default "Share" label. */
  label?: string;
  className?: string;
};

type ShareMethod = "web_share" | "copy";

const VARIANT_CLASS: Record<NonNullable<ShareButtonProps["variant"]>, string> = {
  button:
    "inline-flex items-center justify-center gap-2 rounded-full bg-[var(--hc-accent,#C9A227)] px-4 py-2 text-sm font-semibold text-[var(--hc-accent-ink,#0b1018)] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hc-accent,#C9A227)]/40",
  ghost:
    "inline-flex items-center justify-center gap-2 rounded-full border border-current/15 px-4 py-2 text-sm font-medium text-current transition hover:bg-current/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/30",
  icon:
    "inline-flex h-10 w-10 items-center justify-center rounded-full border border-current/15 text-current transition hover:bg-current/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/30",
};

function canUseWebShare(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function"
  );
}

async function copyToClipboard(value: string): Promise<boolean> {
  try {
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard?.writeText
    ) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // fall through to legacy path
  }
  // Legacy fallback for browsers without the async clipboard API.
  try {
    if (typeof document === "undefined") return false;
    const el = document.createElement("textarea");
    el.value = value;
    el.setAttribute("readonly", "");
    el.style.position = "absolute";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

export function ShareButton({
  url,
  title,
  text,
  surface,
  sharerHash = null,
  variant = "ghost",
  label,
  className,
}: ShareButtonProps) {
  const locale = useOptionalHenryCoLocale() ?? "en";
  const t = useCallback(
    (value: string) => translateSurfaceLabel(locale, value),
    [locale],
  );
  const [copied, setCopied] = useState(false);

  // Tag the URL with share attribution once per url/hash change. Pure
  // string work (client-safe) — the hash itself was minted server-side.
  const shareUrl = useMemo(
    () => withShareAttribution(url, sharerHash),
    [url, sharerHash],
  );

  const emitClicked = useCallback(
    (method: ShareMethod) => {
      emitEvent({
        name: "henry.share.clicked",
        classification: "user_action",
        outcome: "completed",
        payload: {
          surface,
          method,
          attributed: Boolean(sharerHash),
        },
      });
    },
    [surface, sharerHash],
  );

  const handleClick = useCallback(async () => {
    if (canUseWebShare()) {
      try {
        await navigator.share({ title, text: text ?? title, url: shareUrl });
        emitClicked("web_share");
        return;
      } catch (error) {
        // AbortError = user dismissed the sheet; do not fall back to copy
        // (that would be surprising). Any OTHER error → fall back to copy.
        if (
          error &&
          typeof error === "object" &&
          "name" in error &&
          (error as { name?: string }).name === "AbortError"
        ) {
          return;
        }
      }
    }

    const ok = await copyToClipboard(shareUrl);
    if (ok) {
      setCopied(true);
      emitClicked("copy");
      window.setTimeout(() => setCopied(false), 2000);
    }
  }, [emitClicked, shareUrl, text, title]);

  const resolvedLabel = label ?? t("Share");
  const copiedLabel = t("Link copied");
  const isIcon = variant === "icon";

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(VARIANT_CLASS[variant], className)}
      aria-label={isIcon ? resolvedLabel : undefined}
      data-share-surface={surface}
    >
      {copied ? (
        <Check size={isIcon ? 18 : 16} aria-hidden="true" />
      ) : isIcon ? (
        <Share2 size={18} aria-hidden="true" />
      ) : (
        <Link2 size={16} aria-hidden="true" />
      )}
      {!isIcon ? <span>{copied ? copiedLabel : resolvedLabel}</span> : null}
    </button>
  );
}
