import "react-native-gesture-handler";

import FontAwesome from "@expo/vector-icons/FontAwesome";
import * as Sentry from "@sentry/react-native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

import { brandFontAssets } from "@henryco/rn-type";
import { AppProviders } from "@/providers/AppProviders";

SplashScreen.preventAutoHideAsync();

function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
    // Owned type — the brand faces (interim ttf; swap to bespoke at reveal).
    ...brandFontAssets,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="legal" />
        <Stack.Screen name="module" />
      </Stack>
    </AppProviders>
  );
}

export default Sentry.wrap(RootLayout);
