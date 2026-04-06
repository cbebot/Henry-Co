import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { Searchbar } from "react-native-paper";

import { HubBrandHeader } from "@/components/HubBrandHeader";
import { useHubAppearance } from "@/context/HubAppearanceContext";
import { useHubSearch } from "@/context/HubSearchContext";
import { DIVISIONS } from "@/data/divisions";
import type { Division } from "@/types/division";

const MAX_SUGGESTIONS = 5;
const DEBOUNCE_MS = 200;

function getSearchSuggestions(query: string): Division[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return DIVISIONS.filter((d) => {
    const hay = `${d.name} ${d.tagline} ${d.summary} ${d.subdomain}`.toLowerCase();
    return hay.includes(q);
  }).slice(0, MAX_SUGGESTIONS);
}

export function HubSearchBar() {
  const { palette } = useHubAppearance();
  const { query, setQuery, clearQuery } = useHubSearch();
  const [localQuery, setLocalQuery] = useState(query);
  const [suggestions, setSuggestions] = useState<Division[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  const handleChange = useCallback(
    (text: string) => {
      setLocalQuery(text);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(() => {
        setQuery(text);
        const results = getSearchSuggestions(text);
        setSuggestions(results);
        setShowSuggestions(results.length > 0 && text.trim().length > 0);
      }, DEBOUNCE_MS);
    },
    [setQuery],
  );

  const handleClear = useCallback(() => {
    clearQuery();
    setLocalQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
  }, [clearQuery]);

  const handleSelectSuggestion = useCallback(
    (division: Division) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setQuery(division.name);
      setLocalQuery(division.name);
      setShowSuggestions(false);
    },
    [setQuery],
  );

  return (
    <View className="z-50 px-4 pb-2 pt-1">
      <View className="pb-3 pt-2">
        <HubBrandHeader />
      </View>
      <Searchbar
        placeholder="Search divisions, services, keywords…"
        onChangeText={handleChange}
        value={localQuery}
        onClearIconPress={handleClear}
        onFocus={() => {
          if (suggestions.length > 0) setShowSuggestions(true);
        }}
        onBlur={() => {
          setTimeout(() => setShowSuggestions(false), 150);
        }}
        icon={() => (
          <MaterialCommunityIcons name="magnify" size={22} color={palette.muted} />
        )}
        style={{
          backgroundColor: palette.searchBg,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: palette.searchBorder,
        }}
        inputStyle={{ fontSize: 15, color: palette.textPrimary }}
        placeholderTextColor={palette.searchPlaceholder}
        elevation={0}
      />

      {showSuggestions && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          className="mt-1 overflow-hidden rounded-xl border"
          style={{
            borderColor: palette.line,
            backgroundColor: palette.surface,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          {suggestions.map((division, idx) => (
            <Pressable
              key={division.id}
              onPress={() => handleSelectSuggestion(division)}
              accessibilityRole="button"
              accessibilityLabel={`Select ${division.name}`}
              className="flex-row items-center gap-3 px-4 py-3 active:opacity-90"
              style={{
                borderBottomWidth: idx < suggestions.length - 1 ? 1 : 0,
                borderBottomColor: palette.line,
                backgroundColor: palette.surface,
              }}
            >
              <View
                className="items-center justify-center rounded-lg"
                style={{
                  width: 32,
                  height: 32,
                  backgroundColor: `${division.accentHex ?? "#C9A227"}26`,
                }}
              >
                <MaterialCommunityIcons
                  name={
                    (division.iconName as keyof typeof MaterialCommunityIcons.glyphMap) ??
                    "domain"
                  }
                  size={18}
                  color={division.accentHex ?? "#C9A227"}
                />
              </View>
              <View className="min-w-0 flex-1">
                <Text
                  className="text-sm font-semibold"
                  style={{ color: palette.textPrimary }}
                  numberOfLines={1}
                >
                  {division.name}
                </Text>
                {division.tagline ? (
                  <Text
                    className="text-xs"
                    style={{ color: palette.muted }}
                    numberOfLines={1}
                  >
                    {division.tagline}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          ))}
        </Animated.View>
      )}
    </View>
  );
}
