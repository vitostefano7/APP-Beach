import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import API_URL from "../../../../config/api";
import { styles } from "../styles";
import ChatModal from "./ChatModal";
import { useUnreadMessages } from "../../../../context/UnreadMessagesContext"; // Importa il context

interface HeaderProps {
  user: any;
  pendingInvites: any[];
}

const getInitials = (name?: string, surname?: string): string => {
  if (!name) return "??";
  if (surname) {
    return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase();
  }
  const parts = name.trim().split(" ");
  return parts.length === 1
    ? parts[0][0].toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const Header: React.FC<HeaderProps> = ({ user, pendingInvites }) => {
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [rotateAnim] = useState(new Animated.Value(0));
  
  // Usa il context dei messaggi non letti
  const { unreadCount, refreshUnreadCount } = useUnreadMessages();

  const openChatModal = () => {
    // Animazione del bottone
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        useNativeDriver: true,
        friction: 3,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setChatModalVisible(true);
    });

    setTimeout(() => {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 3,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }, 150);
  };

  // Refresh del conteggio quando il componente viene montato
  useEffect(() => {
    refreshUnreadCount();
  }, []);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <>
      {/* ================= HEADER ================= */}
      <View style={styles.headerSection}>
        {/* LEFT: Avatar e nome */}
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
            <Text style={styles.greeting}>BENVENUTO</Text>
            <Text style={styles.userName}>
              {user?.name?.split(" ")[0]}!
            </Text>
          </View>
        </View>

        {/* RIGHT: Chat + Notifiche */}
        <View style={styles.headerRightCompact}>
          {/* CHAT BUTTON con badge */}
          <View style={{ position: 'relative' }}>
            <Animated.View
              style={{
                transform: [
                  { scale: scaleAnim },
                  { rotate: rotateInterpolate },
                ],
              }}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.chatToggleButtonCompact,
                  pressed && styles.chatButtonPressed,
                  unreadCount > 0 && styles.chatButtonUnread, // Stile quando ci sono messaggi non letti
                ]}
                onPress={openChatModal}
              >
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={20}
                  color={unreadCount > 0 ? "#FF5252" : "#007AFF"} // Cambia colore se ci sono messaggi non letti
                />
              </Pressable>
            </Animated.View>
            
            {/* Badge per i messaggi non letti */}
            {unreadCount > 0 && (
              <View style={styles.chatUnreadBadge}>
                <Text style={styles.chatUnreadBadgeText}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
          </View>

          {/* NOTIFICATION BUTTON */}
          <View style={{ position: 'relative' }}>
            <Pressable 
              style={({ pressed }) => [
                styles.notificationButtonCompact,
                pressed && styles.chatButtonPressed,
              ]}
            >
              <Ionicons
                name="notifications-outline"
                size={22}
                color="#333"
              />
            </Pressable>
            
            {pendingInvites.length > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {pendingInvites.length > 99 ? "99+" : pendingInvites.length}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* CHAT MODAL */}
      <ChatModal
        visible={chatModalVisible}
        onClose={() => setChatModalVisible(false)}
      />
    </>
  );
};

export default Header;