/**
 * @henryco/push — the push delivery channel for the Henry Onyx notification
 * spine. Web Push (RFC 8291) + native (Expo), fanned out per device, logged to
 * notification_delivery_log, with dead-credential pruning. Money-grade: one bad
 * device never blocks the others.
 *
 *   import { dispatchPush } from "@henryco/push";
 *   await dispatchPush(userId, { title, body, url }, { division: "security", notificationId });
 */
import { dispatchPushWith } from "./dispatch";
import { sendWebPush } from "./web-push";
import { sendExpoPush } from "./expo-push";
import {
  listActiveSubscriptions,
  logPushDelivery,
  pruneSubscription,
  recordFailure,
} from "./tokens";
import type { DispatchDeps, DispatchOptions, DispatchSummary, PushPayload } from "./types";

// Guard: this module performs service-role writes and must never be imported
// from client/browser code.
if (typeof window !== "undefined") {
  throw new Error("@henryco/push must only be imported from server code");
}

const liveDeps: DispatchDeps = {
  listActiveSubscriptions,
  sendWeb: sendWebPush,
  sendExpo: sendExpoPush,
  logDelivery: logPushDelivery,
  pruneSubscription,
  recordFailure,
};

/** Send a push to every active device a user holds, across web + native. */
export async function dispatchPush(
  userId: string,
  payload: PushPayload,
  options?: DispatchOptions,
): Promise<DispatchSummary> {
  return dispatchPushWith(liveDeps, userId, payload, options);
}

export { dispatchPushWith } from "./dispatch";
export { getPublicVapidKey, getVapidConfig, type VapidConfig } from "./config";
export {
  listActiveSubscriptions,
  registerWebSubscription,
  registerExpoToken,
  revokeSubscription,
  revokeWebSubscriptionByEndpoint,
  type WebSubscriptionInput,
  type ExpoTokenInput,
} from "./tokens";
export type {
  PushChannel,
  PushProvider,
  PushPayload,
  StoredSubscription,
  SendResult,
  DispatchSummary,
  DispatchOptions,
  DispatchDeps,
  DeliveryLogEntry,
} from "./types";
