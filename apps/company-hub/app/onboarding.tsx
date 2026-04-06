import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useCallback, useRef, useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { useHubAppearance } from "@/context/HubAppearanceContext";
import { setOnboardingComplete } from "@/store/onboarding";

type Slide = {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  title: string;
  description: string;
};

const SLIDES: Slide[] = [
  {
    icon: "domain",
    title: "Welcome to\nHenry & Co.",
    description:
      "Your connected entry point to every Henry & Co. division. Explore services spanning fabric care, technology, commerce, talent, property, education, logistics, and more — all under one roof.",
  },
  {
    icon: "view-grid-outline",
    title: "Discover\nDivisions",
    description:
      "Browse 8+ divisions with detailed profiles, status indicators, and direct links. Each division operates with autonomy while sharing the group's commitment to premium execution.",
  },
  {
    icon: "connection",
    title: "Stay\nConnected",
    description:
      "Bookmark your favourite divisions for quick access, search across the entire network, and deep-link directly into division experiences. Your hub, your way.",
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function OnboardingScreen() {
  const { palette, resolvedScheme } = useHubAppearance();
  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / SCREEN_WIDTH);
      setCurrentIndex(index);
    },
    [],
  );

  const handleNext = useCallback(() => {
    if (currentIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({
        x: (currentIndex + 1) * SCREEN_WIDTH,
        animated: true,
      });
    }
  }, [currentIndex]);

  const handleGetStarted = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await setOnboardingComplete();
    router.replace("/(tabs)");
  }, []);

  const isLastSlide = currentIndex === SLIDES.length - 1;

  const slideMuted = resolvedScheme === "dark" ? "#C8C8D0" : palette.textBody;
  const slideFootnote = palette.textSubtle;

  return (
    <View className="flex-1" style={{ backgroundColor: palette.bg }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {SLIDES.map((slide, index) => (
          <View
            key={slide.title}
            style={{ width: SCREEN_WIDTH }}
            className="flex-1 items-center justify-center px-8"
          >
            <LinearGradient
              colors={["#2A2210", "#1A1510", "#0B0B0C"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={{
                width: 120,
                height: 120,
                borderRadius: 32,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "rgba(201, 162, 39, 0.3)",
              }}
            >
              <MaterialCommunityIcons
                name={slide.icon}
                size={52}
                color="#C9A227"
              />
            </LinearGradient>

            <Text
              className="mt-8 text-center text-3xl font-bold leading-tight"
              style={{ color: palette.textPrimary }}
            >
              {slide.title}
            </Text>

            <View className="mt-4 h-px w-12 bg-[#C9A227]/60" />

            <Text
              className="mt-4 text-center text-base leading-7"
              style={{ color: slideMuted }}
            >
              {slide.description}
            </Text>

            <Text className="mt-6 text-xs" style={{ color: slideFootnote }}>
              {index + 1} of {SLIDES.length}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View className="items-center pb-12 pt-4 px-8">
        <View className="mb-8 flex-row gap-2">
          {SLIDES.map((slide, index) => (
            <View
              key={slide.title}
              className="h-2 rounded-full"
              style={{
                width: index === currentIndex ? 32 : 8,
                backgroundColor:
                  index === currentIndex ? "#C9A227" : palette.line,
              }}
            />
          ))}
        </View>

        {isLastSlide ? (
          <Pressable
            onPress={handleGetStarted}
            className="w-full items-center rounded-2xl bg-[#C9A227] py-4 active:opacity-80"
            accessibilityLabel="Get started with Henry and Co Hub"
            accessibilityRole="button"
          >
            <Text className="text-base font-bold text-[#0B0B0C]">
              Get Started
            </Text>
          </Pressable>
        ) : (
          <View className="w-full flex-row gap-3">
            <Pressable
              onPress={handleGetStarted}
              className="flex-1 items-center rounded-2xl border py-4 active:opacity-80"
              style={{ borderColor: palette.line }}
              accessibilityLabel="Skip onboarding"
              accessibilityRole="button"
            >
              <Text
                className="text-base font-semibold"
                style={{ color: palette.muted }}
              >
                Skip
              </Text>
            </Pressable>
            <Pressable
              onPress={handleNext}
              className="flex-1 items-center rounded-2xl bg-[#C9A227] py-4 active:opacity-80"
              accessibilityLabel="Go to next slide"
              accessibilityRole="button"
            >
              <Text className="text-base font-bold text-[#0B0B0C]">
                Next
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}
