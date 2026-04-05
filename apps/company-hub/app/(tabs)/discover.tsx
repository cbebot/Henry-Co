import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Chip } from "react-native-paper";

import { DivisionCardPremium } from "@/components/DivisionCardPremium";
import { HubSearchBar } from "@/components/HubSearchBar";
import { useDivisionModal } from "@/context/DivisionModalContext";
import { useHubSearch } from "@/context/HubSearchContext";
import { DIVISIONS } from "@/data/divisions";
import { filterByStatus, matchesQuery } from "@/lib/searchDivisions";
import { getBookmarks, toggleBookmark } from "@/store/bookmarks";
import type { Division } from "@/types/division";

type StatusFilter = "all" | "active" | "coming_soon" | "bookmarked";

const FILTER_CHIPS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "coming_soon", label: "Coming Soon" },
  { key: "bookmarked", label: "Bookmarked" },
];

export default function DiscoverScreen() {
  const { query } = useHubSearch();
  const { openDivision } = useDivisionModal();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const loadBookmarks = useCallback(async () => {
    const bms = await getBookmarks();
    setBookmarkedIds(new Set(bms.map((b) => b.divisionId)));
  }, []);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBookmarks();
    setRefreshing(false);
  }, [loadBookmarks]);

  const handleToggleBookmark = useCallback(
    async (divisionId: string) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    },
    [],
  );

  const data = useMemo(() => {
    let list = DIVISIONS.filter((d) => matchesQuery(d, query));
    if (status === "bookmarked") {
      list = list.filter((d) => bookmarkedIds.has(d.id));
    } else {
      list = filterByStatus(list, status);
    }
    return list;
  }, [query, status, bookmarkedIds]);

  const renderItem = useCallback(
    ({ item, index }: { item: Division; index: number }) => (
      <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
        <DivisionCardPremium
          division={item}
          onPress={() => openDivision(item)}
          isBookmarked={bookmarkedIds.has(item.id)}
          onToggleBookmark={() => handleToggleBookmark(item.id)}
          compact
        />
      </Animated.View>
    ),
    [openDivision, bookmarkedIds, handleToggleBookmark],
  );

  return (
    <SafeAreaView className="flex-1 bg-hub-bg" edges={["top"]}>
      <HubSearchBar />

      <View className="flex-row flex-wrap gap-2 px-4 pb-3">
        {FILTER_CHIPS.map(({ key, label }) => (
          <Chip
            key={key}
            selected={status === key}
            onPress={() => setStatus(key)}
            style={{
              backgroundColor: status === key ? "#C9A22733" : "#1E1E22",
              borderWidth: 1,
              borderColor: status === key ? "#C9A227" : "#2A2A2E",
            }}
            textStyle={{
              color: status === key ? "#F5E6B8" : "#C8C8D0",
              fontWeight: "600",
            }}
            selectedColor="#C9A227"
            accessibilityLabel={`Filter by ${label}`}
          >
            {label}
          </Chip>
        ))}
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 48 }}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#C9A227"
            colors={["#C9A227"]}
            progressBackgroundColor="#141416"
          />
        }
        ListEmptyComponent={
          <View className="mt-20 items-center px-8">
            <MaterialCommunityIcons
              name="magnify-close"
              size={56}
              color="#3A3A40"
            />
            <Text className="mt-4 text-center text-lg font-semibold text-[#6B6B73]">
              No divisions found
            </Text>
            <Text className="mt-2 text-center text-sm leading-5 text-hub-muted">
              Try adjusting your search or filters to discover Henry &amp; Co.
              divisions.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
