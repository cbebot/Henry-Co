import { Stack } from "expo-router";

import { palette } from "@/design-system/theme";

export default function ModuleLayout() {
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
      <Stack.Screen name="[slug]" options={{ title: "Division" }} />
    </Stack>
  );
}
