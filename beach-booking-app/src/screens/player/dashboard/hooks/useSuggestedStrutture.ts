import { useState, useContext, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { AuthContext } from '../../../../context/AuthContext';
import API_URL from '../../../../config/api';

interface SuggestedStruttura {
  _id: string;
  name: string;
  description?: string;
  images: string[];
  location: {
    address: string;
    city: string;
  };
  isFollowing?: boolean;
  reason?: {
    type: string;
    details?: any;
  };
  score?: number;
}

interface UseSuggestedStruttureProps {
  limit?: number;
  autoLoad?: boolean;
}

export const useSuggestedStrutture = ({
  limit = 10,
  autoLoad = true
}: UseSuggestedStruttureProps = {}) => {
  const { token } = useContext(AuthContext);
  
  const [suggestions, setSuggestions] = useState<SuggestedStruttura[]>([]);
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

      console.log("Fetching struttura suggestions...");
      const response = await fetch(`${API_URL}/community/strutture/suggestions?limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Errore API suggerimenti strutture:", response.status, errorText);
        throw new Error(`Errore ${response.status}: ${response.statusText}`);     
      }

      const data = await response.json();
      console.log("Suggerimenti strutture ricevuti:", data.suggestions?.length || 0);
      
      setSuggestions(data.suggestions || []);
      return data.suggestions || [];
    } catch (err: any) {
      console.error('Errore nel recupero dei suggerimenti strutture:', err);
      setError(err.message || 'Impossibile caricare i suggerimenti');
      setSuggestions([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [token, limit]);

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
          prev.map(s => 
            s._id === strutturaId ? { ...s, isFollowing: true } : s
          )
        );
        return true;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Errore nel seguire la struttura');
      }
    } catch (err: any) {
      console.error('Errore nel seguire struttura:', err);
      Alert.alert("Errore", err.message || "Impossibile seguire la struttura");
      return false;
    }
  }, [token]);

  const unfollowStruttura = useCallback(async (strutturaId: string): Promise<boolean> => {
    if (!token) {
      Alert.alert("Errore", "Token non disponibile");
      return false;
    }

    try {
      const response = await fetch(`${API_URL}/community/strutture/${strutturaId}/follow`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSuggestions(prev => 
          prev.map(s => 
            s._id === strutturaId ? { ...s, isFollowing: false } : s
          )
        );
        return true;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Errore nello smettere di seguire la struttura');
      }
    } catch (err: any) {
      console.error('Errore nello smettere di seguire struttura:', err);
      Alert.alert("Errore", err.message || "Impossibile smettere di seguire la struttura");
      return false;
    }
  }, [token]);

  const refresh = useCallback(() => {
    return fetchSuggestions();
  }, [fetchSuggestions]);

  useEffect(() => {
    if (autoLoad) {
      console.log('🔄 useSuggestedStrutture: Auto-loading suggestions...');
      fetchSuggestions();
    }
  }, [autoLoad, fetchSuggestions]);

  return {
    suggestions,
    loading,
    error,
    refresh,
    followStruttura,
    unfollowStruttura,
    hasSuggestions: suggestions.length > 0,
  };
};