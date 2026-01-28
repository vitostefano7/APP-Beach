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
  type?: 'direct' | 'group';
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
  match?: {
    _id: string;
    players?: Array<{
      _id: string;
      user: {
        _id: string;
        name: string;
        email: string;
      };
      team?: "A" | "B";
      status: string;
    }>;
    booking?: {
      date: string;
      startTime: string;
      campo?: {
        name: string;
        struttura?: {
          name: string;
        };
      };
    };
  };
  participants?: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
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
        // Debug partecipanti
        data.forEach((conv: any) => {
          if (conv.type === 'group') {
            console.log('🔍 Conversazione gruppo:', {
              id: conv._id,
              participants: conv.participants?.length || 0,
              hasMatch: !!conv.match,
              matchId: conv.match?._id
            });
          }
        });
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

    // Debug: verifica struttura
    console.log('Rendering conversation:', {
      id: item._id,
      type: item.type,
      hasStruttura: !!item.struttura,
      struttura: item.struttura ? {
        name: (item.struttura as any).name,
        hasImages: !!(item.struttura as any).images
      } : null
    });

    // Gestisci conversazioni di gruppo
    if (item.type === 'group') {
      const matchInfo = item.match?.booking;
      const campo = matchInfo?.campo;
      const struttura = campo?.struttura || item.struttura;
      
      // Crea titolo descrittivo
      const strutturaName = struttura?.name || "Struttura";
      const groupTitle = `Partita - ${strutturaName}`;
      
      // Formatta giorno/ora/partecipanti
      let dayLabel = "";
      if (matchInfo?.date) {
        const date = new Date(matchInfo.date);
        dayLabel = date.toLocaleDateString("it-IT", {
          day: "2-digit",
          month: "2-digit",
        });
      }
      const timeLabel = matchInfo?.startTime || "";
      
      // Conta partecipanti dal match
      const participantsCount = item.match?.participants?.length || 0;
      const metaLine = [
        dayLabel || "Data",
        timeLabel || "Ora",
        `${participantsCount} partecipanti`,
      ].join(" - ");

      return (
        <Pressable
          style={styles.conversationCard}
          onPress={() => {
            navigation.navigate("GroupChat", {
              conversationId: item._id,
              groupName: item.groupName,
              matchId: item.match?._id,
              headerInfo: {
                strutturaName: struttura?.name,
                date: matchInfo?.date,
                startTime: matchInfo?.startTime,
                participantsCount: item.match?.participants?.length || 0,
                bookingId: matchInfo?._id,
              },
            });
            setTimeout(() => refreshUnreadCount(), 1000);
          }}
        >
          <View style={styles.conversationLeft}>
            <View style={[styles.conversationImage, styles.conversationImagePlaceholder, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="people" size={24} color="#2196F3" />
            </View>

            <View style={styles.conversationInfo}>
              <View style={styles.conversationHeader}>
                <Text style={styles.conversationTitle} numberOfLines={1}>
                  {groupTitle}
                </Text>
                <Text style={styles.conversationTime}>
                  {formatTime(item.lastMessageAt)}
                </Text>
              </View>

              <View style={styles.conversationFooter}>
                <View style={styles.matchInfoRow}>
                  <Text style={styles.matchInfoText} numberOfLines={1}>
                    {metaLine}
                  </Text>
                </View>
              </View>
              
              {item.lastMessage && (
                <Text style={styles.conversationMessage} numberOfLines={1}>
                  {item.lastMessage}
                </Text>
              )}
            </View>
          </View>

          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unreadCount}</Text>
            </View>
          )}
        </Pressable>
      );
    }

    // Per conversazioni direct, se non c'è struttura popolata, usa valori di fallback
    const strutturaName = item.struttura && typeof item.struttura === 'object' 
      ? (item.struttura as any).name || "Struttura" 
      : "Struttura";
    
    const strutturaImages = item.struttura && typeof item.struttura === 'object'
      ? (item.struttura as any).images || []
      : [];


    return (
      <Pressable
        style={styles.conversationCard}
        onPress={() => {
          navigation.navigate("Chat", {
            conversationId: item._id,
            strutturaName: strutturaName,
            otherPersonName: otherPerson?.name || "Utente",
            struttura: item.struttura,
          });
          // Aggiorna badge dopo aver aperto la chat
          setTimeout(() => refreshUnreadCount(), 1000);
        }}
      >
        <View style={styles.conversationLeft}>
          {strutturaImages.length > 0 ? (
            <Image
              source={{ uri: strutturaImages[0] }}
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
                {strutturaName}
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
