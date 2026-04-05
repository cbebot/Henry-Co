import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function ContactScreen() {
  const openMail = () => {
    void Linking.openURL(
      "mailto:hello@henrycogroup.com?subject=Henry%20%26%20Co.%20Hub%20inquiry",
    );
  };

  const openWeb = () => {
    void Linking.openURL("https://www.henrycogroup.com");
  };

  return (
    <ScrollView
      className="flex-1 bg-hub-bg"
      contentContainerStyle={{ paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="px-4 pt-4">
        <Text className="text-base leading-7 text-[#DCDCE2]">
          For general inquiries about Henry &amp; Co. and the divisions listed in
          this app, reach us through the channels below. Division-specific
          requests are best routed through each division&apos;s site (use Visit
          Division from any card).
        </Text>
      </View>

      <View className="mt-8 px-4">
        <Pressable
          onPress={openMail}
          className="rounded-2xl border border-[#C9A227]/40 bg-[#C9A227]/10 p-5 active:opacity-80"
          accessibilityLabel="Send email to hello@henrycogroup.com"
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
              <Text className="mt-1 text-lg font-semibold text-white">
                hello@henrycogroup.com
              </Text>
            </View>
          </View>
        </Pressable>
      </View>

      <View className="mt-4 px-4">
        <Pressable
          onPress={openWeb}
          className="rounded-2xl border border-hub-line bg-hub-surface p-5 active:opacity-80"
          accessibilityLabel="Open henrycogroup.com"
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
              <Text className="mt-1 text-lg font-semibold text-white">
                henrycogroup.com
              </Text>
            </View>
          </View>
        </Pressable>
      </View>
    </ScrollView>
  );
}
