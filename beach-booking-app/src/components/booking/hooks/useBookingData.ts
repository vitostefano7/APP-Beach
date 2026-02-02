import { useState, useEffect, useCallback, useContext } from 'react';
import { Alert } from 'react-native';
import { AuthContext } from '../../../context/AuthContext';
import API_URL from '../../../config/api';
import { BookingDetails, UserRole } from '../types/booking.types';
import { getUserId, isSameUser } from '../utils/bookingUtils';

interface UseBookingDataOptions {
  bookingId: string;
  role: UserRole;
  onNavigateBack?: () => void;
}

export const useBookingData = ({ bookingId, role, onNavigateBack }: UseBookingDataOptions) => {
  const { token, user, updateUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  // User info helpers
  const userId = getUserId(user);
  const isCreator = booking?.match?.createdBy ? isSameUser(user, booking.match.createdBy) : false;
  const currentUserPlayer = booking?.match?.players?.find(p => isSameUser(user, p.user));
  const isPendingInvite = currentUserPlayer?.status === "pending";
  const isDeclined = currentUserPlayer?.status === "declined";
  const isConfirmed = currentUserPlayer?.status === "confirmed";
  const isInMatch = !!currentUserPlayer;

  // Load booking data
  const loadBooking = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = role === 'owner' 
        ? `${API_URL}/bookings/owner/${bookingId}`
        : `${API_URL}/bookings/${bookingId}`;

      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      
      // Add matchId for compatibility
      if (data.match && !data.matchId) {
        data.matchId = data.match._id;
      }
      
      setBooking(data);
    } catch (error: any) {
      console.error('Errore nel caricamento:', error);
      setError(error.message);
      if (onNavigateBack) {
        Alert.alert('Errore', error.message || 'Impossibile caricare la prenotazione', [
          { text: 'OK', onPress: onNavigateBack }
        ]);
      }
    } finally {
      setLoading(false);
    }
  }, [bookingId, role, token, onNavigateBack]);

  // Helper function to update booking state safely
  const updateBookingState = useCallback((updater: (prevBooking: BookingDetails) => BookingDetails) => {
    setBooking((prevBooking) => {
      if (!prevBooking) return prevBooking;
      return updater(prevBooking);
    });
  }, []);

  // Initial load
  useEffect(() => {
    if (!bookingId || bookingId === 'undefined') {
      setError('ID prenotazione non valido');
      setLoading(false);
      if (onNavigateBack) {
        Alert.alert('Errore', 'ID prenotazione non valido', [
          { text: 'OK', onPress: onNavigateBack }
        ]);
      }
      return;
    }
    loadBooking();
  }, [bookingId, loadBooking]);

  // Fetch user ID if missing
  useEffect(() => {
    const fetchUserIdIfMissing = async () => {
      if (user && !userId && token) {
        try {
          const res = await fetch(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const updatedUser = await res.json();
            updateUser(updatedUser);
          }
        } catch (err) {
          console.error('Errore recupero ID utente:', err);
        }
      }
    };
    
    fetchUserIdIfMissing();
  }, [user, userId, token, updateUser]);

  return {
    // Data
    booking,
    loading,
    error,
    
    // User info
    user,
    userId,
    token,
    isCreator,
    currentUserPlayer,
    isPendingInvite,
    isDeclined,
    isConfirmed,
    isInMatch,
    
    // Functions
    loadBooking,
    updateBookingState,
  };
};
