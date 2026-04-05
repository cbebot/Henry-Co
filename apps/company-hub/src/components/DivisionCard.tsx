import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import type { Division } from "@/types/division";

type Props = {
  division: Division;
  onPress: () => void;
  compact?: boolean;
};

export function DivisionCard({ division, onPress, compact }: Props) {
  const active = division.status === "active";

  return (
    <Pressable
      onPress={onPress}
      className={`mb-3 overflow-hidden rounded-2xl border border-hub-line bg-hub-surface active:opacity-90 ${compact ? "p-3" : "p-4"}`}
    >
      <View className="flex-row items-start justify-between gap-2">
        <View className="min-w-0 flex-1">
          <Text className={`font-semibold text-white ${compact ? "text-base" : "text-lg"}`} numberOfLines={2}>
            {division.name}
          </Text>
          <Text className="mt-1 text-sm leading-5 text-hub-muted" numberOfLines={compact ? 2 : 3}>
            {division.summary}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color="#C9A227" />
      </View>
      <View className="mt-3 flex-row items-center gap-2">
        <View
          className={`rounded-full px-2.5 py-0.5 ${active ? "bg-[#C9A227]/20" : "bg-white/10"}`}
        >
          <Text className={`text-xs font-semibold uppercase tracking-wide ${active ? "text-[#C9A227]" : "text-hub-muted"}`}>
            {active ? "Active" : "Coming Soon"}
          </Text>
        </View>
        <Text className="text-xs text-hub-muted" numberOfLines={1}>
          {division.subdomain}
        </Text>
      </View>
    </Pressable>
  );
}
