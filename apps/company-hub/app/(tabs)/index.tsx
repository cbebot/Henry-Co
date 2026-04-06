import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { DivisionCardPremium } from "@/components/DivisionCardPremium";
import { FeaturedCarousel } from "@/components/FeaturedCarousel";
import { HubSearchBar } from "@/components/HubSearchBar";
import { NewsCard } from "@/components/NewsCard";
import { SectionHeader } from "@/components/SectionHeader";
import { useDivisionModal } from "@/context/DivisionModalContext";
import { useHubAppearance } from "@/context/HubAppearanceContext";
import { useHubSearch } from "@/context/HubSearchContext";
import { DIVISIONS, getFeaturedDivisions } from "@/data/divisions";
import { matchesQuery } from "@/lib/searchDivisions";
import { getBookmarks, toggleBookmark } from "@/store/bookmarks";

export default function HomeScreen() {
  const { palette, resolvedScheme } = useHubAppearance();
  const { query } = useHubSearch();
  const { openDivision } = useDivisionModal();
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    getBookmarks().then((bms) => {
      setBookmarkedIds(new Set(bms.map((b) => b.divisionId)));
    });
  }, []);

  const handleToggleBookmark = useCallback(async (divisionId: string) => {
    const nowBookmarked = await toggleBookmark(divisionId);
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (nowBookmarked) {
        next.add(divisionId);
      } else {
        next.delete(divisionId);
      }
      return next;
    });
  }, []);

  const filtered = useMemo(
    () => DIVISIONS.filter((d) => matchesQuery(d, query)),
    [query],
  );

  const featured = useMemo(() => {
    const feats = getFeaturedDivisions();
    if (!query) return feats;
    return feats.filter((d) => matchesQuery(d, query));
  }, [query]);

  const spotlight = featured[0] ?? filtered[0];

  const heroTextMuted =
    resolvedScheme === "dark" ? "#C8C8D0" : palette.textBody;
  const heroKickerMuted = palette.textSubtle;

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: palette.bg }}
      edges={["top"]}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        <HubSearchBar />

        <LinearGradient
          colors={
            resolvedScheme === "dark"
              ? ["#5C4D18", "#3D3318", "#1A1510", "#0B0B0C"]
              : ["#F5EED8", "#EBE4D4", "#E8E2DC", "#F2F2F4"]
          }
          locations={[0, 0.28, 0.62, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            marginHorizontal: 16,
            borderRadius: 24,
            overflow: "hidden",
            borderWidth: 1,
            borderColor:
              resolvedScheme === "dark"
                ? "rgba(201, 162, 39, 0.35)"
                : "rgba(201, 162, 39, 0.45)",
          }}
        >
          <View className="px-6 pb-10 pt-10">
            <Animated.View entering={FadeInDown.duration(520).springify()}>
              <Text className="text-xs font-bold uppercase tracking-[0.35em] text-[#C9A227]">
                Henry &amp; Co.
              </Text>
            </Animated.View>
            <Animated.View entering={FadeInUp.delay(80).duration(560).springify()}>
              <Text
                className="mt-4 font-bold leading-tight"
                style={{
                  color: palette.textPrimary,
                  fontSize: 26,
                  lineHeight: 32,
                }}
              >
                Explore the businesses, services, and operating divisions of
                Henry &amp; Co.
              </Text>
            </Animated.View>
            <Animated.View entering={FadeInUp.delay(140).duration(560).springify()}>
              <Text
                className="mt-4 max-w-xl text-base leading-7"
                style={{ color: heroTextMuted }}
              >
                Henry &amp; Co. brings together focused businesses under one
                respected group identity.
              </Text>
            </Animated.View>
            <Animated.View entering={FadeInUp.delay(200).duration(480).springify()}>
              <View className="mt-7 h-px w-20 bg-[#C9A227]/70" />
              <Text className="mt-4 text-sm" style={{ color: heroKickerMuted }}>
                Premium company network — henrycogroup.com
              </Text>
            </Animated.View>
          </View>
        </LinearGradient>

        <View className="mt-10 px-4">
          <SectionHeader kicker="News & Updates" title="What's happening" />
          <View className="mt-4">
            <NewsCard
              title="Company-wide platform stabilization"
              date="April 5, 2026"
              excerpt="Ongoing MVP stabilization across all Henry & Co. divisions — refining connected experiences, polishing interfaces, and ensuring consistent quality from Care through Logistics and beyond."
              onPress={() => {}}
            />
          </View>
        </View>

        {spotlight ? (
          <View className="mt-10 px-4">
            <SectionHeader kicker="Spotlight" title="Featured division" />
            <View className="mt-4">
              <DivisionCardPremium
                division={spotlight}
                onPress={() => openDivision(spotlight)}
                isBookmarked={bookmarkedIds.has(spotlight.id)}
                onToggleBookmark={() => handleToggleBookmark(spotlight.id)}
              />
            </View>
          </View>
        ) : null}

        {featured.length > 0 ? (
          <View className="mt-10">
            <View className="px-4">
              <SectionHeader kicker="Directory" title="Featured divisions" />
            </View>
            <View className="mt-4">
              <FeaturedCarousel
                divisions={featured}
                onPressDivision={openDivision}
              />
            </View>
          </View>
        ) : null}

        <View className="mt-10 px-4">
          <Link href="/discover" asChild>
            <Pressable
              className="items-center rounded-2xl border border-[#C9A227]/40 py-4 active:opacity-80"
              style={{ backgroundColor: "rgba(201, 162, 39, 0.12)" }}
              accessibilityLabel="View full division directory"
              accessibilityRole="button"
            >
              <View className="flex-row items-center gap-2">
                <MaterialCommunityIcons
                  name="view-grid-outline"
                  size={20}
                  color="#C9A227"
                />
                <Text className="text-base font-semibold text-[#C9A227]">
                  View Full Directory
                </Text>
              </View>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
