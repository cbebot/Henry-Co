import { Link, Stack } from "expo-router";
import { StyleSheet, View } from "react-native";

import { Text } from "@/design-system/components/Text";
import { palette, spacing } from "@/design-system/theme";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not found" }} />
      <View style={styles.container}>
        <Text variant="title">This screen does not exist.</Text>
        <Link href="/" accessibilityLabel="Go to hub home">
          <Text variant="body" style={styles.link}>
            Return to hub
          </Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: palette.background,
    gap: spacing.md,
  },
  link: {
    color: palette.accent,
    marginTop: spacing.sm,
  },
});
