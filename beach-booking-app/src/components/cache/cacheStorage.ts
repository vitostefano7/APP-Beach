import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CacheEntry<T> {
  ts: number;
  data: T;
}

export async function getCachedEntry<T>(
  key: string,
  ttlMs?: number
): Promise<CacheEntry<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (!parsed || typeof parsed.ts !== 'number' || typeof parsed.data === 'undefined') {
      return null;
    }

    if (typeof ttlMs === 'number' && Date.now() - parsed.ts >= ttlMs) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function getCachedData<T>(key: string, ttlMs?: number): Promise<T | null> {
  const entry = await getCachedEntry<T>(key, ttlMs);
  return entry ? entry.data : null;
}

export async function setCachedData<T>(key: string, data: T): Promise<void> {
  const entry: CacheEntry<T> = {
    ts: Date.now(),
    data,
  };
  await AsyncStorage.setItem(key, JSON.stringify(entry));
}

export async function removeCachedData(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

export async function removeCachedDataMany(keys: string[]): Promise<void> {
  if (!keys.length) return;
  await AsyncStorage.multiRemove(keys);
}

export async function removeCachedByPrefix(prefix: string): Promise<void> {
  const allKeys = await AsyncStorage.getAllKeys();
  const keysToRemove = allKeys.filter((key) => key.startsWith(prefix));
  if (!keysToRemove.length) return;
  await AsyncStorage.multiRemove(keysToRemove);
}
