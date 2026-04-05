export const palette = {
  background: "#0B0B0C",
  surface: "#141416",
  surfaceElevated: "#1C1C1F",
  border: "#2A2A2E",
  textPrimary: "#F4F4F5",
  textSecondary: "#A1A1AA",
  textMuted: "#71717A",
  accent: "#C9A227",
  danger: "#F87171",
  success: "#4ADE80",
  focus: "#C9A227",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 24, fontWeight: "700" as const, lineHeight: 30 },
  subtitle: { fontSize: 18, fontWeight: "600" as const, lineHeight: 24 },
  body: { fontSize: 16, fontWeight: "400" as const, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: "600" as const, lineHeight: 16, letterSpacing: 0.6 },
} as const;
