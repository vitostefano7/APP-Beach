import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Dimensions,
  Keyboard,
  StyleSheet,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useCustomAlert } from "../CustomAlert/CustomAlert";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useContext, useState, useEffect, useRef, useLayoutEffect } from "react";

import API_URL from "../../config/api";
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

type UserProfile = {
  _id: string;
  name: string;
  surname?: string;
  email: string;
  avatarUrl?: string | null;
  phone?: string;
  createdAt: string;
};

type ChatScreenProps = {
  role: "player" | "owner";
};

export default function ChatScreen({ role }: ChatScreenProps) {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { token, user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  const { showAlert, AlertComponent } = useCustomAlert();

  const {
    conversationId,
    strutturaName,
    struttura,
    strutturaAvatar,
    isUserChat,
    otherUser,
    userName,
    userId,
    userAvatar,
  } = route.params;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Owner-specific state
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

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
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        const adjustedHeight =
          Platform.OS === "android"
            ? e.endCoordinates.height - 1
            : e.endCoordinates.height;
        console.log("⌨️ [ChatScreen] Tastiera APERTA:", {
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
          console.log("⌨️ [ChatScreen] Tastiera CHIUSA:", {
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

  useEffect(() => {
    // Carica il profilo utente se non è una chat con struttura
    if (!struttura && (userId || otherUser?._id) && !userProfile && !loadingProfile) {
      loadUserProfile();
    }
  }, [struttura, userId, otherUser, userProfile, loadingProfile]);

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

  const loadUserProfile = async () => {
    if (!token) return;
    
    const targetUserId = userId || otherUser?._id;
    if (!targetUserId) return;

    try {
      setLoadingProfile(true);
      const res = await fetch(`${API_URL}/users/${targetUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setUserProfile(data);
      }
    } catch (error) {
      console.error("Errore caricamento profilo:", error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const deleteConversation = async () => {
    showAlert({
      type: 'warning',
      title: 'Elimina conversazione',
      message: 'Sei sicuro di voler eliminare questa conversazione? Questa azione non può essere annullata.',
      buttons: [
        {
          text: 'Annulla',
          style: 'cancel',
        },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              const endpoint = role === "owner"
                ? `${API_URL}/api/conversations/${conversationId}`
                : `${API_URL}/api/conversations/${conversationId}`;

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
      ]
    });
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

      if (res.ok) {
        const newMessage = await res.json();
        setMessages((prev) => [...prev, newMessage]);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error("Errore invio messaggio:", error);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    // Usa senderType per determinare se è un mio messaggio
    const isMine = role === "owner" ? item.senderType === "owner" : item.senderType === "user";
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
    const showAvatar = !nextMessage || nextMessage.sender._id !== item.sender._id;
    const isConsecutive = prevMessage && prevMessage.sender._id === item.sender._id;

    const otherAvatarUrl =
      role === "owner"
        ? userAvatar || userProfile?.avatarUrl || item.sender.avatarUrl
        : strutturaAvatar || struttura?.images?.[0] || item.sender.avatarUrl;

    const myAvatarUrl =
      role === "owner"
        ? strutturaAvatar
          ? resolveImageUrl(strutturaAvatar)
          : struttura?.images?.[0]
          ? resolveImageUrl(struttura.images[0])
          : undefined
        : user?.avatarUrl;

    const otherName =
      role === "owner"
        ? item.sender.name || userName
        : item.sender.name || strutturaName;

    const myName = role === "owner" ? strutturaName || user?.name || "U" : user?.name || "U";

    return (
      <View
        style={[
          baseStyles.messageContainer,
          isMine ? baseStyles.messageContainerMine : baseStyles.messageContainerTheirs,
          isConsecutive && baseStyles.messageContainerConsecutive,
        ]}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
          {!isMine && showAvatar && (
            <View style={baseStyles.avatarContainer}>
              <Avatar
                name={otherName}
                avatarUrl={
                  otherAvatarUrl
                    ? role === "player" && !item.sender.avatarUrl
                      ? resolveImageUrl(otherAvatarUrl)
                      : otherAvatarUrl
                    : undefined
                }
                size={32}
                backgroundColor="#E3F2FD"
                textColor="#2196F3"
              />
            </View>
          )}

          {!isMine && !showAvatar && <View style={baseStyles.avatarSpacer} />}

          <View
            style={[
              baseStyles.messageBubble,
              isMine ? baseStyles.messageBubbleMine : baseStyles.messageBubbleTheirs,
              isConsecutive &&
                (isMine ? baseStyles.bubbleConsecutiveMine : baseStyles.bubbleConsecutiveTheirs),
            ]}
          >
            <Text
              style={[
                baseStyles.messageText,
                isMine ? baseStyles.messageTextMine : baseStyles.messageTextTheirs,
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
                name={myName}
                avatarUrl={myAvatarUrl}
                size={32}
                backgroundColor="#E3F2FD"
                textColor="#2196F3"
              />
            </View>
          )}

          {isMine && !showAvatar && <View style={baseStyles.avatarSpacer} />}
        </View>
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
        <View style={baseStyles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={baseStyles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </Pressable>

          {role === "owner" || !struttura ? (
            /* Chat con utente (sempre per owner, o player senza struttura) */
            <Pressable
              style={baseStyles.headerCenter}
              onPress={() => {
                const targetUserId = userId || otherUser?._id;
                if (targetUserId) {
                  const routeName = role === "owner" ? "UserProfile" : "ProfiloUtente";
                  navigation.navigate(routeName, { userId: targetUserId });
                }
              }}
            >
              <Avatar
                name={
                  userProfile?.surname 
                    ? `${userProfile.name} ${userProfile.surname}`
                    : otherUser?.surname
                    ? `${otherUser.name} ${otherUser.surname}`
                    : userProfile?.name || userName || otherUser?.name || "Utente"
                }
                surname={userProfile?.surname || otherUser?.surname}
                avatarUrl={userProfile?.avatarUrl || otherUser?.avatarUrl || userAvatar}
                size={44}
                backgroundColor="#E3F2FD"
                textColor="#2196F3"
              />
              <View style={baseStyles.headerInfo}>
                <Text style={baseStyles.headerTitle} numberOfLines={1}>
                  {userName || 
                   (userProfile?.surname 
                    ? `${userProfile.name} ${userProfile.surname}`
                    : otherUser?.surname
                    ? `${otherUser.name} ${otherUser.surname}`
                    : userProfile?.name || otherUser?.name || "Utente")}
                </Text>
              </View>
            </Pressable>
          ) : (
            /* Chat con struttura (solo per player) */
            <Pressable
              style={baseStyles.headerCenter}
              onPress={() => {
                navigation.navigate("FieldDetails", { struttura });
              }}
            >
              <Avatar
                name={strutturaName || "Struttura"}
                avatarUrl={
                  struttura?.images?.[0]
                    ? resolveImageUrl(struttura.images[0])
                    : undefined
                }
                size={44}
                backgroundColor="#E3F2FD"
                textColor="#2196F3"
              />
              <View style={baseStyles.headerInfo}>
                <Text style={baseStyles.headerTitle} numberOfLines={1}>
                  {strutturaName || "Struttura"}
                </Text>
              </View>
            </Pressable>
          )}
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[baseStyles.messagesList, { flexGrow: 1 }]}
          onContentSizeChange={() => {
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
                <Ionicons name="chatbubbles-outline" size={64} color="#2196F3" />
              </View>
              <Text style={baseStyles.emptyTitle}>Inizia la conversazione</Text>
              <Text style={baseStyles.emptyText}>
                {role === "owner"
                  ? "Rispondi al cliente per avviare la conversazione"
                  : "Invia un messaggio alla struttura per ricevere assistenza"}
              </Text>
            </View>
          }
        />

        <View
          style={[
            baseStyles.inputContainer,
            {
              paddingBottom: Math.max(insets.bottom, 12),
              marginBottom: keyboardHeight > 0 ? keyboardHeight + 10 : 0,
            },
          ]}
          onLayout={(event) => {
            const { y, height } = event.nativeEvent.layout;
            const screenHeight = Dimensions.get("window").height;
            const containerBottom = y + height;
            
            console.log("📍 [ChatScreen] Input Container Layout:", {
              role,
              y: y.toFixed(2),
              height: height.toFixed(2),
              containerBottom: containerBottom.toFixed(2),
              screenHeight: screenHeight.toFixed(2),
              distanceFromBottom: (screenHeight - containerBottom).toFixed(2),
              keyboardHeight,
              insetsBottom: insets.bottom,
              marginBottom: keyboardHeight > 0 ? keyboardHeight + 10 : 0,
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
                role === "owner"
                  ? "Rispondi al cliente..."
                  : "Scrivi un messaggio..."
              }
              placeholderTextColor="#999"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
            />
          </View>

          <Pressable
            style={[
              baseStyles.sendButton,
              inputText.trim() && !sending && baseStyles.sendButtonActive,
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
      </KeyboardAvoidingView>

      {role === "owner" && (
        <Modal
          visible={showUserProfile}
          animationType="slide"
          transparent
          onRequestClose={() => setShowUserProfile(false)}
        >
          <Pressable
            style={modalStyles.modalOverlay}
            onPress={() => setShowUserProfile(false)}
          >
            <Pressable
              style={modalStyles.modalContent}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={modalStyles.modalHandle} />

              <View style={modalStyles.modalHeader}>
                <Text style={modalStyles.modalTitle}>Profilo utente</Text>
                <Pressable onPress={() => setShowUserProfile(false)} hitSlop={10}>
                  <Ionicons name="close" size={28} color="#333" g/>
                </Pressable>
              </View>

              {loadingProfile ? (
                <View style={modalStyles.modalLoading}>
                  <ActivityIndicator size="large" color="#2196F3" />
                  <Text style={modalStyles.modalLoadingText}>Caricamento...</Text>
                </View>
              ) : userProfile ? (
                <View style={modalStyles.profileContent}>
                  <View style={modalStyles.profileAvatarContainer}>
                    <View style={modalStyles.profileAvatar}>
                      <Ionicons name="person" size={48} color="#2196F3" />
                    </View>
                  </View>

                  <View style={modalStyles.profileInfo}>
                    <View style={modalStyles.profileRow}>
                      <View style={modalStyles.profileIconContainer}>
                        <Ionicons name="person-outline" size={20} color="#2196F3" />
                      </View>
                      <View style={modalStyles.profileRowContent}>
                        <Text style={modalStyles.profileLabel}>Nome</Text>
                        <Text style={modalStyles.profileValue}>{userProfile.name}</Text>
                      </View>
                    </View>

                    <View style={modalStyles.profileRow}>
                      <View style={modalStyles.profileIconContainer}>
                        <Ionicons name="mail-outline" size={20} color="#FF9800" />
                      </View>
                      <View style={modalStyles.profileRowContent}>
                        <Text style={modalStyles.profileLabel}>Email</Text>
                        <Text style={modalStyles.profileValue}>{userProfile.email}</Text>
                      </View>
                    </View>

                    {userProfile.phone && (
                      <View style={modalStyles.profileRow}>
                        <View style={modalStyles.profileIconContainer}>
                          <Ionicons name="call-outline" size={20} color="#4CAF50" />
                        </View>
                        <View style={modalStyles.profileRowContent}>
                          <Text style={modalStyles.profileLabel}>Telefono</Text>
                          <Text style={modalStyles.profileValue}>{userProfile.phone}</Text>
                        </View>
                      </View>
                    )}

                    <View style={modalStyles.profileRow}>
                      <View style={modalStyles.profileIconContainer}>
                        <Ionicons name="calendar-outline" size={20} color="#9C27B0" />
                      </View>
                      <View style={modalStyles.profileRowContent}>
                        <Text style={modalStyles.profileLabel}>Cliente dal</Text>
                        <Text style={modalStyles.profileValue}>
                          {formatDate(userProfile.createdAt)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={modalStyles.modalError}>
                  <Ionicons name="alert-circle-outline" size={48} color="#ccc" />
                  <Text style={modalStyles.modalErrorText}>
                    Impossibile caricare il profilo
                  </Text>
                  {!userId && (
                    <Text style={modalStyles.modalErrorSubtext}>ID utente mancante</Text>
                  )}
                </View>
              )}
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </SafeAreaView>
    <AlertComponent />
    </>
  );
}

const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#ddd",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  modalLoading: {
    padding: 40,
    alignItems: "center",
  },
  modalLoadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
  },
  profileContent: {
    padding: 20,
  },
  profileAvatarContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#e9ecef",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    gap: 16,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
  },
  profileRowContent: {
    flex: 1,
  },
  profileLabel: {
    fontSize: 12,
    color: "#666",
    textTransform: "uppercase",
    fontWeight: "500",
    marginBottom: 2,
  },
  profileValue: {
    fontSize: 16,
    color: "#1a1a1a",
    fontWeight: "500",
  },
  modalError: {
    padding: 40,
    alignItems: "center",
  },
  modalErrorText: {
    fontSize: 16,
    color: "#dc3545",
    marginBottom: 8,
  },
  modalErrorSubtext: {
    fontSize: 14,
    color: "#666",
  },
});
