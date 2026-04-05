import type { NotificationsAdapter, PushRegistration } from "@/platform/contracts/notifications";

export class MockNotificationsAdapter implements NotificationsAdapter {
  async registerForPush(): Promise<PushRegistration> {
    return {
      status: "unavailable",
      reason: "Push is mocked in local mode. Enable EXPO_PUBLIC_FEATURE_LIVE_PUSH on staging.",
    };
  }
}
