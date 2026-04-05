import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { Card } from "@/design-system/components/Card";
import { Text } from "@/design-system/components/Text";
import { spacing } from "@/design-system/theme";
import { useDivisions } from "@/hooks/useDivisions";

export function ServicesScreen() {
  const router = useRouter();
  const divisions = useDivisions();
  return (
    <View style={styles.container} testID="services-screen">
      <Text variant="body" color="textSecondary">
        Jump into a division module. Each area opens focused tools and curated web destinations when
        needed.
      </Text>
      <View style={{ gap: spacing.md, marginTop: spacing.md }}>
        {divisions.map((d) => (
          <Card
            key={d.slug}
            title={d.shortName}
            subtitle={d.summary}
            onPress={() => router.push(`/module/${d.slug}`)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
});
