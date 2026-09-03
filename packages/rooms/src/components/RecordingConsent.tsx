"use client";

import { useState } from "react";
import { ShieldCheck, ShieldOff } from "lucide-react";
import {
  ActionButton,
  BottomSheet,
  Drawer,
} from "@henryco/dashboard-shell/components";
import { CSS_VARS } from "@henryco/dashboard-shell/tokens";

import {
  recordConsent as recordConsentAction,
  withdrawConsent as withdrawConsentAction,
} from "../server/actions";
import { isRoomError } from "../types";
import type { RoomError } from "../types";

/**
 * RecordingConsent — versioned consent modal.
 *
 * Shown on first join when the session is configured to allow
 * recording. Plain-language copy. User clicks "I consent" and the
 * server action records the row; user can withdraw at any time — if
 * recording is currently active, the consumer surface MUST stop it
 * (this component does not stop recording itself, because there is no
 * guarantee the withdrawer is the recording's initiator).
 *
 * `consentTextVersion` MUST be passed by the host so a future copy
 * change does not retroactively re-consent users. Convention: an
 * ISO-date string like `"2026-05-14"`, bumped whenever the copy
 * material changes.
 *
 * Renders on desktop as a `<Drawer>` (right side), on mobile as a
 * `<BottomSheet>` per DASH-7 mobile parity.
 *
 * Accessibility:
 *   - role="dialog" + aria-modal="true" via Drawer / BottomSheet
 *   - Focus trapped inside the dialog (Drawer / BottomSheet primitives)
 *   - Escape closes (deferred to parent — they handle the dismiss)
 */
export type RecordingConsentProps = {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  consentTextVersion: string;
  /** Pre-existing consent state — drives the title + actions. */
  alreadyConsented: boolean;
  /** When true, render a BottomSheet instead of a Drawer. */
  isMobile?: boolean;
  /** Called after the user consents (or withdraws). */
  onChange?: (next: { consented: boolean }) => void;
};

export function RecordingConsent({
  open,
  onClose,
  sessionId,
  consentTextVersion,
  alreadyConsented,
  isMobile,
  onChange,
}: RecordingConsentProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<RoomError | undefined>(undefined);

  const consent = async () => {
    setSubmitting(true);
    setError(undefined);
    const result = await recordConsentAction({
      sessionId,
      consentTextVersion,
    });
    setSubmitting(false);
    if (isRoomError(result)) {
      setError(result);
      return;
    }
    onChange?.({ consented: true });
    onClose();
  };

  const withdraw = async () => {
    setSubmitting(true);
    setError(undefined);
    const result = await withdrawConsentAction({ sessionId });
    setSubmitting(false);
    if (isRoomError(result)) {
      setError(result);
      return;
    }
    onChange?.({ consented: false });
    onClose();
  };

  const body = (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <p
        style={{
          margin: 0,
          color: `var(${CSS_VARS.ink})`,
          lineHeight: 1.55,
        }}
      >
        This session may be recorded for review. The recording is stored on
        Henry Onyx infrastructure and is accessible only to participants and the
        session owner.
      </p>
      <ul
        style={{
          margin: 0,
          paddingInlineStart: "1.25rem",
          color: `var(${CSS_VARS.inkSoft})`,
          display: "flex",
          flexDirection: "column",
          gap: "0.4rem",
          lineHeight: 1.5,
        }}
      >
        <li>You can withdraw consent at any time — recording will stop.</li>
        <li>
          You can request a copy or deletion of the recording from your
          account settings.
        </li>
        <li>
          Recording will not start until every participant has consented.
        </li>
      </ul>
      <p
        style={{
          margin: 0,
          fontSize: "0.8rem",
          color: `var(${CSS_VARS.inkMuted})`,
        }}
      >
        Consent text version: <code>{consentTextVersion}</code>
      </p>
      {error ? (
        <p
          role="alert"
          style={{
            margin: 0,
            color: "var(--hc-status-danger-text, #B91C1C)",
            fontSize: "0.9rem",
          }}
        >
          We couldn&apos;t save your choice ({error.error}). Try again.
        </p>
      ) : null}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
          marginTop: "0.25rem",
        }}
      >
        {alreadyConsented ? (
          <>
            <ActionButton
              tone="secondary"
              onClick={withdraw}
              spinner={submitting}
              icon={<ShieldOff size={16} aria-hidden />}
            >
              Withdraw consent
            </ActionButton>
            <ActionButton tone="ghost" onClick={onClose}>
              Keep consent
            </ActionButton>
          </>
        ) : (
          <>
            <ActionButton
              tone="primary"
              onClick={consent}
              spinner={submitting}
              icon={<ShieldCheck size={16} aria-hidden />}
            >
              I consent to recording
            </ActionButton>
            <ActionButton tone="ghost" onClick={onClose}>
              Not now
            </ActionButton>
          </>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <BottomSheet
        open={open}
        onClose={onClose}
        title="Recording consent"
        kicker="Live room"
      >
        {body}
      </BottomSheet>
    );
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Recording consent"
      kicker="Live room"
    >
      {body}
    </Drawer>
  );
}
