import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { styles } from "../styles/OwnerDashboardScreen.styles";

interface QuickStatsRowProps {
  activeStrutture: number;
  totalStrutture: number;
  todayBookings: number;
  ongoingBookings: number;
  monthRevenue: number;
  onStatsPress: (type: "strutture" | "bookings" | "revenue") => void;
}

export default function QuickStatsRow({
  activeStrutture,
  totalStrutture,
  todayBookings,
  ongoingBookings,
  monthRevenue,
  onStatsPress,
}: QuickStatsRowProps) {
  return (
    <View style={styles.statsRow}>
      <Pressable
        style={styles.statCard}
        onPress={() => onStatsPress("strutture")}
      >
        <View style={[styles.statIcon, { backgroundColor: "#E3F2FD" }]}>
          <Ionicons name="business" size={20} color="#2196F3" />
        </View>
        <View style={styles.statContent}>
          <Text style={styles.statValue}>
            {activeStrutture}/{totalStrutture}
          </Text>
          <Text style={styles.statLabel}>Strutture Attive</Text>
        </View>
      </Pressable>

      <Pressable
        style={[styles.statCard, ongoingBookings > 0 && styles.statCardHighlight]}
        onPress={() => onStatsPress("bookings")}
      >
        <View
          style={[
            styles.statIcon,
            { backgroundColor: ongoingBookings > 0 ? "#E8F5E9" : "#F5F5F5" },
          ]}
        >
          <Ionicons
            name="calendar"
            size={20}
            color={ongoingBookings > 0 ? "#4CAF50" : "#999"}
          />
        </View>
        <View style={styles.statContent}>
          <Text style={styles.statValue}>
            {todayBookings > 0 ? `${todayBookings}/${todayBookings}` : "0/0"}
          </Text>
          <Text style={styles.statLabel}>Oggi</Text>
        </View>
      </Pressable>

      <Pressable
        style={styles.statCard}
        onPress={() => onStatsPress("revenue")}
      >
        <View style={[styles.statIcon, { backgroundColor: "#F3E5F5" }]}>
          <Ionicons name="cash" size={20} color="#9C27B0" />
        </View>
        <View style={styles.statContent}>
          <Text style={styles.statValue}>€{monthRevenue.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Mese</Text>
        </View>
      </Pressable>
    </View>
  );
}
