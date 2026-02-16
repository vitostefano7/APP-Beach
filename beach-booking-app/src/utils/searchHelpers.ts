import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from '../config/api';

// AsyncStorage Keys
export const STORAGE_KEYS = {
  RECENT_USERS: '@recent_searches',
  RECENT_STRUTTURE: '@recent_strutture_searches',
};

// Types
export interface SearchResult {
  _id: string;
  name: string;
  surname?: string;
  username: string;
  avatarUrl?: string;
  preferredSports?: string[];
  friendshipStatus?: 'none' | 'pending' | 'accepted';
  commonMatchesCount?: number;
  mutualFriendsCount?: number;
}

export interface Struttura {
  _id: string;
  name: string;
  description?: string;
  images: string[];
  location: {
    address: string;
    city: string;
  };
  isFollowing?: boolean;
}

// API Endpoints based on role
export function getFollowStrutturaEndpoint(role: 'player' | 'owner', strutturaId: string) {
  if (role === 'owner') {
    return `${API_URL}/strutture/${strutturaId}/follow`;
  }
  return `${API_URL}/community/strutture/${strutturaId}/follow`;
}

export function getFollowStatusEndpoint(role: 'player' | 'owner', strutturaId: string) {
  if (role === 'owner') {
    return `${API_URL}/strutture/${strutturaId}/follow-status`;
  }
  return `${API_URL}/community/strutture/${strutturaId}/follow-status`;
}

// Search Functions
export async function performUserSearch(
  query: string,
  token: string
): Promise<SearchResult[]> {
  try {
    const response = await fetch(
      `${API_URL}/users/search?q=${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.users || data || [];
    }
    return [];
  } catch (error) {
    console.error('Errore ricerca utenti:', error);
    return [];
  }
}

export async function performStructureSearch(
  query: string,
  token: string,
  role: 'player' | 'owner'
): Promise<Struttura[]> {
  try {
    const response = await fetch(
      `${API_URL}/community/strutture/search?q=${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      const strutture = data.strutture || [];

      // For each struttura, check follow status
      const struttureWithStatus = await Promise.all(
        strutture.map(async (struttura: Struttura) => {
          try {
            const statusResponse = await fetch(
              getFollowStatusEndpoint(role, struttura._id),
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              return {
                ...struttura,
                isFollowing: statusData.isFollowing || false,
              };
            }
          } catch (err) {
            console.error('Error fetching follow status:', err);
          }
          return struttura;
        })
      );

      return struttureWithStatus;
    }
    return [];
  } catch (error) {
    console.error('Errore ricerca strutture:', error);
    return [];
  }
}

// Recent Searches - Users
export async function loadRecentUserSearches(): Promise<SearchResult[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_USERS);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error('Errore caricamento ricerche utenti recenti:', error);
    return [];
  }
}

export async function saveRecentUserSearch(user: SearchResult): Promise<void> {
  try {
    const recent = await loadRecentUserSearches();
    // Remove if already present
    const filtered = recent.filter((u) => u._id !== user._id);
    // Add to beginning
    const updated = [user, ...filtered].slice(0, 10); // Keep only last 10
    await AsyncStorage.setItem(STORAGE_KEYS.RECENT_USERS, JSON.stringify(updated));
  } catch (error) {
    console.error('Errore salvataggio ricerca utente:', error);
  }
}

export async function clearRecentUserSearches(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.RECENT_USERS);
  } catch (error) {
    console.error('Errore cancellazione ricerche utenti:', error);
  }
}

export async function refreshRecentUserSearches(
  token: string
): Promise<SearchResult[]> {
  try {
    const recent = await loadRecentUserSearches();
    if (recent.length === 0) return [];

    const updated = await Promise.all(
      recent.map(async (user) => {
        try {
          const response = await fetch(
            `${API_URL}/users/${user._id}/friendship-status`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (response.ok) {
            const data = await response.json();
            return {
              ...user,
              friendshipStatus: data.friendshipStatus,
              commonMatchesCount: data.commonMatchesCount,
              mutualFriendsCount: data.mutualFriendsCount,
            };
          }
        } catch (error) {
          console.error(`Errore refresh dati per ${user._id}:`, error);
        }
        return user;
      })
    );

    await AsyncStorage.setItem(STORAGE_KEYS.RECENT_USERS, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Errore refresh ricerche utenti recenti:', error);
    return [];
  }
}

// Recent Searches - Strutture
export async function loadRecentStruttureSearches(): Promise<Struttura[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_STRUTTURE);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error('Errore caricamento ricerche strutture recenti:', error);
    return [];
  }
}

export async function saveRecentStrutturaSearch(struttura: Struttura): Promise<void> {
  try {
    const recent = await loadRecentStruttureSearches();
    // Remove if already present
    const filtered = recent.filter((s) => s._id !== struttura._id);
    // Add to beginning
    const updated = [struttura, ...filtered].slice(0, 10); // Keep only last 10
    await AsyncStorage.setItem(STORAGE_KEYS.RECENT_STRUTTURE, JSON.stringify(updated));
  } catch (error) {
    console.error('Errore salvataggio ricerca struttura:', error);
  }
}

export async function clearRecentStruttureSearches(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.RECENT_STRUTTURE);
  } catch (error) {
    console.error('Errore cancellazione ricerche strutture:', error);
  }
}

export async function refreshRecentStruttureSearches(
  token: string,
  role: 'player' | 'owner'
): Promise<Struttura[]> {
  try {
    const recent = await loadRecentStruttureSearches();
    if (recent.length === 0) return [];

    const updated = await Promise.all(
      recent.map(async (struttura) => {
        try {
          const statusResponse = await fetch(
            getFollowStatusEndpoint(role, struttura._id),
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            return {
              ...struttura,
              isFollowing: statusData.isFollowing || false,
            };
          }
        } catch (error) {
          console.error('Error fetching struttura follow status:', error);
        }
        return struttura;
      })
    );

    await AsyncStorage.setItem(STORAGE_KEYS.RECENT_STRUTTURE, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Errore refresh ricerche strutture recenti:', error);
    return [];
  }
}
