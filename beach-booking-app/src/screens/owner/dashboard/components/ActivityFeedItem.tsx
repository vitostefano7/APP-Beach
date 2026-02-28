import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { styles } from "../styles/OwnerDashboardScreen.styles";

interface Activity {
  type: "new_booking" | "cancellation" | "cancellation_refund";
  booking: {
    _id: string;
    userName: string;
    userSurname?: string;
    struttura: {
      name: string;
    };
    campo: {
      name: string;
    };
    date: string;
    startTime: string;
    totalPrice: number;
  };
  timestamp: string;
}

interface ActivityFeedItemProps {
  activity: Activity;
  onPress: () => void;
}

export default function ActivityFeedItem({
  activity,
  onPress,
}: ActivityFeedItemProps) {
  const getActivityIcon = () => {
    switch (activity.type) {
      case "new_booking":
        return { name: "checkmark-circle", color: "#4CAF50", bg: "#E8F5E9" };
      case "cancellation":
        return { name: "close-circle", color: "#F44336", bg: "#FFEBEE" };
      case "cancellation_refund":
        return { name: "arrow-undo-circle", color: "#9C27B0", bg: "#F3E5F5" };
      default:
        return { name: "information-circle", color: "#2196F3", bg: "#E3F2FD" };
    }
  };

  const getActivityText = () => {
    const fullName = activity.booking.userSurname
      ? `${activity.booking.userName} ${activity.booking.userSurname}`
      : activity.booking.userName;

    switch (activity.type) {
      case "new_booking":
        return `${fullName} ha prenotato ${activity.booking.campo.name}`;
      case "cancellation":
        return `${fullName} ha cancellato la prenotazione`;
      case "cancellation_refund":
        return `${fullName} ha cancellato la prenotazione con rimborso`;
      default:
        return "Nuova attività";
    }
  };

  const getRelativeTime = () => {
    const now = new Date();
    const activityDate = new Date(activity.timestamp);
    const diffMs = now.getTime() - activityDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Adesso";
    if (diffMins < 60) return `${diffMins}m fa`;
    if (diffHours < 24) return `${diffHours}h fa`;
    if (diffDays === 1) return "Ieri";
    return `${diffDays}g fa`;
  };

  const formatDate = () => {
    const date = new Date(activity.booking.date);
    return date.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "short",
    });
  };

  const icon = getActivityIcon();

  return (
    <Pressable style={styles.activityItem} onPress={onPress}>
      <View style={[styles.activityIcon, { backgroundColor: icon.bg }]}>
        <Ionicons name={icon.name as any} size={20} color={icon.color} />
      </View>

      <View style={styles.activityContent}>
        <Text style={styles.activityText}>{getActivityText()}</Text>
        <View style={styles.activityMeta}>
          <Text style={styles.activityMetaText}>
            {formatDate()} · {activity.booking.startTime}
          </Text>
          <Text style={styles.activityMetaDot}>•</Text>
          <Text style={styles.activityMetaText}>{activity.booking.struttura.name}</Text>
        </View>
      </View>

      <View style={styles.activityRight}>
        <Text style={styles.activityTime}>{getRelativeTime()}</Text>
        {activity.type !== "cancellation" && (
          <Text style={styles.activityPrice}>
            {activity.type === "cancellation_refund" ? "Rimborsati " : "€"}
            {activity.type === "cancellation_refund" ? "€" : ""}
            {activity.booking.totalPrice.toFixed(2)}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
