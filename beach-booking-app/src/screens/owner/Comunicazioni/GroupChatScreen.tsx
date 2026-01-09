import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useContext, useState, useEffect, useRef } from "react";

import API_URL from "../../../config/api";
import { AuthContext } from "../../../context/AuthContext";
import { styles } from "../styles/ChatScreen.styles";

type Message = {
  _id: string;
  conversationId: string;
  sender: {
    _id: string;
    name: string;
  };
  senderType: "user" | "owner";
  content: string;
  read: boolean;
  createdAt: string;
};

type Participant = {
  _id: string;
  name: string;
  email: string;
};

export default function GroupChatScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { token, user } = useContext(AuthContext);

  const { conversationId, groupName, matchId, headerInfo } = route.params || {};

  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [matchData, setMatchData] = useState<any>(null);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadConversation();
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [conversationId]);

  const loadConversation = async () => {
    if (!token) return;
    if (!matchId) return;

    try {
      const res = await fetch(
        `${API_URL}/api/conversations/match/${matchId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        const conversation = await res.json();
        console.log('🎯 Conversation data:', JSON.stringify(conversation, null, 2));
        setParticipants(conversation.participants || []);
        
        // Carica anche i dati del match
        if (conversation.match) {
          console.log('🎯 Match data:', JSON.stringify(conversation.match, null, 2));
          setMatchData(conversation.match);
        } else {
          console.log('⚠️ Nessun match nella conversazione');
        }
      }
    } catch (error) {
      console.error("Errore caricamento conversazione:", error);
    }
  };

  const loadMessages = async () => {
    if (!token) return;

    try {
      const res = await fetch(
        `${API_URL}/api/conversations/${conversationId}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Errore caricamento messaggi:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!token || !inputText.trim() || sending) return;

    const content = inputText.trim();
    setInputText("");
    setSending(true);

    try {
      const res = await fetch(
        `${API_URL}/api/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Errore invio messaggio');
      }

      const newMessage = await res.json();
      setMessages((prev) => [...prev, newMessage]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      console.error("Errore invio messaggio:", error);
      Alert.alert("Errore", error.message || "Impossibile inviare il messaggio");
      setInputText(content);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Ora";
    if (diffMins < 60) return `${diffMins}m fa`;

    return date.toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSenderColor = (senderId: string) => {
    // Genera un colore consistente per ogni sender
    const colors = ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336', '#00BCD4'];
    const index = senderId.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMine = item.sender._id === user?.id;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showAvatar = !prevMessage || prevMessage.sender._id !== item.sender._id;
    const isConsecutive = prevMessage && prevMessage.sender._id === item.sender._id;
    const isOwner = item.senderType === 'owner';

    return (
      <View
        style={[
          styles.messageContainer,
          isMine ? styles.messageContainerMine : styles.messageContainerTheirs,
          isConsecutive && styles.messageContainerConsecutive,
        ]}
      >
        {!isMine && showAvatar && (
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: isOwner ? '#FF9800' : getSenderColor(item.sender._id) }]}>
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 12 }}>
                {isOwner ? '👑' : item.sender.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
        )}

        {!isMine && !showAvatar && <View style={styles.avatarSpacer} />}

        <View
          style={[
            styles.messageBubble,
            isMine ? styles.messageBubbleMine : styles.messageBubbleTheirs,
            isConsecutive && (isMine ? styles.bubbleConsecutiveMine : styles.bubbleConsecutiveTheirs),
          ]}
        >
          {!isMine && showAvatar && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <Text style={[styles.senderName, { color: isOwner ? '#FF9800' : getSenderColor(item.sender._id) }]}>
                {item.sender.name}
              </Text>
              {isOwner && (
                <View style={{ backgroundColor: '#FF9800', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: 'white' }}>PROPRIETARIO</Text>
                </View>
              )}
            </View>
          )}
          <Text
            style={[
              styles.messageText,
              isMine ? styles.messageTextMine : styles.messageTextTheirs,
            ]}
          >
            {item.content}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isMine ? styles.messageTimeMine : styles.messageTimeTheirs,
            ]}
          >
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <View style={styles.safe}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.header}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
            </Pressable>

            <View style={styles.headerCenter}>
              <View style={[styles.headerAvatar, { backgroundColor: '#2196F3' }]}>
                <Ionicons name="people" size={20} color="white" />
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {matchData?.booking?.campo?.struttura?.name
                    ? `Partita - ${matchData.booking.campo.struttura.name}`
                    : matchData?.booking?.struttura?.name
                    ? `Partita - ${matchData.booking.struttura.name}`
                    : headerInfo?.strutturaName
                    ? `Partita - ${headerInfo.strutturaName}`
                    : groupName || "Chat di Gruppo"}
                </Text>
                {(matchData?.booking || headerInfo?.date || headerInfo?.startTime) && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <Ionicons name="calendar-outline" size={11} color="#666" />
                      <Text style={[styles.headerSubtitle, { fontSize: 11 }]}>
                        {new Date(
                          matchData?.booking?.date || headerInfo?.date || new Date()
                        ).toLocaleDateString('it-IT', {
                          day: '2-digit',
                          month: 'short'
                        })} - {matchData?.booking?.startTime || headerInfo?.startTime || '--:--'} - {headerInfo?.participantsCount ?? participants.length} utenti
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            <Pressable 
              style={styles.infoButton}
              onPress={() => {
                const bookingId = matchData?.booking?._id || headerInfo?.bookingId;
                if (!bookingId) {
                  Alert.alert("Errore", "Prenotazione non disponibile");
                  return;
                }
                navigation.navigate("OwnerDettaglioPrenotazione" as never, { bookingId } as never);
              }}
            >
              <Ionicons name="calendar-outline" size={24} color="#1a1a1a" />
            </Pressable>
          </View>
        </SafeAreaView>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="chatbubbles-outline" size={64} color="#2196F3" />
              </View>
              <Text style={styles.emptyTitle}>Nessun messaggio ancora</Text>
              <Text style={styles.emptyText}>
                Inizia la conversazione con il gruppo!
              </Text>
            </View>
          }
        />

        <SafeAreaView edges={["bottom"]}>
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Scrivi un messaggio..."
                placeholderTextColor="#999"
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={1000}
                editable={!sending}
              />
            </View>

            <Pressable
              style={[
                styles.sendButton,
                inputText.trim() && !sending && styles.sendButtonActive,
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons 
                  name={inputText.trim() ? "send" : "send-outline"} 
                  size={20} 
                  color="white" 
                />
              )}
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </KeyboardAvoidingView>
  );
}
