import { Stack } from "expo-router";
import { View } from "react-native";

import { HubBrandHeader } from "@/components/HubBrandHeader";
import { useHubAppearance } from "@/context/HubAppearanceContext";

export default function MoreStackLayout() {
  const { palette } = useHubAppearance();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: palette.headerBg,
        },
        headerShadowVisible: false,
        headerTintColor: "#C9A227",
        headerTitle: () => (
          <View style={{ flex: 1, marginRight: 12, justifyContent: "center" }}>
            <HubBrandHeader variant="nav" />
          </View>
        ),
        headerTitleAlign: "left",
        contentStyle: { backgroundColor: palette.bg },
      }}
    >
      <Stack.Screen name="index" options={{ title: "" }} />
      <Stack.Screen name="about" options={{ title: "" }} />
      <Stack.Screen name="contact" options={{ title: "" }} />
      <Stack.Screen name="privacy" options={{ title: "" }} />
      <Stack.Screen name="terms" options={{ title: "" }} />
      <Stack.Screen name="settings" options={{ title: "" }} />
    </Stack>
  );
}
