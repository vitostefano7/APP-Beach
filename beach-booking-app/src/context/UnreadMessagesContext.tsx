import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AuthContext } from "./AuthContext";
import API_URL from "../config/api";

type UnreadMessagesContextType = {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  loading: boolean;
};

export const UnreadMessagesContext = createContext<UnreadMessagesContextType>({
  unreadCount: 0,
  refreshUnreadCount: async () => {},
  loading: false,
});

export const UnreadMessagesProvider = ({ children }: { children: React.ReactNode }) => {
  const { token, user } = useContext(AuthContext);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refreshUnreadCount = useCallback(async () => {
    console.log('🔄 [UnreadContext] refreshUnreadCount CALLED');
    console.log('🔄 [UnreadContext] Token exists:', !!token);
    console.log('🔄 [UnreadContext] User:', user?.name || 'NULL');
    
    if (!token || !user) {
      console.log('❌ [UnreadContext] No token or user, setting count to 0');
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      const url = `${API_URL}/api/conversations/unread-count`;
      console.log('📡 [UnreadContext] Fetching from:', url);
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('📡 [UnreadContext] Response status:', res.status);

      if (res.ok) {
        const data = await res.json();
        console.log('✅ [UnreadContext] Data received:', data);
        console.log('🔔 [UnreadContext] Setting unreadCount to:', data.unreadCount);
        setUnreadCount(data.unreadCount || 0);
      } else {
        console.error('❌ [UnreadContext] Response NOT OK:', res.status);
        const errorText = await res.text();
        console.error('❌ [UnreadContext] Error text:', errorText);
      }
    } catch (error) {
      console.error('❌ [UnreadContext] Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  // Carica al mount e quando cambiano token/user
  useEffect(() => {
    console.log('🎬 [UnreadContext] useEffect triggered');
    console.log('🎬 [UnreadContext] Token changed:', !!token);
    console.log('🎬 [UnreadContext] User changed:', user?.name || 'NULL');
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  // Polling ogni 30 secondi
  useEffect(() => {
    if (!token || !user) {
      console.log('⏸️ [UnreadContext] Polling disabled (no token/user)');
      return;
    }

    console.log('⏰ [UnreadContext] Polling started (30s interval)');
    const interval = setInterval(() => {
      console.log('⏰ [UnreadContext] Polling tick');
      refreshUnreadCount();
    }, 30000);

    return () => {
      console.log('🛑 [UnreadContext] Polling stopped');
      clearInterval(interval);
    };
  }, [token, user, refreshUnreadCount]);

  return (
    <UnreadMessagesContext.Provider value={{ unreadCount, refreshUnreadCount, loading }}>
      {children}
    </UnreadMessagesContext.Provider>
  );
};

// Hook personalizzato
export const useUnreadMessages = () => {
  const context = useContext(UnreadMessagesContext);
  if (!context) {
    throw new Error("useUnreadMessages deve essere usato dentro UnreadMessagesProvider");
  }
  return context;
};