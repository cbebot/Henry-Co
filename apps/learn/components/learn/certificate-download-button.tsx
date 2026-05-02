"use client";

import { useCallback, useState, type ButtonHTMLAttributes } from "react";
import { Download, Loader2, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

type CertificateDownloadButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Verification code — used to build the PDF endpoint. */
  verificationCode: string;
  /** Optional learner name baked into the suggested filename. */
  learnerName?: string | null;
  /** Optional course title used to build the share-sheet title. */
  courseTitle?: string | null;
  label?: string;
  variant?: "primary" | "secondary";
};

/**
 * Premium certificate download/share trigger.
 *
 * The component fetches the streaming PDF from
 * /api/certificates/<code>/pdf and:
 *   - On capable touch devices, hands the file to navigator.share so it
 *     can drop into WhatsApp, Mail, AirDrop, Drive, or LinkedIn directly.
 *   - On desktop or no-share environments, falls back to a regular
 *     download link (with ?download=1 to force the attachment header).
 */

async function fetchPdfBlob(endpoint: string) {
  const res = await fetch(endpoint, {
    method: "GET",
    headers: { Accept: "application/pdf" },
    credentials: "same-origin",
  });
  if (!res.ok) throw new Error(`Certificate PDF request failed (${res.status})`);
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

export function CertificateDownloadButton({
  verificationCode,
  learnerName,
  courseTitle,
  label = "Download certificate",
  className,
  type = "button",
  variant = "primary",
  onClick,
  disabled,
  ...props
}: CertificateDownloadButtonProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endpoint = `/api/certificates/${encodeURIComponent(verificationCode)}/pdf`;
  const namePart = (learnerName || "certificate").replace(/[^A-Za-z0-9]+/g, "-").slice(0, 32) || "certificate";
  const filename = `HenryCo-Certificate-${namePart}.pdf`;
  const shareTitle = courseTitle ? `HenryCo Learn certificate — ${courseTitle}` : "HenryCo Learn certificate";

  const handleClick = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      setError(null);
      setBusy(true);
      try {
        if (canShareFiles()) {
          const blob = await fetchPdfBlob(endpoint);
          const file = new File([blob], filename, { type: "application/pdf" });
          await navigator.share({ files: [file], title: shareTitle });
        } else {
          const blob = await fetchPdfBlob(`${endpoint}?download=1`);
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        }
      } catch (err) {
        if ((err as { name?: string })?.name !== "AbortError") {
          setError("We couldn't prepare your certificate. Try again.");
        }
      } finally {
        setBusy(false);
      }
    },
    [endpoint, filename, shareTitle, onClick]
  );

  return (
    <div className="inline-flex flex-col items-stretch gap-1">
      <button
        type={type}
        className={cn(
          variant === "primary" ? "learn-button-primary" : "learn-button-secondary",
          "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-progress disabled:opacity-80",
          className
        )}
        onClick={handleClick}
        aria-busy={busy}
        disabled={busy || disabled}
        {...props}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : canShareFiles() ? <Share2 className="h-4 w-4" /> : <Download className="h-4 w-4" />}
        <span>{busy ? "Preparing…" : label}</span>
      </button>
      {error ? <p className="text-[0.7rem] text-rose-300">{error}</p> : null}
    </div>
  );
}
