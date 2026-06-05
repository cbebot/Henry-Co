import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { getEnv } from "@/core/env";
import { getSupabaseClient } from "@/core/supabase";

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

/**
 * Register the Expo push token with the Henry Onyx backend so security alerts
 * (and other urgent notifications) reach this device. Authenticates with the
 * signed-in user's Supabase access token. Best-effort — returns false rather
 * than throwing when not signed in or offline.
 */
export async function syncExpoPushToken(expoPushToken: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) return false;

  try {
    const res = await fetch(`${getEnv().ACCOUNT_ORIGIN}/api/push/subscribe`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ channel: "expo", expoToken: expoPushToken }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * One call to do both: request permission + obtain the Expo token, then
 * register it with the backend. This is the entry point app code should use
 * once the user is signed in.
 */
export async function registerAndSyncPushToken(): Promise<PushRegistration> {
  const registration = await registerForPushNotificationsAsync();
  if (registration.status === "granted") {
    await syncExpoPushToken(registration.expoPushToken);
  }
  return registration;
}
