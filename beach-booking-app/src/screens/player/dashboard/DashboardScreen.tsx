import React from 'react';
import {
  ScrollView,
  RefreshControl,
  View,
  Pressable,
  ActivityIndicator,
  Text, // Aggiunto Text mancante
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
        <Header user={user} pendingInvites={pendingInvites} />

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

        {/* Inviti in Attesa */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <InviteCard.Title count={pendingInvites.length} />
          </View>
          
          {pendingInvites.length > 0 ? (
            pendingInvites.map((invite) => (
              <InviteCard
                key={invite._id || invite.match?._id}
                invite={invite}
                userId={user?.id}
                onPress={(bookingId) => {
                  if (bookingId) {
                    navigation.navigate("DettaglioPrenotazione", {
                      bookingId,
                    });
                  }
                }}
                onRespond={respondToInvite}
              />
            ))
          ) : (
            <EmptyStateCard
              icon="mail-open-outline"
              title="Nessun invito pendente"
              subtitle="Quando qualcuno ti invita a una partita, apparirà qui"
              type="invite"
            />
          )}
        </View>

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