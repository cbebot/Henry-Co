import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@henryco/hub/onboarding_complete";

export async function hasCompletedOnboarding(): Promise<boolean> {
  const value = await AsyncStorage.getItem(STORAGE_KEY);
  return value === "true";
}

export async function setOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, "true");
}

export async function resetOnboarding(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
