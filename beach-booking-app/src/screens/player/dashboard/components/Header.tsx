import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Avatar } from "../../../../components/Avatar";
import { styles } from "../styles";
import ChatModal from "./ChatModal";
import { useUnreadMessages } from "../../../../context/UnreadMessagesContext";
import { useNotifications } from "../hooks/useNotifications";

interface HeaderProps {
  user: any;
  pendingInvites: any[];
}

const Header: React.FC<HeaderProps> = ({ user, pendingInvites }) => {
  const navigation = useNavigation<any>();
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [rotateAnim] = useState(new Animated.Value(0));
  
  // Usa il context dei messaggi non letti
  const { unreadCount, refreshUnreadCount } = useUnreadMessages();
  
  // Hook per le notifiche
  const { unreadCount: notificationsUnreadCount, fetchUnreadCount } = useNotifications();

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
    fetchUnreadCount();
    
    // Auto-refresh ogni 30 secondi
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

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
          <Avatar
            name={user?.name}
            surname={user?.surname}
            avatarUrl={user?.avatarUrl}
            size="medium"
            showStatusDot
            statusDotColor="#4CAF50"
          />

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
                notificationsUnreadCount > 0 && styles.notificationButtonUnread,
              ]}
              onPress={() => navigation.navigate('Notifiche')}
            >
              <Ionicons
                name="notifications-outline"
                size={22}
                color={notificationsUnreadCount > 0 ? "#FF5252" : "#333"}
              />
            </Pressable>
            
            {notificationsUnreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {notificationsUnreadCount > 99 ? "99+" : notificationsUnreadCount}
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