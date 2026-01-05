import React from 'react';
import {
  ScrollView,
  RefreshControl,
  View,
  Pressable,
  ActivityIndicator,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { useDashboardData } from "./hooks/userDashboardData";
import Header from "./components/Header";
import DebugInvites from "./components/DebugInvites";
import StatsRow from "./components/StatsRow";
import NextMatchCard from "./components/NextMatchCard";
import InviteCard from "./components/InviteCard";
import MatchHistoryCard from "./components/MatchHistoryCard";
import EmptyStateCard from "./components/EmptyStateCard";
import { styles } from "./styles";

// Componente per il titolo degli inviti con bottone "Vedi tutti"
const InviteCardTitle = ({ count, onViewAll }: { count: number, onViewAll: () => void }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Text style={styles.sectionTitle}>Inviti in attesa</Text>
      {count > 0 && (
        <View style={styles.inviteCountBadge}>
          <Text style={styles.inviteCountText}>{count}</Text>
        </View>
      )}
    </View>
    <Pressable onPress={onViewAll} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Text style={styles.sectionLink}>Vedi tutti</Text>
      <Ionicons name="chevron-forward" size={16} color="#2196F3" />
    </Pressable>
  </View>
);

// Funzione per filtrare gli inviti validi (non scaduti e pending)
const getValidPendingInvites = (invites: any[], userId: string) => {
  return invites.filter(invite => {
    const match = invite.match || invite;
    const booking = invite.booking || match?.booking;
    const myPlayer = match?.players?.find((p: any) => p.user?._id === userId);
    const myStatus = myPlayer?.status || "unknown";
    
    // Controlla se è pending
    if (myStatus !== "pending") {
      return false;
    }
    
    // Controlla se è scaduto (2 ore prima della partita)
    if (!booking?.date || !booking?.startTime) {
      return false; // Se non c'è data/orario, non è valido
    }
    
    try {
      // Calcola se è scaduto (2 ore prima)
      const matchDateTime = new Date(`${booking.date}T${booking.startTime}`);
      const cutoffTime = new Date(matchDateTime);
      cutoffTime.setHours(cutoffTime.getHours() - 2); // 2 ore prima
      
      const isExpired = new Date() > cutoffTime;
      
      // Solo se non è scaduto
      return !isExpired;
    } catch (error) {
      console.error("Errore nel calcolo scadenza invito:", error);
      return false; // In caso di errore, non mostrare
    }
  });
};

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const {
    loading,
    refreshing,
    nextBooking,
    pendingInvites,
    recentMatches,
    stats,
    user,
    loadDashboardData,
    onRefresh,
    respondToInvite,
  } = useDashboardData();

  // Filtra gli inviti per mostrare solo quelli validi
  const validPendingInvites = getValidPendingInvites(pendingInvites || [], user?.id || "");

  const handleViewInviteDetails = (invite: any) => {
    console.log("Viewing invite details:", invite);
    
    navigation.navigate("DettaglioInvito", {
      inviteId: invite._id || invite.match?._id,
      inviteData: invite,
    });
  };

  const handleViewAllInvites = () => {
    console.log("Navigating to all invites screen");
    navigation.navigate("TuttiInviti", {
      userId: user?.id,
      invites: pendingInvites,
    });
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Caricamento dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Header user={user} pendingInvites={validPendingInvites} />

        <DebugInvites
          pendingInvites={pendingInvites}
          user={user}
          onReload={loadDashboardData}
        />

        <StatsRow stats={stats} />

        {/* Prossima Partita */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>La tua prossima partita</Text>
            <Pressable onPress={() => navigation.navigate("LeMiePrenotazioni")}>
              <Text style={styles.sectionLink}>Calendario</Text>
            </Pressable>
          </View>
          
          {nextBooking ? (
            <NextMatchCard
              booking={nextBooking}
              onPress={() =>
                navigation.navigate("DettaglioPrenotazione", {
                  bookingId: nextBooking._id,
                })
              }
            />
          ) : (
            <EmptyStateCard
              icon="calendar-outline"
              title="Nessuna partita in programma"
              subtitle="Prenota un campo o unisciti a una partita"
              buttonText="Prenota ora"
              onPress={() => navigation.navigate("Strutture")}
              type="booking"
            />
          )}
        </View>

        {/* Inviti in Attesa - MOSTRA SOLO SE CI SONO INVITI VALIDI */}
        {validPendingInvites.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <InviteCardTitle 
                count={validPendingInvites.length} 
                onViewAll={handleViewAllInvites}
              />
            </View>
            
            {validPendingInvites.slice(0, 3).map((invite) => (
              <InviteCard
                key={invite._id || invite.match?._id}
                invite={invite}
                userId={user?.id}
                onViewDetails={handleViewInviteDetails}
                onRespond={respondToInvite}
              />
            ))}
            
            {/* Mostra "Mostra più" se ci sono più di 3 inviti */}
            {validPendingInvites.length > 3 && (
              <Pressable 
                style={styles.showMoreButton}
                onPress={handleViewAllInvites}
              >
                <Text style={styles.showMoreText}>
                  Mostra altri {validPendingInvites.length - 3} inviti
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#2196F3" />
              </Pressable>
            )}
          </View>
        )}

        {/* Se non ci sono inviti in attesa, mostra lo stato vuoto */}
        {validPendingInvites.length === 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Inviti in attesa</Text>
              <Pressable onPress={handleViewAllInvites}>
                <Text style={styles.sectionLink}>Vedi tutti</Text>
              </Pressable>
            </View>
            
            <EmptyStateCard
              icon="mail-open-outline"
              title="Nessun invito in attesa"
              type="invite"
            />
          </View>
        )}

        {/* Ultime Partite */}
        {recentMatches.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ultime Partite</Text>
              <Pressable onPress={() => navigation.navigate("Storico")}>
                <Text style={styles.sectionLink}>Storico</Text>
              </Pressable>
            </View>

            {recentMatches.map((match) => (
              <MatchHistoryCard
                key={match._id}
                match={match}
                userId={user?.id}
                onPress={(bookingId) => {
                  if (bookingId) {
                    navigation.navigate("DettaglioPrenotazione", {
                      bookingId,
                    });
                  }
                }}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate("Strutture")}
      >
        <Ionicons name="add" size={28} color="white" />
      </Pressable>
    </SafeAreaView>
  );
}