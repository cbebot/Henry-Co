import * as React from "react";
import { Svg, Path, G, Text, Rect } from "@react-pdf/renderer";
import { palette } from "../tokens";

type WordmarkProps = {
  variant?: "full" | "compact";
  height?: number;
  color?: string;
  fontFamily?: string;
};

export function BrandedWordmark({
  variant = "full",
  height = 22,
  color = palette.ink,
  fontFamily = "HenryCoSerif",
}: WordmarkProps) {
  const viewWidth = variant === "full" ? 320 : 200;
  const viewHeight = 64;
  const width = (viewWidth / viewHeight) * height;

  if (variant === "full") {
    return (
      <Svg viewBox={`0 0 ${viewWidth} ${viewHeight}`} width={width} height={height}>
        <G>
          <Text x={0} y={46} style={{ fontFamily, fontWeight: 500, fontSize: 48, fill: color, letterSpacing: -1.4 }}>
            Henry
          </Text>
          <Text x={148} y={42} style={{ fontFamily, fontStyle: "italic", fontWeight: 400, fontSize: 36, fill: color, opacity: 0.92 }}>
            &amp;
          </Text>
          <Text x={186} y={46} style={{ fontFamily, fontWeight: 500, fontSize: 48, fill: color, letterSpacing: -1.4 }}>
            Co.
          </Text>
        </G>
      </Svg>
    );
  }

  return (
    <Svg viewBox={`0 0 ${viewWidth} ${viewHeight}`} width={width} height={height}>
      <G>
        <Text x={0} y={46} style={{ fontFamily, fontWeight: 600, fontSize: 48, fill: color, letterSpacing: -1.9 }}>
          HenryCo
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
