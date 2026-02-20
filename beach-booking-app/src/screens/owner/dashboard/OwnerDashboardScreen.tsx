import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState, useContext, useCallback, useMemo } from "react";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { AuthContext } from "../../../context/AuthContext";
import API_URL from "../../../config/api";
import { styles } from "./styles/OwnerDashboardScreen.styles";
import { useAlert } from "../../../context/AlertContext";
import OwnerHeader from "./components/OwnerHeader";
import QuickStatsRow from "./components/QuickStatsRow";
import BookingTodayCard from "./components/BookingTodayCard";
import StrutturaQuickCard from "./components/StrutturaQuickCard";
import ActivityFeedItem from "./components/ActivityFeedItem";
import MatchCard from "./components/MatchCard";

type Struttura = {
  _id: string;
  name: string;
  location: {
    city: string;
    address: string;
  };
  images: string[];
  isActive: boolean;
};

type Booking = {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: string;
  userName: string;
  userSurname?: string;
  userPhone?: string;
  campo: {
    _id: string;
    name: string;
    sport: string;
  };
  struttura: {
    _id: string;
    name: string;
  };
  createdAt: string;
};

type Activity = {
  type: "new_booking" | "cancellation" | "payment";
  booking: Booking;
  timestamp: string;
};

type Match = {
  _id: string;
  booking: {
    _id: string;
    date: string;
    startTime: string;
    endTime: string;
    campo: {
      name: string;
      sport: string;
    };
    struttura: {
      _id: string;
      name: string;
    };
  };
  players: Array<{
    user: {
      _id: string;
      name: string;
      avatarUrl?: string;
    };
    team: "A" | "B";
    status: string;
  }>;
  maxPlayers: number;
  isPublic: boolean;
  status: string;
};

export default function OwnerDashboardScreen() {
  const { token, user } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const { showAlert } = useAlert();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [strutture, setStrutture] = useState<Struttura[]>([]);
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  
  const [monthRevenue, setMonthRevenue] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const loadDashboardData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      
      await Promise.all([
        loadStrutture(),
        loadTodayBookings(),
        loadMonthRevenue(),
        loadUnreadNotifications(),
        loadRecentActivities(),
        loadUpcomingMatches(),
      ]);
    } catch (error) {
      console.error("❌ [OwnerDashboard] Errore caricamento dati:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStrutture = useCallback(async () => {
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/owner/strutture`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setStrutture(data);
      }
    } catch (error) {
      console.error("❌ [OwnerDashboard] Errore caricamento strutture:", error);
    }
  }, [token]);

  const loadTodayBookings = useCallback(async () => {
    if (!token) return;

    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch(`${API_URL}/owner/bookings?date=${today}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        // Filtra solo prenotazioni confermate e ordina per orario
        const confirmed = data
          .filter((b: Booking) => b.status === "confirmed")
          .sort((a: Booking, b: Booking) => 
            a.startTime.localeCompare(b.startTime)
          );
        setTodayBookings(confirmed);
      }
    } catch (error) {
      console.error("❌ [OwnerDashboard] Errore caricamento prenotazioni oggi:", error);
    }
  }, [token]);

  const loadMonthRevenue = useCallback(async () => {
    if (!token) return;

    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const monthParam = `${year}-${month}`;

      const res = await fetch(`${API_URL}/owner/bookings?month=${monthParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const revenue = data
          .filter((b: Booking) => b.status === "confirmed")
          .reduce((sum: number, b: Booking) => sum + (b.totalPrice || 0), 0);
        setMonthRevenue(revenue);
      }
    } catch (error) {
      console.error("❌ [OwnerDashboard] Errore calcolo incasso:", error);
    }
  }, [token]);

  const loadUnreadNotifications = useCallback(async () => {
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setUnreadNotifications(data.count || 0);
      }
    } catch (error) {
      console.error("❌ [OwnerDashboard] Errore caricamento notifiche:", error);
    }
  }, [token]);

  const loadRecentActivities = useCallback(async () => {
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/owner/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        
        // Prendi ultime 10 prenotazioni ordinate per data creazione
        const activities: Activity[] = data
          .sort((a: Booking, b: Booking) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 10)
          .map((booking: Booking) => ({
            type: booking.status === "cancelled" ? "cancellation" : "new_booking",
            booking,
            timestamp: booking.createdAt,
          }));

        setRecentActivities(activities);
      } else {
        console.error("❌ [OwnerDashboard] Errore response:", res.status, res.statusText);
      }
    } catch (error) {
      console.error("❌ [OwnerDashboard] Errore caricamento attività:", error);
    }
  }, [token]);

  const loadUpcomingMatches = useCallback(async () => {
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/owner/matches`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const matches = await res.json();
        setUpcomingMatches(matches);
      } else {
        console.error("❌ [OwnerDashboard] Errore response match:", res.status);
      }
    } catch (error) {
      console.error("❌ [OwnerDashboard] Errore caricamento match:", error);
    }
  }, [token]);

  const handleCallUser = useCallback((phone?: string) => {
    if (phone) {
      // Linking.openURL(`tel:${phone}`);
    }
  }, []);

  const handleChatUser = useCallback(async (bookingId: string) => {
    try {
      // Ottieni i dettagli completi della prenotazione per avere l'userId
      const res = await fetch(`${API_URL}/bookings/owner/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        console.error("❌ [OwnerDashboard] Errore caricamento prenotazione:", res.status);
        return;
      }

      const bookingDetails = await res.json();

      // Crea conversazione con l'utente
      const chatRes = await fetch(`${API_URL}/api/conversations/user/${bookingDetails.user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!chatRes.ok) {
        console.error("❌ [OwnerDashboard] Errore creazione conversazione:", chatRes.status);
        return;
      }

      const conversation = await chatRes.json();

      // Naviga alla chat
      navigation.navigate("Chat", {
        conversationId: conversation._id,
        strutturaName: bookingDetails.campo.struttura.name,
        userName: bookingDetails.user.name,
        userId: bookingDetails.user._id,
        struttura: bookingDetails.campo.struttura,
      });
    } catch (error) {
      console.error("❌ [OwnerDashboard] Errore apertura chat:", error);
    }
  }, [token, navigation]);

  const activeStrutture = useMemo(
    () => strutture.filter(s => s.isActive).length,
    [strutture]
  );

  const upcomingBookings = useMemo(
    () => todayBookings.filter(b => {
      const now = new Date();
      const bookingTime = new Date(`${b.date}T${b.startTime}`);
      return bookingTime > now;
    }),
    [todayBookings]
  );

  const handleViewAllBookings = useCallback(() => {
    navigation.navigate("OwnerBookings", {
      filterDate: new Date().toISOString().split('T')[0],
      fromDashboard: true,
    });
  }, [navigation]);

  const handleViewOwnerBookings = useCallback(() => {
    navigation.navigate("OwnerBookings");
  }, [navigation]);

  const handleViewStrutture = useCallback(() => {
    navigation.navigate("Strutture");
  }, [navigation]);

  const handleCreaStruttura = useCallback(() => {
    navigation.navigate("CreaStruttura");
  }, [navigation]);

  const handleNotificationsPress = useCallback(() => {
    navigation.navigate("OwnerNotifiche");
  }, [navigation]);

  const handleStatsPress = useCallback((type: string) => {
    if (type === "bookings") {
      navigation.navigate("OwnerBookings");
    } else if (type === "strutture") {
      navigation.navigate("Strutture");
    }
  }, [navigation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, [loadDashboardData]);

  if (loading) {
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
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2196F3"
            colors={["#2196F3"]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <OwnerHeader
          user={user}
          todayBookingsCount={todayBookings.length}
          unreadNotifications={unreadNotifications}
          onNotificationsPress={handleNotificationsPress}
        />

        {/* Quick Stats */}
        <QuickStatsRow
          activeStrutture={activeStrutture}
          totalStrutture={strutture.length}
          todayBookings={todayBookings.length}
          monthRevenue={monthRevenue}
          onStatsPress={handleStatsPress}
        />

        {/* Prossime Prenotazioni Oggi */}
        {upcomingBookings.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Prenotazioni Oggi</Text>
              <Pressable
                onPress={handleViewAllBookings}
                style={styles.sectionLink}
              >
                <Text style={styles.sectionLinkText}>Vedi tutte</Text>
                <Ionicons name="chevron-forward" size={14} color="#2196F3" />
              </Pressable>
            </View>

            {upcomingBookings.slice(0, 3).map((booking) => (
              <BookingTodayCard
                key={booking._id}
                booking={booking}
                onPress={() =>
                  navigation.navigate("OwnerDettaglioPrenotazione", {
                    bookingId: booking._id,
                  })
                }
                onCall={() => handleCallUser(booking.userPhone)}
                onChat={() => handleChatUser(booking._id)}
              />
            ))}
          </View>
        )}

        {/* Partite in Corso / Prossime */}
        {upcomingMatches.length > 0 && (
          <View style={[styles.section, { marginBottom: 1 }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Partite in Programma</Text>
              <Pressable
                onPress={handleViewOwnerBookings}
                style={styles.sectionLink}
              >
                <Text style={styles.sectionLinkText}>Prenotazioni</Text>
                <Ionicons name="chevron-forward" size={14} color="#2196F3" />
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
              removeClippedSubviews
            >
              {upcomingMatches.map((match) => (
                <MatchCard
                  key={match._id}
                  match={match}
                  onPress={() =>
                    navigation.navigate("OwnerDettaglioPrenotazione", {
                      bookingId: match.booking._id,
                    })
                  }
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/*   rutture */}
        {strutture.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Le Tue Strutture</Text>
              <Pressable
                onPress={handleViewStrutture}
                style={styles.sectionLink}
              >
                <Text style={styles.sectionLinkText}>Gestisci</Text>
                <Ionicons name="chevron-forward" size={14} color="#2196F3" />
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
              removeClippedSubviews
            >
              {strutture.map((struttura) => {
                const strutturaBookings = todayBookings.filter(
                  (b) => b.struttura._id === struttura._id
                );
                return (
                  <StrutturaQuickCard
                    key={struttura._id}
                    struttura={struttura}
                    todayBookingsCount={strutturaBookings.length}
                    onPress={() =>
                      navigation.navigate("StrutturaDashboard", {
                        strutturaId: struttura._id,
                      })
                    }
                  />
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Attività Recenti */}
        {recentActivities.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Attività Recenti</Text>
            </View>

            {recentActivities.slice(0, 5).map((activity, index) => (
              <ActivityFeedItem
                key={`${activity.booking._id}-${index}`}
                activity={activity}
                onPress={() =>
                  navigation.navigate("OwnerDettaglioPrenotazione", {
                    bookingId: activity.booking._id,
                  })
                }
              />
            ))}
          </View>
        )}

        {/* Empty State */}
        {strutture.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="business-outline" size={54} color="#2196F3" />
            </View>
            <Text style={styles.emptyTitle}>Nessuna Struttura</Text>
            <Text style={styles.emptyText}>
              Inizia aggiungendo la tua prima struttura per gestire prenotazioni e campi
            </Text>
            <Pressable
              style={styles.emptyButton}
              onPress={handleCreaStruttura}
            >
              <Ionicons name="add" size={18} color="white" />
              <Text style={styles.emptyButtonText}>Aggiungi Struttura</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

    </SafeAreaView>
  );
}
