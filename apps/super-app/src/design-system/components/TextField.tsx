import { forwardRef } from "react";
import type { TextInputProps } from "react-native";
import { StyleSheet, TextInput, View } from "react-native";

import { Text } from "@/design-system/components/Text";
import { palette, radii, spacing } from "@/design-system/theme";

export type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  hint?: string;
};

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, hint, style, accessibilityLabel, ...rest },
  ref,
) {
  const a11yLabel = accessibilityLabel ?? label;
  return (
    <View style={styles.wrap}>
      <Text variant="label" color="textSecondary" style={styles.label}>
        {label}
      </Text>
      <TextInput
        ref={ref}
        placeholderTextColor={palette.textMuted}
        accessibilityLabel={a11yLabel}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...rest}
      />
      {hint && !error ? (
        <Text variant="caption" color="textMuted">
          {hint}
        </Text>
      ) : null}
      {error ? (
        <Text variant="caption" color="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  label: {
    textTransform: "uppercase",
  },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    color: palette.textPrimary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
  },
  inputError: {
    borderColor: palette.danger,
  },
});
