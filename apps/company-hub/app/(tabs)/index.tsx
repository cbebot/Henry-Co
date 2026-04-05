import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DivisionCardPremium } from "@/components/DivisionCardPremium";
import { FeaturedCarousel } from "@/components/FeaturedCarousel";
import { HubSearchBar } from "@/components/HubSearchBar";
import { NewsCard } from "@/components/NewsCard";
import { SectionHeader } from "@/components/SectionHeader";
import { useDivisionModal } from "@/context/DivisionModalContext";
import { useHubSearch } from "@/context/HubSearchContext";
import { DIVISIONS, getFeaturedDivisions } from "@/data/divisions";
import { matchesQuery } from "@/lib/searchDivisions";
import { getBookmarks, toggleBookmark } from "@/store/bookmarks";

export default function HomeScreen() {
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

  return (
    <SafeAreaView className="flex-1 bg-hub-bg" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        <HubSearchBar />

        <LinearGradient
          colors={["#2A2210", "#1A1510", "#0B0B0C"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            marginHorizontal: 16,
            borderRadius: 24,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: "rgba(201, 162, 39, 0.25)",
          }}
        >
          <View className="px-6 pb-10 pt-10">
            <Text className="text-xs font-bold uppercase tracking-[0.35em] text-[#C9A227]">
              Henry &amp; Co.
            </Text>
            <Text className="mt-3 text-3xl font-bold leading-tight text-white">
              Company Hub
            </Text>
            <Text className="mt-3 max-w-sm text-base leading-6 text-[#C8C8D0]">
              One connected entry point to every Henry &amp; Co.
              division—discover services, explore opportunities, and open the
              experience that fits your needs.
            </Text>
            <View className="mt-6 h-px w-16 bg-[#C9A227]/60" />
            <Text className="mt-4 text-sm text-[#9A9AA3]">
              Aligned with henrycogroup.com — refined, accountable, and built to
              scale.
            </Text>
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
              className="items-center rounded-2xl border border-[#C9A227]/40 bg-[#C9A227]/10 py-4 active:opacity-80"
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
