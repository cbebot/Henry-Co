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
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BellOff,
  BellRing,
  Check,
  CircleDot,
  Copy,
  Download,
  Link2,
  MoreVertical,
} from "lucide-react";
import {
  ThreadCustomizationMenu,
  ThreadParticipantsStrip,
  type ThreadParticipant,
} from "@henryco/messaging-thread";
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
  /** Initially muted state — server reads `customer_muted_at IS NOT NULL`
   * and passes through. Header treats it as the seed for the optimistic
   * toggle. */
  initialMuted?: boolean;
  /** Participants rendered as the persistent strip below the pills. */
  participants: ThreadParticipant[];
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
 * a persistent participants strip with avatars + roles, desktop download
 * + customization actions, and an overflow menu with mobile download plus
 * customer-side actions (mute, report, copy link, copy ID).
 */
export default function SupportThreadHeader({
  threadId,
  subject,
  divisionLabel,
  categoryLabel,
  status,
  statusLabel,
  initialMuted,
  participants,
  download,
}: SupportThreadHeaderProps) {
  const locale = useHenryCoLocale();
  const t = useCallback(
    (text: string) => translateSurfaceLabel(locale, text),
    [locale],
  );
  const tone = statusTone(status);

  const customizationLabels = useMemo(
    () => ({
      trigger: t("Customize thread"),
      title: t("Customize"),
      fontSize: t("Font size"),
      fontSizeSm: t("Small"),
      fontSizeMd: t("Medium"),
      fontSizeLg: t("Large"),
      density: t("Density"),
      densityComfortable: t("Comfortable"),
      densityCompact: t("Compact"),
      surfaceTone: t("Surface tone"),
      surfaceToneDefault: t("Default"),
      surfaceToneSoft: t("Soft"),
      surfaceToneWarm: t("Warm"),
      surfaceToneCool: t("Cool"),
      reset: t("Reset to defaults"),
      hint: t("Preferences save to this device."),
    }),
    [t],
  );

  return (
    <header
      className="acct-thread-header"
      aria-label={t("Support thread header")}
    >
      {/* Mobile-only back affordance — sits at the head of the thin
          mobile top bar. CSS hides this on tablet+ where the page
          renders the full `.acct-support-back` pill above the header. */}
      <Link
        href="/support"
        className="acct-thread-header__mobile-back"
        aria-label={t("Back to support")}
      >
        <ArrowLeft size={18} aria-hidden />
      </Link>
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
        {/* Mobile-only subtitle — replaces the verbose meta line +
            pill row with a single calm subtitle that mirrors the
            iOS/WhatsApp pattern (name on top, status underneath). */}
        <p
          className="acct-thread-header__mobile-subtitle"
          aria-label={`${t("Status")}: ${statusLabel}`}
        >
          <span
            className="acct-thread-header__mobile-subtitle-dot"
            data-tone={tone}
            aria-hidden
          />
          <span>{statusLabel}</span>
          <span aria-hidden>·</span>
          <span>{divisionLabel}</span>
        </p>
        <p className="acct-thread-header__meta hc-body-sm">
          {t("Thread")} #{threadId.slice(0, 8)}
        </p>
        {participants.length > 0 ? (
          <ThreadParticipantsStrip
            participants={participants}
            ariaLabel={t("Thread participants")}
          />
        ) : null}
      </div>
      <div className="acct-thread-header__actions">
        <div className="acct-thread-header__actions-primary">
          <DownloadDocumentButton
            endpoint={download.endpoint}
            suggestedFilename={download.filename}
            shareTitle={download.shareTitle}
            variant="secondary"
            label={download.label}
          />
          <ThreadCustomizationMenu labels={customizationLabels} />
        </div>
        <ActionMenu
          threadId={threadId}
          subject={subject}
          initialMuted={Boolean(initialMuted)}
          download={download}
        />
      </div>
    </header>
  );
}

/**
 * Accessible popover with the customer-side overflow actions.
 *
 * Actions:
 *   - Download thread (included here for compact/mobile layouts)
 *   - Mute / Unmute notifications for this thread
 *   - Report thread (flag for human review)
 *   - Copy thread link
 *   - Copy thread ID
 *
 * Exported (as ThreadActionMenu below) so the ChatThread-based
 * SupportChatScreen reuses the identical action set in its compact header.
 */
function ActionMenu({
  threadId,
  subject,
  initialMuted,
  download,
}: {
  threadId: string;
  subject: string;
  initialMuted: boolean;
  download: SupportThreadHeaderProps["download"];
}) {
  const locale = useHenryCoLocale();
  const t = useCallback(
    (text: string) => translateSurfaceLabel(locale, text),
    [locale],
  );
  const [open, setOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [muted, setMuted] = useState(initialMuted);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const firstItemRef = useRef<HTMLAnchorElement | null>(null);

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
  const downloadHref = useMemo(() => {
    const separator = download.endpoint.includes("?") ? "&" : "?";
    return `${download.endpoint}${separator}download=1`;
  }, [download.endpoint]);

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
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1600);
    } catch {
      // Silent — the user can try again from the menu.
    }
  }, []);

  const toggleMute = useCallback(async () => {
    const nextMuted = !muted;
    setMuted(nextMuted); // optimistic
    setBusyKey("mute");
    try {
      const response = await fetch("/api/support/mute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ threadId, muted: nextMuted }),
      });
      if (!response.ok) throw new Error("mute_failed");
      setFeedback(nextMuted ? t("Notifications muted") : t("Notifications on"));
      setTimeout(() => setFeedback((f) => (f && f.length > 0 ? null : f)), 2000);
    } catch {
      setMuted(!nextMuted); // rollback
      setFeedback(t("Couldn't update mute. Try again."));
    } finally {
      setBusyKey(null);
    }
  }, [muted, threadId, t]);

  const reportThread = useCallback(async () => {
    setBusyKey("report");
    try {
      const response = await fetch("/api/support/report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ threadId }),
      });
      if (!response.ok) throw new Error("report_failed");
      setFeedback(t("Thank you — operations will review this."));
      setTimeout(() => setFeedback((f) => (f && f.length > 0 ? null : f)), 3000);
    } catch {
      setFeedback(t("Couldn't submit the report. Try again."));
    } finally {
      setBusyKey(null);
    }
  }, [threadId, t]);

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
        <span className="acct-thread-header__menu-trigger-label">
          {t("Actions")}
        </span>
      </button>
      {open ? (
        <div
          className="acct-thread-header__menu-panel"
          role="menu"
          aria-label={t("Thread actions")}
        >
          <ActionLink
            ref={firstItemRef}
            href={downloadHref}
            icon={<Download size={14} aria-hidden />}
            label={download.label}
            description={t("Save a branded PDF copy of this conversation.")}
          />
          <div className="acct-thread-header__menu-divider" role="separator" />
          <ActionItem
            icon={
              muted ? (
                <BellRing size={14} aria-hidden />
              ) : (
                <BellOff size={14} aria-hidden />
              )
            }
            label={muted ? t("Unmute notifications") : t("Mute notifications")}
            description={
              muted
                ? t("Notifications are paused for this thread.")
                : t("Pause email and push for this thread.")
            }
            onSelect={toggleMute}
            disabled={busyKey === "mute"}
          />
          <ActionItem
            icon={<AlertTriangle size={14} aria-hidden />}
            label={t("Report thread")}
            description={t("Send to operations for human review.")}
            onSelect={reportThread}
            disabled={busyKey === "report"}
          />
          <div className="acct-thread-header__menu-divider" role="separator" />
          <ActionItem
            icon={<Link2 size={14} aria-hidden />}
            label={
              copiedKey === "link" ? t("Link copied") : t("Copy thread link")
            }
            confirmed={copiedKey === "link"}
            onSelect={() => copy("link", link)}
          />
          <ActionItem
            icon={<Copy size={14} aria-hidden />}
            label={copiedKey === "id" ? t("ID copied") : t("Copy thread ID")}
            confirmed={copiedKey === "id"}
            onSelect={() => copy("id", threadId)}
          />
          {feedback ? (
            <p className="acct-thread-header__menu-feedback" role="status">
              {feedback}
            </p>
          ) : null}
          <p className="acct-thread-header__menu-foot">
            {t("Thread")} · {subject}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export { ActionMenu as ThreadActionMenu };

type ActionItemProps = {
  icon: ReactNode;
  label: string;
  description?: string;
  onSelect: () => void;
  confirmed?: boolean;
  disabled?: boolean;
};

type ActionLinkProps = {
  href: string;
  icon: ReactNode;
  label: string;
  description?: string;
};

const ActionLink = forwardRef<HTMLAnchorElement, ActionLinkProps>(
  function ActionLink({ href, icon, label, description }, ref) {
    return (
      <a
        ref={ref}
        className="acct-thread-header__menu-item"
        role="menuitem"
        href={href}
        download
      >
        <span className="acct-thread-header__menu-item-icon" aria-hidden>
          {icon}
        </span>
        <span className="acct-thread-header__menu-item-text">
          <span className="acct-thread-header__menu-item-label">{label}</span>
          {description ? (
            <span className="acct-thread-header__menu-item-desc">{description}</span>
          ) : null}
        </span>
      </a>
    );
  },
);

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
