import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import API_URL from "../../config/api";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useUnreadMessages } from "../../context/UnreadMessagesContext";

type Conversation = {
  _id: string;
  type?: 'direct' | 'group';
  user?: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
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
  participants?: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
  match?: {
    _id: string;
    booking?: {
      date: string;
      startTime: string;
      struttura?: {
        _id: string;
        name: string;
      };
      campo?: {
        name: string;
        struttura?: {
          _id: string;
          name: string;
        };
      };
    };
  };
  lastMessage: string;
  lastMessageAt: string;
  unreadByUser?: number;
  unreadByOwner?: number;
  unreadCount?: Map<string, number>;
};

interface UseConversationsOptions {
  role: 'player' | 'owner';
  enableFilters?: boolean;
}

export const useConversations = ({ role, enableFilters = false }: UseConversationsOptions) => {
  const { token, user } = useContext(AuthContext);
  const { refreshUnreadCount } = useUnreadMessages();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Owner-specific states
  const [filter, setFilter] = useState<"all" | "personal" | "group">("all");
  const [selectedStruttura, setSelectedStruttura] = useState<string | null>(null);

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
        console.log(`📬 ${role} conversazioni caricate:`, data.length);
        setConversations(data);
      } else {
        console.error('❌ Errore response:', res.status);
      }
    } catch (error) {
      console.error(`❌ Errore caricamento conversazioni per ${role}:`, error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadConversations();
      refreshUnreadCount();
    }, [token])
  );

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

  // Estrai strutture uniche dalle conversazioni (solo per owner)
  const strutture = enableFilters
    ? Array.from(
        new Set(
          conversations
            .filter(c => c.struttura)
            .map(c => JSON.stringify({ id: c.struttura!._id, name: c.struttura!.name }))
        )
      ).map(s => JSON.parse(s))
    : [];

  // Filtra per struttura (se selezionata)
  const conversationsByStruttura = selectedStruttura
    ? conversations.filter(c => c.struttura?._id === selectedStruttura)
    : conversations;

  // Filtra per tipo (solo per owner)
  const filteredConversations = enableFilters
    ? conversationsByStruttura.filter((conv) => {
        if (filter === "personal" && conv.type !== 'direct') return false;
        if (filter === "group" && conv.type !== 'group') return false;
        return true;
      })
    : conversationsByStruttura;

  // Calcola conteggi
  const allCount = conversationsByStruttura.length;
  const personalCount = conversationsByStruttura.filter(c => c.type === 'direct').length;
  const groupCount = conversationsByStruttura.filter(c => c.type === 'group').length;

  const getUnreadCount = (conv: Conversation) => {
    if (role === 'owner' && conv.type === 'group') {
      const unreadMap = conv.unreadCount as any;
      const count = unreadMap?.[user?.id] || 0;
      return count;
    }
    const count = role === 'owner' ? conv.unreadByOwner || 0 : conv.unreadByUser || 0;
    return count;
  };

  return {
    conversations: filteredConversations,
    loading,
    refreshing,
    onRefresh,
    formatTime,
    getUnreadCount,
    // Owner-specific
    filter,
    setFilter,
    selectedStruttura,
    setSelectedStruttura,
    strutture,
    allCount,
    personalCount,
    groupCount,
  };
};