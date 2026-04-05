import { MD3DarkTheme, type MD3Theme } from "react-native-paper";

const gold = "#C9A227";

export const hubPaperTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: gold,
    onPrimary: "#0B0B0C",
    primaryContainer: "#3D3318",
    onPrimaryContainer: "#F5E6B8",
    secondary: gold,
    onSecondary: "#0B0B0C",
    secondaryContainer: "#2A2410",
    onSecondaryContainer: "#E8D48A",
    tertiary: "#D4BC5C",
    surface: "#141416",
    surfaceVariant: "#1E1E22",
    onSurface: "#F4F4F5",
    onSurfaceVariant: "#B8B8C0",
    background: "#0B0B0C",
    elevation: {
      ...MD3DarkTheme.colors.elevation,
      level0: "transparent",
      level1: "#161618",
      level2: "#1A1A1D",
      level3: "#1E1E22",
      level4: "#222226",
      level5: "#26262A",
    },
    outline: "#3A3A40",
    outlineVariant: "#2A2A2E",
  },
};
