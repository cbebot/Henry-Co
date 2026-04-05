import { ActivityIndicator, View } from "react-native";

import { Text } from "@/design-system/components/Text";
import { palette, spacing } from "@/design-system/theme";

export function Spinner({ label }: { label?: string }) {
  return (
    <View
      style={{ alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xl }}
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? "Loading"}
    >
      <ActivityIndicator size="large" color={palette.accent} />
      {label ? (
        <Text variant="caption" color="textSecondary">
          {label}
        </Text>
      ) : null}
    </View>
  );
}
