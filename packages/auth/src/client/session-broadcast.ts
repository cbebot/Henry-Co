/**
 * BroadcastChannel("henryco-session") — typed cross-tab session signal.
 *
 * New channel as of V3-01. The pre-flight audit confirmed no prior
 * channel of this name exists in the repository; the cart/wishlist
 * cross-tab sync uses its own dedicated channel
 * (`marketplace-runtime`) and remains independent. We do NOT multiplex
 * unrelated concerns onto a channel named for something else
 * (Addendum A2).
 *
 * Same-origin only by browser design — no cross-origin leakage.
 */

import { emitEvent } from "@henryco/observability/events";

export const SESSION_CHANNEL_NAME = "henryco-session";

export type SessionSignOutReason = "user" | "server" | "expired";

export type SessionBroadcastMessage =
  | {
      type: "sign-out";
      reason: SessionSignOutReason;
      /** Wall-clock ms at the publish site — listeners may render relative times. */
      at: number;
    }
  | {
      type: "user-changed";
      /**
       * The id of the user the publishing tab now sees. Receiving tabs
       * compare with their own viewer.id to detect account-switch vs
       * re-affirm.
       */
      userId: string;
      at: number;
    }
  | {
      type: "reauth-required";
      /** Path the publishing tab was on when refresh failed. */
      returnPath: string;
      at: number;
    }
  | {
      type: "draft-restored";
      draftKey: string;
      at: number;
    };

export type SessionBroadcastListener = (message: SessionBroadcastMessage) => void;

export type SessionBroadcastSubscription = {
  unsubscribe(): void;
};

export type PublishInput = Omit<SessionBroadcastMessage, "at"> & { at?: number };

export interface SessionBroadcaster {
  publish(message: PublishInput): void;
  subscribe(listener: SessionBroadcastListener): SessionBroadcastSubscription;
  close(): void;
}

class NullBroadcaster implements SessionBroadcaster {
  publish(): void {
    /* no-op when BroadcastChannel is unavailable */
  }
  subscribe(): SessionBroadcastSubscription {
    return {
      unsubscribe() {
        /* no-op */
      },
    };
  }
  close(): void {
    /* no-op */
  }
}

class RealBroadcaster implements SessionBroadcaster {
  private readonly channel: BroadcastChannel;
  private readonly listeners = new Set<SessionBroadcastListener>();

  constructor() {
    this.channel = new BroadcastChannel(SESSION_CHANNEL_NAME);
    this.channel.addEventListener("message", this.handleMessage);
  }

  private readonly handleMessage = (event: MessageEvent<SessionBroadcastMessage>): void => {
    const msg = event.data;
    if (!isValidMessage(msg)) return;
    for (const listener of this.listeners) {
      try {
        listener(msg);
      } catch {
        // Listener errors must not break peer listeners or the channel.
      }
    }
  };

  publish(input: PublishInput): void {
    const message = { at: Date.now(), ...input } as SessionBroadcastMessage;
    this.channel.postMessage(message);
    emitEvent({
      name: "henry.auth.session.multitab_broadcast",
      classification: "system_state",
      outcome: "completed",
      payload: { type: message.type },
    });
  }

  subscribe(listener: SessionBroadcastListener): SessionBroadcastSubscription {
    this.listeners.add(listener);
    return {
      unsubscribe: () => {
        this.listeners.delete(listener);
      },
    };
  }

  close(): void {
    this.channel.removeEventListener("message", this.handleMessage);
    this.listeners.clear();
    this.channel.close();
  }
}

function isValidMessage(msg: unknown): msg is SessionBroadcastMessage {
  if (!msg || typeof msg !== "object") return false;
  const m = msg as { type?: unknown };
  return (
    m.type === "sign-out" ||
    m.type === "user-changed" ||
    m.type === "reauth-required" ||
    m.type === "draft-restored"
  );
}

/**
 * Build a session broadcaster for the current document. When the
 * environment lacks `BroadcastChannel` (SSR, older Safari iOS), a
 * no-op broadcaster is returned so callers do not have to feature-
 * check at every call site.
 */
export function createSessionBroadcaster(): SessionBroadcaster {
  if (typeof BroadcastChannel === "undefined") {
    return new NullBroadcaster();
  }
  return new RealBroadcaster();
}
