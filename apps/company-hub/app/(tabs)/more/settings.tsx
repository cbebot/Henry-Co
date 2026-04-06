import { MaterialCommunityIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import { useHubAppearance } from "@/context/HubAppearanceContext";
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
  const { palette, refresh } = useHubAppearance();
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>("system");

  useEffect(() => {
    getThemeMode().then(setCurrentTheme);
  }, []);

  const handleThemeChange = useCallback(
    async (mode: ThemeMode) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentTheme(mode);
      await setThemeMode(mode);
      await refresh();
    },
    [refresh],
  );

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
      className="flex-1"
      style={{ backgroundColor: palette.bg }}
      contentContainerStyle={{ paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="px-4 pb-6 pt-4">
        <Text className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C9A227]">
          Official product
        </Text>
        <Text
          className="mt-2 text-2xl font-bold"
          style={{ color: palette.textPrimary }}
        >
          Henry &amp; Co. Hub
        </Text>
        <Text className="mt-2 text-sm leading-5" style={{ color: palette.muted }}>
          The official corporate directory for Henry &amp; Co. divisions and
          services—aligned with henrycogroup.com.
        </Text>
      </View>

      <View className="mx-4 h-px" style={{ backgroundColor: palette.line }} />

      <View className="px-4 pt-6">
        <Text className="text-xs font-bold uppercase tracking-widest text-[#C9A227]">
          Appearance
        </Text>
        <Text className="mt-2 text-sm" style={{ color: palette.muted }}>
          Choose your preferred theme
        </Text>
        <View className="mt-4 flex-row gap-3">
          {THEME_OPTIONS.map(({ key, label, icon }) => {
            const active = currentTheme === key;
            return (
              <Pressable
                key={key}
                onPress={() => handleThemeChange(key)}
                className="flex-1 items-center rounded-2xl border p-4 active:opacity-80"
                style={{
                  borderColor: active ? "#C9A227" : palette.line,
                  backgroundColor: active ? "rgba(201, 162, 39, 0.12)" : palette.surface,
                }}
                accessibilityLabel={`Set theme to ${label}`}
                accessibilityRole="button"
              >
                <MaterialCommunityIcons
                  name={icon}
                  size={24}
                  color={active ? "#C9A227" : palette.textSubtle}
                />
                <Text
                  className="mt-2 text-sm font-semibold"
                  style={{
                    color: active ? "#C9A227" : palette.muted,
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="mt-8 mx-4 h-px" style={{ backgroundColor: palette.line }} />

      <View className="mt-8 gap-3 px-4">
        <Text className="text-xs font-bold uppercase tracking-widest text-[#C9A227]">
          Data
        </Text>

        <Pressable
          onPress={handleResetOnboarding}
          className="flex-row items-center gap-4 rounded-2xl border p-4 active:opacity-80"
          style={{
            borderColor: palette.line,
            backgroundColor: palette.surface,
          }}
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
            <Text
              className="text-base font-semibold"
              style={{ color: palette.textPrimary }}
            >
              Reset Onboarding
            </Text>
            <Text className="text-xs" style={{ color: palette.muted }}>
              Show welcome screens again
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={palette.textSubtle}
          />
        </Pressable>

        <Pressable
          onPress={handleClearBookmarks}
          className="flex-row items-center gap-4 rounded-2xl border p-4 active:opacity-80"
          style={{
            borderColor: palette.line,
            backgroundColor: palette.surface,
          }}
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
            <Text
              className="text-base font-semibold"
              style={{ color: palette.textPrimary }}
            >
              Clear Bookmarks
            </Text>
            <Text className="text-xs" style={{ color: palette.muted }}>
              Remove all saved divisions
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={palette.textSubtle}
          />
        </Pressable>
      </View>

      <View className="mt-8 mx-4 h-px" style={{ backgroundColor: palette.line }} />

      <View className="mt-8 px-4">
        <Text className="text-xs font-bold uppercase tracking-widest text-[#C9A227]">
          About This App
        </Text>
        <View
          className="mt-4 rounded-2xl border p-5"
          style={{
            borderColor: palette.line,
            backgroundColor: palette.surface,
          }}
        >
          <Text
            className="text-lg font-bold"
            style={{ color: palette.textPrimary }}
          >
            Henry &amp; Co. Hub v{appVersion}
          </Text>
          <Text className="mt-2 text-sm leading-5" style={{ color: palette.muted }}>
            Built for the Henry &amp; Co. division network. One connected
            entry point to discover, explore, and navigate all Henry &amp; Co.
            services.
          </Text>
        </View>
      </View>

      <View className="mt-8 mx-4 h-px" style={{ backgroundColor: palette.line }} />

      <View className="mt-6 items-center px-4 pb-4">
        <Text className="text-xs" style={{ color: palette.textSubtle }}>
          Powered by Cursor AI
        </Text>
      </View>
    </ScrollView>
  );
}
