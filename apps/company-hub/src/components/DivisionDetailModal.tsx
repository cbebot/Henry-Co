import { useCallback } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as Sharing from "expo-sharing";
import * as WebBrowser from "expo-web-browser";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";
import { IconButton, Portal } from "react-native-paper";

import type { Division } from "@/types/division";

type Props = {
  visible: boolean;
  division: Division | null;
  onDismiss: () => void;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
};

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const HERO_HEIGHT = 200;

export function DivisionDetailModal({
  visible,
  division,
  onDismiss,
  isBookmarked = false,
  onToggleBookmark,
}: Props) {
  const openSite = useCallback(async () => {
    if (!division) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await WebBrowser.openBrowserAsync(division.visitUrl);
  }, [division]);

  const handleShare = useCallback(async () => {
    if (!division) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const available = await Sharing.isAvailableAsync();
    if (available) {
      await Sharing.shareAsync(division.visitUrl, {
        dialogTitle: `Check out ${division.name}`,
      });
    }
  }, [division]);

  const handleBookmark = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggleBookmark?.();
  }, [onToggleBookmark]);

  const handleDismiss = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss();
  }, [onDismiss]);

  if (!division) return null;

  const active = division.status === "active";
  const accent = division.accentHex ?? "#C9A227";

  return (
    <Portal>
      <Modal
        visible={visible}
        animationType="none"
        transparent
        onRequestClose={onDismiss}
        statusBarTranslucent
      >
        {/* Backdrop */}
        <Animated.View
          entering={FadeIn.duration(250)}
          exiting={FadeOut.duration(200)}
          className="absolute inset-0 bg-black/80"
        />

        <Pressable
          className="flex-1 justify-end"
          onPress={handleDismiss}
          accessibilityRole="button"
          accessibilityLabel="Close modal"
        >
          <Animated.View
            entering={SlideInDown.duration(400).springify().damping(18)}
            exiting={SlideOutDown.duration(300)}
          >
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={{ maxHeight: SCREEN_HEIGHT * 0.9 }}
              className="rounded-t-3xl border border-hub-line bg-hub-bg"
            >
              {/* Hero gradient */}
              <View
                className="overflow-hidden rounded-t-3xl"
                style={{ height: HERO_HEIGHT }}
              >
                <LinearGradient
                  colors={[`${accent}40`, `${accent}10`, "#0B0B0C"]}
                  locations={[0, 0.6, 1]}
                  style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
                >
                  <View
                    className="mb-3 items-center justify-center rounded-2xl"
                    style={{
                      width: 72,
                      height: 72,
                      backgroundColor: `${accent}30`,
                    }}
                  >
                    <MaterialCommunityIcons
                      name={(division.iconName as keyof typeof MaterialCommunityIcons.glyphMap) ?? "domain"}
                      size={40}
                      color={accent}
                    />
                  </View>
                  <Text className="text-2xl font-bold text-white">
                    {division.name}
                  </Text>
                  {division.tagline ? (
                    <Text className="mt-1 text-sm text-hub-muted">
                      {division.tagline}
                    </Text>
                  ) : null}
                </LinearGradient>

                {/* Close button */}
                <View className="absolute right-2 top-2">
                  <IconButton
                    icon="close"
                    iconColor="#F4F4F5"
                    size={22}
                    onPress={handleDismiss}
                    accessibilityLabel="Close"
                    style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
                  />
                </View>
              </View>

              <ScrollView
                className="px-5 pb-10"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {/* Status + Subdomain */}
                <View className="mb-4 mt-4 flex-row flex-wrap items-center gap-2">
                  <View
                    className={`rounded-full px-3 py-1 ${
                      active ? "bg-[#16A34A]/15" : "bg-[#F59E0B]/15"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold uppercase tracking-wide ${
                        active ? "text-[#22C55E]" : "text-[#FBBF24]"
                      }`}
                    >
                      {active ? "Active" : "Coming Soon"}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <MaterialCommunityIcons name="web" size={14} color="#9A9AA3" />
                    <Text className="text-sm text-hub-muted">
                      {division.subdomain}
                    </Text>
                  </View>
                </View>

                {/* Sectors */}
                {division.sectors?.length > 0 && (
                  <View className="mb-4 flex-row flex-wrap gap-2">
                    {division.sectors.map((sector) => (
                      <View
                        key={sector}
                        className="rounded-full border border-hub-line bg-hub-surface px-3 py-1"
                      >
                        <Text className="text-xs font-medium text-hub-muted">
                          {sector}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Description */}
                <Text className="text-base leading-7 text-[#DCDCE2]">
                  {division.description}
                </Text>

                {/* Action buttons */}
                <View className="mt-6 flex-row items-center gap-3">
                  {/* Visit */}
                  <Pressable
                    onPress={openSite}
                    accessibilityRole="button"
                    accessibilityLabel={`Visit ${division.name}`}
                    className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-hub-gold py-3.5"
                  >
                    <MaterialCommunityIcons name="launch" size={18} color="#0B0B0C" />
                    <Text className="text-sm font-bold text-[#0B0B0C]">
                      Visit Division
                    </Text>
                  </Pressable>

                  {/* Share */}
                  <Pressable
                    onPress={handleShare}
                    accessibilityRole="button"
                    accessibilityLabel="Share division"
                    className="items-center justify-center rounded-xl border border-hub-line bg-hub-surface p-3.5"
                  >
                    <MaterialCommunityIcons
                      name="share-variant-outline"
                      size={20}
                      color="#F4F4F5"
                    />
                  </Pressable>

                  {/* Bookmark */}
                  {onToggleBookmark && (
                    <Pressable
                      onPress={handleBookmark}
                      accessibilityRole="button"
                      accessibilityLabel={
                        isBookmarked ? "Remove bookmark" : "Add bookmark"
                      }
                      className="items-center justify-center rounded-xl border border-hub-line bg-hub-surface p-3.5"
                    >
                      <MaterialCommunityIcons
                        name={isBookmarked ? "heart" : "heart-outline"}
                        size={20}
                        color={isBookmarked ? "#E54560" : "#F4F4F5"}
                      />
                    </Pressable>
                  )}
                </View>

                {/* Bottom spacing for safe area */}
                <View style={{ height: 24 }} />
              </ScrollView>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </Portal>
  );
}
