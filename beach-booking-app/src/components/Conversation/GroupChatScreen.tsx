import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Keyboard } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useContext, useState, useEffect, useRef, useLayoutEffect } from "react";

import API_URL from "../../config/api";
import { useCustomAlert } from "../CustomAlert/CustomAlert";
import { AuthContext } from "../../context/AuthContext";
import { styles as baseStyles } from "../../screens/player/styles-player/ChatScreen.styles";
import Avatar from "../Avatar/Avatar";
import { resolveImageUrl } from "../../utils/imageUtils";

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

type GroupChatScreenProps = {
  role: "player" | "owner";
};

export default function GroupChatScreen({ role }: GroupChatScreenProps) {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { token, user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  const { showAlert, AlertComponent } = useCustomAlert();

  const { conversationId, groupName, matchId, headerInfo, bookingId: paramBookingId, struttura } = route.params;

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
    participantsCount?: number;
  } | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const flatListRef = useRef<FlatList>(null);

  useLayoutEffect(() => {
    if (role === "player") {
      const parent = navigation.getParent();
      const tabParent = parent?.getParent();
      parent?.setOptions({ tabBarStyle: { display: "none" } });
      tabParent?.setOptions({ tabBarStyle: { display: "none" } });
      return () => {
        parent?.setOptions({ tabBarStyle: undefined });
        tabParent?.setOptions({ tabBarStyle: undefined });
      };
    }
  }, [navigation, role]);

  useEffect(() => {
    if (role === "player") {
      loadMatchInfo();
    } else {
      loadConversation();
    }
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [conversationId, matchId, role]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        const adjustedHeight =
          Platform.OS === "android"
            ? e.endCoordinates.height - 1
            : e.endCoordinates.height;
        console.log("⌨️ [GroupChatScreen] Tastiera APERTA:", {
          role,
          platform: Platform.OS,
          keyboardHeight: adjustedHeight,
          screenHeight: e.endCoordinates.screenY,
        });
        setKeyboardHeight(adjustedHeight);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        console.log("⌨️ [GroupChatScreen] Tastiera CHIUSA:", {
          role,
          platform: Platform.OS,
          screenHeight: Dimensions.get("window").height,
        });
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [role]);

  const loadConversation = async () => {
    if (!token) return;

    try {
      const res = await fetch(
        `${API_URL}/api/conversations/${conversationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.ok) {
        const data = await res.json();
        if (data.matchId) {
          await loadMatchInfo(data.matchId);
        }
      }
    } catch (error) {
      console.error("Errore caricamento conversazione:", error);
    }
  };

  const loadMatchInfo = async (matchIdParam?: string) => {
    const targetMatchId = matchIdParam || matchId;
    if (!token || !targetMatchId) return;

    try {
      const res = await fetch(
        `${API_URL}/matches/${targetMatchId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.ok) {
        const data = await res.json();
        const userParticipant = data.players?.find(
          (p: any) => p.user?._id === user?.id || p.user === user?.id
        );

        if (role === "player") {
          setCanSendMessages(
            !userParticipant || userParticipant.status === "confirmed"
          );
        }

        setBookingInfo({
          bookingId: data.booking?._id || data._id,
          strutturaName:
            data.booking?.campo?.struttura?.name ||
            data.campo?.struttura?.name ||
            "Struttura",
          date: data.booking?.date || data.date,
          startTime: data.booking?.startTime || data.startTime,
          endTime: data.booking?.endTime || data.endTime,
          participantsCount:
            data.players?.filter((p: any) => p.status === "confirmed")
              .length || 0,
        });
      }
    } catch (error) {
      console.error("Errore caricamento info match:", error);
    }
  };

  const loadMessages = async () => {
    if (!token) return;

    try {
      const res = await fetch(
        `${API_URL}/api/conversations/${conversationId}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
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

        if (role === "player" && errorData.reason === "not_confirmed") {
          setCanSendMessages(false);
          showAlert({
            type: 'warning',
            title: 'Non puoi inviare messaggi',
            message: 'Devi confermare la partecipazione al match per inviare messaggi nella chat di gruppo.',
          });
          setInputText(content);
          return;
        }

        throw new Error(errorData.message || "Errore invio messaggio");
      }

      const newMessage = await res.json();
      setMessages((prev) => [...prev, newMessage]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      console.error("Errore invio messaggio:", error);
      showAlert({
        type: 'error',
        title: 'Errore',
        message: error.message || "Impossibile inviare il messaggio",
      });
      setInputText(content);
    } finally {
      setSending(false);
    }
  };

  const deleteConversation = async () => {
    showAlert({
      type: 'warning',
      title: 'Elimina conversazione',
      message: 'Sei sicuro di voler eliminare questa conversazione di gruppo? Questa azione non può essere annullata.',
      buttons: [
        {
          text: "Annulla",
          style: "cancel",
        },
        {
          text: "Elimina",
          style: "destructive",
          onPress: async () => {
            try {
              const endpoint = role === "owner"
                ? `${API_URL}/owner/conversazioni/${conversationId}`
                : `${API_URL}/conversazioni/${conversationId}`;

              const response = await fetch(endpoint, {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (!response.ok) {
                throw new Error("Errore durante l'eliminazione");
              }

              // Naviga indietro alla lista conversazioni
              navigation.goBack();
            } catch (error) {
              console.error("Errore nell'eliminazione della conversazione:", error);
              showAlert({
                type: 'error',
                title: 'Errore',
                message: 'Non è stato possibile eliminare la conversazione. Riprova più tardi.',
              });
            }
          },
        },
      ],
    });
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
    const colors = [
      "#2196F3",
      "#4CAF50",
      "#FF9800",
      "#9C27B0",
      "#F44336",
      "#00BCD4",
    ];
    const index = senderId.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleOpenProfile = (targetUserId?: string) => {
    if (!targetUserId || targetUserId === user?.id) return;
    navigation.navigate("ProfiloUtente", { userId: targetUserId });
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMine = item.sender._id === user?.id;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
    const showAvatar = !nextMessage || nextMessage.sender._id !== item.sender._id;
    const isConsecutive = prevMessage && prevMessage.sender._id === item.sender._id;
    const senderColor = getSenderColor(item.sender._id);
    const isOwner = item.senderType === "owner";

    const strutturaAvatarUrl =
      struttura?.images?.[0] ? resolveImageUrl(struttura.images[0]) : undefined;

    return (
      <View
        style={[
          baseStyles.messageContainer,
          isMine
            ? baseStyles.messageContainerMine
            : baseStyles.messageContainerTheirs,
          isConsecutive && baseStyles.messageContainerConsecutive,
        ]}
      >
        {!isMine && showAvatar && (
          <View style={baseStyles.avatarContainer}>
            <Avatar
              name={item.sender.name}
              avatarUrl={item.sender.avatarUrl}
              size={32}
              backgroundColor={
                role === "owner" && isOwner ? "#FF9800" : senderColor
              }
              textColor="#fff"
              onPress={() => handleOpenProfile(item.sender._id)}
            />
          </View>
        )}

        {!isMine && !showAvatar && <View style={baseStyles.avatarSpacer} />}

        <View
          style={[
            baseStyles.messageBubble,
            isMine
              ? baseStyles.messageBubbleMine
              : baseStyles.messageBubbleTheirs,
            isConsecutive &&
              (isMine
                ? baseStyles.bubbleConsecutiveMine
                : baseStyles.bubbleConsecutiveTheirs),
          ]}
        >
          {!isMine && showAvatar && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginBottom: 2,
              }}
            >
              <Text
                style={[
                  baseStyles.senderName,
                  {
                    color:
                      role === "owner" && isOwner ? "#FF9800" : senderColor,
                  },
                ]}
              >
                {item.sender.name}
              </Text>
              {role === "owner" && isOwner && (
                <View
                  style={{
                    backgroundColor: "#FF9800",
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 4,
                  }}
                >
                  <Text
                    style={{ fontSize: 10, fontWeight: "700", color: "white" }}
                  >
                    PROPRIETARIO
                  </Text>
                </View>
              )}
            </View>
          )}
          <Text
            style={[
              baseStyles.messageText,
              isMine
                ? baseStyles.messageTextMine
                : baseStyles.messageTextTheirs,
            ]}
          >
            {item.content}
          </Text>
          <Text
            style={[
              baseStyles.messageTime,
              isMine ? baseStyles.messageTimeMine : baseStyles.messageTimeTheirs,
            ]}
          >
            {formatTime(item.createdAt)}
          </Text>
        </View>

        {isMine && showAvatar && (
          <View style={baseStyles.avatarContainerMine}>
            <Avatar
              name={
                role === "owner"
                  ? headerInfo?.strutturaName || groupName || "Struttura"
                  : user?.name || "U"
              }
              avatarUrl={role === "owner" ? strutturaAvatarUrl : user?.avatarUrl}
              size={32}
              backgroundColor={
                role === "owner" ? "#E3F2FD" : senderColor
              }
              textColor={role === "owner" ? "#2196F3" : "#fff"}
            />
          </View>
        )}

        {isMine && !showAvatar && <View style={baseStyles.avatarSpacer} />}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={baseStyles.safe}>
        <View style={baseStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={baseStyles.loadingText}>Caricamento chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView style={[baseStyles.safe, { flex: 1 }]} edges={["top"]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <View style={{ flex: 1 }}>
            {/* Header */}
            <View style={baseStyles.header}>
              <Pressable
                onPress={() => navigation.goBack()}
                style={baseStyles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
              </Pressable>

              <Text style={additionalStyles.headerTitleCentered} numberOfLines={1}>
                Chat della Partita
              </Text>
              <View style={{ width: 40 }} />
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
                    navigation.navigate(
                      role === "owner"
                        ? "OwnerDettaglioPrenotazione"
                        : "DettaglioPrenotazione",
                      { bookingId: bookingInfo.bookingId }
                    );
                  }
                }}
                disabled={!bookingInfo?.bookingId}
              >
                <Ionicons name="calendar-outline" size={18} color="#2196F3" />
                <Text style={additionalStyles.detailsButtonText}>Dettaglio</Text>
              </Pressable>
            </View>

            {role === "player" && !canSendMessages && (
              <View style={additionalStyles.warningBanner}>
                <Ionicons
                  name="alert-circle-outline"
                  size={20}
                  color="#FF9800"
                />
                <Text style={additionalStyles.warningText}>
                  Conferma la tua partecipazione al match per inviare messaggi
                </Text>
              </View>
            )}

            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item._id}
              contentContainerStyle={[
                baseStyles.messagesList,
                {
                  flexGrow: 1,
                  paddingBottom: 8,
                },
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
                <View style={baseStyles.emptyState}>
                  <View style={baseStyles.emptyIcon}>
                    <Ionicons
                      name="chatbubbles-outline"
                      size={64}
                      color="#2196F3"
                    />
                  </View>
                  <Text style={baseStyles.emptyTitle}>
                    Nessun messaggio ancora
                  </Text>
                  <Text style={baseStyles.emptyText}>
                    Inizia la conversazione con il gruppo!
                  </Text>
                </View>
              }
            />

            <View
              style={[
                baseStyles.inputContainer,
                {
                  paddingBottom: Math.max(insets.bottom, 12),
                  marginBottom:
                    role === "player" && keyboardHeight > 0
                      ? keyboardHeight + 10
                      : 0,
                },
              ]}
              onLayout={(event) => {
                const { y, height } = event.nativeEvent.layout;
                const screenHeight = Dimensions.get("window").height;
                const containerBottom = y + height;
                
                console.log("📍 [GroupChatScreen] Input Container Layout:", {
                  role,
                  y: y.toFixed(2),
                  height: height.toFixed(2),
                  containerBottom: containerBottom.toFixed(2),
                  screenHeight: screenHeight.toFixed(2),
                  distanceFromBottom: (screenHeight - containerBottom).toFixed(2),
                  keyboardHeight,
                  insetsBottom: insets.bottom,
                  marginBottom: role === "player" && keyboardHeight > 0 ? keyboardHeight + 10 : 0,
                  paddingBottom: Math.max(insets.bottom, 12),
                  isVisible: containerBottom <= screenHeight ? "✅ VISIBILE" : "❌ TAGLIATO",
                });
              }}
            >
              {role === "player" && (
                <Pressable style={baseStyles.addButton} onPress={() => {}}>
                  <Ionicons name="add" size={22} color="#1a1a1a" />
                </Pressable>
              )}
              <View style={baseStyles.inputWrapper}>
                <TextInput
                  style={baseStyles.input}
                  placeholder={
                    role === "player" && !canSendMessages
                      ? "Non puoi inviare messaggi"
                      : "Scrivi un messaggio..."
                  }
                  placeholderTextColor="#999"
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={1000}
                  editable={role === "owner" || canSendMessages}
                  onFocus={() => {
                    setTimeout(() => {
                      flatListRef.current?.scrollToEnd({ animated: true });
                    }, 100);
                  }}
                />
              </View>

              <Pressable
                style={[
                  baseStyles.sendButton,
                  inputText.trim() &&
                    !sending &&
                    (role === "owner" || canSendMessages) &&
                    baseStyles.sendButtonActive,
                ]}
                onPress={sendMessage}
                disabled={
                  !inputText.trim() ||
                  sending ||
                  (role === "player" && !canSendMessages)
                }
              >
                {sending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons
                    name={
                      inputText.trim() && (role === "owner" || canSendMessages)
                        ? "send"
                        : "send-outline"
                    }
                    size={20}
                    color="white"
                  />
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <AlertComponent />
    </>
  );
}

const additionalStyles = StyleSheet.create({
  headerTitleCentered: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  headerSpacer: {
    width: 24,
  },
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  subHeaderLeft: {
    flex: 1,
  },
  subHeaderTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  subHeaderDay: {
    fontSize: 14,
    color: "#666",
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  detailsButtonText: {
    fontSize: 14,
    color: "#2196F3",
    marginLeft: 4,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: "#E65100",
    fontWeight: "500",
  },
});
