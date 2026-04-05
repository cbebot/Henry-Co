import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";

import type { NotificationsAdapter, PushRegistration } from "@/platform/contracts/notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function projectId(): string | undefined {
  const eas = Constants.expoConfig?.extra?.eas as { projectId?: string } | undefined;
  return eas?.projectId;
}

export class ExpoNotificationsAdapter implements NotificationsAdapter {
  async registerForPush(): Promise<PushRegistration> {
    if (!Device.isDevice) {
      return { status: "unavailable", reason: "Simulator has no push token." };
    }
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    const settings = await Notifications.getPermissionsAsync();
    let finalStatus = settings.status;
    if (finalStatus !== "granted") {
      const asked = await Notifications.requestPermissionsAsync();
      finalStatus = asked.status;
    }
    if (finalStatus !== "granted") return { status: "denied" };
    try {
      const pid = projectId();
      const token = await Notifications.getExpoPushTokenAsync(pid ? { projectId: pid } : undefined);
      return { status: "granted", token: token.data };
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      return { status: "unavailable", reason: message };
    }
  }
}
