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

import { useHubAppearance } from "@/context/HubAppearanceContext";
import { contrastOnAccent } from "@/lib/contrastOnAccent";
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
  const { palette, resolvedScheme } = useHubAppearance();
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
  const visitFg = contrastOnAccent(accent);
  const heroBase =
    resolvedScheme === "light" ? palette.surface : "#0B0B0C";

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
              className="rounded-t-3xl border"
              style={{
                maxHeight: SCREEN_HEIGHT * 0.9,
                borderColor: palette.line,
                backgroundColor: palette.bg,
              }}
            >
              {/* Hero gradient */}
              <View
                className="overflow-hidden rounded-t-3xl"
                style={{ height: HERO_HEIGHT }}
              >
                <LinearGradient
                  colors={[`${accent}40`, `${accent}12`, heroBase]}
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
                  <Text
                    className="text-2xl font-bold"
                    style={{ color: palette.textPrimary }}
                  >
                    {division.name}
                  </Text>
                  {division.tagline ? (
                    <Text className="mt-1 text-sm" style={{ color: palette.muted }}>
                      {division.tagline}
                    </Text>
                  ) : null}
                </LinearGradient>

                {/* Close button */}
                <View className="absolute right-2 top-2">
                  <IconButton
                    icon="close"
                    iconColor={palette.textPrimary}
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
                    <MaterialCommunityIcons name="web" size={14} color={palette.muted} />
                    <Text className="text-sm" style={{ color: palette.muted }}>
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
                        className="rounded-full border px-3 py-1"
                        style={{
                          borderColor: palette.line,
                          backgroundColor: palette.surface,
                        }}
                      >
                        <Text
                          className="text-xs font-medium"
                          style={{ color: palette.muted }}
                        >
                          {sector}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Description */}
                <Text
                  className="text-base leading-7"
                  style={{ color: palette.textBody }}
                >
                  {division.description}
                </Text>

                {/* Action buttons */}
                <View className="mt-6 flex-row items-center gap-3">
                  {/* Visit */}
                  <Pressable
                    onPress={openSite}
                    accessibilityRole="button"
                    accessibilityLabel={`Visit ${division.name}`}
                    className="flex-1 flex-row items-center justify-center gap-2 rounded-xl py-3.5"
                    style={{
                      backgroundColor: accent,
                      borderWidth: 1,
                      borderColor:
                        visitFg === "#FFFFFF"
                          ? "rgba(255,255,255,0.2)"
                          : "rgba(0,0,0,0.12)",
                    }}
                  >
                    <MaterialCommunityIcons name="launch" size={18} color={visitFg} />
                    <Text className="text-sm font-bold" style={{ color: visitFg }}>
                      Visit Division
                    </Text>
                  </Pressable>

                  {/* Share */}
                  <Pressable
                    onPress={handleShare}
                    accessibilityRole="button"
                    accessibilityLabel="Share division"
                    className="items-center justify-center rounded-xl border p-3.5"
                    style={{
                      borderColor: palette.line,
                      backgroundColor: palette.surface,
                    }}
                  >
                    <MaterialCommunityIcons
                      name="share-variant-outline"
                      size={20}
                      color={palette.textPrimary}
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
                      className="items-center justify-center rounded-xl border p-3.5"
                      style={{
                        borderColor: palette.line,
                        backgroundColor: palette.surface,
                      }}
                    >
                      <MaterialCommunityIcons
                        name={isBookmarked ? "heart" : "heart-outline"}
                        size={20}
                        color={isBookmarked ? "#E54560" : palette.textPrimary}
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
