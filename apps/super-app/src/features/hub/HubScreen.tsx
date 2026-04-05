import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { Button } from "@/design-system/components/Button";
import { Card } from "@/design-system/components/Card";
import { Text } from "@/design-system/components/Text";
import { spacing } from "@/design-system/theme";
import { useDivisions } from "@/hooks/useDivisions";
import { usePlatform } from "@/providers/PlatformProvider";

export function HubScreen() {
  const router = useRouter();
  const divisions = useDivisions();
  const { media } = usePlatform();
  const logoUrl = media.buildPublicUrl("logo/m6mbunrxxa7hmankrk1h", { width: 320, format: "png" });
  const featured = divisions.filter((d) => d.featured).slice(0, 3);
  return (
    <View style={styles.container} testID="hub-screen">
      <Image
        accessibilityLabel="Henry and Co. logo"
        source={{ uri: logoUrl }}
        style={styles.logo}
        contentFit="contain"
      />
      <Text variant="title">Henry &amp; Co. Company Hub</Text>
      <Text variant="body" color="textSecondary">
        Explore the businesses, services, and operating divisions of Henry &amp; Co. — now in one
        connected mobile experience.
      </Text>
      <View style={styles.actions}>
        <Link href="/directory" asChild>
          <Button title="Open directory" />
        </Link>
        <Link href="/legal/about" asChild>
          <Button title="About the company" variant="secondary" />
        </Link>
      </View>
      <Text variant="subtitle" style={{ marginTop: spacing.lg }}>
        Featured divisions
      </Text>
      <View style={{ gap: spacing.md }}>
        {featured.map((d) => (
          <Card
            key={d.slug}
            title={d.shortName}
            subtitle={d.summary}
            onPress={() => router.push(`/module/${d.slug}`)}
            right={
              <View
                style={[
                  styles.badge,
                  { backgroundColor: `${d.accentHex}22`, borderColor: d.accentHex },
                ]}
              >
                <Text variant="caption" style={{ color: d.accentHex }}>
                  {d.status === "coming_soon" ? "Soon" : "Open"}
                </Text>
              </View>
            }
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  logo: {
    width: 120,
    height: 48,
    marginBottom: spacing.sm,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    borderWidth: 1,
  },
});
