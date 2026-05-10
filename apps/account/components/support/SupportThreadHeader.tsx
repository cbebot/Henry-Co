"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  Check,
  CircleDot,
  Copy,
  Download,
  Link2,
  MoreVertical,
} from "lucide-react";
import { translateSurfaceLabel, useHenryCoLocale } from "@henryco/i18n";
import { DownloadDocumentButton } from "@/components/branded-documents/DownloadDocumentButton";

type StatusTone = "open" | "awaiting" | "resolved" | "closed" | "neutral";

function statusTone(status: string): StatusTone {
  const norm = status.toLowerCase();
  if (norm === "resolved") return "resolved";
  if (norm === "closed") return "closed";
  if (norm.includes("await")) return "awaiting";
  if (norm === "open" || norm === "in_progress" || norm === "active") return "open";
  return "neutral";
}

const TONE_CLASS: Record<StatusTone, string> = {
  open: "bg-[var(--acct-blue-soft)] text-[var(--acct-blue)]",
  awaiting: "bg-[var(--acct-gold-soft)] text-[var(--acct-gold-text,#8A6F00)]",
  resolved: "bg-[var(--acct-green-soft)] text-[var(--acct-green)]",
  closed: "bg-[var(--acct-surface)] text-[var(--acct-muted)]",
  neutral: "bg-[var(--acct-surface)] text-[var(--acct-muted)]",
};

export type SupportThreadHeaderProps = {
  threadId: string;
  subject: string;
  divisionLabel: string;
  categoryLabel: string;
  status: string;
  /** Localized human-readable status label, eg. "Awaiting reply". */
  statusLabel: string;
  /** Owner of the secondary action: PDF download endpoint and label. */
  download: {
    endpoint: string;
    filename: string;
    shareTitle: string;
    label: string;
  };
};

/**
 * Workspace-grade thread header for /support/[threadId].
 *
 * Renders subject, division/category pills, status pill (with tone),
 * and an action menu (download thread, copy thread link). Designed to
 * sit above the SupportThreadRoom on desktop and stack cleanly on
 * mobile.
 *
 * The download is delegated to the existing DownloadDocumentButton —
 * which handles Web Share API on touch devices and a direct download
 * fallback on desktop — so no new PDF surface is introduced.
 */
export default function SupportThreadHeader({
  threadId,
  subject,
  divisionLabel,
  categoryLabel,
  status,
  statusLabel,
  download,
}: SupportThreadHeaderProps) {
  const locale = useHenryCoLocale();
  const t = useCallback(
    (text: string) => translateSurfaceLabel(locale, text),
    [locale],
  );
  const tone = statusTone(status);

  return (
    <header
      className="acct-thread-header"
      aria-label={t("Support thread header")}
    >
      <div className="acct-thread-header__primary">
        <div className="acct-thread-header__pills">
          <span className="acct-thread-header__pill acct-thread-header__pill--division">
            <CircleDot size={11} aria-hidden />
            {divisionLabel}
          </span>
          <span className="acct-thread-header__pill acct-thread-header__pill--category">
            {categoryLabel}
          </span>
          <span
            className={`acct-thread-header__pill acct-thread-header__pill--status ${TONE_CLASS[tone]}`}
            aria-label={`${t("Status")}: ${statusLabel}`}
          >
            <span
              className="acct-thread-header__pill-dot"
              data-tone={tone}
              aria-hidden
            />
            {statusLabel}
          </span>
        </div>
        <h1 className="acct-thread-header__subject hc-h1 acct-display">
          {subject}
        </h1>
        <p className="acct-thread-header__meta hc-body-sm">
          {t("Thread")} #{threadId.slice(0, 8)}
        </p>
      </div>
      <div className="acct-thread-header__actions">
        <DownloadDocumentButton
          endpoint={download.endpoint}
          suggestedFilename={download.filename}
          shareTitle={download.shareTitle}
          variant="secondary"
          label={download.label}
        />
        <ActionMenu threadId={threadId} subject={subject} />
      </div>
    </header>
  );
}

/**
 * Minimal accessible popover with the thread overflow actions.
 *
 * Actions today: copy thread link, copy thread ID. Mute / Mark resolved /
 * Transfer / Report are surfaced as disabled placeholders so the IA is
 * present even before the database routes ship — keeps the design
 * stable and tells the user "we know about this; coming soon".
 */
function ActionMenu({
  threadId,
  subject,
}: {
  threadId: string;
  subject: string;
}) {
  const locale = useHenryCoLocale();
  const t = useCallback(
    (text: string) => translateSurfaceLabel(locale, text),
    [locale],
  );
  const [open, setOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const firstItemRef = useRef<HTMLButtonElement | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    // Restore focus to the trigger so keyboard users land predictably.
    requestAnimationFrame(() => buttonRef.current?.focus());
  }, []);

  // Close on outside click / escape.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
      }
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    // First menu item gets focus when the panel opens.
    requestAnimationFrame(() => firstItemRef.current?.focus());
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const link = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/support/${threadId}`;
  }, [threadId]);

  const copy = useCallback(
    async (key: string, value: string) => {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(value);
        } else {
          // Fallback for older browsers / restricted contexts.
          const ta = document.createElement("textarea");
          ta.value = value;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          try {
            document.execCommand("copy");
          } finally {
            document.body.removeChild(ta);
          }
        }
        setCopiedKey(key);
        setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1600);
      } catch {
        // Silent — the user can try again from the menu.
      }
    },
    [],
  );

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
  };

  return (
    <div className="acct-thread-header__menu" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        className="acct-button-ghost rounded-xl"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("Thread actions")}
        title={t("Thread actions")}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={onTriggerKeyDown}
      >
        <MoreVertical size={16} />
      </button>
      {open ? (
        <div
          className="acct-thread-header__menu-panel"
          role="menu"
          aria-label={t("Thread actions")}
        >
          <ActionItem
            ref={firstItemRef}
            icon={<Link2 size={14} aria-hidden />}
            label={
              copiedKey === "link" ? t("Link copied") : t("Copy thread link")
            }
            confirmed={copiedKey === "link"}
            onSelect={() => copy("link", link)}
          />
          <ActionItem
            icon={<Copy size={14} aria-hidden />}
            label={
              copiedKey === "id" ? t("ID copied") : t("Copy thread ID")
            }
            confirmed={copiedKey === "id"}
            onSelect={() => copy("id", threadId)}
          />
          <div className="acct-thread-header__menu-divider" role="separator" />
          <ActionItem
            icon={<Download size={14} aria-hidden />}
            label={t("Download (use the action above)")}
            description={t(
              "Use the Download button to grab a branded PDF copy.",
            )}
            disabled
            onSelect={() => null}
          />
          <p className="acct-thread-header__menu-foot">
            {t("Thread")} · {subject}
          </p>
        </div>
      ) : null}
    </div>
  );
}

type ActionItemProps = {
  icon: ReactNode;
  label: string;
  description?: string;
  onSelect: () => void;
  confirmed?: boolean;
  disabled?: boolean;
};

const ActionItem = forwardRef<HTMLButtonElement, ActionItemProps>(
  function ActionItem(
    { icon, label, description, onSelect, confirmed, disabled },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type="button"
        className="acct-thread-header__menu-item"
        role="menuitem"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          onSelect();
        }}
      >
        <span className="acct-thread-header__menu-item-icon" aria-hidden>
          {confirmed ? <Check size={14} /> : icon}
        </span>
        <span className="acct-thread-header__menu-item-text">
          <span className="acct-thread-header__menu-item-label">{label}</span>
          {description ? (
            <span className="acct-thread-header__menu-item-desc">{description}</span>
          ) : null}
        </span>
      </button>
    );
  },
);
