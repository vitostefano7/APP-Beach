import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  Modal,
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

type UserProfile = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
};

export default function OwnerChatScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { token, user } = useContext(AuthContext);

  const { conversationId, strutturaName, userName, userId } = route.params;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  // ✅ MODAL PROFILO UTENTE
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => showSub.remove();
  }, []);

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

  // ✅ CARICA PROFILO UTENTE
  const loadUserProfile = async () => {
    if (!token) {
      console.log("❌ Nessun token disponibile");
      return;
    }
    
    if (!userId) {
      console.log("❌ userId non presente nei params:", route.params);
      return;
    }

    try {
      setLoadingProfile(true);
      
      console.log("🔍 Caricamento profilo per userId:", userId);
      console.log("📞 Chiamata API:", `${API_URL}/users/${userId}`);
      
      const res = await fetch(`${API_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("📡 Response status:", res.status);

      if (res.ok) {
        const data = await res.json();
        console.log("✅ Profilo caricato:", data);
        setUserProfile(data);
      } else {
        const errorText = await res.text();
        console.error("❌ Errore response:", res.status, errorText);
      }
    } catch (error) {
      console.error("❌ Errore caricamento profilo:", error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleOpenProfile = () => {
    console.log("👆 Apertura profilo utente");
    console.log("📋 Route params completi:", route.params);
    console.log("🆔 userId:", userId);
    
    setShowUserProfile(true);
    if (!userProfile) {
      loadUserProfile();
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
    const showAvatar = !prevMessage || prevMessage.sender._id !== item.sender._id;
    const isConsecutive = prevMessage && prevMessage.sender._id === item.sender._id;

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
            <View style={styles.avatar}>
              <Ionicons name="person" size={16} color="#2196F3" />
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

            <Pressable style={styles.headerCenter} onPress={handleOpenProfile}>
              <View style={styles.headerAvatar}>
                <Ionicons name="person" size={24} color="#2196F3" />
              </View>
              <View style={styles.headerInfo}>
                <View style={styles.headerTitleRow}>
                  <Text style={styles.headerTitle} numberOfLines={1}>
                    {userName}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#999" />
                </View>
                <View style={styles.onlineIndicator}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.onlineText}>Online</Text>
                </View>
              </View>
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
              <Text style={styles.emptyTitle}>Inizia la conversazione</Text>
              <Text style={styles.emptyText}>
                Rispondi al cliente per avviare la conversazione
              </Text>
            </View>
          }
        />

        <SafeAreaView edges={["bottom"]}>
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Rispondi al cliente..."
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
        </SafeAreaView>
      </View>

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
                  <Text style={styles.modalErrorSubtext}>
                    ID utente mancante
                  </Text>
                )}
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}