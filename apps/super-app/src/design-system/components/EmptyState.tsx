import { View } from "react-native";

import { Button } from "@/design-system/components/Button";
import { Text } from "@/design-system/components/Text";
import { spacing } from "@/design-system/theme";

export type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View
      style={{ gap: spacing.md, paddingVertical: spacing.xxl, alignItems: "center" }}
      accessibilityRole="summary"
    >
      <Text variant="subtitle">{title}</Text>
      {description ? (
        <Text variant="body" color="textSecondary" style={{ textAlign: "center" }}>
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} variant="secondary" onPress={onAction} />
      ) : null}
    </View>
  );
}
