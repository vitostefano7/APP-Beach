import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import API_URL from '../../../config/api';
import { BookingDetails, Player } from '../types/booking.types';
import { submitMatchScore } from '../utils/bookingUtils';

interface UseMatchActionsOptions {
  booking: BookingDetails | null;
  token: string;
  userId: string;
  updateBookingState: (updater: (prevBooking: BookingDetails) => BookingDetails) => void;
  loadBooking: () => void;
}

export const useMatchActions = ({
  booking,
  token,
  userId,
  updateBookingState,
  loadBooking,
}: UseMatchActionsOptions) => {
  const [acceptingInvite, setAcceptingInvite] = useState(false);
  const [leavingMatch, setLeavingMatch] = useState(false);

  // Join match
  const handleJoinMatch = useCallback(async (team?: "A" | "B") => {
    if (!booking?.matchId) return;

    try {
      const res = await fetch(`${API_URL}/matches/${booking.matchId}/join`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(team ? { team } : {}),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Errore durante l'unione al match");
      }

      loadBooking();
      Alert.alert("✅ Match unito!", "Ti sei unito al match con successo");
    } catch (error: any) {
      Alert.alert("Errore", error.message);
    }
  }, [booking, token, loadBooking]);

  // Leave match
  const handleLeaveMatch = useCallback(async () => {
    if (!booking?.matchId) return;

    try {
      setLeavingMatch(true);
      const res = await fetch(`${API_URL}/matches/${booking.matchId}/leave`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Errore durante l'abbandono del match");
      }

      loadBooking();
      Alert.alert("Match abbandonato", "Hai lasciato il match con successo");
    } catch (error: any) {
      Alert.alert("Errore", error.message);
    } finally {
      setLeavingMatch(false);
    }
  }, [booking, token, loadBooking]);

  // Respond to invite
  const handleRespondToInvite = useCallback(async (response: "accept" | "decline", team?: "A" | "B") => {
    if (!booking?.matchId) return;

    try {
      setAcceptingInvite(true);
      const body: any = { action: response };
      if (team) body.team = team;
      
      const res = await fetch(`${API_URL}/matches/${booking.matchId}/respond`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Errore durante la risposta all'invito");
      }

      loadBooking();
      
      if (response === "accept") {
        Alert.alert("✅ Invito accettato!", "Ti sei unito al match con successo");
      } else {
        Alert.alert("Invito rifiutato", "Hai rifiutato l'invito al match");
      }
    } catch (error: any) {
      Alert.alert("Errore", error.message);
    } finally {
      setAcceptingInvite(false);
    }
  }, [booking, token, loadBooking]);

  // Invite player
  const handleInvitePlayer = useCallback(async (username: string, team?: "A" | "B") => {
    if (!booking?.matchId) return;

    try {
      const body: any = { 
        username,
        ...(team && { team })
      };
      
      const res = await fetch(`${API_URL}/matches/${booking.matchId}/invite`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Errore invito");
      }

      loadBooking();
      Alert.alert("✅ Invito inviato!", "L'utente è stato invitato al match");
    } catch (error: any) {
      Alert.alert("Errore", error.message);
    }
  }, [booking, token, loadBooking]);

  // Remove player
  const handleRemovePlayer = useCallback(async (playerId: string) => {
    if (!booking?.matchId) return;

    Alert.alert(
      "Rimuovi giocatore",
      "Sei sicuro di voler rimuovere questo giocatore dal match?",
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Rimuovi",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetch(`${API_URL}/matches/${booking.matchId}/players/${playerId}`, {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Errore rimozione");
              }

              loadBooking();
              Alert.alert("Successo", "Giocatore rimosso dal match");
            } catch (error: any) {
              Alert.alert("Errore", error.message);
            }
          },
        },
      ]
    );
  }, [booking, token, loadBooking]);

  // Assign team
  const handleAssignTeam = useCallback(async (playerId: string, team: "A" | "B" | null) => {
    if (!booking?.matchId) return;

    try {
      const res = await fetch(`${API_URL}/matches/${booking.matchId}/players/${playerId}/team`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ team }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Errore assegnazione team");
      }

      loadBooking();
    } catch (error: any) {
      Alert.alert("Errore", error.message || "Impossibile assegnare il giocatore");
    }
  }, [booking, token, loadBooking]);

  // Submit score
  const handleSubmitScore = useCallback(async (winner: 'A' | 'B', sets: { teamA: number; teamB: number }[]) => {
    if (!booking?.matchId) return;

    try {
      await submitMatchScore(booking.matchId, winner, sets, token);
      Alert.alert('✅ Risultato salvato!', 'Il risultato del match è stato registrato con successo');
      loadBooking();
    } catch (error: any) {
      Alert.alert('Errore', error.message || 'Impossibile salvare il risultato');
      throw error;
    }
  }, [booking, token, loadBooking]);

  // Cancel booking (owner only)
  const handleCancelBooking = useCallback(async () => {
    if (!booking?._id) return;

    Alert.alert(
      "Annulla prenotazione",
      "Sei sicuro di voler annullare questa prenotazione? Il cliente verrà notificato.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Sì, annulla",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetch(`${API_URL}/bookings/owner/${booking._id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });

              if (!res.ok) throw new Error();

              Alert.alert("Successo", "Prenotazione cancellata");
              // Navigate back handled by caller
            } catch {
              Alert.alert("Errore", "Impossibile cancellare la prenotazione");
            }
          },
        },
      ]
    );
  }, [booking, token]);

  return {
    // State
    acceptingInvite,
    leavingMatch,
    
    // Actions
    handleJoinMatch,
    handleLeaveMatch,
    handleRespondToInvite,
    handleInvitePlayer,
    handleRemovePlayer,
    handleAssignTeam,
    handleSubmitScore,
    handleCancelBooking,
  };
};
