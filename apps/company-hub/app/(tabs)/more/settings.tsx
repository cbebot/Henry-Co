import { MaterialCommunityIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import { clearBookmarks } from "@/store/bookmarks";
import { resetOnboarding } from "@/store/onboarding";
import { getThemeMode, setThemeMode, type ThemeMode } from "@/store/themeStore";

const THEME_OPTIONS: { key: ThemeMode; label: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"] }[] = [
  { key: "system", label: "System", icon: "cellphone-cog" },
  { key: "light", label: "Light", icon: "white-balance-sunny" },
  { key: "dark", label: "Dark", icon: "moon-waning-crescent" },
];

const appVersion = Constants.expoConfig?.version ?? "1.0.0";

export default function SettingsScreen() {
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>("system");

  useEffect(() => {
    getThemeMode().then(setCurrentTheme);
  }, []);

  const handleThemeChange = useCallback(async (mode: ThemeMode) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentTheme(mode);
    await setThemeMode(mode);
  }, []);

  const handleResetOnboarding = useCallback(() => {
    Alert.alert(
      "Reset Onboarding",
      "This will show the onboarding screens again on next app launch.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await resetOnboarding();
            await Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            );
          },
        },
      ],
    );
  }, []);

  const handleClearBookmarks = useCallback(() => {
    Alert.alert(
      "Clear Bookmarks",
      "This will remove all saved division bookmarks. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            await clearBookmarks();
            await Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            );
          },
        },
      ],
    );
  }, []);

  return (
    <ScrollView
      className="flex-1 bg-hub-bg"
      contentContainerStyle={{ paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="px-4 pt-4">
        <Text className="text-xs font-bold uppercase tracking-widest text-[#C9A227]">
          Appearance
        </Text>
        <Text className="mt-2 text-sm text-hub-muted">
          Choose your preferred theme
        </Text>
        <View className="mt-4 flex-row gap-3">
          {THEME_OPTIONS.map(({ key, label, icon }) => {
            const active = currentTheme === key;
            return (
              <Pressable
                key={key}
                onPress={() => handleThemeChange(key)}
                className={`flex-1 items-center rounded-2xl border p-4 active:opacity-80 ${
                  active
                    ? "border-[#C9A227] bg-[#C9A227]/15"
                    : "border-hub-line bg-hub-surface"
                }`}
                accessibilityLabel={`Set theme to ${label}`}
                accessibilityRole="button"
              >
                <MaterialCommunityIcons
                  name={icon}
                  size={24}
                  color={active ? "#C9A227" : "#6B6B73"}
                />
                <Text
                  className={`mt-2 text-sm font-semibold ${
                    active ? "text-[#C9A227]" : "text-hub-muted"
                  }`}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="mt-8 h-px bg-hub-line mx-4" />

      <View className="mt-8 gap-3 px-4">
        <Text className="text-xs font-bold uppercase tracking-widest text-[#C9A227]">
          Data
        </Text>

        <Pressable
          onPress={handleResetOnboarding}
          className="flex-row items-center gap-4 rounded-2xl border border-hub-line bg-hub-surface p-4 active:opacity-80"
          accessibilityLabel="Reset onboarding"
          accessibilityRole="button"
        >
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#C9A227]/15">
            <MaterialCommunityIcons
              name="refresh"
              size={20}
              color="#C9A227"
            />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-base font-semibold text-white">
              Reset Onboarding
            </Text>
            <Text className="text-xs text-hub-muted">
              Show welcome screens again
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color="#6B6B73"
          />
        </Pressable>

        <Pressable
          onPress={handleClearBookmarks}
          className="flex-row items-center gap-4 rounded-2xl border border-hub-line bg-hub-surface p-4 active:opacity-80"
          accessibilityLabel="Clear all bookmarks"
          accessibilityRole="button"
        >
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#C9A227]/15">
            <MaterialCommunityIcons
              name="bookmark-remove-outline"
              size={20}
              color="#C9A227"
            />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-base font-semibold text-white">
              Clear Bookmarks
            </Text>
            <Text className="text-xs text-hub-muted">
              Remove all saved divisions
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color="#6B6B73"
          />
        </Pressable>
      </View>

      <View className="mt-8 h-px bg-hub-line mx-4" />

      <View className="mt-8 px-4">
        <Text className="text-xs font-bold uppercase tracking-widest text-[#C9A227]">
          About This App
        </Text>
        <View className="mt-4 rounded-2xl border border-hub-line bg-hub-surface p-5">
          <Text className="text-lg font-bold text-white">
            Henry &amp; Co. Hub v{appVersion}
          </Text>
          <Text className="mt-2 text-sm leading-5 text-hub-muted">
            Built for the Henry &amp; Co. division network. One connected
            entry point to discover, explore, and navigate all Henry &amp; Co.
            services.
          </Text>
        </View>
      </View>

      <View className="mt-8 h-px bg-hub-line mx-4" />

      <View className="mt-6 items-center px-4 pb-4">
        <Text className="text-xs text-[#6B6B73]">
          Powered by Cursor AI
        </Text>
      </View>
    </ScrollView>
  );
}
