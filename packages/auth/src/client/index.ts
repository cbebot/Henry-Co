/**
 * @henryco/auth/client — client-side session primitives.
 *
 * Safe to import from client components and Expo runtimes; each module
 * feature-checks for browser APIs and falls back to no-ops where
 * absent (SSR, ancient Safari, sessionStorage-disabled contexts).
 */

export {
  withSessionRetry,
  reserveIdempotencyKey,
  releaseIdempotencyKey,
  SessionRetryAbortError,
  type RetryOptions,
  type RetryContext,
  type RetryBackoff,
} from "./retry";

export {
  createSessionBroadcaster,
  SESSION_CHANNEL_NAME,
  type PublishInput,
  type SessionBroadcaster,
  type SessionBroadcastListener,
  type SessionBroadcastMessage,
  type SessionBroadcastSubscription,
  type SessionSignOutReason,
} from "./session-broadcast";

export {
  readSessionStateCookie,
  subscribeSessionState,
  type SessionStateListener,
} from "./session-state";

export type { SessionState } from "../types";
export { HC_SESSION_STATE_COOKIE, SESSION_STATE_VALUES } from "../types";
