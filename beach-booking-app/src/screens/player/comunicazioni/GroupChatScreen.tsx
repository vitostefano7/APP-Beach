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
import { useContext, useState, useEffect, useRef, useLayoutEffect } from "react";

import API_URL from "../../../config/api";
import { AuthContext } from "../../../context/AuthContext";
import { styles } from "../styles-player/ChatScreen.styles";

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

export default function GroupChatScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { token, user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  const { conversationId, groupName, matchId } = route.params;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [canSendMessages, setCanSendMessages] = useState(true);
  const [bookingInfo, setBookingInfo] = useState<{
    bookingId?: string;
    strutturaName?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
  } | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const flatListRef = useRef<FlatList>(null);

  useLayoutEffect(() => {
    const parent = navigation.getParent();
    const tabParent = parent?.getParent();
    parent?.setOptions({ tabBarStyle: { display: "none" } });
    tabParent?.setOptions({ tabBarStyle: { display: "none" } });
    return () => {
      parent?.setOptions({ tabBarStyle: undefined });
      tabParent?.setOptions({ tabBarStyle: undefined });
    };
  }, [navigation]);

  useEffect(() => {
    loadMatchInfo();
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [conversationId, matchId]);

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

  const loadMatchInfo = async () => {
    if (!token || !matchId) return;

    try {
      const res = await fetch(`${API_URL}/matches/${matchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const match = await res.json();
        const booking = match.booking || {};
        setBookingInfo({
          bookingId: booking._id,
          strutturaName: booking.campo?.struttura?.name,
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime,
        });
      }
    } catch (error) {
      console.error("Errore caricamento match:", error);
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
        
        if (errorData.reason === 'not_confirmed') {
          setCanSendMessages(false);
          Alert.alert(
            "Non puoi inviare messaggi",
            "Devi confermare la partecipazione al match per inviare messaggi nella chat di gruppo."
          );
          setInputText(content);
          return;
        }
        
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

  const formatDay = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("it-IT", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
    } catch {
      return "";
    }
  };

  const formatTimeRange = (startTime?: string, endTime?: string) => {
    if (!startTime) return "--:--";
    return endTime ? `${startTime} - ${endTime}` : startTime;
  };

  const getSenderColor = (senderId: string) => {
    const colors = ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336', '#00BCD4'];
    const index = senderId.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMine = item.sender._id === user?.id;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showAvatar = !prevMessage || prevMessage.sender._id !== item.sender._id;
    const isConsecutive = prevMessage && prevMessage.sender._id === item.sender._id;
    const senderColor = getSenderColor(item.sender._id);

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
            <View style={[styles.avatar, { backgroundColor: senderColor }]}>
              <Text style={{ color: "white", fontWeight: "600", fontSize: 12 }}>
                {item.sender.name.charAt(0).toUpperCase()}
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
            <Text style={[styles.senderName, { color: senderColor }]}>
              {item.sender.name}
            </Text>
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
            <View style={[styles.avatar, { backgroundColor: senderColor }]}>
              <Text style={{ color: "white", fontWeight: "600", fontSize: 12 }}>
                {(user?.name || "U").charAt(0).toUpperCase()}
              </Text>
            </View>
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

          <Text style={styles.headerTitleCentered} numberOfLines={1}>
            Chat della partita
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* SubHeader */}
        <View style={styles.subHeader}>
          <View style={styles.subHeaderLeft}>
            <Text style={styles.subHeaderTitle} numberOfLines={1}>
              {bookingInfo?.strutturaName || "Struttura"}
            </Text>
            <Text style={styles.subHeaderDay} numberOfLines={1}>
              {formatDay(bookingInfo?.date) +
                (bookingInfo?.startTime
                  ? ` • ${formatTimeRange(bookingInfo?.startTime, bookingInfo?.endTime)}`
                  : "")}
            </Text>
          </View>
          <Pressable
            style={[
              styles.detailsButton,
              !bookingInfo?.bookingId && { opacity: 0.5 },
            ]}
            onPress={() => {
              if (bookingInfo?.bookingId) {
                navigation.navigate("DettaglioPrenotazione", {
                  bookingId: bookingInfo.bookingId,
                });
              }
            }}
            disabled={!bookingInfo?.bookingId}
          >
            <Ionicons name="calendar-outline" size={18} color="#2196F3" />
            <Text style={styles.detailsButtonText}>Dettaglio</Text>
          </Pressable>
        </View>

        {!canSendMessages && (
          <View style={styles.warningBanner}>
            <Ionicons name="warning-outline" size={18} color="#FF9800" />
            <Text style={styles.warningText}>
              Conferma la partecipazione per inviare messaggi
            </Text>
          </View>
        )}

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
        <Pressable style={styles.addButton} onPress={() => {}}>
          <Ionicons name="add" size={22} color="#1a1a1a" />
        </Pressable>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder={canSendMessages ? "Scrivi un messaggio..." : "Non puoi inviare messaggi"}
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            editable={canSendMessages && !sending}
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
            inputText.trim() && !sending && canSendMessages && styles.sendButtonActive,
          ]}
          onPress={sendMessage}
          disabled={!inputText.trim() || sending || !canSendMessages}
        >
          {sending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons 
              name={inputText.trim() && canSendMessages ? "send" : "send-outline"} 
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

// Se hai bisogno di sovrascrivere o aggiungere stili, puoi farlo qui:
const additionalStyles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
});