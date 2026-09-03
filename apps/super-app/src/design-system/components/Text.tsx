import type { TextProps as RNTextProps } from "react-native";
import { Text as RNText, StyleSheet } from "react-native";

import { brandType } from "@henryco/rn-type";
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

// Owned type — the design-system base font is the brand sans (flag-gated: falls
// back to the platform sans until the reveal flag is live).
const type = brandType();
const styles = StyleSheet.create({
  base: {
    fontFamily: type.sans,
  },
});
