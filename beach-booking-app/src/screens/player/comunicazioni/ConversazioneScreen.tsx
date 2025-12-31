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
import { styles } from "../styles-player/ConversazioneScreen.styles";

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

export default function ConversationsScreen() {
  const navigation = useNavigation<any>();
  const { token, user } = useContext(AuthContext);
  const { refreshUnreadCount } = useUnreadMessages();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isOwner = user?.role === 'owner';

  useFocusEffect(
    useCallback(() => {
      loadConversations();
      refreshUnreadCount(); // ← Aggiorna badge quando torna sullo screen
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
        console.log('📬 Conversazioni caricate:', data.length);
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

  const renderConversation = ({ item }: { item: Conversation }) => {
    const unreadCount = isOwner ? item.unreadByOwner : item.unreadByUser;
    const otherPerson = isOwner ? item.user : item.owner;

    return (
      <Pressable
        style={styles.conversationCard}
        onPress={() => {
          navigation.navigate("Chat", {
            conversationId: item._id,
            strutturaName: item.struttura.name,
            otherPersonName: otherPerson.name,
          });
          // Aggiorna badge dopo aver aperto la chat
          setTimeout(() => refreshUnreadCount(), 1000);
        }}
      >
        <View style={styles.conversationLeft}>
          {item.struttura.images?.length > 0 ? (
            <Image
              source={{ uri: item.struttura.images[0] }}
              style={styles.conversationImage}
            />
          ) : (
            <View style={[styles.conversationImage, styles.conversationImagePlaceholder]}>
              <Ionicons name="business-outline" size={24} color="#999" />
            </View>
          )}

          <View style={styles.conversationInfo}>
            <View style={styles.conversationHeader}>
              <Text style={styles.conversationTitle} numberOfLines={1}>
                {item.struttura.name}
              </Text>
              <Text style={styles.conversationTime}>
                {formatTime(item.lastMessageAt)}
              </Text>
            </View>

            <Text style={styles.conversationSubtitle} numberOfLines={1}>
              {isOwner ? `👤 ${otherPerson.name}` : `🏢 Chat con la struttura`}
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
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyState}>
          <Ionicons name="lock-closed-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>Accedi per vedere le chat</Text>
          <Text style={styles.emptyText}>
            Effettua il login per chattare con le strutture
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2979ff" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messaggi</Text>
      </View>

      {conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>Nessuna conversazione</Text>
          <Text style={styles.emptyText}>
            {isOwner
              ? "Quando riceverai messaggi dai clienti, appariranno qui"
              : "Contatta una struttura per iniziare una chat!"}
          </Text>
        </View>
      ) : (
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
        />
      )}
    </SafeAreaView>
  );
}