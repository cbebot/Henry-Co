import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeMode = "system" | "light" | "dark";

const STORAGE_KEY = "@henryco/hub/theme_mode";
const VALID_MODES: ThemeMode[] = ["system", "light", "dark"];

export async function getThemeMode(): Promise<ThemeMode> {
  const value = await AsyncStorage.getItem(STORAGE_KEY);
  if (value && VALID_MODES.includes(value as ThemeMode)) {
    return value as ThemeMode;
  }
  return "system";
}

export async function setThemeMode(mode: ThemeMode): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, mode);
}
