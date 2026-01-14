import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { styles } from "../styles/OwnerDashboardScreen.styles";

interface Booking {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  userName: string;
  userSurname?: string;
  userPhone?: string;
  campo: {
    name: string;
    sport: string;
  };
  struttura: {
    name: string;
  };
}

interface BookingTodayCardProps {
  booking: Booking;
  onPress: () => void;
  onCall: () => void;
  onChat: () => void;
}

export default function BookingTodayCard({
  booking,
  onPress,
  onCall,
  onChat,
}: BookingTodayCardProps) {
  const getTimeStatus = () => {
    const now = new Date();
    const bookingStart = new Date(`${booking.date}T${booking.startTime}`);
    const bookingEnd = new Date(`${booking.date}T${booking.endTime}`);
    
    const diffMs = bookingStart.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (now >= bookingStart && now <= bookingEnd) {
      return { text: "IN CORSO", color: "#4CAF50", bg: "#E8F5E9" };
    }

    if (diffHours < 1 && diffMins > 0) {
      return { text: `Tra ${diffMins}m`, color: "#FF9800", bg: "#FFF3E0" };
    }

    if (diffHours < 24) {
      return { text: `Tra ${diffHours}h`, color: "#2196F3", bg: "#E3F2FD" };
    }

    return { text: "Oggi", color: "#666", bg: "#F5F5F5" };
  };

  const status = getTimeStatus();
  const fullName = booking.userSurname 
    ? `${booking.userName} ${booking.userSurname}`
    : booking.userName;

  const getSportIcon = (sport: string) => {
    if (!sport) return "football";
    if (sport.toLowerCase().includes("volley")) return "basketball";
    return "football";
  };

  return (
    <Pressable style={styles.bookingCard} onPress={onPress}>
      <View style={styles.bookingHeader}>
        <View style={styles.bookingTimeWrapper}>
          <Text style={styles.bookingTime}>
            {booking.startTime} - {booking.endTime}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusBadgeText, { color: status.color }]}>
              {status.text}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.bookingContent}>
        <View style={styles.bookingInfo}>
          <View style={styles.bookingRow}>
            <Ionicons name="person-outline" size={16} color="#666" />
            <Text style={styles.bookingText}>{fullName}</Text>
          </View>
          
          <View style={styles.bookingRow}>
            <Ionicons name="business-outline" size={16} color="#666" />
            <Text style={styles.bookingText}>{booking.struttura.name}</Text>
          </View>

          <View style={styles.bookingRow}>
            <Ionicons name={getSportIcon(booking.campo.sport)} size={16} color="#666" />
            <Text style={styles.bookingText}>{booking.campo.name}</Text>
          </View>
        </View>

        <View style={styles.bookingActions}>
          {booking.userPhone && (
            <Pressable
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                onCall();
              }}
            >
              <Ionicons name="call" size={18} color="#4CAF50" />
            </Pressable>
          )}
          
          <Pressable
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              onChat();
            }}
          >
            <Ionicons name="chatbox" size={18} color="#2196F3" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}
