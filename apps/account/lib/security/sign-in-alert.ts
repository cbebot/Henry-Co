import "server-only";

import { randomUUID } from "node:crypto";

import { publishNotification } from "@henryco/notifications";

import { logSecurityEvent, summarizeUserAgent } from "@/lib/security-events";

import { evaluateSignIn, type SignInDecisionReason } from "./sign-in-evaluation";
import { loadKnownDeviceState, recordKnownDevice } from "./known-devices";
import { sendSignInSecurityEmail } from "./security-email";
import type { SignInAlertReason } from "./security-email-content";

/**
 * Sign-in alert orchestrator.
 *
 * Gathers the recognised-device state, runs the pure decision, always records
 * the device, and — only when the decision says so — fires three redundant,
 * independently-isolated channels: the in-app + push notification, the
 * security history entry, and the email. Every side effect is best-effort and
 * wrapped so a single failing channel never blocks the others, and the whole
 * thing never throws into the sign-in flow (it runs in an `after()` callback).
 */

export type SignInAlertParams = {
  userId: string;
  email: string | null;
  deviceId: string;
  userAgent: string | null;
  country: string | null;
  locationSummary: string | null;
  ipAddress: string | null;
  /** Absolute origin of the request, for building the review deep link. */
  origin: string;
  /** Fresh signup confirmation → establish the first device silently. */
  justConfirmed: boolean;
};

const EMAIL_REASON: Record<SignInDecisionReason, SignInAlertReason> = {
  known: "new_device",
  grandfathered: "new_device",
  new_device: "new_device",
  new_country: "new_country",
  new_device_and_country: "new_device_and_country",
};

function buildNotificationBody(deviceSummary: string, locationSummary: string | null): string {
  const place = locationSummary?.trim();
  const where = place ? `${deviceSummary} · ${place}` : deviceSummary;
  // Plain text, no PII (no email/phone): satisfies the publish validator.
  return `New sign-in from ${where}. If this wasn't you, secure your account.`.slice(0, 240);
}

function formatWhen(nowMs: number): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Lagos",
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date(nowMs));
  } catch {
    return new Date(nowMs).toUTCString();
  }
}

export async function recordSignInAndMaybeAlert(params: SignInAlertParams): Promise<void> {
  const deviceSummary = summarizeUserAgent(params.userAgent);

  try {
    // Fresh signups: establish the first device silently, no alert.
    if (params.justConfirmed) {
      await recordKnownDevice(params.userId, params.deviceId, deviceSummary, params.country);
      return;
    }

    const state = await loadKnownDeviceState(params.userId, params.deviceId);
    const decision = evaluateSignIn({
      deviceIsKnown: state.deviceIsKnown,
      knownActiveDeviceCount: state.knownActiveDeviceCount,
      earliestKnownDeviceAgeMs: state.earliestKnownDeviceAgeMs,
      currentCountry: params.country,
      priorCountries: state.priorCountries,
    });

    // Record/refresh the device regardless of the verdict so it is recognised
    // next time (this happens AFTER the state read, so the decision is unaffected).
    await recordKnownDevice(params.userId, params.deviceId, deviceSummary, params.country);

    if (!decision.alert) return;

    const nowMs = Date.now();
    const eventId = randomUUID();
    const reviewPath = `/security?review=${eventId}`;

    // 1) Security history (high-risk). Stores the country so a place we have
    //    already flagged does not re-alert on the next visit.
    await logSecurityEvent({
      id: eventId,
      userId: params.userId,
      eventType: "new_device_sign_in_alert",
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      locationSummary: params.locationSummary,
      country: params.country,
      metadata: {
        reason: decision.reason,
        source: "sign_in_alert",
        // Server-only mapping so "Yes, it was me" trusts the ALERTED device.
        device_id: params.deviceId,
      },
    });

    // 2) In-app + push. The registered `auth.security.new_device` event has
    //    `security` severity, which fans out to the user's devices via push.
    try {
      await publishNotification({
        userId: params.userId,
        division: "security",
        eventType: "auth.security.new_device",
        title: "Sign-in from a new device",
        body: buildNotificationBody(deviceSummary, params.locationSummary),
        deepLink: reviewPath,
        actionLabel: "Was this you?",
        payload: {
          device_label: deviceSummary,
          ip_country: params.country ?? "",
          occurred_at: new Date(nowMs).toISOString(),
        },
        publisher: "bridge:apps/account/lib/security/sign-in-alert",
      });
    } catch {
      // in-app/push is one of three channels — never fatal.
    }

    // 3) Email (redundant money-grade channel — reaches the user even if the
    //    tab is closed and push is unavailable).
    if (params.email) {
      try {
        await sendSignInSecurityEmail(params.email, {
          reason: EMAIL_REASON[decision.reason],
          deviceSummary,
          locationSummary: params.locationSummary,
          whenLabel: formatWhen(nowMs),
          reviewUrl: `${params.origin}${reviewPath}`,
        });
      } catch {
        // email is redundant to in-app + push.
      }
    }
  } catch {
    // Detection must never block or fail sign-in.
  }
}
