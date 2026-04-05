import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { Text } from "@/design-system/components/Text";
import { spacing } from "@/design-system/theme";
import { useDivisions } from "@/hooks/useDivisions";
import { ModuleDetail } from "@/features/modules/ModuleDetail";
import { usePlatform } from "@/providers/PlatformProvider";

export function DivisionModuleScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const divisions = useDivisions();
  const { analytics } = usePlatform();
  const division = divisions.find((d) => d.slug === slug);

  useEffect(() => {
    if (slug) analytics.screen(`module:${slug}`);
  }, [slug, analytics]);

  if (!division) {
    return (
      <View style={styles.center}>
        <Text variant="subtitle">Division not found</Text>
        <Text variant="body" color="textSecondary">
          The link may be outdated. Use the directory to pick a current division.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.pad} testID={`module-${division.slug}`}>
      <Text variant="title">{division.name}</Text>
      <Text variant="body" color="textSecondary">
        {division.summary}
      </Text>
      <Text variant="subtitle">Highlights</Text>
      {division.highlights.map((h) => (
        <Text key={h} variant="body" color="textSecondary">
          • {h}
        </Text>
      ))}
      <ModuleDetail division={division} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  center: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.sm,
    justifyContent: "center",
  },
});
