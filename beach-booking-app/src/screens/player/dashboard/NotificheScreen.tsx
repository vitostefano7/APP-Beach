import React, { useState, useCallback, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNotifications, Notification } from './hooks/useNotifications';
import { AuthContext } from '../../../context/AuthContext';
import API_URL from '../../../config/api';
import { styles } from '../styles-player/NotificheScreen.styles';

type FilterType = 'all' | 'unread';

const NotificheScreen = () => {
  const navigation = useNavigation<any>();
  const { token, user } = useContext(AuthContext);
  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    acceptFollowRequest,
    rejectFollowRequest,
  } = useNotifications();

  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);

  // Carica notifiche quando la schermata è visibile
  useFocusEffect(
    useCallback(() => {
      loadNotifications();
      fetchUnreadCount();
      loadPendingInvitesCount();
    }, [filter])
  );

  const loadNotifications = async () => {
    const isReadFilter = filter === 'unread' ? false : undefined;
    console.log('🔄 [NotificheScreen] Loading notifications with filter:', filter, 'isReadFilter:', isReadFilter);
    await fetchNotifications(isReadFilter);
  };

  const loadPendingInvitesCount = async () => {
    try {
      console.log('🔍 [NotificheScreen] Caricamento conteggio inviti...');
      const res = await fetch(`${API_URL}/matches/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const allMatches = await res.json();
        console.log('📋 [NotificheScreen] Match ricevuti:', allMatches.length);

        if (!Array.isArray(allMatches)) {
          console.error("Formato dati inviti non valido");
          setPendingInvitesCount(0);
          return;
        }

        const pendingInvites = allMatches.filter((match: any) => {
          if (!match || !match.players) return false;

          const myPlayer = match.players?.find((p: any) =>
            p?.user?._id === user?.id
          );

          if (!myPlayer) return false;

          const isPendingStatus = myPlayer.status === "pending";
          const isCreator = match.createdBy?._id === user?.id;
          const isExpired = isInviteExpired(match);

          // console.log(`[NotificheScreen] Match ${match._id}: pending=${isPendingStatus}, isCreator=${isCreator}, expired=${isExpired}`);

          return isPendingStatus && !isCreator && !isExpired;
        });

        console.log('✅ [NotificheScreen] Inviti pendenti trovati:', pendingInvites.length);
        setPendingInvitesCount(pendingInvites.length);
      }
    } catch (error) {
      console.error("Errore caricamento conteggio inviti:", error);
      setPendingInvitesCount(0);
    }
  };

  const isInviteExpired = (match: any): boolean => {
    const booking = match.booking;
    if (!booking?.date || !booking?.startTime) return false;

    try {
      const matchDateTime = new Date(`${booking.date}T${booking.startTime}`);
      const cutoffTime = new Date(matchDateTime);
      cutoffTime.setHours(cutoffTime.getHours() - 2);

      const now = new Date();
      return now > cutoffTime;
    } catch (error) {
      console.error("Errore nel calcolo scadenza:", error);
      return false;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    await fetchUnreadCount();
    await loadPendingInvitesCount();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Non navigare se la notifica ha pulsanti di azione (richiesta pending)
    if (notification.type === 'new_follower' && notification.relatedModel === 'Friendship') {
      // Questa è una richiesta di follow in sospeso, non navigare
      return;
    }

    // Marca come letta se non lo è già
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    // Naviga alla risorsa correlata
    if (notification.type === 'new_follower' || notification.type === 'follow_back') {
      if (notification.sender) {
        navigation.navigate('ProfiloUtente', {
          userId: notification.sender._id,
        });
      }
    } else if (notification.type === 'match_invite' && notification.relatedId) {
      navigation.navigate('DettaglioInvito', {
        inviteId: notification.relatedId,
      });
    } else if (notification.type === 'match_join' && notification.relatedId) {
      navigation.navigate('DettaglioPrenotazione', {
        bookingId: notification.relatedId,
      });
    } else if (notification.type === 'match_result' && notification.relatedId) {
      navigation.navigate('DettaglioPrenotazione', {
        bookingId: notification.relatedId,
      });
    } else if (notification.type === 'invite_accepted' || notification.type === 'invite_declined') {
      // Notifiche di accettazione/rifiuto invito - naviga alla prenotazione
      if (notification.relatedId) {
        navigation.navigate('DettaglioPrenotazione', {
          bookingId: notification.relatedId,
        });
      }
    } else if (notification.relatedModel === 'Booking' && notification.relatedId) {
      navigation.navigate('DettaglioPrenotazione', {
        bookingId: notification.relatedId,
      });
    }
  };

  const handleAcceptRequest = async (notification: Notification) => {
    if (!notification.relatedId) return;
    
    const success = await acceptFollowRequest(notification.relatedId, notification._id);
    if (success) {
      Alert.alert('Successo', 'Richiesta di follow accettata');
      await fetchUnreadCount();
    } else {
      Alert.alert('Errore', 'Non è stato possibile accettare la richiesta');
    }
  };

  const handleRejectRequest = async (notification: Notification) => {
    if (!notification.relatedId) return;

    Alert.alert(
      'Rifiuta richiesta',
      'Vuoi rifiutare questa richiesta di follow?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Rifiuta',
          style: 'destructive',
          onPress: async () => {
            const success = await rejectFollowRequest(notification.relatedId!, notification._id);
            if (success) {
              await fetchUnreadCount();
            } else {
              Alert.alert('Errore', 'Non è stato possibile rifiutare la richiesta');
            }
          },
        },
      ]
    );
  };

  const handleDelete = (notificationId: string) => {
    Alert.alert(
      'Elimina notifica',
      'Vuoi eliminare questa notifica?',
      [
        {
          text: 'Annulla',
          style: 'cancel',
        },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: () => deleteNotification(notificationId),
        },
      ]
    );
  };

  const handleMarkAllAsRead = () => {
    if (unreadCount === 0) return;

    Alert.alert(
      'Segna tutte come lette',
      `Vuoi segnare tutte le ${unreadCount} notifiche come lette?`,
      [
        {
          text: 'Annulla',
          style: 'cancel',
        },
        {
          text: 'Conferma',
          onPress: async () => {
            await markAllAsRead();
            await loadNotifications();
          },
        },
      ]
    );
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'new_follower':
        return 'person-add';
      case 'follow_back':
        return 'people';
      case 'match_invite':
        return 'mail';
      case 'match_start':
        return 'play';
      case 'match_result':
        return 'trophy';
      case 'match_join':
        return 'person-add';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'new_follower':
        return '#4CAF50';
      case 'follow_back':
        return '#2196F3';
      case 'match_invite':
        return '#FF9800';
      case 'match_start':
        return '#9C27B0';
      case 'match_result':
        return '#FFD700';
      case 'match_join':
        return '#00BCD4';
      default:
        return '#757575';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Adesso';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m fa`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h fa`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}g fa`;
    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  };

  const renderRightActions = (notificationId: string) => (
    <Pressable
      style={styles.deleteAction}
      onPress={() => handleDelete(notificationId)}
    >
      <Ionicons name="trash-outline" size={24} color="#fff" />
    </Pressable>
  );

  const renderNotification = ({ item }: { item: Notification }) => {
    // Mostra i pulsanti solo per richieste pending (relatedModel = Friendship)
    const isPendingFollowRequest = item.type === 'new_follower' && item.relatedModel === 'Friendship' && item.relatedId;

    return (
      <Swipeable
        renderRightActions={() => renderRightActions(item._id)}
        overshootRight={false}
      >
        <Pressable
          style={[
            styles.notificationCard,
            !item.isRead && styles.notificationCardUnread,
          ]}
          onPress={() => handleNotificationPress(item)}
        >
          <View style={styles.notificationContent}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: getNotificationColor(item.type) + '20' },
              ]}
            >
              <Ionicons
                name={getNotificationIcon(item.type)}
                size={24}
                color={getNotificationColor(item.type)}
              />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.notificationTitle}>{item.title}</Text>
              <Text style={styles.notificationMessage}>{item.message}</Text>
              <Text style={styles.notificationTime}>
                {formatTimeAgo(item.createdAt)}
              </Text>

              {/* Pulsanti per accettare/rifiutare richieste di follow */}
              {isPendingFollowRequest && (
                <View style={styles.actionButtons}>
                  <Pressable
                    style={[styles.actionButton, styles.acceptButton]}
                    onPress={() => handleAcceptRequest(item)}
                  >
                    <Text style={styles.acceptButtonText}>Accetta</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleRejectRequest(item)}
                  >
                    <Text style={styles.rejectButtonText}>Rifiuta</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {!item.isRead && <View style={styles.unreadDot} />}
          </View>
        </Pressable>
      </Swipeable>
    );
  };

  const filteredNotifications = notifications;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </Pressable>
          <Text style={styles.headerTitle}>Notifiche</Text>

          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            {/* Bottone Inviti */}
            <Pressable
              style={styles.invitesButtonContainer}
              onPress={() => navigation.navigate('TuttiInviti')}
            >
              <View style={{ position: 'relative' }}>
                <Ionicons name="mail-outline" size={20} color="#2196F3" />
                {pendingInvitesCount > 0 && (
                  <View style={styles.invitesBadge}>
                    <Text style={styles.invitesBadgeText}>
                      {pendingInvitesCount > 99 ? '99+' : pendingInvitesCount}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.invitesButtonText}>Inviti</Text>
            </Pressable>

            {/* Bottone Segna tutte come lette */}
            {unreadCount > 0 && (
              <Pressable
                style={styles.markAllButton}
                onPress={handleMarkAllAsRead}
              >
                <Ionicons name="checkmark-done" size={20} color="#2196F3" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <Pressable
            style={[
              styles.filterTab,
              filter === 'all' && styles.filterTabActive,
            ]}
            onPress={() => setFilter('all')}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === 'all' && styles.filterTabTextActive,
              ]}
            >
              Tutte
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.filterTab,
              filter === 'unread' && styles.filterTabActive,
            ]}
            onPress={() => setFilter('unread')}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === 'unread' && styles.filterTabTextActive,
              ]}
            >
              Non lette
              {unreadCount > 0 && (
                <Text style={styles.filterBadge}> ({unreadCount})</Text>
              )}
            </Text>
          </Pressable>
        </View>

        {/* Lista Notifiche */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={48} color="#f44336" />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={loadNotifications}>
              <Text style={styles.retryButtonText}>Riprova</Text>
            </Pressable>
          </View>
        ) : filteredNotifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>
              {filter === 'unread'
                ? 'Nessuna notifica non letta'
                : 'Nessuna notifica'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'unread'
                ? 'Tutte le notifiche sono state lette'
                : 'Riceverai qui le notifiche sulle tue attività'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredNotifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item._id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default NotificheScreen;
