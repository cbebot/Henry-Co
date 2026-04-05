import { useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";

import { Text } from "@/design-system/components/Text";
import { spacing } from "@/design-system/theme";
import { DIVISION_CATALOG } from "@/domain/divisionCatalog";
import { ModuleDetail } from "@/features/modules/ModuleDetail";

export function DivisionModuleScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const division = DIVISION_CATALOG.find((d) => d.slug === slug);

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
