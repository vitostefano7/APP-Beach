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
} from "react-native";
import { Keyboard, Dimensions } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useContext, useState, useEffect, useRef, useLayoutEffect } from "react";

import API_URL from "../../config/api";
import { AuthContext } from "../../context/AuthContext";
import { styles } from "../../screens/player/styles-player/ChatScreen.styles";
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

  const {
    conversationId,
    strutturaName,
    struttura,
    isUserChat,
    otherUser,
    userName,
    userId,
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
    if (role === "player") {
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
    } else {
      const showSub = Keyboard.addListener("keyboardDidShow", () => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      });

      return () => showSub.remove();
    }
  }, [role]);

  useEffect(() => {
    if (role === "owner" && userId && !userProfile && !loadingProfile) {
      loadUserProfile();
    }
  }, [role, userId, userProfile, loadingProfile]);

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
    if (!token || !userId) return;

    try {
      setLoadingProfile(true);
      const res = await fetch(`${API_URL}/users/${userId}`, {
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

  const handleOpenProfile = () => {
    if (role === "owner") {
      setShowUserProfile(true);
      if (!userProfile) {
        loadUserProfile();
      }
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
    const isMine = item.sender._id === user?.id;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
    const showAvatar = !nextMessage || nextMessage.sender._id !== item.sender._id;
    const isConsecutive = prevMessage && prevMessage.sender._id === item.sender._id;

    const otherAvatarUrl =
      role === "owner"
        ? item.sender.avatarUrl || userProfile?.avatarUrl
        : item.sender.avatarUrl || struttura?.images?.[0];

    const myAvatarUrl =
      role === "owner"
        ? struttura?.images?.[0]
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
          styles.messageContainer,
          isMine ? styles.messageContainerMine : styles.messageContainerTheirs,
          isConsecutive && styles.messageContainerConsecutive,
        ]}
      >
        {!isMine && showAvatar && (
          <View style={styles.avatarContainer}>
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

        {!isMine && !showAvatar && <View style={styles.avatarSpacer} />}

        <View
          style={[
            styles.messageBubble,
            isMine ? styles.messageBubbleMine : styles.messageBubbleTheirs,
            isConsecutive &&
              (isMine ? styles.bubbleConsecutiveMine : styles.bubbleConsecutiveTheirs),
          ]}
        >
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
              name={myName}
              avatarUrl={myAvatarUrl}
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
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </Pressable>

          {role === "player" ? (
            <Pressable
              style={styles.headerCenter}
              onPress={() => {
                if (struttura) {
                  navigation.navigate("FieldDetails", { struttura });
                } else if (isUserChat && otherUser) {
                  navigation.navigate("ProfiloUtente", { userId: otherUser._id });
                }
              }}
              disabled={!struttura && !isUserChat}
            >
              <Avatar
                name={strutturaName}
                avatarUrl={
                  isUserChat && otherUser?.avatarUrl
                    ? otherUser.avatarUrl
                    : struttura?.images?.[0]
                    ? resolveImageUrl(struttura.images[0])
                    : undefined
                }
                size={44}
                backgroundColor="#E3F2FD"
                textColor="#2196F3"
              />
              <View style={styles.headerInfo}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {strutturaName}
                </Text>
                {isUserChat ? (
                  <Text style={styles.onlineText}>Tocca per vedere il profilo</Text>
                ) : (
                  <View style={styles.onlineIndicator}>
                    <View style={styles.onlineDot} />
                    <Text style={styles.onlineText}>Online</Text>
                  </View>
                )}
              </View>
            </Pressable>
          ) : (
            <Pressable style={styles.headerCenter} onPress={handleOpenProfile}>
              <View style={styles.headerAvatar}>
                <Ionicons name="person" size={24} color="#2196F3" />
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {userName}
                </Text>
                <View style={styles.onlineIndicator}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.onlineText}>Online</Text>
                </View>
              </View>
            </Pressable>
          )}
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[styles.messagesList, { flexGrow: 1 }]}
          onContentSizeChange={() => {
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
              <Text style={styles.emptyTitle}>Inizia la conversazione</Text>
              <Text style={styles.emptyText}>
                {role === "owner"
                  ? "Rispondi al cliente per avviare la conversazione"
                  : "Invia un messaggio alla struttura per ricevere assistenza"}
              </Text>
            </View>
          }
        />

        <View
          style={[
            styles.inputContainer,
            {
              paddingBottom: Math.max(insets.bottom, 12),
            },
            role === "player" &&
              keyboardHeight > 0 && {
                marginBottom: keyboardHeight + 10,
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
              marginBottom: role === "player" && keyboardHeight > 0 ? keyboardHeight + 10 : 0,
              paddingBottom: Math.max(insets.bottom, 12),
              isVisible: containerBottom <= screenHeight ? "✅ VISIBILE" : "❌ TAGLIATO",
            });
          }}
        >
          {role === "player" && (
            <Pressable style={styles.addButton} onPress={() => {}}>
              <Ionicons name="add" size={22} color="#1a1a1a" />
            </Pressable>
          )}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
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
      </KeyboardAvoidingView>

      {role === "owner" && (
        <Modal
          visible={showUserProfile}
          animationType="slide"
          transparent
          onRequestClose={() => setShowUserProfile(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowUserProfile(false)}
          >
            <Pressable
              style={styles.modalContent}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHandle} />

              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Profilo utente</Text>
                <Pressable onPress={() => setShowUserProfile(false)} hitSlop={10}>
                  <Ionicons name="close" size={28} color="#333" />
                </Pressable>
              </View>

              {loadingProfile ? (
                <View style={styles.modalLoading}>
                  <ActivityIndicator size="large" color="#2196F3" />
                  <Text style={styles.modalLoadingText}>Caricamento...</Text>
                </View>
              ) : userProfile ? (
                <View style={styles.profileContent}>
                  <View style={styles.profileAvatarContainer}>
                    <View style={styles.profileAvatar}>
                      <Ionicons name="person" size={48} color="#2196F3" />
                    </View>
                  </View>

                  <View style={styles.profileInfo}>
                    <View style={styles.profileRow}>
                      <View style={styles.profileIconContainer}>
                        <Ionicons name="person-outline" size={20} color="#2196F3" />
                      </View>
                      <View style={styles.profileRowContent}>
                        <Text style={styles.profileLabel}>Nome</Text>
                        <Text style={styles.profileValue}>{userProfile.name}</Text>
                      </View>
                    </View>

                    <View style={styles.profileRow}>
                      <View style={styles.profileIconContainer}>
                        <Ionicons name="mail-outline" size={20} color="#FF9800" />
                      </View>
                      <View style={styles.profileRowContent}>
                        <Text style={styles.profileLabel}>Email</Text>
                        <Text style={styles.profileValue}>{userProfile.email}</Text>
                      </View>
                    </View>

                    {userProfile.phone && (
                      <View style={styles.profileRow}>
                        <View style={styles.profileIconContainer}>
                          <Ionicons name="call-outline" size={20} color="#4CAF50" />
                        </View>
                        <View style={styles.profileRowContent}>
                          <Text style={styles.profileLabel}>Telefono</Text>
                          <Text style={styles.profileValue}>{userProfile.phone}</Text>
                        </View>
                      </View>
                    )}

                    <View style={styles.profileRow}>
                      <View style={styles.profileIconContainer}>
                        <Ionicons name="calendar-outline" size={20} color="#9C27B0" />
                      </View>
                      <View style={styles.profileRowContent}>
                        <Text style={styles.profileLabel}>Cliente dal</Text>
                        <Text style={styles.profileValue}>
                          {formatDate(userProfile.createdAt)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.modalError}>
                  <Ionicons name="alert-circle-outline" size={48} color="#ccc" />
                  <Text style={styles.modalErrorText}>
                    Impossibile caricare il profilo
                  </Text>
                  {!userId && (
                    <Text style={styles.modalErrorSubtext}>ID utente mancante</Text>
                  )}
                </View>
              )}
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </SafeAreaView>
  );
}
