"use client";

import { useNotificationSignalContext } from "./NotificationSignalProvider";

export function useNotificationSignal() {
  const context = useNotificationSignalContext();

  if (!context) {
    throw new Error("useNotificationSignal must be used inside NotificationSignalProvider.");
  }

  return context;
}
