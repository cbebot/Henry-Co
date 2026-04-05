import AsyncStorage from "@react-native-async-storage/async-storage";

import type { DivisionBookmark } from "@/types/division";

const STORAGE_KEY = "@henryco/hub/bookmarks";

async function readBookmarks(): Promise<DivisionBookmark[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as DivisionBookmark[];
  } catch {
    return [];
  }
}

async function writeBookmarks(bookmarks: DivisionBookmark[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
}

export async function getBookmarks(): Promise<DivisionBookmark[]> {
  return readBookmarks();
}

export async function toggleBookmark(divisionId: string): Promise<boolean> {
  const bookmarks = await readBookmarks();
  const index = bookmarks.findIndex((b) => b.divisionId === divisionId);

  if (index >= 0) {
    bookmarks.splice(index, 1);
    await writeBookmarks(bookmarks);
    return false;
  }

  bookmarks.push({ divisionId, savedAt: Date.now() });
  await writeBookmarks(bookmarks);
  return true;
}

export async function isBookmarked(divisionId: string): Promise<boolean> {
  const bookmarks = await readBookmarks();
  return bookmarks.some((b) => b.divisionId === divisionId);
}

export async function clearBookmarks(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
