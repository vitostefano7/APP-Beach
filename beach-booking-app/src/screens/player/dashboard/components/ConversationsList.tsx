// components/ConversationsList.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
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
import ConversationItem from "../../../../components/Conversation/ConversationItem";
import MatchModal from "../../../../components/Conversation/MatchModal";

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
      date?: string;
      startTime?: string;
      struttura?: {
        name: string;
      };
      campo?: {
        struttura?: {
          name: string;
        };
      };
    };
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
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  const isOwner = user?.role === 'owner';

  useEffect(() => {
    loadConversations();
  }, [token]);

  useEffect(() => {
    // Chiudi il modal quando si naviga via da questo componente
    const unsubscribe = navigation.addListener('blur', () => {
      if (onCloseModal) {
        onCloseModal();
      }
    });
    return unsubscribe;
  }, [navigation, onCloseModal]);

  useEffect(() => {
    if (token) {
      fetchMatches();
    }
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

  const getUnreadCount = (conversation: Conversation) => {
    if (conversation.type === 'group') {
      return conversation.unreadCount?.[user?.id || ''] || 0;
    }
    return isOwner ? conversation.unreadByOwner : conversation.unreadByUser;
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        onRefresh();
        refreshUnreadCount();
      } else {
        console.error('Errore nell\'eliminazione della conversazione');
      }
    } catch (error) {
      console.error('Errore nell\'eliminazione della conversazione:', error);
    }
  };

  const fetchMatches = async () => {
    setLoadingMatches(true);
    try {
      let endpoint = '';
      if (isOwner) {
        endpoint = `${API_URL}/matches/future-followed`;
      } else {
        endpoint = `${API_URL}/matches/me?status=open`;
      }
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      let data = await response.json();

      if (!isOwner) {
        // Filtra partite future per giocatori
        const now = new Date();
        data = data.filter((match: any) => {
          const booking = match.booking;
          return booking && new Date(booking.date) > now;
        });
      }

      setMatches(data);
    } catch (error) {
      console.error("Errore nel caricamento delle partite:", error);
    } finally {
      setLoadingMatches(false);
    }
  };

  const openGroupChat = async (match: any) => {
    try {
      const response = await fetch(`${API_URL}/api/conversations/match/${match._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Errore API:', errorData);
        throw new Error(errorData.message || 'Errore nella creazione della conversazione');
      }
      
      const conversation = await response.json();
      
      if (!conversation._id) {
        throw new Error('Conversazione non valida');
      }

      // Chiudi il modal principale se esiste
      if (onCloseModal) {
        onCloseModal();
      }
      
      navigation.navigate("GroupChat", { conversationId: conversation._id, match });
      setShowMatchModal(false);
    } catch (error) {
      console.error("Errore nell'apertura della chat di gruppo:", error);
    }
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <ConversationItem
      conversation={item as any}
      role={isOwner ? 'owner' : 'player'}
      formatTime={formatTime}
      getUnreadCount={getUnreadCount as any}
      refreshUnreadCount={refreshUnreadCount}
      onDelete={deleteConversation}
    />
  );

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
    <View style={styles.container}>
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

      <Pressable
        style={styles.fab}
        onPress={() => setShowMatchModal(true)}
      >
        <Ionicons name="add" size={24} color="white" />
      </Pressable>

      <MatchModal
        visible={showMatchModal}
        onRequestClose={() => setShowMatchModal(false)}
        matches={matches}
        loading={loadingMatches}
        onSelectMatch={openGroupChat}
        emptyText={
          isOwner
            ? "Non ci sono partite future nelle strutture che gestisci"
            : "Non ci sono partite future a cui partecipi"
        }
      />
    </View>
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2979ff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
