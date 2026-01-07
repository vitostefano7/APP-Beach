import { useState, useCallback, useContext } from 'react';
import API_URL from '../../../../config/api';
import { AuthContext } from '../../../../context/AuthContext';

export interface Notification {
  _id: string;
  recipient: string;
  sender?: {
    _id: string;
    name: string;
    username: string;
    avatarUrl?: string;
  };
  type: 'new_follower' | 'follow_back' | 'match_invite' | 'match_start' | 'match_result';
  title: string;
  message: string;
  relatedId?: string;
  relatedModel?: 'Match' | 'Friendship' | 'Booking' | 'User';
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  hasMore: boolean;
}

export const useNotifications = () => {
  const { token } = useContext(AuthContext);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carica le notifiche
  const fetchNotifications = useCallback(async (isRead?: boolean) => {
    try {
      setLoading(true);
      setError(null);

      let url = `${API_URL}/notifications/me?limit=50`;
      if (isRead !== undefined) {
        url += `&isRead=${isRead}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Errore nel caricamento delle notifiche');
      }

      const data: NotificationsResponse = await response.json();
      setNotifications(data.notifications);
      
      return data.notifications;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore sconosciuto';
      setError(message);
      console.error('fetchNotifications error:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Carica il conteggio delle notifiche non lette
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/notifications/unread-count`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Errore nel caricamento del conteggio');
      }

      const data = await response.json();
      setUnreadCount(data.count);
      
      return data.count;
    } catch (err) {
      console.error('fetchUnreadCount error:', err);
      return 0;
    }
  }, [token]);

  // Marca una notifica come letta
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Errore nel marcare la notifica come letta');
      }

      // Aggiorna lo stato locale
      setNotifications(prev =>
        prev.map(n =>
          n._id === notificationId
            ? { ...n, isRead: true, readAt: new Date().toISOString() }
            : n
        )
      );

      // Decrementa il conteggio non lette
      setUnreadCount(prev => Math.max(0, prev - 1));

      return true;
    } catch (err) {
      console.error('markAsRead error:', err);
      return false;
    }
  }, [token]);

  // Marca tutte le notifiche come lette
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Errore nel marcare tutte le notifiche come lette');
      }

      // Aggiorna lo stato locale
      setNotifications(prev =>
        prev.map(n => ({
          ...n,
          isRead: true,
          readAt: new Date().toISOString()
        }))
      );

      setUnreadCount(0);

      return true;
    } catch (err) {
      console.error('markAllAsRead error:', err);
      return false;
    }
  }, [token]);

  // Elimina una notifica
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`${API_URL}/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Errore nell\'eliminazione della notifica');
      }

      // Rimuovi dallo stato locale
      setNotifications(prev => {
        const notification = prev.find(n => n._id === notificationId);
        if (notification && !notification.isRead) {
          setUnreadCount(count => Math.max(0, count - 1));
        }
        return prev.filter(n => n._id !== notificationId);
      });

      return true;
    } catch (err) {
      console.error('deleteNotification error:', err);
      return false;
    }
  }, [token]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
};
