import { Stack } from "expo-router";

export default function MoreStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#141416" },
        headerTintColor: "#C9A227",
        headerTitleStyle: { color: "#F4F4F5", fontWeight: "700" },
        contentStyle: { backgroundColor: "#0B0B0C" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "More" }} />
      <Stack.Screen name="about" options={{ title: "About" }} />
      <Stack.Screen name="contact" options={{ title: "Contact" }} />
      <Stack.Screen name="privacy" options={{ title: "Privacy" }} />
      <Stack.Screen name="terms" options={{ title: "Terms" }} />
      <Stack.Screen name="settings" options={{ title: "Settings" }} />
    </Stack>
  );
}
