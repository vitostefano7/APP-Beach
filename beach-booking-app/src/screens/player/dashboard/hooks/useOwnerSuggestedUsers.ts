// src/screens/player/dashboard/hooks/useOwnerSuggestedUsers.ts
import { useState, useContext, useCallback, useEffect } from 'react';
import { AuthContext } from '../../../../context/AuthContext';
import API_URL from '../../../../config/api';

interface OwnerSuggestedUser {
  user: {
    _id: string;
    name: string;
    username: string;
    avatarUrl?: string;
    preferredSports?: string[];
  };
  reason: {
    type: "most_games_played" | "follows_structure" | "vip_user";
    details: {
      matchCount?: number;
      strutturaName?: string;
      vipLevel?: string;
    };
  };
  score: number;
  friendshipStatus?: "none" | "pending" | "accepted";
}

interface UseOwnerSuggestedUsersProps {
  limit?: number;
  autoLoad?: boolean;
  strutturaId?: string;
}

export const useOwnerSuggestedUsers = ({
  limit = 10,
  autoLoad = true,
  strutturaId
}: UseOwnerSuggestedUsersProps = {}) => {
  const { token, user } = useContext(AuthContext);

  const [suggestions, setSuggestions] = useState<OwnerSuggestedUser[]>([]);
  const [loading, setLoading] = useState<boolean>(autoLoad);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    if (!token || user?.role !== 'owner') {
      setError("Token non disponibile o utente non owner");
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      console.log("Fetching owner user suggestions...");

      const queryParams = new URLSearchParams({ limit: limit.toString() });
      if (strutturaId) {
        queryParams.append('strutturaId', strutturaId);
      }

      const response = await fetch(`${API_URL}/owner/user-suggestions?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Errore ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const suggestions = data.suggestions || [];

      console.log("Owner suggestions ricevuti:", suggestions.length);

      setSuggestions(suggestions);
      return suggestions;
    } catch (err: any) {
      console.error('Errore nel recupero dei suggerimenti owner:', err);
      setError(err.message || 'Impossibile caricare i suggerimenti');
      setSuggestions([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [token, user?.role, limit, strutturaId]);

  const sendFriendRequest = useCallback(async (userId: string): Promise<boolean> => {
    if (!token) {
      console.error("Token non disponibile");
      return false;
    }

    try {
      const response = await fetch(`${API_URL}/friends/request`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ receiverId: userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Errore invio richiesta amicizia:', errorData);
        return false;
      }

      const data = await response.json();
      console.log('Richiesta amicizia inviata:', data);

      // Aggiorna lo stato del suggerimento
      setSuggestions(prev =>
        prev.map(suggestion =>
          suggestion.user._id === userId
            ? { ...suggestion, friendshipStatus: 'pending' as const }
            : suggestion
        )
      );

      return true;
    } catch (err: any) {
      console.error('Errore invio richiesta amicizia:', err);
      return false;
    }
  }, [token]);

  useEffect(() => {
    if (autoLoad && user?.role === 'owner') {
      console.log('🔄 useOwnerSuggestedUsers: Auto-loading suggestions...');
      fetchSuggestions();
    }
  }, [autoLoad, fetchSuggestions, user?.role]);

  return {
    suggestions,
    loading,
    error,
    refetch: fetchSuggestions,
    sendFriendRequest,
  };
};