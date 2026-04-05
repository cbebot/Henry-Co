import type { ViewProps } from "react-native";
import { Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/design-system/components/Text";
import { palette, radii, spacing } from "@/design-system/theme";

export type CardProps = ViewProps & {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: React.ReactNode;
};

export function Card({ title, subtitle, onPress, right, children, style, ...rest }: CardProps) {
  const Inner = onPress ? Pressable : View;
  return (
    <Inner
      accessibilityRole={onPress ? "button" : undefined}
      onPress={onPress}
      style={[styles.card, style]}
      {...rest}
    >
      <View style={styles.row}>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Text variant="subtitle">{title}</Text>
          {subtitle ? (
            <Text variant="caption" color="textSecondary">
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
      {children}
    </Inner>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
});
