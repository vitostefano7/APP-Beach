import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Avatar } from "../../../../components/Avatar";
import { styles } from "../styles/OwnerDashboardScreen.styles";

interface OwnerHeaderProps {
  user: any;
  todayBookingsCount: number;
  unreadNotifications: number;
  onNotificationsPress: () => void;
}

export default function OwnerHeader({
  user,
  todayBookingsCount,
  unreadNotifications,
  onNotificationsPress,
}: OwnerHeaderProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buongiorno";
    if (hour < 18) return "Buon pomeriggio";
    return "Buonasera";
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={styles.avatarWrapper}>
          <Avatar
            name={user?.name || ""}
            surname={user?.surname}
            avatarUrl={user?.avatarUrl}
            size={56}
            fallbackIcon="person"
          />
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.userName}>{user?.name || "Owner"}</Text>
          
        </View>
      </View>

      <View style={styles.headerRight}>
        <Pressable
          style={styles.notificationButton}
          onPress={onNotificationsPress}
        >
          <Ionicons name="notifications-outline" size={24} color="#333" />
          {unreadNotifications > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}
