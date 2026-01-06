import React from 'react';
import { View, Text, Image, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import API_URL from "../../../../config/api";
import { styles } from "../styles";

interface HeaderProps {
  user: any;
  pendingInvites: any[];
}

const getInitials = (name?: string): string => {
  if (!name) return "";

  const cleaned = name.trim().replace(/\s+/g, " ");
  if (!cleaned) return "";

  const parts = cleaned.split(" ");

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  const first = parts[0].charAt(0);
  const last = parts[parts.length - 1].charAt(0);

  return (first + last).toUpperCase();
};


const Header: React.FC<HeaderProps> = ({ user, pendingInvites }) => {
  return (
    <View style={styles.headerSection}>
      <View style={styles.headerLeft}>
        <View style={styles.avatarContainer}>
          {user?.avatarUrl ? (
            <Image
              source={{ uri: `${API_URL}${user.avatarUrl}` }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>
                  {getInitials(user?.name)}
                </Text>
            </View>
          )}
          <View style={styles.statusDot} />
        </View>
        <View>
          <Text style={styles.userName}>Ciao, {user?.name?.split(" ")[0]}!</Text>
        </View>
      </View>
      <Pressable 
        style={styles.notificationButton}
        onPress={() => {
          console.log("Notifiche cliccate");
          console.log("Inviti pendenti attuali:", pendingInvites.length);
        }}
      >
        <Ionicons name="notifications-outline" size={24} color="#333" />
        {pendingInvites.length > 0 && (
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>{pendingInvites.length}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
};

export default Header;