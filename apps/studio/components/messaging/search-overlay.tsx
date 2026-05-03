"use client";

import { useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

type Props = {
  open: boolean;
  query: string;
  onChange: (query: string) => void;
  onClose: () => void;
  /** Total messages searched against — for the result count line. */
  totalMessages: number;
  /** Number of matches found in the current query. */
  matchCount: number;
};

/**
 * Inline search bar that opens in the thread header. Filtering is
 * performed by <MessageList /> dimming non-matching bubbles to 30%.
 * Search clears when this overlay closes.
 */
export function SearchOverlay({
  open,
  query,
  onChange,
  onClose,
  totalMessages,
  matchCount,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    } else {
      onChange("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="flex items-center gap-2 border-b border-white/[0.06] bg-[#0A0E1A] px-3 py-2 motion-safe:animate-[studio-msg-fade-in_160ms_ease-out]"
      role="search"
      aria-label="Search this conversation"
    >
      <Search className="h-4 w-4 shrink-0 text-white/45" aria-hidden />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onClose();
          }
        }}
        placeholder="Search this conversation…"
        className="flex-1 bg-transparent text-[13px] text-[#F5F4EE] outline-none placeholder:text-white/35"
        aria-label="Search this conversation"
      />
      {query ? (
        <span className="shrink-0 text-[11px] font-medium tabular-nums text-white/55">
          {matchCount} of {totalMessages}
        </span>
      ) : null}
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded-full p-1 text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white/80"
        aria-label="Close search"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
