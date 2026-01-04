import React from 'react';
import { View, Text, Image, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import API_URL from "../../../../config/api";
import { styles } from "../styles";

interface HeaderProps {
  user: any;
  pendingInvites: any[];
}

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
              <Ionicons name="person" size={24} color="#999" />
            </View>
          )}
          <View style={styles.statusDot} />
        </View>
        <View>
          <Text style={styles.greeting}>BENTORNATO</Text>
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