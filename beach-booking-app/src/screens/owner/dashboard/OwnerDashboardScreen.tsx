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
  payments?: Array<{
    amount: number;
    status: string;
  }>;
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
  updatedAt?: string;
};

type Activity = {
  type: "new_booking" | "cancellation" | "cancellation_refund";
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
      sport: string | { _id: string; name: string };
      struttura: {
        _id: string;
        name: string;
      };
    };
  };
  createdBy: {
    _id: string;
    name: string;
    surname: string;
    avatarUrl?: string;
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
  
  const [dailyRevenue, setDailyRevenue] = useState(0);

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

        const revenue = confirmed.reduce(
          (sum: number, booking: Booking) => sum + (booking.totalPrice || 0),
          0
        );

        setTodayBookings(confirmed);
        setDailyRevenue(revenue);
      }
    } catch (error) {
      console.error("❌ [OwnerDashboard] Errore caricamento prenotazioni oggi:", error);
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
      const res = await fetch(`${API_URL}/bookings/owner`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();

        const activities: Activity[] = data
          .map((rawBooking: any): Activity | null => {
            const strutturaId =
              typeof rawBooking?.struttura === "object"
                ? rawBooking.struttura?._id
                : rawBooking?.struttura;

            const normalizedBooking: Booking = {
              _id: rawBooking?._id,
              date: rawBooking?.date,
              startTime: rawBooking?.startTime,
              endTime: rawBooking?.endTime,
              totalPrice: rawBooking?.totalPrice ?? rawBooking?.price ?? 0,
              status: rawBooking?.status,
              payments: Array.isArray(rawBooking?.payments) ? rawBooking.payments : [],
              userName: rawBooking?.user?.name || "Utente",
              userSurname: rawBooking?.user?.surname,
              userPhone: rawBooking?.user?.phone,
              campo: {
                _id:
                  typeof rawBooking?.campo === "object"
                    ? rawBooking.campo?._id
                    : rawBooking?.campo,
                name: rawBooking?.campo?.name || "Campo",
                sport: rawBooking?.campo?.sport || "",
              },
              struttura: {
                _id: rawBooking?.campo?.struttura?._id || strutturaId || "",
                name: rawBooking?.campo?.struttura?.name || "Struttura",
              },
              createdAt: rawBooking?.createdAt,
              updatedAt: rawBooking?.updatedAt,
            };

            if (!normalizedBooking._id || !normalizedBooking.createdAt) {
              return null;
            }

            const refundedAmount = (normalizedBooking.payments || [])
              .filter((payment) => payment?.status === "refunded")
              .reduce((sum, payment) => sum + (payment?.amount || 0), 0);

            const hasRefund = refundedAmount > 0;

            const activityType: Activity["type"] =
              normalizedBooking.status === "cancelled"
                ? hasRefund
                  ? "cancellation_refund"
                  : "cancellation"
                : "new_booking";

            const activityBooking: Booking = {
              ...normalizedBooking,
              totalPrice:
                activityType === "cancellation_refund"
                  ? refundedAmount
                  : normalizedBooking.totalPrice,
            };

            return {
              type: activityType,
              booking: activityBooking,
              timestamp: normalizedBooking.updatedAt || normalizedBooking.createdAt,
            };
          })
          .filter((activity: Activity | null): activity is Activity => Boolean(activity))
          .sort((a: Activity, b: Activity) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
          .slice(0, 10)
;

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

      // Crea conversazione con l'utente (come struttura della prenotazione)
      const strutturaId = bookingDetails.campo?.struttura?._id;
      const chatRes = await fetch(
        `${API_URL}/api/conversations/user/${bookingDetails.user._id}${strutturaId ? `?strutturaId=${strutturaId}` : ""}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!chatRes.ok) {
        console.error("❌ [OwnerDashboard] Errore creazione conversazione:", chatRes.status);
        return;
      }

      const conversation = await chatRes.json();

      // Naviga alla chat
      const struttura = bookingDetails.campo?.struttura;
      navigation.navigate("Chat", {
        conversationId: conversation._id,
        userName: bookingDetails.user.surname
          ? `${bookingDetails.user.name} ${bookingDetails.user.surname}`
          : bookingDetails.user.name,
        userId: bookingDetails.user._id,
        userAvatar: bookingDetails.user.avatarUrl,
        struttura,
        strutturaName: struttura?.name,
        strutturaAvatar: struttura?.images?.[0],
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
      const bookingStart = new Date(`${b.date}T${b.startTime}`);
      const bookingEnd = new Date(`${b.date}T${b.endTime}`);
      return bookingStart > now || (now >= bookingStart && now <= bookingEnd);
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

  const handleViewAllActivities = useCallback(() => {
    navigation.navigate("OwnerAllActivities");
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
            {...({
              refreshing,
              onRefresh,
              tintColor: "#2196F3",
              colors: ["#2196F3"],
            } as any)}
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
          ongoingBookings={upcomingBookings.length}
          dailyRevenue={dailyRevenue}
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
              <Pressable
                onPress={handleViewAllActivities}
                style={styles.sectionLink}
              >
                <Text style={styles.sectionLinkText}>Vedi tutte</Text>
                <Ionicons name="chevron-forward" size={14} color="#2196F3" />
              </Pressable>
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
