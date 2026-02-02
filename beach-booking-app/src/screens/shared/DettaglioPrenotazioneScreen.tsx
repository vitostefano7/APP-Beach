/**
 * DettaglioPrenotazioneSharedScreen
 * 
 * Schermata condivisa per la visualizzazione dei dettagli di una prenotazione.
 * Viene utilizzata sia dai player che dagli owner, con comportamenti differenziati
 * tramite la prop `role`.
 * 
 * Caratteristiche:
 * - Componenti modulari riutilizzabili
 * - Hook custom per logica condivisa
 * - Render condizionato in base al ruolo (player/owner)
 * - Gestione state centralizzata
 * 
 * @param {UserRole} role - 'player' o 'owner'
 * @param {string} bookingId - ID della prenotazione da visualizzare
 * @param {function} onNavigateBack - Callback per tornare indietro
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  Text,
  Pressable,
  Linking,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Shared components
import {
  BookingHeader,
  FieldInfoCard,
  BookingDetailsCard,
  AnimatedCard,
  AnimatedButton,
  useBookingData,
  useMatchActions,
  calculateDuration,
  isMatchInProgress,
  isMatchPassed,
  isRegistrationOpen,
  getMatchStatus,
  getTimeUntilRegistrationDeadline,
  UserRole,
} from '../../components/booking';

// Navigation types
import { useNavigation } from '@react-navigation/native';

interface DettaglioPrenotazioneSharedScreenProps {
  role: UserRole;
  bookingId: string;
  onNavigateBack?: () => void;
}

export const DettaglioPrenotazioneSharedScreen: React.FC<DettaglioPrenotazioneSharedScreenProps> = ({
  role,
  bookingId,
  onNavigateBack,
}) => {
  const navigation = useNavigation<any>();

  // Hook per gestire i dati del booking
  const {
    booking,
    loading,
    error,
    user,
    userId,
    token,
    isCreator,
    currentUserPlayer,
    isPendingInvite,
    isInMatch,
    loadBooking,
    updateBookingState,
  } = useBookingData({
    bookingId,
    role,
    onNavigateBack: onNavigateBack || (() => navigation.goBack()),
  });

  // Hook per gestire le azioni sul match
  const {
    acceptingInvite,
    leavingMatch,
    handleJoinMatch,
    handleLeaveMatch,
    handleRespondToInvite,
    handleInvitePlayer,
    handleRemovePlayer,
    handleAssignTeam,
    handleSubmitScore,
    handleCancelBooking,
  } = useMatchActions({
    booking,
    token,
    userId,
    updateBookingState,
    loadBooking,
  });

  // Computed values
  const confirmedPlayers = useMemo(
    () => booking?.match?.players?.filter(p => p.status === "confirmed") || [],
    [booking]
  );

  const canJoin = useMemo(() => {
    if (!booking?.match) return false;
    return !isInMatch && booking.match.status === "open" && isRegistrationOpen(booking);
  }, [booking, isInMatch]);

  // Handlers
  const handleOpenMaps = () => {
    if (!booking?.campo?.struttura?.location) return;

    const { address, city } = booking.campo.struttura.location;
    const query = address ? `${address}, ${city}` : city;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    
    Linking.openURL(url).catch(err => {
      console.error("Errore apertura mappa:", err);
    });
  };

  const handleOpenStrutturaDetails = () => {
    if (!booking?.campo?.struttura?._id) return;
    navigation.navigate("DettaglioStruttura", { struttura: booking.campo.struttura });
  };

  const handleOpenStrutturaChat = async () => {
    if (!booking?.campo?.struttura?._id || !token) return;
    
    // Import dinamico per evitare dipendenze circolari
    const { openStrutturaChat } = await import('../player/struttura/FieldDetailsScreen/api/fieldDetails.api');
    
    try {
      const conversation = await openStrutturaChat(booking.campo.struttura._id, token);
      navigation.navigate("Chat", {
        conversationId: conversation._id,
        strutturaName: booking.campo.struttura.name,
        struttura: booking.campo.struttura,
      });
    } catch (error: any) {
      console.error("Errore apertura chat:", error);
    }
  };

  // Get header title based on state and role
  const getHeaderTitle = () => {
    if (!booking) return 'Prenotazione';
    
    if (booking.status === 'cancelled') return 'Cancellata';
    
    if (isMatchInProgress(booking)) return 'Partita in Corso';
    if (isMatchPassed(booking)) return 'Partita Conclusa';
    
    return 'Prossima Partita';
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Caricamento...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !booking) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#F44336" />
          <Text style={styles.errorText}>
            {error || 'Impossibile caricare la prenotazione'}
          </Text>
          <AnimatedButton
            style={styles.retryButton}
            onPress={onNavigateBack || (() => navigation.goBack())}
          >
            <Text style={styles.retryButtonText}>Torna indietro</Text>
          </AnimatedButton>
        </View>
      </SafeAreaView>
    );
  }

  // Main render
  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <BookingHeader
        onBack={onNavigateBack || (() => navigation.goBack())}
        title={getHeaderTitle()}
        showCancelButton={role === 'player' && isCreator}
        onCancel={handleCancelBooking}
      />

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Field Info Card */}
        <FieldInfoCard
          struttura={booking.campo.struttura}
          campo={{
            name: booking.campo.name,
            sport: booking.campo.sport,
          }}
          onStrutturaPress={handleOpenStrutturaDetails}
          onChatPress={role === 'player' ? handleOpenStrutturaChat : undefined}
          onMapPress={handleOpenMaps}
          showChatButton={role === 'player'}
        />

        {/* Booking Details */}
        <AnimatedCard delay={150}>
          <BookingDetailsCard
            date={booking.date}
            startTime={booking.startTime}
            endTime={booking.endTime}
            duration={calculateDuration(booking.startTime, booking.endTime)}
            price={booking.price}
            createdAt={booking.createdAt}
            isPublic={booking.match?.isPublic}
          />
        </AnimatedCard>

        {/* CTA Join Match - Solo per player non nel match */}
        {role === 'player' && canJoin && (
          <AnimatedCard delay={180}>
            <Pressable 
              style={styles.joinMatchCTA}
              onPress={() => handleJoinMatch()}
            >
              <View style={styles.joinMatchCTAContent}>
                <View style={styles.joinMatchCTAIconContainer}>
                  <Ionicons name="people" size={24} color="#fff" />
                </View>
                <View style={styles.joinMatchCTATextContainer}>
                  <Text style={styles.joinMatchCTATitle}>Unisciti a questa partita!</Text>
                  <Text style={styles.joinMatchCTASubtitle}>
                    {confirmedPlayers.length}/{booking.match?.maxPlayers || 0} giocatori • {
                      (booking.match?.maxPlayers || 0) - confirmedPlayers.length
                    } posti disponibili
                    {getTimeUntilRegistrationDeadline(booking) && 
                      ` • ${getTimeUntilRegistrationDeadline(booking)} rimasti`
                    }
                  </Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={28} color="#fff" />
              </View>
            </Pressable>
          </AnimatedCard>
        )}

        {/* TODO: Match Section - Da implementare */}
        {booking.match && (
          <AnimatedCard delay={200}>
            <View style={styles.placeholderCard}>
              <Text style={styles.placeholderText}>
                Match Section - Da implementare
              </Text>
              <Text style={styles.placeholderSubtext}>
                Qui andrà la visualizzazione dei giocatori, team e punteggi
              </Text>
            </View>
          </AnimatedCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  joinMatchCTA: {
    backgroundColor: '#4CAF50',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  joinMatchCTAContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  joinMatchCTAIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinMatchCTATextContainer: {
    flex: 1,
  },
  joinMatchCTATitle: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
    marginBottom: 4,
  },
  joinMatchCTASubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  placeholderCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f0f0f0',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#999',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 13,
    color: '#bbb',
    textAlign: 'center',
  },
});

export default DettaglioPrenotazioneSharedScreen;
