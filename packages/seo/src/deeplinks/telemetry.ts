/**
 * V3-04 (S8) — Deep-link + share telemetry payload contracts.
 *
 * The canonical event NAMES live in `@henryco/observability/events`
 * (`henry.deeplink.*`, `henry.share.*`). This module defines the typed
 * payload shapes so every emit site sends the same fields, and a thin
 * `deeplinkEvent(...)` factory that returns the `EmitEventParams`-shaped
 * object a caller passes to `emitEvent`. We keep the factory free of an
 * `@henryco/observability` import so `@henryco/seo/deeplinks` stays
 * client-bundlable (the ShareButton imports share helpers from here);
 * callers own the `emitEvent` call.
 */

/** Where a deep link was sent from. */
export type DeepLinkSource =
  | "notification"
  | "email"
  | "share"
  | "sms"
  | "unknown";

export type DeepLinkArrivedPayload = {
  source: DeepLinkSource;
  /** Path (not full URL) the user landed on, e.g. "/care/bookings/123". */
  target: string;
  /** "ok" = route resolved; "auth_gated" = bounced to sign-in first. */
  outcome: "ok" | "auth_gated" | "not_found";
};

export type DeepLinkReturnedAfterAuthPayload = {
  /** Path the user was returned to after the sign-in detour. */
  target: string;
  /** Which auth path completed the round trip. */
  via: "sign_in" | "sign_up" | "oauth" | "reauth";
};

export type DeepLinkDeadLinkPayload = {
  source: DeepLinkSource;
  /** The 404'd path. */
  target: string;
  /** Source attribution token (notification id, email purpose, share token). */
  sourceRef?: string | null;
};

export type ShareClickedPayload = {
  /** Division/surface the share originated from. */
  surface: string;
  /** "web_share" = native sheet used; "copy" = clipboard fallback. */
  method: "web_share" | "copy";
  /** Whether a sharer fingerprint was attached. */
  attributed: boolean;
};

export type ShareAttributedInstallPayload = {
  surface: string;
  /** Whether the `from=` token matched a known sharer. */
  matched: boolean;
};
