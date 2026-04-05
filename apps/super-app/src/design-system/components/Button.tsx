import React, { forwardRef } from "react";
import type { PressableProps } from "react-native";
import { ActivityIndicator, Pressable, StyleSheet, View as RNView } from "react-native";

import { Text } from "@/design-system/components/Text";
import { palette, radii, spacing } from "@/design-system/theme";

type Variant = "primary" | "secondary" | "ghost";

export type ButtonProps = PressableProps & {
  title: string;
  variant?: Variant;
  loading?: boolean;
  leftIcon?: React.ReactNode;
};

export const Button = forwardRef<React.ComponentRef<typeof Pressable>, ButtonProps>(
  function Button(
  {
    title,
    variant = "primary",
    loading,
    disabled,
    leftIcon,
    accessibilityLabel,
    ...rest
  },
  ref,
) {
  const isDisabled = Boolean(disabled || loading);
  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: isDisabled, busy: Boolean(loading) }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" && styles.primary,
        variant === "secondary" && styles.secondary,
        variant === "ghost" && styles.ghost,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
      ]}
      {...rest}
    >
      <RNView style={styles.content}>
        {loading ? (
          <ActivityIndicator color={variant === "primary" ? palette.background : palette.accent} />
        ) : (
          <>
            {leftIcon}
            <Text
              variant="subtitle"
              style={[
                styles.label,
                variant === "primary" && { color: palette.background },
                variant !== "primary" && { color: palette.accent },
              ]}
            >
              {title}
            </Text>
          </>
        )}
      </RNView>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  primary: {
    backgroundColor: palette.accent,
  },
  secondary: {
    backgroundColor: palette.surfaceElevated,
    borderColor: palette.border,
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: palette.border,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  label: {
    fontSize: 16,
  },
});
