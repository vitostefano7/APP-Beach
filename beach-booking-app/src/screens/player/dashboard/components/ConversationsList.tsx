// components/ConversationsList.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useContext } from "react";
import API_URL from "../../../../config/api";
import { AuthContext } from "../../../../context/AuthContext";
import { useUnreadMessages } from "../../../../context/UnreadMessagesContext";

type Conversation = {
  _id: string;
  type: 'direct' | 'group';
  
  // Campi per chat diretta
  user?: {
    _id: string;
    name: string;
    email: string;
  };
  struttura?: {
    _id: string;
    name: string;
    images: string[];
  };
  owner?: {
    _id: string;
    name: string;
    email: string;
  };
  
  // Campi per chat di gruppo
  participants?: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
  match?: {
    _id: string;
  };
  groupName?: string;
  
  // Campi comuni
  lastMessage: string;
  lastMessageAt: string;
  unreadByUser: number;
  unreadByOwner: number;
  unreadCount?: Record<string, number>;
};

interface ConversationsListProps {
  onCloseModal?: () => void;
}

const ConversationsList: React.FC<ConversationsListProps> = ({ onCloseModal }) => {
  const navigation = useNavigation<any>();
  const { token, user } = useContext(AuthContext);
  const { refreshUnreadCount } = useUnreadMessages();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isOwner = user?.role === 'owner';

  useEffect(() => {
    loadConversations();
  }, [token]);

  const loadConversations = async (isRefresh = false) => {
    if (!token) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const res = await fetch(`${API_URL}/api/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      } else {
        console.error('❌ Errore response:', res.status);
      }
    } catch (error) {
      console.error("❌ Errore caricamento conversazioni:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    loadConversations(true);
    refreshUnreadCount();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Ora";
    if (diffMins < 60) return `${diffMins}m fa`;
    if (diffHours < 24) return `${diffHours}h fa`;
    if (diffDays < 7) return `${diffDays}g fa`;
    
    return date.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "short",
    });
  };

  const handleOpenChat = (item: Conversation) => {
    // Chiudi il modal prima di navigare
    if (onCloseModal) {
      onCloseModal();
    }
    
    // Naviga alla chat appropriata
    if (item.type === 'group') {
      navigation.navigate("GroupChat", {
        conversationId: item._id,
        groupName: item.groupName,
        matchId: item.match?._id,
      });
    } else {
      const otherPerson = isOwner ? item.user : item.owner;
      navigation.navigate("Chat", {
        conversationId: item._id,
        strutturaName: item.struttura?.name,
        otherPersonName: otherPerson?.name,
      });
    }
    
    // Aggiorna badge dopo un secondo
    setTimeout(() => refreshUnreadCount(), 1000);
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    let unreadCount = 0;
    let displayName = '';
    let subtitle = '';
    let imageUri = '';
    let iconName: any = 'chatbubble-outline';
    
    if (item.type === 'group') {
      // Chat di gruppo
      unreadCount = item.unreadCount?.[user?.id || ''] || 0;
      displayName = item.groupName || 'Chat di Gruppo';
      subtitle = `👥 ${item.participants?.length || 0} partecipanti`;
      iconName = 'people';
    } else {
      // Chat diretta
      unreadCount = isOwner ? item.unreadByOwner : item.unreadByUser;
      displayName = item.struttura?.name || 'Struttura';
      const otherPerson = isOwner ? item.user : item.owner;
      subtitle = isOwner ? `👤 ${otherPerson?.name}` : `🏢 Chat con la struttura`;
      imageUri = item.struttura?.images?.[0] || '';
    }

    return (
      <Pressable
        style={styles.conversationCard}
        onPress={() => handleOpenChat(item)}
      >
        <View style={styles.conversationLeft}>
          {item.type === 'group' ? (
            <View style={[styles.conversationImage, styles.groupImagePlaceholder]}>
              <Ionicons name="people" size={24} color="#2196F3" />
            </View>
          ) : imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.conversationImage}
            />
          ) : (
            <View style={[styles.conversationImage, styles.conversationImagePlaceholder]}>
              <Ionicons name="business-outline" size={24} color="#999" />
            </View>
          )}

          <View style={styles.conversationInfo}>
            <View style={styles.conversationHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {item.type === 'group' && (
                  <Ionicons name="chatbubbles" size={14} color="#2196F3" />
                )}
                <Text style={styles.conversationTitle} numberOfLines={1}>
                  {displayName}
                </Text>
              </View>
              <Text style={styles.conversationTime}>
                {formatTime(item.lastMessageAt)}
              </Text>
            </View>

            <Text style={styles.conversationSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>

            {item.lastMessage && (
              <Text
                style={[
                  styles.conversationLastMessage,
                  unreadCount > 0 && styles.conversationLastMessageUnread,
                ]}
                numberOfLines={1}
              >
                {item.lastMessage}
              </Text>
            )}
          </View>
        </View>

        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </Text>
          </View>
        )}
      </Pressable>
    );
  };

  if (!token) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="lock-closed-outline" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>Accedi per vedere le chat</Text>
        <Text style={styles.emptyText}>
          Effettua il login per chattare con le strutture
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2979ff" />
      </View>
    );
  }

  if (conversations.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>Nessuna conversazione</Text>
        <Text style={styles.emptyText}>
          {isOwner
            ? "Quando riceverai messaggi dai clienti, appariranno qui"
            : "Contatta una struttura per iniziare una chat!"}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={conversations}
      renderItem={renderConversation}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#2979ff"]}
          tintColor="#2979ff"
        />
      }
      style={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  conversationCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  conversationLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  conversationImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  conversationImagePlaceholder: {
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  groupImagePlaceholder: {
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    flex: 1,
  },
  conversationTime: {
    fontSize: 12,
    color: "#999",
    marginLeft: 8,
  },
  conversationSubtitle: {
    fontSize: 13,
    color: "#666",
    marginBottom: 2,
  },
  conversationLastMessage: {
    fontSize: 14,
    color: "#999",
  },
  conversationLastMessageUnread: {
    color: "#1a1a1a",
    fontWeight: "500",
  },
  unreadBadge: {
    backgroundColor: "#2979ff",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 6,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default ConversationsList;