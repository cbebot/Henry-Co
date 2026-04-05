import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Switch, View } from "react-native";

import { Card } from "@/design-system/components/Card";
import { EmptyState } from "@/design-system/components/EmptyState";
import { Text } from "@/design-system/components/Text";
import { TextField } from "@/design-system/components/TextField";
import { palette, radii, spacing } from "@/design-system/theme";
import type { DivisionStatus } from "@/domain/division";
import { DIRECTORY_SECTOR_FILTERS, filterDivisions } from "@/domain/divisionCatalog";
import { useDivisions } from "@/hooks/useDivisions";
import { useRouter } from "expo-router";

const STATUS_OPTIONS: { id: "all" | DivisionStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "coming_soon", label: "Coming soon" },
  { id: "paused", label: "Paused" },
];

export function DirectoryScreen() {
  const router = useRouter();
  const divisions = useDivisions();
  const [query, setQuery] = useState("");
  const [sectorId, setSectorId] = useState("all");
  const [status, setStatus] = useState<"all" | DivisionStatus>("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);

  const results = useMemo(
    () => filterDivisions({ query, sectorId, status, featuredOnly, source: divisions }),
    [query, sectorId, status, featuredOnly, divisions],
  );

  return (
    <View style={styles.container} testID="directory-screen">
      <TextField
        label="Search"
        placeholder="Division, sector, or keyword"
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        accessibilityHint="Filters the division directory"
      />
      <Text variant="label" color="textSecondary">
        Sector
      </Text>
      <View style={styles.chips}>
        {DIRECTORY_SECTOR_FILTERS.map((s) => {
          const selected = sectorId === s.id;
          return (
            <Pressable
              key={s.id}
              onPress={() => setSectorId(s.id)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text
                variant="caption"
                style={{ color: selected ? "#0B0B0C" : palette.textSecondary }}
              >
                {s.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text variant="label" color="textSecondary">
        Status
      </Text>
      <View style={styles.chips}>
        {STATUS_OPTIONS.map((s) => {
          const selected = status === s.id;
          return (
            <Pressable
              key={s.id}
              onPress={() => setStatus(s.id)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text
                variant="caption"
                style={{ color: selected ? "#0B0B0C" : palette.textSecondary }}
              >
                {s.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.row}>
        <Text variant="body">Featured only</Text>
        <Switch
          accessibilityLabel="Limit to featured divisions"
          value={featuredOnly}
          onValueChange={setFeaturedOnly}
          thumbColor={featuredOnly ? palette.accent : palette.textMuted}
          trackColor={{ false: palette.border, true: palette.surfaceElevated }}
        />
      </View>
      {results.length === 0 ? (
        <EmptyState
          title="No divisions match"
          description="Try clearing filters or searching with a broader keyword."
          actionLabel="Reset filters"
          onAction={() => {
            setQuery("");
            setSectorId("all");
            setStatus("all");
            setFeaturedOnly(false);
          }}
        />
      ) : (
        <View style={{ gap: spacing.md }}>
          {results.map((d) => (
            <Card
              key={d.slug}
              title={d.name}
              subtitle={d.summary}
              onPress={() => router.push(`/module/${d.slug}`)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: palette.surface,
  },
  chipSelected: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
