import { useCallback } from "react";
import { Pressable, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { useHubAppearance } from "@/context/HubAppearanceContext";
import type { Division } from "@/types/division";

type Props = {
  division: Division;
  onPress: () => void;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  compact?: boolean;
  index?: number;
};

const SPRING_CONFIG = { damping: 15, stiffness: 150 };

export function DivisionCardPremium({
  division,
  onPress,
  isBookmarked = false,
  onToggleBookmark,
  compact = false,
  index = 0,
}: Props) {
  const { palette } = useHubAppearance();
  const scale = useSharedValue(1);
  const active = division.status === "active";

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, SPRING_CONFIG);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_CONFIG);
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  const handleBookmark = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggleBookmark?.();
  }, [onToggleBookmark]);

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).duration(400).springify()}
    >
      <Animated.View style={animatedCardStyle}>
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessibilityRole="button"
          accessibilityLabel={`${division.name} division`}
          className={`mb-3 overflow-hidden rounded-2xl border ${compact ? "p-3" : "p-4"}`}
          style={{
            borderColor: palette.line,
            backgroundColor: palette.surface,
          }}
        >
          <View className="flex-row items-start gap-3">
            {/* Icon container */}
            <View
              className="items-center justify-center rounded-xl"
              style={{
                width: compact ? 40 : 48,
                height: compact ? 40 : 48,
                backgroundColor: `${division.accentHex ?? "#C9A227"}26`,
              }}
            >
              <MaterialCommunityIcons
                name={(division.iconName as keyof typeof MaterialCommunityIcons.glyphMap) ?? "domain"}
                size={compact ? 22 : 26}
                color={division.accentHex ?? "#C9A227"}
              />
            </View>

            {/* Text content */}
            <View className="min-w-0 flex-1">
              <Text
                className={`font-bold ${compact ? "text-base" : "text-lg"}`}
                style={{ color: palette.textPrimary }}
                numberOfLines={1}
              >
                {division.name}
              </Text>
              <Text
                className="mt-0.5 text-sm leading-5"
                style={{ color: palette.muted }}
                numberOfLines={1}
              >
                {division.tagline}
              </Text>
            </View>

            {/* Bookmark */}
            {onToggleBookmark && (
              <Pressable
                onPress={handleBookmark}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel={isBookmarked ? "Remove bookmark" : "Add bookmark"}
                className="pt-0.5"
              >
                <MaterialCommunityIcons
                  name={isBookmarked ? "heart" : "heart-outline"}
                  size={22}
                  color={isBookmarked ? "#E54560" : palette.textSubtle}
                />
              </Pressable>
            )}
          </View>

          {/* Summary */}
          {!compact && (
            <Text
              className="mt-2 text-sm leading-5"
              style={{ color: palette.textBody }}
              numberOfLines={2}
            >
              {division.summary}
            </Text>
          )}

          {/* Status badge */}
          <View className="mt-3 flex-row items-center gap-2">
            <View
              className={`rounded-full px-2.5 py-0.5 ${
                active ? "bg-[#16A34A]/15" : "bg-[#F59E0B]/15"
              }`}
            >
              <Text
                className={`text-xs font-semibold uppercase tracking-wide ${
                  active ? "text-[#22C55E]" : "text-[#FBBF24]"
                }`}
              >
                {active ? "Active" : "Coming Soon"}
              </Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}
