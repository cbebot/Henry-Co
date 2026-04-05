import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type PushRegistration =
  | { status: "unavailable"; reason: string }
  | { status: "granted"; expoPushToken: string }
  | { status: "denied" };

function resolveExpoProjectId(): string | undefined {
  const eas = Constants.expoConfig?.extra?.eas as { projectId?: string } | undefined;
  return eas?.projectId;
}

/**
 * Request notification permissions and return an Expo push token when available.
 * Set `extra.eas.projectId` in app.json for EAS Build; local dev may skip token.
 */
export async function registerForPushNotificationsAsync(): Promise<PushRegistration> {
  if (!Device.isDevice) {
    return { status: "unavailable", reason: "Must use physical device for push." };
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
  if (finalStatus !== "granted") {
    return { status: "denied" };
  }

  try {
    const projectId = resolveExpoProjectId();
    const token = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return { status: "granted", expoPushToken: token.data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return { status: "unavailable", reason: message };
  }
}
