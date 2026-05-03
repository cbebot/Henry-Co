"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Maximize2, Paperclip } from "lucide-react";
import { cn } from "@henryco/ui/cn";
import {
  DEFAULT_ACCEPTED_MIME_TYPES,
  DEFAULT_MAX_ATTACHMENTS,
  DEFAULT_MAX_FILE_BYTES,
  type ComposerAttachment,
  type ComposerProps,
} from "../types";
import { useAttachmentUpload } from "../hooks/useAttachmentUpload";
import { useDraftStorage } from "../hooks/useDraftStorage";
import {
  isMacLike,
  shortcutHintText,
  useComposerKeyboard,
} from "../hooks/useComposerKeyboard";
import { useIsMobile } from "../hooks/useIsMobile";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { AutosizeTextarea } from "./AutosizeTextarea";
import { AttachmentPreview } from "./AttachmentPreview";
import { DraftIndicator } from "./DraftIndicator";
import { SendButton } from "./SendButton";
import { FullScreenComposer } from "./FullScreenComposer";
import { ensureComposerStyles } from "./composer-styles";

/**
 * Tone palette aligned with @henryco/brand division accents and PublicBrandTokens.
 * Each tone exports its accent (focal/active) and a paired deep variant for
 * gradient + hover-lift + send-button pressed state.
 */
const TONE_ACCENT: Record<string, { base: string; deep: string }> = {
  neutral: { base: "#0E7C86", deep: "#0A5C63" },
  account: { base: "#1F4ED8", deep: "#1A3FB0" },
  care: { base: "#4F5DDA", deep: "#3C49B0" },
  jobs: { base: "#0E7C86", deep: "#0A5C63" },
  marketplace: { base: "#B2863B", deep: "#8C6326" },
  studio: { base: "#d4b14e", deep: "#a98835" },
};

function toneStyle(tone: string): React.CSSProperties {
  const accent = TONE_ACCENT[tone] || TONE_ACCENT.neutral;
  return {
    ["--composer-accent" as keyof React.CSSProperties]: accent.base,
    ["--composer-accent-deep" as keyof React.CSSProperties]: accent.deep,
    ["--composer-muted" as keyof React.CSSProperties]: "rgba(15,23,42,0.5)",
  } as React.CSSProperties;
}

type SendStatus = "idle" | "sending" | "failed";

export function ChatComposer(props: ComposerProps) {
  const {
    threadId,
    onSend,
    placeholder,
    tone = "neutral",
    disabled,
    busy: externalBusy,
    maxAttachments = DEFAULT_MAX_ATTACHMENTS,
    maxFileBytes = DEFAULT_MAX_FILE_BYTES,
    acceptedMimeTypes = DEFAULT_ACCEPTED_MIME_TYPES,
    acceptAttribute,
    enableAttachments = true,
    enableDraft = true,
    enableFullScreenOnMobile = true,
    uploadAttachment,
    onTyping,
    onValidationError,
    onSendSuccess,
    onSendError,
    className,
    labels,
    belowInputSlot,
    initialText,
    ariaLabel,
  } = props;

  useEffect(() => {
    ensureComposerStyles();
  }, []);

  const [text, setText] = useState(initialText || "");
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [sendStatus, setSendStatus] = useState<SendStatus>("idle");
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null
  );
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [shake, setShake] = useState(false);

  const isMobile = useIsMobile();
  const reduceMotion = useReducedMotion();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const inlineTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const liveRegionId = useId();

  const draft = useDraftStorage(threadId, enableDraft);
  const attachmentApi = useAttachmentUpload({
    uploader: uploadAttachment,
    maxBytes: maxFileBytes,
    maxAttachments,
    acceptedMimeTypes,
    onValidationError: (message) => {
      setValidationMessage(message);
      onValidationError?.(message);
    },
  });

  const { attachments, addFiles, removeAttachment, retryAttachment, clearAll } =
    attachmentApi;

  useEffect(() => {
    if (!draft.hydrated || draftHydrated) return;
    if (!initialText && draft.initialDraft) {
      setText(draft.initialDraft);
    }
    setDraftHydrated(true);
  }, [draft.hydrated, draft.initialDraft, draftHydrated, initialText]);

  useEffect(() => {
    if (!draftHydrated) return;
    draft.persist(text);
    if (text) onTyping?.();
  }, [text, draftHydrated, draft, onTyping]);

  useEffect(() => {
    if (!validationMessage) return;
    const t = setTimeout(() => setValidationMessage(null), 4500);
    return () => clearTimeout(t);
  }, [validationMessage]);

  const macLike = useMemo(() => isMacLike(), []);
  const shortcutHint = labels?.shortcutHint || shortcutHintText(macLike);

  const trimmed = text.trim();
  const hasText = trimmed.length > 0;
  const hasAttachments = attachments.length > 0;
  const ready =
    !disabled &&
    !externalBusy &&
    sendStatus !== "sending" &&
    !attachmentApi.hasPending &&
    (hasText || hasAttachments);

  const handleSubmit = useCallback(async () => {
    if (!ready) return;
    if (attachmentApi.hasFailed) {
      setValidationMessage(
        labels?.failedSendLabel ||
          "One or more attachments failed to upload — retry or remove them first."
      );
      return;
    }
    setSendStatus("sending");
    setValidationMessage(null);
    try {
      await onSend({
        threadId,
        text: trimmed,
        attachments: attachments as ComposerAttachment[],
      });
      setSendStatus("idle");
      setText("");
      clearAll();
      await draft.clear();
      setIsFullScreen(false);
      onSendSuccess?.();
    } catch (error) {
      setSendStatus("failed");
      setShake(true);
      setTimeout(() => setShake(false), 400);
      const message =
        error instanceof Error
          ? error.message
          : "We couldn't send that. Try again.";
      setValidationMessage(message);
      onSendError?.(error instanceof Error ? error : new Error(message));
    }
  }, [
    ready,
    attachmentApi.hasFailed,
    onSend,
    threadId,
    trimmed,
    attachments,
    draft,
    clearAll,
    onSendSuccess,
    onSendError,
    labels?.failedSendLabel,
  ]);

  const handleKeyDown = useComposerKeyboard({
    onSubmit: handleSubmit,
    onEscape: isFullScreen ? () => setIsFullScreen(false) : undefined,
    disabled,
  });

  const handleDiscardDraft = useCallback(async () => {
    setText("");
    clearAll();
    await draft.clear();
  }, [clearAll, draft]);

  const handleFiles = useCallback(
    (files: FileList | File[] | null) => {
      if (!files) return;
      addFiles(files);
    },
    [addFiles]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragOver(false);
      if (!enableAttachments) return;
      handleFiles(event.dataTransfer.files);
    },
    [enableAttachments, handleFiles]
  );

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
      if (!enableAttachments) return;
      const items = Array.from(event.clipboardData?.items || []);
      const fileItems = items
        .filter((item) => item.kind === "file")
        .map((item) => item.getAsFile())
        .filter((file): file is File => Boolean(file));
      if (fileItems.length > 0) {
        event.preventDefault();
        handleFiles(fileItems);
      }
    },
    [enableAttachments, handleFiles]
  );

  const acceptForInput =
    acceptAttribute || acceptedMimeTypes.join(",");

  const showFullScreenButton = enableFullScreenOnMobile && isMobile;

  const inlineComposer = (
    <div
      className={cn(
        "henryco-composer-shell",
        "relative flex flex-col gap-2 rounded-[1.6rem] border px-3 py-3",
        "border-[rgba(15,23,42,0.08)]",
        "shadow-[0_18px_48px_-32px_rgba(15,23,42,0.32),0_2px_6px_rgba(15,23,42,0.04)]",
        "dark:border-white/10",
        "dark:shadow-[0_24px_64px_rgba(0,0,0,0.5)]",
        className
      )}
      style={toneStyle(tone)}
      data-drag-over={isDragOver ? "true" : undefined}
      onDragOver={(event) => {
        if (!enableAttachments) return;
        if (event.dataTransfer.types.includes("Files")) {
          event.preventDefault();
          setIsDragOver(true);
        }
      }}
      onDragLeave={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node)) return;
        setIsDragOver(false);
      }}
      onDrop={handleDrop}
      data-composer-root="inline"
      role="group"
      aria-label={ariaLabel || "Message composer"}
    >
      {isDragOver && enableAttachments ? (
        <div
          className={cn(
            "pointer-events-none absolute inset-0 flex items-center justify-center rounded-[1.6rem]",
            "bg-[color:var(--composer-accent)]/5 backdrop-blur-[2px]",
            !reduceMotion && "henryco-drop-overlay-active"
          )}
          aria-hidden
        >
          <span className="rounded-full bg-white/95 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--composer-accent)] shadow-[0_4px_14px_rgba(15,23,42,0.08)] dark:bg-zinc-900/85">
            Drop to attach
          </span>
        </div>
      ) : null}
      <div className="flex items-start gap-2">
        <AutosizeTextarea
          ref={inlineTextareaRef}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder || labels?.placeholder || "Write a message…"}
          minRows={1}
          maxRows={6}
          disabled={disabled}
          aria-label={ariaLabel || "Message body"}
          aria-describedby={liveRegionId}
          className="flex-1 px-2 py-2 text-zinc-900 dark:text-white"
        />
        {showFullScreenButton ? (
          <button
            type="button"
            onClick={() => setIsFullScreen(true)}
            className="henryco-attach-pill mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[rgba(15,23,42,0.08)] text-zinc-700 dark:border-white/10 dark:text-white"
            aria-label={labels?.expandLabel || "Open full-screen composer"}
          >
            <Maximize2 className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>

      {hasAttachments ? (
        <AttachmentPreview
          attachments={attachments}
          onRemove={removeAttachment}
          onRetry={retryAttachment}
          variant="inline"
          removeLabel={labels?.removeAttachmentLabel}
          retryLabel={labels?.retryUploadLabel}
        />
      ) : null}

      <div className="flex flex-wrap items-center gap-3 border-t border-black/5 px-1 pt-2 dark:border-white/10">
        {enableAttachments ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={acceptForInput}
              onChange={(event) => {
                handleFiles(event.target.files);
                event.currentTarget.value = "";
              }}
              className="hidden"
              tabIndex={-1}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="henryco-attach-pill inline-flex h-9 items-center gap-2 rounded-full border border-[rgba(15,23,42,0.08)] px-3 text-xs font-semibold tracking-[0.01em] text-zinc-700 dark:border-white/10 dark:text-white/80"
              aria-label={labels?.attachLabel || "Attach files"}
            >
              <Paperclip className="h-3.5 w-3.5" aria-hidden />
              {labels?.attachLabel || "Attach"}
            </button>
          </>
        ) : null}

        {enableDraft ? (
          <DraftIndicator
            state={draft.state}
            hasContent={hasText || hasAttachments}
            onDiscard={handleDiscardDraft}
            savedLabel={labels?.draftSavedLabel}
            discardLabel={labels?.discardDraftLabel}
            reduceMotion={reduceMotion}
          />
        ) : null}

        <span className="ml-auto hidden text-[11px] text-zinc-400 dark:text-white/40 sm:inline">
          {shortcutHint}
        </span>

        <SendButton
          ready={ready}
          busy={sendStatus === "sending" || Boolean(externalBusy)}
          disabled={disabled}
          shake={shake}
          reduceMotion={reduceMotion}
          onClick={handleSubmit}
          label={labels?.sendLabel || "Send"}
          busyLabel={labels?.sendingLabel || "Sending…"}
        />
      </div>

      {belowInputSlot}

      <span id={liveRegionId} className="sr-only" aria-live="polite">
        {validationMessage ||
          (sendStatus === "sending" ? "Sending message" : "")}
      </span>

      {validationMessage ? (
        <div
          role="alert"
          className="rounded-2xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-200"
        >
          {validationMessage}
        </div>
      ) : null}
    </div>
  );

  if (isFullScreen && enableFullScreenOnMobile) {
    return (
      <>
        {inlineComposer}
        <FullScreenComposer
          text={text}
          onTextChange={setText}
          attachments={attachments}
          onRemoveAttachment={removeAttachment}
          onRetryAttachment={retryAttachment}
          onAddFiles={(files) => handleFiles(files)}
          onClose={() => setIsFullScreen(false)}
          onSubmit={handleSubmit}
          onKeyDown={handleKeyDown}
          ready={ready}
          busy={sendStatus === "sending" || Boolean(externalBusy)}
          shake={shake}
          reduceMotion={reduceMotion}
          tone={tone}
          accept={acceptForInput}
          enableAttachments={enableAttachments}
          shortcutHint={shortcutHint}
          labels={labels}
          draftState={draft.state}
          onDiscardDraft={handleDiscardDraft}
          enableDraft={enableDraft}
          validationMessage={validationMessage}
          ariaLabel={ariaLabel}
        />
      </>
    );
  }

  return inlineComposer;
}
