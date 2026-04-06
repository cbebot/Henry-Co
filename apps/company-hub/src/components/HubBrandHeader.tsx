import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { useHubAppearance } from "@/context/HubAppearanceContext";

const GOLD = "#C9A227";

type Props = {
  /** Tighter typography for stack header title slot */
  variant?: "screen" | "nav";
};

export function HubBrandHeader({ variant = "screen" }: Props) {
  const { palette } = useHubAppearance();
  const isNav = variant === "nav";
  const nameSize = isNav ? 15 : 17;
  const tagSize = isNav ? 9 : 10;

  const sparkle = useSharedValue(0);

  useEffect(() => {
    sparkle.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [sparkle]);

  const goldWordmarkStyle = useAnimatedStyle(() => ({
    opacity: 0.82 + sparkle.value * 0.18,
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: 0.15 + sparkle.value * 0.35,
    transform: [{ scale: 0.96 + sparkle.value * 0.08 }],
  }));

  return (
    <View
      className="w-full flex-row items-center justify-between gap-2"
      style={{ minHeight: isNav ? 36 : 40 }}
    >
      <View className="min-w-0 flex-1 flex-row flex-wrap items-baseline gap-x-1">
        <Text
          style={{
            fontSize: nameSize,
            fontWeight: "600",
            letterSpacing: isNav ? 0.2 : 0.35,
            color: palette.textPrimary,
          }}
        >
          Henry
        </Text>
        <View className="relative flex-row items-baseline">
          <Animated.Text
            style={[
              goldWordmarkStyle,
              {
                fontSize: nameSize,
                fontWeight: "700",
                letterSpacing: isNav ? 0.2 : 0.35,
                color: GOLD,
              },
            ]}
          >
            {"& Co."}
          </Animated.Text>
          <Animated.View
            pointerEvents="none"
            style={[
              sparkleStyle,
              {
                position: "absolute",
                right: -2,
                top: -3,
                width: 5,
                height: 5,
                borderRadius: 2.5,
                backgroundColor: GOLD,
              },
            ]}
          />
        </View>
      </View>

      <Text
        numberOfLines={1}
        style={{
          fontSize: tagSize,
          fontWeight: "600",
          letterSpacing: 1.6,
          textTransform: "uppercase",
          color: palette.textSubtle,
          maxWidth: isNav ? 120 : 140,
          textAlign: "right",
        }}
      >
        Corporate Platform
      </Text>
    </View>
  );
}
