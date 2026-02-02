import React, { useState, useContext } from 'react';
import { View, Text, Alert, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import API_URL from '../../config/api';
import { AnimatedCard, AnimatedButton } from '../../screens/player/prenotazioni/DettaglioPrenotazione/components/AnimatedComponents';
import styles from '../../screens/player/prenotazioni/DettaglioPrenotazione/styles/DettaglioPrenotazione.styles';
import { useMatchLogic } from '../../hooks/booking/useMatchLogic';

interface PlayerRoleSectionProps {
  booking: any;
  onBookingUpdate?: (updatedBooking: any) => void;
}

const PlayerRoleSection: React.FC<PlayerRoleSectionProps> = ({
  booking,
  onBookingUpdate,
}) => {
  const { token, user } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);

  const {
    isMatchInProgress,
    isMatchPassed,
    isRegistrationOpen,
  } = useMatchLogic(booking);

  // Check if user is already in the match
  const currentPlayerInMatch = booking?.match?.players?.find((p: any) => p.user._id === user?._id);
  const isUserInMatch = !!currentPlayerInMatch;
  const userTeam = currentPlayerInMatch?.team;
  const userStatus = currentPlayerInMatch?.status;

  // Check if user has pending invitation
  const hasPendingInvitation = currentPlayerInMatch?.status === 'pending';

  const joinMatch = async (team: "A" | "B") => {
    if (!booking?.match?._id) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/matches/${booking.match._id}/join`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ team }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Errore nell'unirsi al match");
      }

      const updatedBooking = await res.json();
      onBookingUpdate?.(updatedBooking);
      Alert.alert("✅ Successo!", `Ti sei unito al Team ${team}`);
    } catch (error: any) {
      Alert.alert("Errore", error.message);
    } finally {
      setLoading(false);
    }
  };

  const leaveMatch = async () => {
    if (!booking?.match?._id) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/matches/${booking.match._id}/leave`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Errore nell'abbandonare il match");
      }

      const updatedBooking = await res.json();
      onBookingUpdate?.(updatedBooking);
      Alert.alert("✅ Successo!", "Hai abbandonato il match");
    } catch (error: any) {
      Alert.alert("Errore", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveMatch = () => {
    Alert.alert(
      "Abbandona Match",
      "Sei sicuro di voler abbandonare questo match?",
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Abbandona",
          style: "destructive",
          onPress: leaveMatch,
        },
      ]
    );
  };

  const cancelBooking = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/bookings/${booking._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error();

      Alert.alert("Successo", "Prenotazione cancellata", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert("Errore", "Impossibile cancellare la prenotazione");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = () => {
    Alert.alert(
      "Annulla Prenotazione",
      "Sei sicuro di voler annullare questa prenotazione?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Sì, annulla",
          style: "destructive",
          onPress: cancelBooking,
        },
      ]
    );
  };

  const acceptInvitation = async () => {
    if (!booking?.match?._id) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/matches/${booking.match._id}/accept-invitation`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Errore nell'accettare l'invito");
      }

      const updatedBooking = await res.json();
      onBookingUpdate?.(updatedBooking);
      Alert.alert("✅ Invito accettato!", "Ora fai parte del match");
    } catch (error: any) {
      Alert.alert("Errore", error.message);
    } finally {
      setLoading(false);
    }
  };

  const declineInvitation = async () => {
    if (!booking?.match?._id) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/matches/${booking.match._id}/decline-invitation`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Errore nel rifiutare l'invito");
      }

      const updatedBooking = await res.json();
      onBookingUpdate?.(updatedBooking);
      Alert.alert("Invito rifiutato", "Hai rifiutato l'invito al match");
    } catch (error: any) {
      Alert.alert("Errore", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Check if booking can be cancelled (future booking)
  const startDateTime = new Date(`${booking.date}T${booking.startTime}:00`);
  const now = new Date();
  const isFuture = now < startDateTime;
  const canCancelBooking = !booking?.status === 'cancelled' && isFuture;

  return (
    <>
      {/* Pending Invitation Section */}
      {hasPendingInvitation && (
        <AnimatedCard delay={150}>
          <View style={styles.cardHeader}>
            <Ionicons name="mail-outline" size={18} color="#2196F3" />
            <Text style={[styles.cardTitle, { fontSize: 16 }]}>Invito in Attesa</Text>
          </View>

          <View style={styles.invitationContainer}>
            <Text style={styles.invitationText}>
              Sei stato invitato a partecipare al match del Team {userTeam}
            </Text>

            <View style={styles.invitationActions}>
              <AnimatedButton
                style={[styles.invitationButton, styles.invitationAccept]}
                onPress={acceptInvitation}
                disabled={loading}
              >
                <Ionicons name="checkmark" size={16} color="white" />
                <Text style={styles.invitationButtonText}>Accetta</Text>
              </AnimatedButton>

              <AnimatedButton
                style={[styles.invitationButton, styles.invitationDecline]}
                onPress={declineInvitation}
                disabled={loading}
              >
                <Ionicons name="close" size={16} color="white" />
                <Text style={styles.invitationButtonText}>Rifiuta</Text>
              </AnimatedButton>
            </View>
          </View>
        </AnimatedCard>
      )}

      {/* Match Actions Section */}
      {booking?.match && !hasPendingInvitation && (
        <AnimatedCard delay={200}>
          <View style={styles.cardHeader}>
            <Ionicons name="football" size={18} color="#2196F3" />
            <Text style={[styles.cardTitle, { fontSize: 16 }]}>Partecipazione Match</Text>
          </View>

          {isUserInMatch ? (
            <View style={styles.matchParticipationContainer}>
              <View style={styles.participationStatus}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.participationText}>
                  Partecipi al Team {userTeam}
                </Text>
              </View>

              {!isMatchInProgress && isRegistrationOpen() && (
                <AnimatedButton
                  style={styles.leaveMatchButton}
                  onPress={handleLeaveMatch}
                  disabled={loading}
                >
                  <Ionicons name="exit" size={16} color="white" />
                  <Text style={styles.leaveMatchButtonText}>Abbandona Match</Text>
                </AnimatedButton>
              )}
            </View>
          ) : (
            !isMatchInProgress && isRegistrationOpen() && (
              <View style={styles.joinMatchContainer}>
                <Text style={styles.joinMatchTitle}>Unisciti al match!</Text>
                <Text style={styles.joinMatchSubtitle}>
                  Scegli il team con cui giocare
                </Text>

                <View style={styles.teamSelection}>
                  <AnimatedButton
                    style={[styles.teamButton, styles.teamAButton]}
                    onPress={() => joinMatch("A")}
                    disabled={loading}
                  >
                    <Ionicons name="people" size={20} color="white" />
                    <Text style={styles.teamButtonText}>Team A</Text>
                  </AnimatedButton>

                  <AnimatedButton
                    style={[styles.teamButton, styles.teamBButton]}
                    onPress={() => joinMatch("B")}
                    disabled={loading}
                  >
                    <Ionicons name="people" size={20} color="white" />
                    <Text style={styles.teamButtonText}>Team B</Text>
                  </AnimatedButton>
                </View>
              </View>
            )
          )}

          {isMatchInProgress && (
            <View style={styles.matchInProgress}>
              <Ionicons name="play-circle" size={20} color="#FF9800" />
              <Text style={styles.matchInProgressText}>
                Match in corso - Non puoi modificare la partecipazione
              </Text>
            </View>
          )}

          {!isRegistrationOpen() && !isUserInMatch && (
            <View style={styles.registrationClosed}>
              <Ionicons name="time" size={20} color="#F44336" />
              <Text style={styles.registrationClosedText}>
                Registrazione chiusa - Non puoi più unirti al match
              </Text>
            </View>
          )}
        </AnimatedCard>
      )}

      {/* Cancel Booking Section */}
      {canCancelBooking && (
        <AnimatedCard delay={250}>
          <View style={styles.cancelCard}>
            <Ionicons name="close-circle-outline" size={24} color="#F44336" />
            <Text style={styles.cancelTitle}>Annulla Prenotazione</Text>
            <Text style={styles.cancelSubtitle}>
              Puoi annullare la prenotazione fino a 24 ore prima dell'inizio.
            </Text>
            <AnimatedButton
              style={styles.cancelButton}
              onPress={handleCancelBooking}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Annulla Prenotazione</Text>
            </AnimatedButton>
          </View>
        </AnimatedCard>
      )}
    </>
  );
};

export default PlayerRoleSection;