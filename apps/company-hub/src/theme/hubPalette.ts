export type HubPalette = {
  bg: string;
  surface: string;
  surfaceElevated: string;
  line: string;
  muted: string;
  textPrimary: string;
  textBody: string;
  textSubtle: string;
  headerBg: string;
  searchBg: string;
  searchBorder: string;
  searchPlaceholder: string;
  tabBarBg: string;
  tabBarBorder: string;
  gold: string;
};

const gold = "#C9A227";

export const hubPaletteDark: HubPalette = {
  bg: "#0B0B0C",
  surface: "#141416",
  surfaceElevated: "#1E1E22",
  line: "#2A2A2E",
  muted: "#9A9AA3",
  textPrimary: "#F4F4F5",
  textBody: "#DCDCE2",
  textSubtle: "#6B6B73",
  headerBg: "#141416",
  searchBg: "#1E1E22",
  searchBorder: "#2A2A2E",
  searchPlaceholder: "#6B6B73",
  tabBarBg: "#141416",
  tabBarBorder: "#2A2A2E",
  gold,
};

export const hubPaletteLight: HubPalette = {
  bg: "#F2F2F4",
  surface: "#FFFFFF",
  surfaceElevated: "#FAFAFB",
  line: "#E4E4EA",
  muted: "#636366",
  textPrimary: "#0B0B0C",
  textBody: "#3A3A40",
  textSubtle: "#8E8E93",
  headerBg: "#FFFFFF",
  searchBg: "#FFFFFF",
  searchBorder: "#E4E4EA",
  searchPlaceholder: "#8E8E93",
  tabBarBg: "#FFFFFF",
  tabBarBorder: "#E4E4EA",
  gold,
};

export function getHubPalette(scheme: "light" | "dark"): HubPalette {
  return scheme === "light" ? hubPaletteLight : hubPaletteDark;
}
