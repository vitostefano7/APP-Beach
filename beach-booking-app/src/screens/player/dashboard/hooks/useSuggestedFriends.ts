// src/hooks/useSuggestedFriends.ts
import { useState, useContext, useCallback } from 'react';
import { Alert } from 'react-native';
import { AuthContext } from '../../../../context/AuthContext';
import API_URL from '../../../../config/api';

interface SuggestedFriend {
  user: {
    _id: string;
    name: string;
    username: string;
    avatarUrl?: string;
    preferredSports?: string[];
  };
  reason: {
    type: "match_together" | "mutual_friends" | "same_venue";
    details: {
      matchCount?: number;
      mutualFriendsCount?: number;
      venueName?: string;
      lastPlayed?: Date;
    };
  };
  score: number;
  friendshipStatus?: "none" | "pending" | "accepted";
}

interface UseSuggestedFriendsProps {
  limit?: number;
  autoLoad?: boolean;
}

export const useSuggestedFriends = ({
  limit = 6,
  autoLoad = true
}: UseSuggestedFriendsProps = {}) => {
  const { token } = useContext(AuthContext);
  
  const [suggestions, setSuggestions] = useState<SuggestedFriend[]>([]);
  const [loading, setLoading] = useState<boolean>(autoLoad);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    if (!token) {
      setError("Token non disponibile");
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      console.log("Fetching friend suggestions...");
      const response = await fetch(`${API_URL}/friends/suggestions?limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Errore API suggerimenti:", response.status, errorText);
        throw new Error(`Errore ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Suggerimenti ricevuti:", data.suggestions?.length || 0);
      setSuggestions(data.suggestions || []);
      
      return data.suggestions || [];
    } catch (err: any) {
      console.error('Errore nel recupero dei suggerimenti:', err);
      setError(err.message || 'Impossibile caricare i suggerimenti');
      setSuggestions([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [token, limit]);

  const sendFriendRequest = useCallback(async (userId: string): Promise<boolean> => {
    if (!token) {
      Alert.alert("Errore", "Token non disponibile");
      return false;
    }

    try {
      const response = await fetch(`${API_URL}/friends/request`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipientId: userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nell\'invio della richiesta');
      }

      // Aggiorna lo stato nel local state
      setSuggestions(prev => 
        prev.map(friend => 
          friend.user._id === userId 
            ? { ...friend, friendshipStatus: 'pending' as const }
            : friend
        )
      );

      return true;
    } catch (err: any) {
      console.error('Errore nell\'invio della richiesta di amicizia:', err);
      Alert.alert("Errore", err.message || "Impossibile inviare la richiesta");
      return false;
    }
  }, [token]);

  const refresh = useCallback(() => {
    return fetchSuggestions();
  }, [fetchSuggestions]);

  return {
    suggestions,
    loading,
    error,
    refresh,
    sendFriendRequest,
    hasSuggestions: suggestions.length > 0,
  };
};