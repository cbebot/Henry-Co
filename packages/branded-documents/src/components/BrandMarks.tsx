import * as React from "react";
import { Svg, Path, G, Text, Rect } from "@react-pdf/renderer";
import { COMPANY } from "@henryco/config";
import { palette } from "../tokens";

type WordmarkProps = {
  variant?: "full" | "compact";
  height?: number;
  color?: string;
  fontFamily?: string;
};

/**
 * The engineered Henry Onyx wordmark for branded documents. The brand text is
 * sourced from `COMPANY.group.name` (never hardcoded, never the retired
 * "Henry & Co." / "HenryCo" shorthand) — this masthead appears on every receipt,
 * invoice, and statement, so a stale literal here brands the legal artifact wrong.
 */
export function BrandedWordmark({
  variant = "full",
  height = 22,
  color = palette.ink,
  fontFamily = "HenryCoSerif",
}: WordmarkProps) {
  const viewWidth = variant === "full" ? 360 : 280;
  const viewHeight = 64;
  const width = (viewWidth / viewHeight) * height;
  const fontSize = variant === "full" ? 44 : 40;

  return (
    <Svg viewBox={`0 0 ${viewWidth} ${viewHeight}`} width={width} height={height}>
      <G>
        <Text x={0} y={46} style={{ fontFamily, fontWeight: 600, fontSize, fill: color, letterSpacing: -1.2 }}>
          {COMPANY.group.name}
        </Text>
      </G>
    </Svg>
  );
}

type MonogramProps = {
  size?: number;
  color?: string;
  accent?: string;
  watermark?: boolean;
};

export function BrandedMonogram({
  size = 28,
  color = palette.ink,
  accent = palette.copper,
  watermark = false,
}: MonogramProps) {
  const opacity = watermark ? 0.07 : 1;
  return (
    <Svg viewBox="0 0 64 64" width={size} height={size}>
      <G opacity={opacity}>
        <Path d="M9 7 H17 V57 H9 Z" fill={color} />
        <Path d="M6.5 7 H19.5 V9 H6.5 Z" fill={color} />
        <Path d="M6.5 55 H19.5 V57 H6.5 Z" fill={color} />
        <Path d="M37 7 H45 V57 H37 Z" fill={color} />
        <Path d="M34.5 7 H47.5 V9 H34.5 Z" fill={color} />
        <Path d="M34.5 55 H47.5 V57 H34.5 Z" fill={color} />
        <Path d="M9 28 H45 V34 H9 Z" fill={color} />
        <Rect x={49.5} y={56} width={11.5} height={1.6} fill={accent} />
      </G>
    </Svg>
  );
}
