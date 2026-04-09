"use client";

import { useState, useCallback } from "react";
import { Copy, Check, Link as LinkIcon } from "lucide-react";

type CopyReferralCodeProps = {
  code: string;
};

export default function CopyReferralCode({ code }: CopyReferralCodeProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const shareLink = `https://account.henrycogroup.com/signup?ref=${code}`;

  const copyToClipboard = useCallback(
    async (text: string, type: "code" | "link") => {
      try {
        await navigator.clipboard.writeText(text);
        if (type === "code") {
          setCopiedCode(true);
          setTimeout(() => setCopiedCode(false), 2000);
        } else {
          setCopiedLink(true);
          setTimeout(() => setCopiedLink(false), 2000);
        }
      } catch {
        // Fallback: silently fail
      }
    },
    []
  );

  return (
    <div className="space-y-4">
      {/* Referral Code */}
      <div>
        <p className="text-[0.65rem] font-semibold uppercase text-[var(--acct-muted)]">
          Your Referral Code
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="rounded-lg bg-[var(--acct-surface)] px-4 py-2 font-mono text-base font-bold tracking-wider text-[var(--acct-ink)]">
            {code}
          </span>
          <button
            type="button"
            onClick={() => copyToClipboard(code, "code")}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--acct-line)] text-[var(--acct-muted)] transition-colors hover:bg-[var(--acct-surface)] hover:text-[var(--acct-ink)]"
            title="Copy code"
          >
            {copiedCode ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
          </button>
          {copiedCode && (
            <span className="text-xs font-medium text-emerald-500">Copied!</span>
          )}
        </div>
      </div>

      {/* Share Link */}
      <div>
        <p className="text-[0.65rem] font-semibold uppercase text-[var(--acct-muted)]">
          Share Link
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="min-w-0 flex-1 truncate rounded-lg bg-[var(--acct-surface)] px-4 py-2 text-sm text-[var(--acct-muted)]">
            {shareLink}
          </div>
          <button
            type="button"
            onClick={() => copyToClipboard(shareLink, "link")}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[var(--acct-line)] px-3 text-sm font-medium text-[var(--acct-muted)] transition-colors hover:bg-[var(--acct-surface)] hover:text-[var(--acct-ink)]"
            title="Copy link"
          >
            {copiedLink ? (
              <>
                <Check size={14} className="text-emerald-500" />
                <span className="text-emerald-500">Copied!</span>
              </>
            ) : (
              <>
                <LinkIcon size={14} />
                <span>Copy link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
