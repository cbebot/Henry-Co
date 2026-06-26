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
  AlertTriangle,
  ArrowRightLeft,
  BellOff,
  BellRing,
  Check,
  CheckCircle2,
  CircleDot,
  Copy,
  Download,
  Link2,
  MoreVertical,
  RefreshCw,
} from "lucide-react";
import {
  ThreadCustomizationMenu,
  ThreadParticipantsStrip,
  type ThreadParticipant,
} from "@henryco/messaging-thread";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { getStudioSupportCopy, type StudioSupportCopy } from "@henryco/i18n";

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

const TRANSFER_DIVISIONS: Array<{
  value: string;
  labelKey: keyof StudioSupportCopy["divisions"];
}> = [
  { value: "studio", labelKey: "studio" },
  { value: "care", labelKey: "care" },
  { value: "jobs", labelKey: "jobs" },
  { value: "learn", labelKey: "learn" },
  { value: "property", labelKey: "property" },
  { value: "logistics", labelKey: "logistics" },
  { value: "marketplace", labelKey: "marketplace" },
  { value: "account", labelKey: "account" },
  { value: "support", labelKey: "support" },
];

export type StudioSupportThreadHeaderProps = {
  threadId: string;
  subject: string;
  divisionLabel: string;
  divisionValue: string;
  categoryLabel: string;
  priorityLabel: string;
  status: string;
  statusLabel: string;
  /** Server-rendered initial mute state for the staff side. */
  initialMuted?: boolean;
  /** Persistent participants strip below the pills. */
  participants: ThreadParticipant[];
  /** True for studio_owner / owner — gates the "Transfer division" action. */
  canTransfer: boolean;
  download: {
    endpoint: string;
    filename: string;
    shareTitle: string;
    label: string;
  };
};

/**
 * Workspace-grade thread header for /support/[threadId] in studio.
 * Adds the staff-only actions (mark resolved, reopen, transfer) and
 * the participants strip + customization popover to the previous
 * (closure-shipped) header.
 */
export default function StudioSupportThreadHeader({
  threadId,
  subject,
  divisionLabel,
  divisionValue,
  categoryLabel,
  priorityLabel,
  status,
  statusLabel,
  initialMuted,
  participants,
  canTransfer,
  download,
}: StudioSupportThreadHeaderProps) {
  const locale = useHenryCoLocale();
  const copy = getStudioSupportCopy(locale);
  const tone = statusTone(status);
  return (
    <header
      className="studio-support-header"
      aria-label={copy.header.ariaLabel}
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
            aria-label={copy.header.statusAria.replace("{status}", statusLabel)}
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
          {copy.header.threadMeta.replace("{id}", threadId.slice(0, 8))}
        </p>
        {participants.length > 0 ? (
          <ThreadParticipantsStrip
            participants={participants}
            ariaLabel={copy.header.participantsAria}
          />
        ) : null}
      </div>
      <div className="studio-support-header__actions">
        <StudioDownloadButton
          endpoint={download.endpoint}
          suggestedFilename={download.filename}
          shareTitle={download.shareTitle}
          label={download.label}
        />
        <ThreadCustomizationMenu />
        <ActionMenu
          threadId={threadId}
          subject={subject}
          status={status}
          divisionValue={divisionValue}
          initialMuted={Boolean(initialMuted)}
          canTransfer={canTransfer}
        />
      </div>
    </header>
  );
}

function ActionMenu({
  threadId,
  subject,
  status,
  divisionValue,
  initialMuted,
  canTransfer,
}: {
  threadId: string;
  subject: string;
  status: string;
  divisionValue: string;
  initialMuted: boolean;
  canTransfer: boolean;
}) {
  const locale = useHenryCoLocale();
  const copy = getStudioSupportCopy(locale);
  const [open, setOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [muted, setMuted] = useState(initialMuted);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [transferPanelOpen, setTransferPanelOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const firstItemRef = useRef<HTMLButtonElement | null>(null);
  const isResolved =
    status.toLowerCase() === "resolved" || status.toLowerCase() === "closed";

  const close = useCallback(() => {
    setOpen(false);
    setTransferPanelOpen(false);
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
        setTransferPanelOpen(false);
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

  const copyToClipboard = useCallback(async (key: string, value: string) => {
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
      // Silent.
    }
  }, []);

  const announce = useCallback((message: string) => {
    setFeedback(message);
    setTimeout(() => setFeedback((f) => (f && f.length > 0 ? null : f)), 2400);
  }, []);

  const toggleMute = useCallback(async () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    setBusyKey("mute");
    try {
      const response = await fetch("/api/support/mute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ threadId, muted: nextMuted }),
      });
      if (!response.ok) throw new Error("mute_failed");
      announce(
        nextMuted
          ? copy.header.feedback.notificationsMuted
          : copy.header.feedback.notificationsOn,
      );
    } catch {
      setMuted(!nextMuted);
      announce(copy.header.feedback.muteFailed);
    } finally {
      setBusyKey(null);
    }
  }, [muted, threadId, announce, copy]);

  const submitTransition = useCallback(
    async (action: "resolve" | "reopen") => {
      setBusyKey(action);
      try {
        const response = await fetch("/api/support/transitions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action, threadId }),
        });
        if (!response.ok) throw new Error("transition_failed");
        announce(
          action === "resolve"
            ? copy.header.feedback.markedResolved
            : copy.header.feedback.reopened,
        );
        // Allow the system message to commit before reloading the page.
        setTimeout(() => window.location.reload(), 600);
      } catch {
        announce(copy.header.feedback.statusFailed);
      } finally {
        setBusyKey(null);
      }
    },
    [threadId, announce, copy],
  );

  const submitTransfer = useCallback(
    async (division: string) => {
      setBusyKey("transfer");
      try {
        const response = await fetch("/api/support/transfer", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ threadId, division }),
        });
        if (!response.ok) throw new Error("transfer_failed");
        const divisionLabel =
          copy.divisions[division as keyof StudioSupportCopy["divisions"]] ??
          division;
        announce(
          copy.header.feedback.transferred.replace("{division}", divisionLabel),
        );
        setTimeout(() => window.location.reload(), 600);
      } catch {
        announce(copy.header.feedback.transferFailed);
      } finally {
        setBusyKey(null);
        setTransferPanelOpen(false);
      }
    },
    [threadId, announce, copy],
  );

  const reportThread = useCallback(async () => {
    setBusyKey("report");
    try {
      const response = await fetch("/api/support/report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ threadId }),
      });
      if (!response.ok) throw new Error("report_failed");
      announce(copy.header.feedback.flagged);
    } catch {
      announce(copy.header.feedback.flagFailed);
    } finally {
      setBusyKey(null);
    }
  }, [threadId, announce, copy]);

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
        aria-label={copy.header.actionsLabel}
        title={copy.header.actionsLabel}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={onTriggerKeyDown}
      >
        <MoreVertical size={16} />
      </button>
      {open ? (
        <div
          className="studio-support-header__menu-panel"
          role="menu"
          aria-label={copy.header.actionsLabel}
        >
          {transferPanelOpen ? (
            <div className="studio-support-header__menu-transfer">
              <span className="studio-support-header__menu-transfer-label">
                {copy.header.transfer.panelLabel}
              </span>
              <ul role="listbox" aria-label={copy.header.transfer.destinationAria}>
                {TRANSFER_DIVISIONS.filter(
                  (option) => option.value !== divisionValue,
                ).map((option) => (
                  <li key={option.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={false}
                      onClick={() => submitTransfer(option.value)}
                      disabled={busyKey === "transfer"}
                    >
                      <ArrowRightLeft size={12} aria-hidden />
                      {copy.divisions[option.labelKey]}
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="studio-support-header__menu-transfer-cancel"
                onClick={() => setTransferPanelOpen(false)}
              >
                {copy.header.transfer.cancel}
              </button>
            </div>
          ) : (
            <>
              {isResolved ? (
                <ActionItem
                  ref={firstItemRef}
                  icon={<RefreshCw size={14} aria-hidden />}
                  label={copy.header.actions.reopen.label}
                  description={copy.header.actions.reopen.description}
                  onSelect={() => submitTransition("reopen")}
                  disabled={busyKey === "reopen"}
                />
              ) : (
                <ActionItem
                  ref={firstItemRef}
                  icon={<CheckCircle2 size={14} aria-hidden />}
                  label={copy.header.actions.resolve.label}
                  description={copy.header.actions.resolve.description}
                  onSelect={() => submitTransition("resolve")}
                  disabled={busyKey === "resolve"}
                />
              )}
              {canTransfer ? (
                <ActionItem
                  icon={<ArrowRightLeft size={14} aria-hidden />}
                  label={copy.header.actions.transferDivision.label}
                  description={copy.header.actions.transferDivision.description}
                  onSelect={() => setTransferPanelOpen(true)}
                />
              ) : null}
              <ActionItem
                icon={
                  muted ? (
                    <BellRing size={14} aria-hidden />
                  ) : (
                    <BellOff size={14} aria-hidden />
                  )
                }
                label={
                  muted
                    ? copy.header.actions.unmute.label
                    : copy.header.actions.mute.label
                }
                description={
                  muted
                    ? copy.header.actions.unmute.description
                    : copy.header.actions.mute.description
                }
                onSelect={toggleMute}
                disabled={busyKey === "mute"}
              />
              <ActionItem
                icon={<AlertTriangle size={14} aria-hidden />}
                label={copy.header.actions.flag.label}
                description={copy.header.actions.flag.description}
                onSelect={reportThread}
                disabled={busyKey === "report"}
              />
              <div
                className="studio-support-header__menu-divider"
                role="separator"
              />
              <ActionItem
                icon={<Link2 size={14} aria-hidden />}
                label={
                  copiedKey === "link"
                    ? copy.header.actions.copyLink.confirmed
                    : copy.header.actions.copyLink.label
                }
                confirmed={copiedKey === "link"}
                onSelect={() => copyToClipboard("link", link)}
              />
              <ActionItem
                icon={<Copy size={14} aria-hidden />}
                label={
                  copiedKey === "id"
                    ? copy.header.actions.copyId.confirmed
                    : copy.header.actions.copyId.label
                }
                confirmed={copiedKey === "id"}
                onSelect={() => copyToClipboard("id", threadId)}
              />
              <div
                className="studio-support-header__menu-divider"
                role="separator"
              />
              <ActionItem
                icon={<Download size={14} aria-hidden />}
                label={copy.header.actions.download.label}
                description={copy.header.actions.download.description}
                disabled
                onSelect={() => null}
              />
              {feedback ? (
                <p
                  className="studio-support-header__menu-feedback"
                  role="status"
                >
                  {feedback}
                </p>
              ) : null}
              <p className="studio-support-header__menu-foot">
                {copy.header.foot.replace("{subject}", subject)}
              </p>
            </>
          )}
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
