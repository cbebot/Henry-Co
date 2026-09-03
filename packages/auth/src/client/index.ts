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

export {
  clearHenryCoStorage,
  type ClearHenryCoStorageReport,
} from "./clear-henryco-storage";

export {
  HENRYCO_INDEXED_DB_PREFIX,
  HENRYCO_STORAGE_PREFIXES,
  HENRYCO_CACHE_NAME_PREFIX,
  KNOWN_HENRYCO_INDEXED_DB_NAMES,
  isHenryCoStorageKey,
  isHenryCoIndexedDbName,
  isHenryCoCacheName,
} from "./known-storage";

export {
  logoutEverywhere,
  type LogoutEverywhereOptions,
  type LogoutEverywhereResult,
} from "./logout-everywhere";

export type { SessionState } from "../types";
export { HC_SESSION_STATE_COOKIE, SESSION_STATE_VALUES } from "../types";
