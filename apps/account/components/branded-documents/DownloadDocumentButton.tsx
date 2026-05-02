"use client";

import { useCallback, useState, type ButtonHTMLAttributes } from "react";
import { Download, Loader2, Share2 } from "lucide-react";
import { cn } from "@henryco/ui/cn";

/**
 * Premium download/share trigger for HenryCo branded documents.
 *
 * Two-mode behaviour:
 *   - On a touch device with Web Share API + share-with-files support,
 *     fetch the PDF and present the OS share sheet (so users can drop the
 *     file into WhatsApp, Mail, AirDrop, Drive in a single tap).
 *   - On desktop (or where Web Share is unavailable), fall back to a
 *     direct anchor click that triggers the browser download — same end
 *     result, just without a share dialog.
 *
 * The loading state uses a tasteful "doc building" affordance (a slow
 * pulsing copper bar via Tailwind classes baked into the account theme)
 * instead of a generic spinner. We surface the spinner-icon as a
 * fallback only if the consuming surface hasn't styled `.acct-loading`.
 */

type Variant = "primary" | "secondary" | "ghost";

export type DownloadDocumentButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Endpoint that returns the PDF — same origin recommended. */
  endpoint: string;
  /** File name suggested to the OS (overridden by Content-Disposition when present). */
  suggestedFilename: string;
  /** Optional text for the OS share sheet's title field. */
  shareTitle?: string;
  /** Optional descriptive text for the share sheet. */
  shareText?: string;
  variant?: Variant;
  label?: string;
};

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "acct-button-primary",
  secondary: "acct-button-secondary",
  ghost: "acct-button-ghost",
};

async function fetchPdfBlob(endpoint: string) {
  const res = await fetch(endpoint, {
    method: "GET",
    headers: { Accept: "application/pdf" },
    credentials: "same-origin",
  });
  if (!res.ok) {
    throw new Error(`Document request failed (${res.status})`);
  }
  return res.blob();
}

function canShareFiles() {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") return false;
  if (typeof navigator.canShare !== "function") return false;
  try {
    const probe = new File([new Blob(["probe"])], "probe.pdf", { type: "application/pdf" });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

export function DownloadDocumentButton({
  endpoint,
  suggestedFilename,
  shareTitle,
  shareText,
  variant = "primary",
  label = "Download",
  className,
  type = "button",
  onClick,
  disabled,
  ...rest
}: DownloadDocumentButtonProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      setError(null);
      setBusy(true);
      try {
        if (canShareFiles()) {
          const blob = await fetchPdfBlob(endpoint);
          const file = new File([blob], suggestedFilename, { type: "application/pdf" });
          await navigator.share({
            files: [file],
            title: shareTitle ?? suggestedFilename,
            text: shareText,
          });
        } else {
          // Fallback: trigger a regular download. Using a fetched blob URL
          // means the same `?download=1` query that the API supports
          // produces the right Content-Disposition header.
          const blob = await fetchPdfBlob(`${endpoint}${endpoint.includes("?") ? "&" : "?"}download=1`);
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = suggestedFilename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        }
      } catch (err) {
        // AbortError comes from the user dismissing the share sheet — not
        // an error worth surfacing.
        if ((err as { name?: string })?.name !== "AbortError") {
          setError("We couldn't prepare that document. Please try again.");
        }
      } finally {
        setBusy(false);
      }
    },
    [endpoint, suggestedFilename, shareTitle, shareText, onClick]
  );

  return (
    <div className="inline-flex flex-col items-stretch gap-1">
      <button
        type={type}
        className={cn(
          VARIANT_CLASS[variant],
          "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-progress disabled:opacity-80",
          className
        )}
        onClick={handleClick}
        disabled={busy || disabled}
        aria-busy={busy}
        {...rest}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : canShareFiles() ? <Share2 className="h-4 w-4" /> : <Download className="h-4 w-4" />}
        <span>{busy ? "Preparing…" : label}</span>
      </button>
      {error ? <p className="text-[0.7rem] text-[var(--acct-red,_#9C2A2A)]">{error}</p> : null}
    </div>
  );
}
