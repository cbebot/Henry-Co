import AsyncStorage from "@react-native-async-storage/async-storage";

import type { Division } from "@/types/division";

const STORAGE_KEY = "@henryco/hub/division_cache";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

type CacheEnvelope = {
  timestamp: number;
  divisions: Division[];
};

export async function cacheDivisions(divisions: Division[]): Promise<void> {
  const envelope: CacheEnvelope = {
    timestamp: Date.now(),
    divisions,
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
}

export async function getCachedDivisions(): Promise<Division[] | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const envelope = JSON.parse(raw) as CacheEnvelope;
    if (Date.now() - envelope.timestamp > MAX_AGE_MS) {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return envelope.divisions;
  } catch {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export async function clearCache(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
