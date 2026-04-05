import { Stack } from "expo-router";

import { palette } from "@/design-system/theme";

export default function LegalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: palette.surface },
        headerTintColor: palette.textPrimary,
        headerTitleStyle: { fontWeight: "600" },
        contentStyle: { backgroundColor: palette.background },
      }}
    >
      <Stack.Screen name="about" options={{ title: "About" }} />
      <Stack.Screen name="contact" options={{ title: "Contact" }} />
      <Stack.Screen name="privacy" options={{ title: "Privacy" }} />
      <Stack.Screen name="terms" options={{ title: "Terms" }} />
      <Stack.Screen name="faq" options={{ title: "FAQ" }} />
    </Stack>
  );
}
