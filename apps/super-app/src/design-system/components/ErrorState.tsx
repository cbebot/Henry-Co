import { View } from "react-native";

import { Button } from "@/design-system/components/Button";
import { Text } from "@/design-system/components/Text";
import { spacing } from "@/design-system/theme";

export type ErrorStateProps = {
  title: string;
  message?: string;
  onRetry?: () => void;
};

export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  return (
    <View style={{ gap: spacing.md, paddingVertical: spacing.xl }} accessibilityRole="alert">
      <Text variant="subtitle" color="danger">
        {title}
      </Text>
      {message ? (
        <Text variant="body" color="textSecondary">
          {message}
        </Text>
      ) : null}
      {onRetry ? <Button title="Try again" variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}
