import React, { useCallback, useContext, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import { AuthContext } from "../../../context/AuthContext";
import API_URL from "../../../config/api";
import { getCachedData, setCachedData } from "../../../components/cache/cacheStorage";
import ActivityFeedItem from "./components/ActivityFeedItem";

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

type ActivityFilter = "all" | "booking" | "refund";

export default function OwnerAllActivitiesScreen() {
  const { token, user } = useContext(AuthContext);
  const navigation = useNavigation<any>();

  const CACHE_TTL_MS = 2 * 60 * 1000;
  const cacheKey = `owner:activities:all:${user?.id || "unknown"}`;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");

  const loadActivities = useCallback(async ({ force = false }: { force?: boolean } = {}) => {
    if (!token) return;

    try {
      if (!force) {
        try {
          const cached = await getCachedData<Activity[]>(cacheKey, CACHE_TTL_MS);
          if (cached) {
            setActivities(cached);
            return;
          }
        } catch {
        }
      }

      const res = await fetch(`${API_URL}/bookings/owner`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        console.error("❌ [OwnerAllActivities] Errore response:", res.status);
        return;
      }

      const data = await res.json();

      const mappedActivities: Activity[] = data
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

          return {
            type: activityType,
            booking: {
              ...normalizedBooking,
              totalPrice:
                activityType === "cancellation_refund"
                  ? refundedAmount
                  : normalizedBooking.totalPrice,
            },
            timestamp: normalizedBooking.updatedAt || normalizedBooking.createdAt,
          };
        })
        .filter((activity: Activity | null): activity is Activity => Boolean(activity))
        .sort(
          (a: Activity, b: Activity) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

      setActivities(mappedActivities);

      try {
        await setCachedData(cacheKey, mappedActivities);
      } catch {
      }
    } catch (error) {
      console.error("❌ [OwnerAllActivities] Errore caricamento attività:", error);
    }
  }, [token, cacheKey]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const run = async () => {
        setLoading(true);
        await loadActivities();
        if (active) setLoading(false);
      };

      run();
      return () => {
        active = false;
      };
    }, [loadActivities])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadActivities({ force: true });
    setRefreshing(false);
  }, [loadActivities]);

  const filteredActivities = useMemo(() => {
    if (activityFilter === "all") {
      return activities;
    }

    if (activityFilter === "refund") {
      return activities.filter((activity) => activity.type === "cancellation_refund");
    }

    return activities.filter((activity) => activity.type !== "cancellation_refund");
  }, [activities, activityFilter]);

  return (
    <SafeAreaView style={screenStyles.safe} edges={["top", "bottom"]}>
      <View style={screenStyles.header}>
        <Pressable onPress={() => navigation.goBack()} style={screenStyles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#2196F3" />
        </Pressable>
        <Text style={screenStyles.title}>Tutte le Attività</Text>
        <View style={screenStyles.rightSpacer} />
      </View>

      {loading ? (
        <View style={screenStyles.loadingWrap}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={screenStyles.loadingText}>Caricamento attività...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={screenStyles.content}
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
          <View style={screenStyles.filtersRow}>
            <Pressable
              style={[
                screenStyles.filterChip,
                activityFilter === "all" && screenStyles.filterChipActive,
              ]}
              onPress={() => setActivityFilter("all")}
            >
              <Text
                style={[
                  screenStyles.filterChipText,
                  activityFilter === "all" && screenStyles.filterChipTextActive,
                ]}
              >
                Tutte
              </Text>
            </Pressable>

            <Pressable
              style={[
                screenStyles.filterChip,
                activityFilter === "booking" && screenStyles.filterChipActive,
              ]}
              onPress={() => setActivityFilter("booking")}
            >
              <Text
                style={[
                  screenStyles.filterChipText,
                  activityFilter === "booking" && screenStyles.filterChipTextActive,
                ]}
              >
                Prenotazioni
              </Text>
            </Pressable>

            <Pressable
              style={[
                screenStyles.filterChip,
                activityFilter === "refund" && screenStyles.filterChipActive,
              ]}
              onPress={() => setActivityFilter("refund")}
            >
              <Text
                style={[
                  screenStyles.filterChipText,
                  activityFilter === "refund" && screenStyles.filterChipTextActive,
                ]}
              >
                Rimborsi
              </Text>
            </Pressable>
          </View>

          {filteredActivities.length === 0 ? (
            <View style={screenStyles.emptyWrap}>
              <Ionicons name="time-outline" size={36} color="#90A4AE" />
              <Text style={screenStyles.emptyTitle}>
                {activityFilter === "refund"
                  ? "Nessun rimborso recente"
                  : activityFilter === "booking"
                    ? "Nessuna prenotazione recente"
                    : "Nessuna attività recente"}
              </Text>
            </View>
          ) : (
            filteredActivities.map((activity, index) => (
              <ActivityFeedItem
                key={`${activity.booking._id}-${index}`}
                activity={activity}
                onPress={() =>
                  navigation.navigate("OwnerDettaglioPrenotazione", {
                    bookingId: activity.booking._id,
                  })
                }
              />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const screenStyles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  header: {
    height: 56,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F6",
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F7FF",
  },
  rightSpacer: {
    width: 34,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  content: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  filtersRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: "#EEF2F6",
  },
  filterChipActive: {
    backgroundColor: "#2196F3",
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#607D8B",
  },
  filterChipTextActive: {
    color: "white",
  },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    color: "#607D8B",
    fontWeight: "600",
  },
});