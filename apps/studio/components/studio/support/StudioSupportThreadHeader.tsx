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

import { StudioDownloadButton } from "./StudioDownloadButton";

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
  open: "studio-support-pill--open",
  awaiting: "studio-support-pill--awaiting",
  resolved: "studio-support-pill--resolved",
  closed: "studio-support-pill--closed",
  neutral: "studio-support-pill--neutral",
};

export type StudioSupportThreadHeaderProps = {
  threadId: string;
  subject: string;
  divisionLabel: string;
  categoryLabel: string;
  priorityLabel: string;
  status: string;
  statusLabel: string;
  download: {
    endpoint: string;
    filename: string;
    shareTitle: string;
    label: string;
  };
};

/**
 * Workspace-grade thread header for /support/[threadId] inside the
 * studio dashboard. Renders subject, division/category/priority pills,
 * status pill with tone-driven color, and an accessible overflow menu
 * for "Copy thread link" / "Copy thread ID". Download lives in its own
 * affordance so the share-sheet behavior on touch devices is preserved.
 */
export default function StudioSupportThreadHeader({
  threadId,
  subject,
  divisionLabel,
  categoryLabel,
  priorityLabel,
  status,
  statusLabel,
  download,
}: StudioSupportThreadHeaderProps) {
  const tone = statusTone(status);
  return (
    <header
      className="studio-support-header"
      aria-label="Support thread header"
    >
      <div className="studio-support-header__primary">
        <div className="studio-support-header__pills">
          <span className="studio-support-pill studio-support-pill--division">
            <CircleDot size={11} aria-hidden />
            {divisionLabel}
          </span>
          <span className="studio-support-pill studio-support-pill--category">
            {categoryLabel}
          </span>
          <span className="studio-support-pill studio-support-pill--priority">
            {priorityLabel}
          </span>
          <span
            className={`studio-support-pill studio-support-pill--status ${TONE_CLASS[tone]}`}
            aria-label={`Status: ${statusLabel}`}
          >
            <span
              className="studio-support-pill__dot"
              data-tone={tone}
              aria-hidden
            />
            {statusLabel}
          </span>
        </div>
        <h1 className="studio-support-header__subject">{subject}</h1>
        <p className="studio-support-header__meta">
          Thread #{threadId.slice(0, 8)}
        </p>
      </div>
      <div className="studio-support-header__actions">
        <StudioDownloadButton
          endpoint={download.endpoint}
          suggestedFilename={download.filename}
          shareTitle={download.shareTitle}
          label={download.label}
        />
        <ActionMenu threadId={threadId} subject={subject} />
      </div>
    </header>
  );
}

function ActionMenu({
  threadId,
  subject,
}: {
  threadId: string;
  subject: string;
}) {
  const [open, setOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const firstItemRef = useRef<HTMLButtonElement | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => buttonRef.current?.focus());
  }, []);

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

  const copy = useCallback(async (key: string, value: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
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
      setTimeout(
        () => setCopiedKey((k) => (k === key ? null : k)),
        1600,
      );
    } catch {
      // Silent — the user can try again from the menu.
    }
  }, []);

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
  };

  return (
    <div className="studio-support-header__menu" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        className="studio-support-header__menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Thread actions"
        title="Thread actions"
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={onTriggerKeyDown}
      >
        <MoreVertical size={16} />
      </button>
      {open ? (
        <div
          className="studio-support-header__menu-panel"
          role="menu"
          aria-label="Thread actions"
        >
          <ActionItem
            ref={firstItemRef}
            icon={<Link2 size={14} aria-hidden />}
            label={copiedKey === "link" ? "Link copied" : "Copy thread link"}
            confirmed={copiedKey === "link"}
            onSelect={() => copy("link", link)}
          />
          <ActionItem
            icon={<Copy size={14} aria-hidden />}
            label={copiedKey === "id" ? "ID copied" : "Copy thread ID"}
            confirmed={copiedKey === "id"}
            onSelect={() => copy("id", threadId)}
          />
          <div
            className="studio-support-header__menu-divider"
            role="separator"
          />
          <ActionItem
            icon={<Download size={14} aria-hidden />}
            label="Download (use the action above)"
            description="Use the Download button to grab a branded PDF copy."
            disabled
            onSelect={() => null}
          />
          <p className="studio-support-header__menu-foot">Thread · {subject}</p>
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
        className="studio-support-header__menu-item"
        role="menuitem"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          onSelect();
        }}
      >
        <span
          className="studio-support-header__menu-item-icon"
          aria-hidden
        >
          {confirmed ? <Check size={14} /> : icon}
        </span>
        <span className="studio-support-header__menu-item-text">
          <span className="studio-support-header__menu-item-label">{label}</span>
          {description ? (
            <span className="studio-support-header__menu-item-desc">
              {description}
            </span>
          ) : null}
        </span>
      </button>
    );
  },
);
