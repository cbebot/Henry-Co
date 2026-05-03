"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Paperclip } from "lucide-react";
import { cn } from "@henryco/ui/cn";
import type { ComposerAttachment, ComposerLabels, ComposerTone } from "../types";
import type { DraftState } from "../hooks/useDraftStorage";
import { useViewportKeyboard } from "../hooks/useViewportKeyboard";
import { AutosizeTextarea } from "./AutosizeTextarea";
import { AttachmentPreview } from "./AttachmentPreview";
import { DraftIndicator } from "./DraftIndicator";
import { SendButton } from "./SendButton";

const TONE_ACCENT: Record<string, { base: string; deep: string }> = {
  neutral: { base: "#0E7C86", deep: "#0A5C63" },
  account: { base: "#1F4ED8", deep: "#1A3FB0" },
  care: { base: "#4F5DDA", deep: "#3C49B0" },
  jobs: { base: "#0E7C86", deep: "#0A5C63" },
  marketplace: { base: "#B2863B", deep: "#8C6326" },
  studio: { base: "#d4b14e", deep: "#a98835" },
};

const COLLAPSE_VELOCITY = 0.85; // px/ms
const COLLAPSE_DISTANCE = 110; // px

type Props = {
  text: string;
  onTextChange: (text: string) => void;
  attachments: ComposerAttachment[];
  onRemoveAttachment: (id: string) => void;
  onRetryAttachment: (id: string) => void;
  onAddFiles: (files: FileList | File[]) => void;
  onClose: () => void;
  onSubmit: () => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  ready: boolean;
  busy: boolean;
  shake: boolean;
  reduceMotion: boolean;
  tone: ComposerTone;
  accept: string;
  enableAttachments: boolean;
  shortcutHint: string;
  labels?: ComposerLabels;
  draftState: DraftState;
  onDiscardDraft: () => void;
  enableDraft: boolean;
  validationMessage: string | null;
  ariaLabel?: string;
};

export function FullScreenComposer(props: Props) {
  const {
    text,
    onTextChange,
    attachments,
    onRemoveAttachment,
    onRetryAttachment,
    onAddFiles,
    onClose,
    onSubmit,
    onKeyDown,
    ready,
    busy,
    shake,
    reduceMotion,
    tone,
    accept,
    enableAttachments,
    shortcutHint,
    labels,
    draftState,
    onDiscardDraft,
    enableDraft,
    validationMessage,
    ariaLabel,
  } = props;

  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const dragStart = useRef<{ y: number; t: number } | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  const viewport = useViewportKeyboard(true);

  useEffect(() => {
    setMounted(true);
    document.documentElement.classList.add("henryco-composer-locked");
    document.body.style.overflow = "hidden";
    const focusTimer = setTimeout(() => {
      textareaRef.current?.focus();
    }, 80);
    return () => {
      document.documentElement.classList.remove("henryco-composer-locked");
      document.body.style.overflow = "";
      clearTimeout(focusTimer);
    };
  }, []);

  const beginClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => {
      onClose();
    }, reduceMotion ? 0 : 220);
  }, [closing, onClose, reduceMotion]);

  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") beginClose();
    },
    [beginClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [handleEscape]);

  const tonePair = TONE_ACCENT[tone] || TONE_ACCENT.neutral;

  const overlayStyle = useMemo<React.CSSProperties>(() => {
    return {
      ["--composer-accent" as keyof React.CSSProperties]: tonePair.base,
      ["--composer-accent-deep" as keyof React.CSSProperties]: tonePair.deep,
      paddingBottom: viewport.bottomInset
        ? `${viewport.bottomInset}px`
        : undefined,
    } as React.CSSProperties;
  }, [tonePair.base, tonePair.deep, viewport.bottomInset]);

  const handleHeaderTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0];
    if (!touch) return;
    dragStart.current = { y: touch.clientY, t: Date.now() };
  };
  const handleHeaderTouchMove = (event: React.TouchEvent) => {
    if (!dragStart.current) return;
    const touch = event.touches[0];
    if (!touch) return;
    const delta = touch.clientY - dragStart.current.y;
    setDragOffset(Math.max(0, delta));
  };
  const handleHeaderTouchEnd = () => {
    if (!dragStart.current) return;
    const start = dragStart.current;
    const delta = dragOffset;
    const elapsed = Math.max(1, Date.now() - start.t);
    const velocity = delta / elapsed;
    dragStart.current = null;
    if (delta > COLLAPSE_DISTANCE || velocity > COLLAPSE_VELOCITY) {
      beginClose();
    } else {
      setDragOffset(0);
    }
  };

  if (typeof document === "undefined" || !mounted) return null;

  const headerInnerStyle: React.CSSProperties = {
    transform: dragOffset ? `translateY(${dragOffset * 0.4}px)` : undefined,
  };

  const overlay = (
    <div
      ref={containerRef}
      className={cn(
        "fixed inset-0 z-[2147483600] flex flex-col bg-white text-zinc-900",
        "dark:bg-[#070D18] dark:text-white",
        !reduceMotion &&
          (closing
            ? "henryco-fullscreen-leave"
            : "henryco-fullscreen-enter")
      )}
      style={overlayStyle}
      role="dialog"
      aria-modal="true"
      aria-label={
        labels?.fullScreenTitleLabel || ariaLabel || "Compose a message"
      }
    >
      <div className="henryco-fullscreen-strip" aria-hidden />
      <div
        className="relative flex items-center gap-3 border-b border-black/5 px-4 py-3.5 dark:border-white/10"
        onTouchStart={handleHeaderTouchStart}
        onTouchMove={handleHeaderTouchMove}
        onTouchEnd={handleHeaderTouchEnd}
        style={headerInnerStyle}
      >
        <span
          className="absolute left-1/2 top-1.5 h-1 w-9 -translate-x-1/2 rounded-full bg-black/15 dark:bg-white/20 sm:hidden"
          aria-hidden
        />
        <button
          type="button"
          onClick={beginClose}
          aria-label={labels?.collapseLabel || "Collapse composer"}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/5 text-zinc-700 transition hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--composer-accent)]/45 dark:bg-white/10 dark:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </button>
        <div className="flex flex-1 flex-col leading-tight">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[color:var(--composer-accent)]/80 dark:text-[color:var(--composer-accent)]">
            {labels?.fullScreenTitleLabel || "Compose"}
          </span>
          <span className="text-[15px] font-semibold tracking-[-0.005em] text-zinc-900 dark:text-white">
            {ariaLabel || "New message"}
          </span>
        </div>
        <span
          className="hidden text-[11px] font-medium text-zinc-400 dark:text-white/40 sm:inline"
          aria-hidden
        >
          {shortcutHint}
        </span>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        {attachments.length > 0 ? (
          <div className="border-b border-black/5 px-3 py-3 dark:border-white/10">
            <AttachmentPreview
              attachments={attachments}
              onRemove={onRemoveAttachment}
              onRetry={onRetryAttachment}
              variant="carousel"
              removeLabel={labels?.removeAttachmentLabel}
              retryLabel={labels?.retryUploadLabel}
            />
          </div>
        ) : null}

        <div className="flex-1 overflow-hidden px-4 pt-3 pb-1">
          <AutosizeTextarea
            ref={textareaRef}
            value={text}
            onChange={(event) => onTextChange(event.target.value)}
            onKeyDown={onKeyDown}
            fill
            placeholder={labels?.placeholder || "Write a message…"}
            aria-label={ariaLabel || "Message body"}
            className="min-h-[40vh] text-base leading-7 text-zinc-900 dark:text-white"
            disabled={busy}
          />
        </div>

        {validationMessage ? (
          <div
            role="alert"
            className="mx-4 mb-2 rounded-2xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-200"
          >
            {validationMessage}
          </div>
        ) : null}

        {enableDraft ? (
          <div className="px-4 pb-1">
            <DraftIndicator
              state={draftState}
              hasContent={text.length > 0 || attachments.length > 0}
              onDiscard={onDiscardDraft}
              savedLabel={labels?.draftSavedLabel}
              discardLabel={labels?.discardDraftLabel}
              reduceMotion={reduceMotion}
            />
          </div>
        ) : null}
      </div>

      <div
        className="flex items-center gap-3 border-t border-black/5 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#070D18]"
        style={{
          paddingBottom: `max(env(safe-area-inset-bottom, 0px), 0.75rem)`,
        }}
      >
        {enableAttachments ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={accept}
              onChange={(event) => {
                if (event.target.files) onAddFiles(event.target.files);
                event.currentTarget.value = "";
              }}
              className="hidden"
              tabIndex={-1}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label={labels?.attachLabel || "Attach files"}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/5 text-zinc-700 transition hover:bg-black/10 dark:bg-white/10 dark:text-white"
            >
              <Paperclip className="h-4 w-4" aria-hidden />
            </button>
          </>
        ) : null}
        <div className="ml-auto">
          <SendButton
            ready={ready}
            busy={busy}
            onClick={onSubmit}
            shake={shake}
            reduceMotion={reduceMotion}
            label={labels?.sendLabel || "Send"}
            busyLabel={labels?.sendingLabel || "Sending…"}
          />
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
