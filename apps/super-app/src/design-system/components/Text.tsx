import type { TextProps as RNTextProps } from "react-native";
import { Text as RNText, StyleSheet } from "react-native";

import { palette, typography } from "@/design-system/theme";

type Variant = "title" | "subtitle" | "body" | "caption" | "label";

export type AppTextProps = RNTextProps & {
  variant?: Variant;
  color?: keyof typeof palette;
};

export function Text({ variant = "body", color = "textPrimary", style, ...rest }: AppTextProps) {
  return (
    <RNText
      accessibilityRole="text"
      style={[styles.base, typography[variant], { color: palette[color] }, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: "System",
  },
});
