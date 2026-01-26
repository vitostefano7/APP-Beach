import { useState, useContext, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { AuthContext } from '../../../../context/AuthContext';
import API_URL from '../../../../config/api';

interface SuggestedItem {
  type: 'friend' | 'struttura';
  data: any; // Either SuggestedFriend or SuggestedStruttura
  score: number;
}

interface UseSuggestedItemsProps {
  friendsLimit?: number;
  struttureLimit?: number;
  autoLoad?: boolean;
}

export const useSuggestedItems = ({
  friendsLimit = 4,
  struttureLimit = 2,
  autoLoad = true
}: UseSuggestedItemsProps = {}) => {
  const { token } = useContext(AuthContext);

  const [suggestions, setSuggestions] = useState<SuggestedItem[]>([]);
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

      console.log("Fetching combined suggestions...");

      // Fetch friends and strutture in parallel
      const [friendsResponse, struttureResponse] = await Promise.all([
        fetch(`${API_URL}/friends/suggestions?limit=${friendsLimit}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${API_URL}/community/strutture/suggestions?limit=${struttureLimit}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      ]);

      if (!friendsResponse.ok) {
        console.error("Errore API suggerimenti amici:", friendsResponse.status);
      }

      if (!struttureResponse.ok) {
        console.error("Errore API suggerimenti strutture:", struttureResponse.status);
      }

      const [friendsData, struttureData] = await Promise.all([
        friendsResponse.ok ? friendsResponse.json() : { suggestions: [] },
        struttureResponse.ok ? struttureResponse.json() : { suggestions: [] }
      ]);

      const friends = (friendsData.suggestions || []).filter(
        (friend: any) => friend.friendshipStatus !== 'accepted'
      );

      const strutture = struttureData.suggestions || [];

      // Combine and sort by score descending
      const combined: SuggestedItem[] = [
        ...friends.map((friend: any) => ({
          type: 'friend' as const,
          data: friend,
          score: friend.score || 0
        })),
        ...strutture.map((struttura: any) => ({
          type: 'struttura' as const,
          data: struttura,
          score: struttura.score || 0
        }))
      ].sort((a, b) => b.score - a.score);

      console.log(`Combined suggestions: ${friends.length} friends + ${strutture.length} strutture = ${combined.length} total`);

      setSuggestions(combined);
      return combined;
    } catch (err: any) {
      console.error('Errore nel recupero dei suggerimenti combinati:', err);
      setError(err.message || 'Impossibile caricare i suggerimenti');
      setSuggestions([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [token, friendsLimit, struttureLimit]);

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
        body: JSON.stringify({ receiverId: userId }),
      });

      if (response.ok) {
        // Update local state
        setSuggestions(prev =>
          prev.map(item =>
            item.type === 'friend' && item.data.user?._id === userId
              ? { ...item, data: { ...item.data, friendshipStatus: 'pending' } }
              : item
          )
        );
        return true;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Errore nell\'invio richiesta amicizia');
      }
    } catch (err: any) {
      console.error('Errore invio richiesta amicizia:', err);
      Alert.alert("Errore", err.message || "Impossibile inviare richiesta amicizia");
      return false;
    }
  }, [token]);

  const followStruttura = useCallback(async (strutturaId: string): Promise<boolean> => {
    if (!token) {
      Alert.alert("Errore", "Token non disponibile");
      return false;
    }

    try {
      const response = await fetch(`${API_URL}/community/strutture/${strutturaId}/follow`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSuggestions(prev =>
          prev.map(item =>
            item.type === 'struttura' && item.data._id === strutturaId
              ? { ...item, data: { ...item.data, isFollowing: true } }
              : item
          )
        );
        return true;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Errore nel seguire la struttura');
      }
    } catch (err: any) {
      console.error('Errore seguire struttura:', err);
      Alert.alert("Errore", err.message || "Impossibile seguire la struttura");
      return false;
    }
  }, [token]);

  useEffect(() => {
    if (autoLoad) {
      fetchSuggestions();
    }
  }, [fetchSuggestions, autoLoad]);

  return {
    suggestions,
    loading,
    error,
    refetch: fetchSuggestions,
    sendFriendRequest,
    followStruttura
  };
};