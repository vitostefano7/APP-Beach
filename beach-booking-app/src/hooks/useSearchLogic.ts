import { useState, useRef, useEffect } from 'react';
import {
  performUserSearch,
  performStructureSearch,
  SearchResult,
  Struttura,
} from '../utils/searchHelpers';

interface UseSearchLogicConfig {
  token: string;
  role: 'player' | 'owner';
  currentUserId?: string;
  debounceMs?: number;
}

interface UseSearchLogicReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: SearchResult[];
  struttureResults: Struttura[];
  searchLoading: boolean;
  hasSearched: boolean;
  clearSearch: () => void;
}

export function useSearchLogic({
  token,
  role,
  currentUserId,
  debounceMs = 300,
}: UseSearchLogicConfig): UseSearchLogicReturn {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [struttureResults, setStruttureResults] = useState<Struttura[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Debounced search effect
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      setStruttureResults([]);
      setHasSearched(false);
      return;
    }

    // Only search if at least 2 characters
    if (searchQuery.trim().length < 2) {
      return;
    }

    debounceTimer.current = setTimeout(() => {
      performSearch(searchQuery.trim());
    }, debounceMs);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery, token, role]);

  const performSearch = async (query: string) => {
    if (!token || query.length < 2) return;

    try {
      setSearchLoading(true);
      setHasSearched(true);

      // Search users and structures in parallel
      const [users, strutture] = await Promise.all([
        performUserSearch(query, token),
        performStructureSearch(query, token, role),
      ]);

      // Filter out current user from results
      const filteredUsers = currentUserId
        ? users.filter((user) => user._id !== currentUserId)
        : users;

      setSearchResults(filteredUsers);
      setStruttureResults(strutture);
    } catch (error) {
      console.error('Errore ricerca:', error);
      setSearchResults([]);
      setStruttureResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setStruttureResults([]);
    setHasSearched(false);
  };

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    struttureResults,
    searchLoading,
    hasSearched,
    clearSearch,
  };
}
