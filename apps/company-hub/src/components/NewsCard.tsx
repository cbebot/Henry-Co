import { useCallback } from "react";
import { Pressable, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

type Props = {
  title: string;
  date: string;
  excerpt: string;
  onPress?: () => void;
};

const SPRING_CONFIG = { damping: 15, stiffness: 150 };

export function NewsCard({ title, date, excerpt, onPress }: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (!onPress) return;
    scale.value = withSpring(0.98, SPRING_CONFIG);
  }, [onPress, scale]);

  const handlePressOut = useCallback(() => {
    if (!onPress) return;
    scale.value = withSpring(1, SPRING_CONFIG);
  }, [onPress, scale]);

  const handlePress = useCallback(() => {
    if (!onPress) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!onPress}
        accessibilityRole={onPress ? "button" : "none"}
        accessibilityLabel={title}
        className="mb-3 flex-row overflow-hidden rounded-2xl border border-hub-line bg-hub-surface"
      >
        {/* Gold accent bar */}
        <View className="w-1 bg-hub-gold" />

        <View className="min-w-0 flex-1 px-4 py-3.5">
          <Text className="text-xs font-medium uppercase tracking-wider text-hub-muted">
            {date}
          </Text>
          <Text className="mt-1 text-base font-bold text-white" numberOfLines={2}>
            {title}
          </Text>
          <Text className="mt-1.5 text-sm leading-5 text-[#DCDCE2]" numberOfLines={2}>
            {excerpt}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
