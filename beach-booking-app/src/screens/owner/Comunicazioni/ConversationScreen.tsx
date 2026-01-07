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
  type: 'direct' | 'group';
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
  groupName?: string;
  participants?: any[];
  match?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadByUser?: number;
  unreadByOwner?: number;
  unreadCount?: Map<string, number>;
};

export default function OwnerConversationsScreen() {
  const navigation = useNavigation<any>();
  const { token, user } = useContext(AuthContext);
  const { refreshUnreadCount } = useUnreadMessages();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "personal" | "group">("all");

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
        console.log('📬 Conversazioni ricevute:', JSON.stringify(data, null, 2));
        
        // Debug: conta per tipo
        const directCount = data.filter((c: any) => c.type === 'direct').length;
        const groupCount = data.filter((c: any) => c.type === 'group').length;
        console.log(`📬 Direct: ${directCount}, Group: ${groupCount}`);
        
        // Debug: mostra dettagli conversazioni gruppo
        const groups = data.filter((c: any) => c.type === 'group');
        if (groups.length > 0) {
          console.log('📬 Dettagli conversazioni gruppo:', groups.map((g: any) => ({
            id: g._id,
            groupName: g.groupName,
            participants: g.participants?.length,
            match: g.match,
            lastMessage: g.lastMessage,
          })));
        }
        
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

  const getUnreadCount = (conv: Conversation) => {
    if (conv.type === 'group') {
      // unreadCount è un oggetto, non una Map
      const unreadMap = conv.unreadCount as any;
      const count = unreadMap?.[user?.id] || 0;
      console.log(`📬 Unread gruppo ${conv._id}:`, count, 'userId:', user?.id, 'unreadMap:', unreadMap);
      return count;
    }
    const count = conv.unreadByOwner || 0;
    console.log(`📬 Unread direct ${conv._id}:`, count);
    return count;
  };

  const filteredConversations = conversations.filter((conv) => {
    if (filter === "personal") {
      return conv.type === 'direct';
    }
    if (filter === "group") {
      return conv.type === 'group';
    }
    return true; // "all"
  });

  const personalCount = conversations.filter(c => c.type === 'direct').length;
  const groupCount = conversations.filter(c => c.type === 'group').length;
  const totalUnread = conversations.reduce(
    (sum, conv) => sum + getUnreadCount(conv),
    0
  );

  const renderConversation = ({ item }: { item: Conversation }) => {
    const unreadCount = getUnreadCount(item);
    const hasUnread = unreadCount > 0;
    const isGroup = item.type === 'group';

    return (
      <Pressable
        style={[styles.conversationCard, hasUnread && styles.conversationCardUnread]}
        onPress={() => {
          if (isGroup) {
            navigation.navigate("GroupChat", {
              conversationId: item._id,
              groupName: item.groupName,
              matchId: item.match,
            });
          } else {
            navigation.navigate("Chat", {
              conversationId: item._id,
              strutturaName: item.struttura?.name,
              userName: item.user?.name,
              userId: item.user?._id,
            });
          }
          setTimeout(() => refreshUnreadCount(), 1000);
        }}
      >
        <View style={styles.conversationLeft}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, isGroup && { backgroundColor: '#E3F2FD' }]}>
              <Ionicons 
                name={isGroup ? "people" : "person"} 
                size={24} 
                color="#2196F3" 
              />
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
                {isGroup ? item.groupName : item.user?.name}
              </Text>
              <Text style={styles.conversationTime}>
                {formatTime(item.lastMessageAt)}
              </Text>
            </View>

            {!isGroup && item.struttura && (
              <View style={styles.strutturaRow}>
                <Ionicons name="business-outline" size={14} color="#666" />
                <Text style={styles.strutturaName} numberOfLines={1}>
                  {item.struttura.name}
                </Text>
              </View>
            )}

            {isGroup && item.match && (
              <>
                <View style={styles.strutturaRow}>
                  <Ionicons name="calendar-outline" size={14} color="#2196F3" />
                  <Text style={styles.strutturaName} numberOfLines={1}>
                    {new Date(item.match.booking?.date).toLocaleDateString('it-IT', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })} • {item.match.booking?.startTime}
                  </Text>
                </View>
                {item.match.booking?.campo && (
                  <View style={styles.strutturaRow}>
                    <Ionicons name="location-outline" size={14} color="#4CAF50" />
                    <Text style={styles.strutturaName} numberOfLines={1}>
                      {item.match.booking.campo.name}
                    </Text>
                  </View>
                )}
              </>
            )}

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
              {unreadCount > 99 ? "99+" : unreadCount}
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
              filter === "personal" && styles.filterButtonActive,
            ]}
            onPress={() => setFilter("personal")}
          >
            <View style={styles.filterButtonContent}>
              <Ionicons 
                name="person-outline" 
                size={16} 
                color={filter === "personal" ? "white" : "#666"} 
              />
              <Text
                style={[
                  styles.filterButtonText,
                  filter === "personal" && styles.filterButtonTextActive,
                ]}
              >
                Personali ({personalCount})
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={[
              styles.filterButton,
              filter === "group" && styles.filterButtonActive,
            ]}
            onPress={() => setFilter("group")}
          >
            <View style={styles.filterButtonContent}>
              <Ionicons 
                name="people-outline" 
                size={16} 
                color={filter === "group" ? "white" : "#666"} 
              />
              <Text
                style={[
                  styles.filterButtonText,
                  filter === "group" && styles.filterButtonTextActive,
                ]}
              >
                Gruppi ({groupCount})
              </Text>
            </View>
          </Pressable>
        </View>
      </View>

      {filteredConversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name={filter === "group" ? "people-outline" : filter === "personal" ? "person-outline" : "chatbubbles-outline"}
            size={64}
            color="#ccc"
          />
          <Text style={styles.emptyTitle}>
            {filter === "personal" 
              ? "Nessuna chat personale" 
              : filter === "group" 
              ? "Nessuna chat di gruppo" 
              : "Nessuna conversazione"}
          </Text>
          <Text style={styles.emptyText}>
            {filter === "personal"
              ? "Quando i clienti ti contatteranno, le chat appariranno qui"
              : filter === "group"
              ? "Le chat di gruppo dei match appariranno qui"
              : "Quando i clienti ti contatteranno o verranno creati match, le chat appariranno qui"}
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