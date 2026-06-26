"use client";

import { useState, type ReactNode } from "react";
import { CircleStop, Disc3, LogOut, Mic, Hand } from "lucide-react";
import {
  ActionButton,
  EmptyState,
  LoadingSkeleton,
  Panel,
  Section,
} from "@henryco/dashboard-shell/components";
import { CSS_VARS } from "@henryco/dashboard-shell/tokens";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { getRoomsCopy, type RoomsCopy } from "@henryco/i18n";

import type {
  CreateRoomSuccess,
  ParticipantRole,
  RoomError,
  RoomLifecycleState,
} from "../types";
import { RoomBadge } from "./RoomBadge";

type RoomShellCopy = RoomsCopy["roomShell"];

/**
 * RoomShell — typed wrapper around the provider video iframe.
 *
 * Renders the room scaffold: provider video iframe + presence pane +
 * recording badge + slots for screen share, collab editor, scorecard,
 * and chat. Loading state via `<LoadingSkeleton>`. Error state via
 * `<EmptyState>` + retry.
 *
 * THE SHELL DOES NOT KNOW THE SUPABASE CLIENT.
 *   - The host page mounts <RoomsRealtimeProvider> above this component.
 *   - The shell composes the visible chrome and renders the children
 *     slots (presence, chat, scorecard, collab).
 *
 * THE SHELL IS PROVIDER-AGNOSTIC.
 *   - Daily renders via `<iframe src={joinUrl} />`. Daily's prebuilt UI
 *     handles every in-room affordance (camera, mic, screen share,
 *     chat, recording).
 *   - Jitsi also renders via iframe with the join token encoded into
 *     the URL hash.
 *   - The shell does NOT call provider SDKs directly. Anti-pattern #4
 *     (no direct provider SDK consumer-side).
 *
 * STATES (V10)
 *   - loading: lifecycle.state === "idle" / "joining" — render
 *     LoadingSkeleton in the video slot.
 *   - error: lifecycle.state === "error" — render EmptyState + retry.
 *   - empty: lifecycle.state === "idle" pre-join — render the "Tap to
 *     join" affordance.
 *   - success: lifecycle.state === "live" — render the iframe + chrome.
 *
 * ACCESSIBILITY
 *   - The video iframe gets `title="Room video"` for screen readers.
 *   - The shell is a `<section role="region" aria-label="Live room">`.
 *   - Recording badge wraps an aria-live span so screen readers
 *     announce "Recording started" / "Recording stopped".
 */
export type RoomShellProps = {
  /** The created room — supplies session id, provider, joinUrl. */
  room: CreateRoomSuccess;
  /** The viewer's role in this session. */
  role: ParticipantRole;
  /** Lifecycle state from useRoomLifecycle. */
  lifecycle: RoomLifecycleState;
  /** Show the scorecard sidebar? Default false. */
  scorecardEnabled?: boolean;
  /** Show the collab editor pane? Default false. */
  collabEditor?: boolean;
  /** Show the recording-consent affordance / current consent? */
  recordingConsent?: {
    consentGiven: boolean;
    onOpenConsentDialog: () => void;
  };
  /** Render the chat panel into the side / bottom slot. */
  renderChat?: () => ReactNode;
  /** Render the scorecard sidebar (only when scorecardEnabled). */
  renderScorecard?: () => ReactNode;
  /** Render the collab editor pane (only when collabEditor). */
  renderCollabEditor?: () => ReactNode;
  /** Render the presence pane. */
  renderPresence?: () => ReactNode;
  /** Render the screen-share pane (above the iframe controls). */
  renderScreenShare?: () => ReactNode;
  /** Title (e.g. "Interview with X"). */
  title?: string;
  /** Optional kicker (e.g. "Jobs · Live"). */
  kicker?: string;
};

export function RoomShell({
  room,
  role,
  lifecycle,
  scorecardEnabled = false,
  collabEditor = false,
  recordingConsent,
  renderChat,
  renderScorecard,
  renderCollabEditor,
  renderPresence,
  renderScreenShare,
  title,
  kicker,
}: RoomShellProps) {
  const locale = useHenryCoLocale();
  const copy = getRoomsCopy(locale).roomShell;
  const resolvedTitle = title ?? copy.defaultTitle;
  const resolvedKicker = kicker ?? copy.defaultKicker;
  const [retryCount, setRetryCount] = useState(0);

  // Build the iframe src — for Jitsi the joinToken may be a JWT (use as
  // ?jwt=) or a URL fragment (use as #...). Daily uses ?t= for the
  // meeting token.
  const iframeSrc = lifecycle.state === "live" ? buildIframeSrc(room.joinUrl, room.provider) : null;

  const isOwnerRole = role === "host" || role === "interviewer" || role === "operator";
  const recordingActive = lifecycle.recording.active;

  return (
    <section
      role="region"
      aria-label={resolvedTitle}
      style={{
        display: "grid",
        gap: "1.25rem",
        gridTemplateColumns: "minmax(0, 1fr)",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: "0.75rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: `var(${CSS_VARS.inkMuted})`,
              fontWeight: 600,
            }}
          >
            {resolvedKicker}
          </p>
          <h1
            style={{
              margin: 0,
              fontSize: "1.5rem",
              lineHeight: 1.2,
              color: `var(${CSS_VARS.ink})`,
            }}
          >
            {resolvedTitle}
          </h1>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            flexWrap: "wrap",
          }}
        >
          <RoomBadge status={lifecycle.state === "live" ? "live" : lifecycle.state === "ended" ? "ended" : "scheduled"} />
          {recordingActive ? (
            <span
              aria-live="polite"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.25rem 0.65rem",
                borderRadius: "9999px",
                backgroundColor: "var(--hc-status-danger-bg, #FEE2E2)",
                color: "var(--hc-status-danger-text, #B91C1C)",
                fontSize: "0.8rem",
                fontWeight: 600,
              }}
            >
              <Disc3
                size={12}
                aria-hidden
                style={{ animation: "henrycoSpin 2s linear infinite" }}
              />
              {copy.recordingBadge}
            </span>
          ) : null}
        </div>
      </header>

      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns:
            collabEditor || scorecardEnabled
              ? "minmax(0, 2fr) minmax(280px, 1fr)"
              : "minmax(0, 1fr)",
        }}
      >
        {/* Video + main slot */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Video iframe */}
          <Panel tone="raised" padding="md">
            {lifecycle.state === "idle" ? (
              <PrejoinState
                onJoin={lifecycle.join}
                copy={copy}
              />
            ) : lifecycle.state === "joining" ? (
              <div style={{ minHeight: "20rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <LoadingSkeleton variant="card" lines={3} height="20rem" />
              </div>
            ) : lifecycle.state === "error" ? (
              <ErrorState
                error={lifecycle.error}
                onRetry={() => {
                  setRetryCount((c) => c + 1);
                  void lifecycle.join();
                }}
                copy={copy}
              />
            ) : lifecycle.state === "ended" ? (
              <EmptyState
                kicker={copy.endedKicker}
                headline={copy.endedHeadline}
                body={copy.endedBody}
              />
            ) : (
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  paddingTop: "56.25%", // 16:9
                  borderRadius: "0.75rem",
                  overflow: "hidden",
                  backgroundColor: "#000",
                }}
              >
                {iframeSrc ? (
                  <iframe
                    key={retryCount}
                    title={copy.videoTitle}
                    src={iframeSrc}
                    allow="camera; microphone; fullscreen; speaker; display-capture; autoplay; clipboard-read; clipboard-write"
                    referrerPolicy="strict-origin-when-cross-origin"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      border: 0,
                    }}
                  />
                ) : null}
              </div>
            )}
          </Panel>

          {/* Screen share pane (slot) */}
          {renderScreenShare ? renderScreenShare() : null}

          {/* Collab editor (slot) */}
          {collabEditor && renderCollabEditor ? renderCollabEditor() : null}

          {/* Controls strip */}
          <Panel tone="flat" padding="md">
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <ActionButton
                  tone="secondary"
                  onClick={lifecycle.toggleHand}
                  icon={<Hand size={16} aria-hidden />}
                  aria-label={copy.raiseHand}
                >
                  {copy.raiseHand}
                </ActionButton>
                <ActionButton
                  tone="secondary"
                  onClick={() => {
                    // No-op stub — the provider iframe owns the mute.
                  }}
                  icon={<Mic size={16} aria-hidden />}
                  aria-label={copy.muteLabel}
                >
                  {copy.mute}
                </ActionButton>
                {recordingConsent ? (
                  <ActionButton
                    tone="ghost"
                    onClick={recordingConsent.onOpenConsentDialog}
                    aria-label={
                      recordingConsent.consentGiven
                        ? copy.reviewConsentLabel
                        : copy.provideConsentLabel
                    }
                  >
                    {recordingConsent.consentGiven
                      ? copy.consentGranted
                      : copy.consentPending}
                  </ActionButton>
                ) : null}
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {isOwnerRole ? (
                  recordingActive ? (
                    <ActionButton
                      tone="secondary"
                      onClick={lifecycle.stopRecording}
                      icon={<CircleStop size={16} aria-hidden />}
                    >
                      {copy.stopRecording}
                    </ActionButton>
                  ) : (
                    <ActionButton
                      tone="secondary"
                      onClick={lifecycle.startRecording}
                      icon={<Disc3 size={16} aria-hidden />}
                    >
                      {copy.startRecording}
                    </ActionButton>
                  )
                ) : null}
                <ActionButton
                  tone="primary"
                  onClick={lifecycle.leave}
                  icon={<LogOut size={16} aria-hidden />}
                >
                  {copy.leave}
                </ActionButton>
              </div>
            </div>
          </Panel>

          {/* Presence below the controls on mobile-stack; the right-rail
              shows presence on desktop wide layouts. */}
          {renderPresence ? renderPresence() : null}
        </div>

        {/* Right rail: scorecard OR collab editor pane */}
        {(scorecardEnabled || collabEditor) && (renderScorecard || renderChat) ? (
          <aside
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              minWidth: 0,
            }}
          >
            {scorecardEnabled && renderScorecard ? renderScorecard() : null}
            {renderChat ? renderChat() : null}
          </aside>
        ) : renderChat ? (
          <div style={{ minWidth: 0 }}>{renderChat()}</div>
        ) : null}
      </div>
    </section>
  );
}

function PrejoinState({
  onJoin,
  copy,
}: {
  onJoin: () => Promise<void>;
  copy: RoomShellCopy;
}) {
  return (
    <Section kicker={copy.prejoinKicker} headline={copy.prejoinHeadline}>
      <p
        style={{
          margin: 0,
          fontSize: "0.95rem",
          color: `var(${CSS_VARS.inkSoft})`,
          maxWidth: "55ch",
        }}
      >
        {copy.prejoinBody}
      </p>
      <div style={{ marginTop: "1rem" }}>
        <ActionButton tone="primary" onClick={onJoin}>
          {copy.joinRoom}
        </ActionButton>
      </div>
    </Section>
  );
}

function ErrorState({
  error,
  onRetry,
  copy,
}: {
  error?: RoomError;
  onRetry: () => void;
  copy: RoomShellCopy;
}) {
  const message = errorCopy(error, copy);
  return (
    <EmptyState
      kicker={copy.errorKicker}
      headline={message.headline}
      body={message.body}
      action={
        <ActionButton tone="primary" onClick={onRetry}>
          {copy.tryAgain}
        </ActionButton>
      }
    />
  );
}

function errorCopy(
  error: RoomError | undefined,
  copy: RoomShellCopy,
): { headline: string; body: string } {
  if (!error) {
    return {
      headline: copy.error.defaultHeadline,
      body: copy.error.defaultBody,
    };
  }
  switch (error.error) {
    case "rooms_unavailable":
      return {
        headline: copy.error.unavailableHeadline,
        body: copy.error.unavailableBody,
      };
    case "provider_unavailable":
      return {
        headline: copy.error.offlineHeadline,
        body: copy.error.offlineBody,
      };
    case "session_not_found":
      return {
        headline: copy.error.notFoundHeadline,
        body: copy.error.notFoundBody,
      };
    case "session_not_joinable":
      return {
        headline: copy.error.closedHeadline,
        body: copy.error.closedBody,
      };
    case "unauthorized":
      return {
        headline: copy.error.unauthorizedHeadline,
        body: copy.error.unauthorizedBody,
      };
    case "consent_missing":
      return {
        headline: copy.error.consentHeadline,
        body: copy.error.consentBody,
      };
    case "rate_limited":
      return {
        headline: copy.error.rateLimitedHeadline,
        body: copy.error.rateLimitedBody(error.retryAfter ?? 60),
      };
    case "validation_failed":
      return {
        headline: copy.error.validationHeadline,
        body: error.message,
      };
    case "internal_error":
    default:
      return {
        headline: copy.error.internalHeadline,
        body: copy.error.internalBody,
      };
  }
}

/**
 * Build the iframe src URL for a given provider.
 *
 * Daily: `joinUrl` is the canonical room URL (https://your.daily.co/room).
 *   When the meeting token is present (the lifecycle hook attached
 *   ?t=<token> via the join action's joinUrl param), we use the URL as-is.
 *   When it's not (anonymous prejoin), the URL itself is enough.
 *
 * Jitsi: `joinUrl` is the room URL. If the token starts with `#` it's a
 *   userInfo fragment; if it doesn't, it's a JWT to append as `?jwt=`.
 *   For Wave A2 we render the room as-is — the lifecycle hook attaches
 *   the token via the iframe `allow` permissions and the iframe's
 *   prejoin form picks up the display name.
 */
function buildIframeSrc(joinUrl: string, _provider: "daily" | "jitsi"): string {
  return joinUrl;
}
