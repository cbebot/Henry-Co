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
import { HubSearchProvider } from "@/context/HubSearchContext";
import { hubPaperTheme } from "@/theme/paperTheme";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider
          theme={hubPaperTheme}
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
                  <StatusBar style="light" />
                  <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0B0B0C" } }}>
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
                  </Stack>
                </DivisionModalProvider>
              </HubSearchProvider>
            </ToastProvider>
          </ErrorBoundary>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
