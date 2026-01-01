import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useContext, useState, useCallback } from "react";
import API_URL from "../../../config/api";
import { AuthContext } from "../../../context/AuthContext";
import { useUnreadMessages } from "../../../context/UnreadMessagesContext";
import { styles } from "../styles/ConversationScreen.styles";

type Conversation = {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  struttura: {
    _id: string;
    name: string;
    images: string[];
  };
  owner: {
    _id: string;
    name: string;
    email: string;
  };
  lastMessage: string;
  lastMessageAt: string;
  unreadByUser: number;
  unreadByOwner: number;
};

export default function OwnerConversationsScreen() {
  const navigation = useNavigation<any>();
  const { token, user } = useContext(AuthContext);
  const { refreshUnreadCount } = useUnreadMessages();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useFocusEffect(
    useCallback(() => {
      loadConversations();
      refreshUnreadCount();
    }, [token])
  );

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
        console.log('📬 Owner conversazioni caricate:', data.length);
        setConversations(data);
      }
    } catch (error) {
      console.error("Errore caricamento conversazioni:", error);
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

  const filteredConversations = conversations.filter((conv) => {
    if (filter === "unread") {
      return conv.unreadByOwner > 0;
    }
    return true;
  });

  const totalUnread = conversations.reduce(
    (sum, conv) => sum + conv.unreadByOwner,
    0
  );

  const renderConversation = ({ item }: { item: Conversation }) => {
    const hasUnread = item.unreadByOwner > 0;

    return (
      <Pressable
        style={[styles.conversationCard, hasUnread && styles.conversationCardUnread]}
        onPress={() => {
          navigation.navigate("Chat", {
            conversationId: item._id,
            strutturaName: item.struttura.name,
            userName: item.user.name,
            userId: item.user._id, // ✅ Aggiunto userId
          });
          setTimeout(() => refreshUnreadCount(), 1000);
        }}
      >
        <View style={styles.conversationLeft}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={24} color="#2196F3" />
            </View>
            {hasUnread && <View style={styles.unreadDot} />}
          </View>

          <View style={styles.conversationInfo}>
            <View style={styles.conversationHeader}>
              <Text
                style={[
                  styles.conversationTitle,
                  hasUnread && styles.conversationTitleUnread,
                ]}
                numberOfLines={1}
              >
                {item.user.name}
              </Text>
              <Text style={styles.conversationTime}>
                {formatTime(item.lastMessageAt)}
              </Text>
            </View>

            <View style={styles.strutturaRow}>
              <Ionicons name="business-outline" size={14} color="#666" />
              <Text style={styles.strutturaName} numberOfLines={1}>
                {item.struttura.name}
              </Text>
            </View>

            {item.lastMessage && (
              <Text
                style={[
                  styles.conversationLastMessage,
                  hasUnread && styles.conversationLastMessageUnread,
                ]}
                numberOfLines={2}
              >
                {item.lastMessage}
              </Text>
            )}
          </View>
        </View>

        {hasUnread && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>
              {item.unreadByOwner > 99 ? "99+" : item.unreadByOwner}
            </Text>
          </View>
        )}
      </Pressable>
    );
  };

  if (!token || user?.role !== "owner") {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyState}>
          <Ionicons name="lock-closed-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>Accesso negato</Text>
          <Text style={styles.emptyText}>
            Questa sezione è riservata ai proprietari
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Caricamento chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Comunicazioni</Text>

        <View style={styles.filterContainer}>
          <Pressable
            style={[styles.filterButton, filter === "all" && styles.filterButtonActive]}
            onPress={() => setFilter("all")}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === "all" && styles.filterButtonTextActive,
              ]}
            >
              Tutte ({conversations.length})
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.filterButton,
              filter === "unread" && styles.filterButtonActive,
            ]}
            onPress={() => setFilter("unread")}
          >
            <View style={styles.filterButtonContent}>
              <Text
                style={[
                  styles.filterButtonText,
                  filter === "unread" && styles.filterButtonTextActive,
                ]}
              >
                Da leggere
              </Text>
              {totalUnread > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{totalUnread}</Text>
                </View>
              )}
            </View>
          </Pressable>
        </View>
      </View>

      {filteredConversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name={filter === "unread" ? "checkmark-circle-outline" : "chatbubbles-outline"}
            size={64}
            color="#ccc"
          />
          <Text style={styles.emptyTitle}>
            {filter === "unread" ? "Tutto letto!" : "Nessuna conversazione"}
          </Text>
          <Text style={styles.emptyText}>
            {filter === "unread"
              ? "Non hai messaggi da leggere al momento"
              : "Quando i clienti ti contatteranno, le chat appariranno qui"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2196F3"]}
              tintColor="#2196F3"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}