import "../global.css";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/Toast";
import { DivisionModalProvider } from "@/context/DivisionModalContext";
import { HubAppearanceProvider, useHubAppearance } from "@/context/HubAppearanceContext";
import { HubSearchProvider } from "@/context/HubSearchContext";

function RootStack() {
  const { resolvedScheme, palette, paperTheme } = useHubAppearance();

  return (
    <PaperProvider
      theme={paperTheme}
      settings={{
        icon: (props) => (
          <MaterialCommunityIcons
            name={(props.name as keyof typeof MaterialCommunityIcons.glyphMap) ?? "help-circle-outline"}
            size={props.size ?? 24}
            color={props.color}
          />
        ),
      }}
    >
      <ErrorBoundary>
        <ToastProvider>
          <HubSearchProvider>
            <DivisionModalProvider>
              <StatusBar style={resolvedScheme === "dark" ? "light" : "dark"} />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: palette.bg },
                }}
              >
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
              </Stack>
            </DivisionModalProvider>
          </HubSearchProvider>
        </ToastProvider>
      </ErrorBoundary>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <HubAppearanceProvider>
          <RootStack />
        </HubAppearanceProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
