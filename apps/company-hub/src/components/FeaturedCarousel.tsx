import { useCallback, useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { useHubAppearance } from "@/context/HubAppearanceContext";
import type { Division } from "@/types/division";

type Props = {
  divisions: Division[];
  onPressDivision: (d: Division) => void;
};

const CARD_WIDTH = 280;
const CARD_GAP = 12;
const SPRING_CONFIG = { damping: 15, stiffness: 150 };

function CarouselCard({
  division,
  onPress,
}: {
  division: Division;
  onPress: () => void;
}) {
  const { palette } = useHubAppearance();
  const scale = useSharedValue(1);
  const accent = division.accentHex ?? "#C9A227";

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.96, SPRING_CONFIG);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_CONFIG);
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  return (
    <Animated.View style={[{ width: CARD_WIDTH }, animatedStyle]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={`${division.name} featured division`}
        className="overflow-hidden rounded-2xl border"
        style={{ height: 180, borderColor: palette.line }}
      >
        <LinearGradient
          colors={[`${accent}35`, `${accent}10`, palette.surface]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        >
          <View className="flex-1 justify-end p-4">
            <View
              className="mb-3 items-center justify-center self-start rounded-xl"
              style={{
                width: 44,
                height: 44,
                backgroundColor: `${accent}30`,
              }}
            >
              <MaterialCommunityIcons
                name={(division.iconName as keyof typeof MaterialCommunityIcons.glyphMap) ?? "domain"}
                size={24}
                color={accent}
              />
            </View>
            <Text
              className="text-lg font-bold"
              style={{ color: palette.textPrimary }}
              numberOfLines={1}
            >
              {division.name}
            </Text>
            {division.tagline ? (
              <Text
                className="mt-0.5 text-sm"
                style={{ color: palette.muted }}
                numberOfLines={1}
              >
                {division.tagline}
              </Text>
            ) : null}
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export function FeaturedCarousel({ divisions, onPressDivision }: Props) {
  const { palette } = useHubAppearance();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offset = event.nativeEvent.contentOffset.x;
      const index = Math.round(offset / (CARD_WIDTH + CARD_GAP));
      setActiveIndex(Math.max(0, Math.min(index, divisions.length - 1)));
    },
    [divisions.length],
  );

  if (divisions.length === 0) return null;

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + CARD_GAP}
        decelerationRate="fast"
        contentContainerStyle={{
          paddingHorizontal: 16,
          gap: CARD_GAP,
        }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {divisions.map((division) => (
          <CarouselCard
            key={division.id}
            division={division}
            onPress={() => onPressDivision(division)}
          />
        ))}
      </ScrollView>

      {/* Pagination dots */}
      {divisions.length > 1 && (
        <View className="mt-3 flex-row items-center justify-center gap-1.5">
          {divisions.map((d, idx) => (
            <View
              key={d.id}
              className="rounded-full"
              style={{
                width: idx === activeIndex ? 16 : 6,
                height: 6,
                backgroundColor:
                  idx === activeIndex ? "#C9A227" : palette.line,
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}
