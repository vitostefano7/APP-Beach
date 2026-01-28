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
  StyleSheet,
} from "react-native";
import { Keyboard } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useContext, useState, useEffect, useRef } from "react";

import API_URL from "../../../config/api";
import { AuthContext } from "../../../context/AuthContext";
import { styles } from "../styles/ChatScreen.styles";
import Avatar from "../../../components/Avatar/Avatar";
import { resolveImageUrl } from "../../../utils/imageUtils";

type Message = {
  _id: string;
  conversationId: string;
  sender: {
    _id: string;
    name: string;
    avatarUrl?: string | null;
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
  const insets = useSafeAreaInsets();

  const { conversationId, groupName, matchId, headerInfo, struttura } = route.params || {};

  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [matchData, setMatchData] = useState<any>(null);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [bookingInfo, setBookingInfo] = useState<{
    bookingId?: string;
    strutturaName?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    participantsCount?: number;
  } | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadConversation();
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    console.log("🎹 [GroupChat] Configurazione listener tastiera...");
    console.log("📱 [GroupChat] insets.bottom (safe area):", insets.bottom);
    
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        console.log("🎹 [GroupChat] Tastiera APERTA:", {
          height: e.endCoordinates.height,
          screenY: e.endCoordinates.screenY,
          duration: e.duration,
          platform: Platform.OS,
        });
        const adjustedHeight = Platform.OS === 'android' ? e.endCoordinates.height - 1 : e.endCoordinates.height;
        setKeyboardHeight(adjustedHeight);
        console.log("📍 [GroupChat] keyboardHeight settato:", adjustedHeight);
        console.log("📍 [GroupChat] marginBottom che verrà applicato:", adjustedHeight);
        console.log("📍 [GroupChat] paddingBottom che verrà applicato:", Math.max(insets.bottom, 12));
        console.log("📍 [GroupChat] TOTALE spostamento container:", adjustedHeight + Math.max(insets.bottom, 12));
        // Scrolla automaticamente quando la tastiera appare
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      (e) => {
        console.log("🎹 [GroupChat] Tastiera CHIUSA");
        console.log("📍 [GroupChat] keyboardHeight resettato a 0");
        setKeyboardHeight(0);
      }
    );

    return () => {
      console.log("🎹 [GroupChat] Rimozione listener tastiera");
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

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

          // Popola bookingInfo dal match
          const booking = conversation.match.booking || {};
          setBookingInfo({
            bookingId: booking._id,
            strutturaName: booking.campo?.struttura?.name || booking.struttura?.name,
            date: booking.date,
            startTime: booking.startTime,
            endTime: booking.endTime,
            participantsCount: conversation.match.players?.length || 0,
          });
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

  const handleOpenProfile = (targetUserId?: string) => {
    if (!targetUserId || targetUserId === user?.id) return;
    navigation.navigate("ProfiloUtente", { userId: targetUserId });
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
    const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
    const showAvatar = !nextMessage || nextMessage.sender._id !== item.sender._id;
    const isConsecutive = prevMessage && prevMessage.sender._id === item.sender._id;
    const isOwner = item.senderType === 'owner';
    const strutturaAvatarUrl = struttura?.images?.[0]
      ? resolveImageUrl(struttura.images[0])
      : undefined;

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
            <Avatar
              name={item.sender.name}
              avatarUrl={item.sender.avatarUrl}
              size={32}
              backgroundColor={isOwner ? "#FF9800" : getSenderColor(item.sender._id)}
              textColor="#fff"
              onPress={() => handleOpenProfile(item.sender._id)}
            />
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

        {isMine && showAvatar && (
          <View style={styles.avatarContainerMine}>
            <Avatar
              name={headerInfo?.strutturaName || groupName || "Struttura"}
              avatarUrl={strutturaAvatarUrl}
              size={32}
              backgroundColor="#E3F2FD"
              textColor="#2196F3"
            />
          </View>
        )}

        {isMine && !showAvatar && <View style={styles.avatarSpacer} />}
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
    <SafeAreaView style={[styles.safe, { flex: 1 }]} edges={["top"]}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </Pressable>

          <Text style={additionalStyles.headerTitleCentered} numberOfLines={1}>
            Chat della Partita
          </Text>
          <View style={additionalStyles.headerSpacer} />
        </View>

        {/* SubHeader */}
        <View style={additionalStyles.subHeader}>
          <View style={additionalStyles.subHeaderLeft}>
            <Text style={additionalStyles.subHeaderTitle} numberOfLines={1}>
              {bookingInfo?.strutturaName || "Struttura"}
            </Text>
            <Text style={additionalStyles.subHeaderDay} numberOfLines={1}>
              {bookingInfo?.date
                ? new Date(bookingInfo.date).toLocaleDateString("it-IT", {
                    day: "2-digit",
                    month: "2-digit",
                  })
                : "Data"}
              {" - "}
              {bookingInfo?.startTime || "Ora"}
              {" - "}
              {bookingInfo?.participantsCount || 0} partecipanti
            </Text>
          </View>
          <Pressable
            style={[
              additionalStyles.detailsButton,
              !bookingInfo?.bookingId && { opacity: 0.5 },
            ]}
            onPress={() => {
              if (bookingInfo?.bookingId) {
                navigation.navigate("OwnerDettaglioPrenotazione" as never, { bookingId: bookingInfo.bookingId } as never);
              }
            }}
            disabled={!bookingInfo?.bookingId}
          >
            <Ionicons name="calendar-outline" size={18} color="#2196F3" />
            <Text style={additionalStyles.detailsButtonText}>Dettaglio</Text>
          </Pressable>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[
            styles.messagesList,
            { 
              flexGrow: 1,
              paddingBottom: 8
            }
          ]}
          onContentSizeChange={() => {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }, 100);
          }}
          onLayout={() => {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }, 100);
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
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

        {/* Input Container - sempre in fondo, gestito da SafeAreaView */}
        <View 
          style={[
            styles.inputContainer, 
            { 
              paddingBottom: Math.max(insets.bottom, 12),
              marginBottom: keyboardHeight > 0 ? keyboardHeight + 10 : 0
            }
          ]}
          onLayout={(event) => {
            const { y, height } = event.nativeEvent.layout;
            console.log("📦 [GroupChat] Container position:", {
              y: y,
              height: height,
              containerBottom: y + height,
              marginBottom: keyboardHeight > 0 ? keyboardHeight + 10 : 0,
              paddingBottom: Math.max(insets.bottom, 12),
              keyboardHeight: keyboardHeight,
              insetsBottom: insets.bottom
            });
          }}
        >
        <Pressable style={additionalStyles.addButton} onPress={() => {}}>
          <Ionicons name="add" size={22} color="#1a1a1a" />
        </Pressable>
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
            onFocus={() => {
              console.log("⌨️ [GroupChat] Input FOCUS - keyboard height:", keyboardHeight);
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }}
            onBlur={() => {
              console.log("⌨️ [GroupChat] Input BLUR");
            }}
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
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Stili aggiuntivi per uniformare con la versione player
const additionalStyles = StyleSheet.create({
  headerTitleCentered: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  headerSpacer: {
    width: 24,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  subHeaderLeft: {
    flex: 1,
  },
  subHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  subHeaderDay: {
    fontSize: 14,
    color: '#666',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  detailsButtonText: {
    fontSize: 14,
    color: '#2196F3',
    marginLeft: 4,
  },
  addButton: {
    padding: 8,
    marginRight: 8,
    alignSelf: 'flex-end',
  },
});
