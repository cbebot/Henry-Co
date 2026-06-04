import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { Pressable, ScrollView, Text, View } from "react-native";

import { useHubAppearance } from "@/context/HubAppearanceContext";
import { BRAND_EMAILS } from "@/lib/brand-emails";

export default function ContactScreen() {
  const { palette } = useHubAppearance();
  const openMail = () => {
    void Linking.openURL(
      `mailto:${BRAND_EMAILS.hello}?subject=Henry%20%26%20Co.%20Hub%20inquiry`,
    );
  };

  const openWeb = () => {
    void Linking.openURL("https://www.henryonyx.com");
  };

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: palette.bg }}
      contentContainerStyle={{ paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="px-4 pt-4">
        <Text className="text-base leading-7" style={{ color: palette.textBody }}>
          For general inquiries about Henry Onyx and the divisions listed in
          this app, reach us through the channels below. Division-specific
          requests are best routed through each division&apos;s site (use Visit
          Division from any card).
        </Text>
      </View>

      <View className="mt-8 px-4">
        <Pressable
          onPress={openMail}
          className="rounded-2xl border border-[#C9A227]/40 bg-[#C9A227]/10 p-5 active:opacity-80"
          accessibilityLabel={`Send email to ${BRAND_EMAILS.hello}`}
          accessibilityRole="button"
        >
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-xl bg-[#C9A227]/20">
              <MaterialCommunityIcons
                name="email-outline"
                size={24}
                color="#C9A227"
              />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-xs font-bold uppercase tracking-widest text-[#C9A227]">
                Email
              </Text>
              <Text
                className="mt-1 text-lg font-semibold"
                style={{ color: palette.textPrimary }}
              >
                {BRAND_EMAILS.hello}
              </Text>
            </View>
          </View>
        </Pressable>
      </View>

      <View className="mt-4 px-4">
        <Pressable
          onPress={openWeb}
          className="rounded-2xl border p-5 active:opacity-80"
          style={{
            borderColor: palette.line,
            backgroundColor: palette.surface,
          }}
          accessibilityLabel="Open henryonyx.com"
          accessibilityRole="button"
        >
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-xl bg-[#C9A227]/15">
              <MaterialCommunityIcons
                name="web"
                size={24}
                color="#C9A227"
              />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-xs font-bold uppercase tracking-widest text-[#C9A227]">
                Website
              </Text>
              <Text
                className="mt-1 text-lg font-semibold"
                style={{ color: palette.textPrimary }}
              >
                henryonyx.com
              </Text>
            </View>
          </View>
        </Pressable>
      </View>
    </ScrollView>
  );
}
