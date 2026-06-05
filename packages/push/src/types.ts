/**
 * @henryco/push — contracts.
 *
 * Push is a delivery CHANNEL on the existing notification spine: a dispatch
 * logs to public.notification_delivery_log with channel="push" and
 * provider="web-push"|"expo", exactly like in-app ("in_app") and email.
 */

export type PushChannel = "web" | "expo";
export type PushProvider = "web-push" | "expo";

/** A stored credential (one row of public.push_subscriptions). */
export type StoredSubscription = {
  id: string;
  userId: string;
  channel: PushChannel;
  /** web push (RFC 8291) */
  endpoint?: string | null;
  p256dh?: string | null;
  auth?: string | null;
  /** native */
  expoToken?: string | null;
  /** ties to the signed hc_device cookie + the sign-in device */
  deviceId?: string | null;
};

export type PushPayload = {
  title: string;
  body?: string;
  /** Deep link opened when the notification is clicked. */
  url?: string;
  /** Collapse key so repeated alerts coalesce on the device instead of stacking. */
  tag?: string;
  /** Structured data forwarded to the service worker / native handler. */
  data?: Record<string, unknown>;
};

/**
 * Result of sending to ONE subscription.
 * `dead` = the credential is permanently gone (web push 404/410, Expo
 * DeviceNotRegistered) and must be pruned so it is never tried again.
 */
export type SendResult =
  | { ok: true; providerMessageId?: string | null }
  | { ok: false; dead: boolean; error?: string };

export type DeliveryStatus = "delivered" | "dead" | "failed";

export type DeliveryLogEntry = {
  userId: string;
  notificationId: string | null;
  channel: "push";
  provider: PushProvider;
  status: DeliveryStatus;
  /** The originating division for audit/observability (e.g. "security"). */
  division: string | null;
  providerMessageId?: string | null;
  errorMessage?: string | null;
};

export type DispatchSummary = {
  attempted: number;
  delivered: number;
  dead: number;
  failed: number;
};

/**
 * Injected I/O. Keeping the orchestrator pure over these makes the money-grade
 * fan-out/prune behaviour fully unit-testable and the real providers swappable.
 */
export type DispatchDeps = {
  listActiveSubscriptions: (userId: string) => Promise<StoredSubscription[]>;
  sendWeb: (sub: StoredSubscription, payload: PushPayload) => Promise<SendResult>;
  sendExpo: (sub: StoredSubscription, payload: PushPayload) => Promise<SendResult>;
  logDelivery: (entry: DeliveryLogEntry) => Promise<void>;
  /** Revoke a permanently-dead credential. */
  pruneSubscription: (id: string, reason: string) => Promise<void>;
  /** Bump failure_count on a transient (non-dead) failure. */
  recordFailure: (id: string) => Promise<void>;
};

export type DispatchOptions = {
  /** Links the push delivery rows to the in-app notification row. */
  notificationId?: string | null;
  /** Originating division for the delivery-log audit (default "system"). */
  division?: string | null;
};
