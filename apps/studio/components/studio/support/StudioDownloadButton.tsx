"use client";

import {
  useCallback,
  useState,
  type ButtonHTMLAttributes,
} from "react";
import { Download, Loader2, Share2 } from "lucide-react";
import { cn } from "@henryco/ui/cn";

/**
 * Studio-styled wrapper around the same Web Share / download pattern
 * used by the account dashboard. On a touch device with full Web Share
 * support, the PDF is presented through the OS share sheet; otherwise
 * the browser performs a direct download.
 *
 * Studio button classes (.studio-panel paint stack) keep the surface
 * consistent with the rest of the workspace shell.
 */

export type StudioDownloadButtonProps =
  ButtonHTMLAttributes<HTMLButtonElement> & {
    endpoint: string;
    suggestedFilename: string;
    shareTitle?: string;
    shareText?: string;
    label?: string;
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
  if (typeof navigator === "undefined" || typeof navigator.share !== "function")
    return false;
  if (typeof navigator.canShare !== "function") return false;
  try {
    const probe = new File([new Blob(["probe"])], "probe.pdf", {
      type: "application/pdf",
    });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

export function StudioDownloadButton({
  endpoint,
  suggestedFilename,
  shareTitle,
  shareText,
  label = "Download",
  className,
  type = "button",
  onClick,
  disabled,
  ...rest
}: StudioDownloadButtonProps) {
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
          const file = new File([blob], suggestedFilename, {
            type: "application/pdf",
          });
          await navigator.share({
            files: [file],
            title: shareTitle ?? suggestedFilename,
            text: shareText,
          });
        } else {
          const blob = await fetchPdfBlob(
            `${endpoint}${endpoint.includes("?") ? "&" : "?"}download=1`,
          );
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
        if ((err as { name?: string })?.name !== "AbortError") {
          setError("We couldn't prepare that document. Please try again.");
        }
      } finally {
        setBusy(false);
      }
    },
    [endpoint, suggestedFilename, shareTitle, shareText, onClick],
  );

  return (
    <div className="inline-flex flex-col items-stretch gap-1">
      <button
        type={type}
        className={cn(
          "studio-support-download",
          "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em]",
          "disabled:cursor-progress disabled:opacity-80",
          className,
        )}
        onClick={handleClick}
        disabled={busy || disabled}
        aria-busy={busy}
        {...rest}
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : canShareFiles() ? (
          <Share2 className="h-3.5 w-3.5" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        <span>{busy ? "Preparing…" : label}</span>
      </button>
      {error ? (
        <p
          className="text-[0.7rem] text-[color:var(--studio-warn,_#d99a13)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
