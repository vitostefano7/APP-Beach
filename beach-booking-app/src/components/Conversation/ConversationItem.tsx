import React from "react";
import { View, Text, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Avatar from "../Avatar/Avatar";
import { styles } from "../../styles/ConversationScreen.styles";
import { useCustomAlert } from "../CustomAlert/CustomAlert";

type Conversation = {
  _id: string;
  type?: 'direct' | 'group';
  user?: {
    _id: string;
    name: string;
    surname?: string;
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
    surname?: string;
    email: string;
    avatarUrl?: string;
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

interface ConversationItemProps {
  conversation: Conversation;
  role: 'player' | 'owner';
  formatTime: (dateString: string) => string;
  getUnreadCount: (conv: Conversation) => number;
  refreshUnreadCount: () => void;
  onDelete: (conversationId: string) => Promise<void>;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  role,
  formatTime,
  getUnreadCount,
  refreshUnreadCount,
  onDelete,
}) => {
  const navigation = useNavigation<any>();
  const unreadCount = getUnreadCount(conversation);
  const isOwner = role === 'owner';

  const { showAlert, AlertComponent } = useCustomAlert();

  const handleDelete = () => {
    showAlert({
      type: 'warning',
      title: 'Elimina conversazione',
      message: 'Sei sicuro di voler eliminare questa conversazione? Questa azione non può essere annullata.',
      buttons: [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: () => onDelete(conversation._id),
        },
      ],
    });
  };

  const renderConversation = () => {
    if (conversation.match) {
      const matchInfo = conversation.match?.booking;
      const campo = matchInfo?.campo;
      const struttura = campo?.struttura || conversation.struttura;

      const strutturaName = struttura?.name || "Struttura";
      const groupTitle = `Partita - ${strutturaName}`;

      let dayLabel = "";
      if (matchInfo?.date) {
        const date = new Date(matchInfo.date);
        dayLabel = date.toLocaleDateString("it-IT", {
          day: "2-digit",
          month: "2-digit",
        });
      }
      const timeLabel = matchInfo?.startTime || "";
      const participantsCount = conversation.match?.players?.filter(p => p.status === "confirmed" || p.status === "pending").length || 0;
      const metaLine = [`📅 ${dayLabel || "Data"}`, `🕒 ${timeLabel || "Ora"}`, `👥 ${participantsCount} partecipanti`].join(" - ");

      return (
        <Pressable
          style={[styles.conversationCardGroup, unreadCount > 0 && styles.conversationCardUnread]}
          onPress={() => {
            navigation.navigate("GroupChat", {
              conversationId: conversation._id,
              groupName: conversation.groupName,
              matchId: conversation.match?._id,
              headerInfo: {
                strutturaName: struttura?.name,
                date: matchInfo?.date,
                startTime: matchInfo?.startTime,
                participantsCount: conversation.match?.players?.filter(p => p.status === "confirmed" || p.status === "pending").length || 0,
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.conversationTime}>
                    {formatTime(conversation.lastMessageAt)}
                  </Text>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDelete();
                    }}
                    hitSlop={10}
                  >
                    <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                  </Pressable>
                </View>
              </View>

              <View style={styles.matchInfoRow}>
                <Text style={styles.matchInfoText} numberOfLines={1}>
                  {metaLine}
                </Text>
              </View>

              {conversation.lastMessage && (
                <Text style={styles.conversationMessage} numberOfLines={1}>
                  {conversation.lastMessage}
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

    // Direct conversation
    const otherPerson = isOwner ? conversation.user : conversation.owner;
    const otherPersonFullName = otherPerson?.surname 
      ? `${otherPerson.name} ${otherPerson.surname}`
      : otherPerson?.name;
    const strutturaName = conversation.struttura?.name || "Struttura";
    const strutturaImages = conversation.struttura?.images || [];

    // Determina lo stile in base a chi sta parlando
    let cardStyle;
    if (isOwner) {
      // Owner che parla con un user
      cardStyle = styles.conversationCardUser;
    } else if (conversation.struttura) {
      // Player che parla con una struttura
      cardStyle = styles.conversationCardStruttura;
    } else {
      // Player che parla con un altro player
      cardStyle = styles.conversationCardUserToUser;
    }

    return (
      <Pressable
        style={[cardStyle, unreadCount > 0 && styles.conversationCardUnread]}
        onPress={() => {
          if (isOwner) {
            // Owner chatta con utente
            navigation.navigate("Chat", {
              conversationId: conversation._id,
              userName: otherPersonFullName || conversation.user?.name || "Utente",
              userId: conversation.user?._id,
              otherUser: conversation.user,
              isUserChat: true,
            });
          } else {
            // Player chatta con struttura o altro player
            navigation.navigate("Chat", {
              conversationId: conversation._id,
              strutturaName: strutturaName,
              otherPersonName: otherPerson?.name || "Utente",
              struttura: conversation.struttura,
              isUserChat: !conversation.struttura,
              otherUser: otherPerson,
            });
          }
          setTimeout(() => refreshUnreadCount(), 1000);
        }}
      >
        <View style={styles.conversationLeft}>
          {isOwner ? (
            <Avatar
              name={conversation.user?.name}
              surname={conversation.user?.surname}
              avatarUrl={conversation.user?.avatarUrl}
              size={50}
              fallbackIcon="person"
            />
          ) : conversation.struttura ? (
            // Player parla con struttura
            strutturaImages.length > 0 ? (
              <Image
                source={{ uri: strutturaImages[0] }}
                style={styles.conversationImage}
              />
            ) : (
              <View style={[styles.conversationImage, styles.conversationImagePlaceholder]}>
                <Ionicons name="business-outline" size={24} color="#999" />
              </View>
            )
          ) : (
            // Player parla con player
            <Avatar
              name={otherPerson?.name}
              surname={otherPerson?.surname}
              avatarUrl={otherPerson?.avatarUrl}
              size={50}
              fallbackIcon="person"
            />
          )
          }

          <View style={styles.conversationInfo}>
            <View style={styles.conversationHeader}>
              <Text style={styles.conversationTitle} numberOfLines={1}>
                {isOwner 
                  ? (conversation.user?.surname ? `${conversation.user.name} ${conversation.user.surname}` : conversation.user?.name)
                  : conversation.struttura 
                    ? strutturaName 
                    : otherPersonFullName || "Utente"}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.conversationTime}>
                  {formatTime(conversation.lastMessageAt)}
                </Text>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                  hitSlop={10}
                >
                  <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                </Pressable>
              </View>
            </View>

            {conversation.lastMessage && (
              <Text
                style={[
                  isOwner ? styles.conversationLastMessage : styles.conversationLastMessage,
                  unreadCount > 0 && styles.conversationLastMessageUnread,
                ]}
                numberOfLines={1}
              >
                {conversation.lastMessage}
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

  return (
    <>
      {renderConversation()}
      <AlertComponent />
    </>
  );
};

export default ConversationItem;