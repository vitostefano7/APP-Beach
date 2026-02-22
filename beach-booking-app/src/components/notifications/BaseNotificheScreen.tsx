/**
 * BaseNotificheScreen
 *
 * Schermata notifiche unificata per player e owner.
 * Le differenze di comportamento sono incapsulate nella prop `role`:
 *
 * Player
 *  - Pulsante "Inviti" con badge (→ TuttiInviti)
 *  - Pulsanti Accetta / Rifiuta per richieste di follow pending
 *  - Icone/colori per: new_follower, follow_back, match_invite, match_start, match_result, match_join
 *  - Navigazione → DettaglioPrenotazione, ProfiloUtente, DettaglioInvito
 *
 * Owner
 *  - Nessun pulsante inviti
 *  - Nessuna azione follow
 *  - Icone/colori per: new_booking, booking_cancelled, booking_confirmed, match_join, match_result
 *  - Navigazione → OwnerDettaglioPrenotazione, StrutturaDashboard
 */

import React, { useState, useCallback, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNotifications, Notification } from '../../screens/player/dashboard/hooks/useNotifications';
import { AuthContext } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import API_URL from '../../config/api';
import { styles } from './NotificheScreen.styles';

type FilterType = 'all' | 'unread';

export type NotificheRole = 'player' | 'owner';

interface BaseNotificheScreenProps {
  role: NotificheRole;
}

const BaseNotificheScreen = ({ role }: BaseNotificheScreenProps) => {
  const navigation = useNavigation<any>();
  const { token } = useContext(AuthContext);
  const { showAlert } = useAlert();

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
  // Usato solo dal player
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);

  // Player-only: ripristina il conteggio inviti dalla cache al primo render
  useEffect(() => {
    if (role !== 'player') return;
    AsyncStorage.getItem('pendingInvitesCount').then(cached => {
      if (cached !== null) setPendingInvitesCount(parseInt(cached, 10));
    });
  }, [role]);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
      fetchUnreadCount();
      if (role === 'player') loadPendingInvitesCount();
    }, [filter, role])
  );

  // ─── Data fetching ────────────────────────────────────────────────────────

  const loadNotifications = async () => {
    const isReadFilter = filter === 'unread' ? false : undefined;
    await fetchNotifications(isReadFilter);
  };

  const loadPendingInvitesCount = async () => {
    try {
      const res = await fetch(`${API_URL}/matches/pending-invites`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setPendingInvitesCount(data.length);
          await AsyncStorage.setItem('pendingInvitesCount', String(data.length));
        }
      }
    } catch (err) {
      console.error('[BaseNotificheScreen] Errore caricamento inviti:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    await fetchUnreadCount();
    if (role === 'player') await loadPendingInvitesCount();
    setRefreshing(false);
  };

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleNotificationPress = async (notification: Notification) => {
    // Player: le richieste follow pending hanno solo i pulsanti Accetta/Rifiuta
    if (
      role === 'player' &&
      notification.type === 'new_follower' &&
      notification.relatedModel === 'Friendship'
    ) {
      return;
    }

    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    if (role === 'player') {
      if (notification.type === 'new_follower' || notification.type === 'follow_back') {
        if (notification.sender) {
          navigation.navigate('ProfiloUtente', { userId: notification.sender._id });
        }
      } else if (notification.type === 'match_invite' && notification.relatedId) {
        navigation.navigate('DettaglioInvito', { inviteId: notification.relatedId });
      } else if (
        (notification.type === 'match_join' || notification.type === 'match_result') &&
        notification.relatedId
      ) {
        navigation.navigate('DettaglioPrenotazione', { bookingId: notification.relatedId });
      } else if (
        (notification.type === 'invite_accepted' || notification.type === 'invite_declined') &&
        notification.relatedId
      ) {
        navigation.navigate('DettaglioPrenotazione', { bookingId: notification.relatedId });
      } else if (notification.relatedModel === 'Booking' && notification.relatedId) {
        navigation.navigate('DettaglioPrenotazione', { bookingId: notification.relatedId });
      }
    } else {
      // owner
      if (
        (notification.type === 'match_join' || notification.type === 'match_result') &&
        notification.relatedId
      ) {
        navigation.navigate('OwnerDettaglioPrenotazione', { bookingId: notification.relatedId });
      } else if (notification.relatedModel === 'Booking' && notification.relatedId) {
        navigation.navigate('OwnerDettaglioPrenotazione', { bookingId: notification.relatedId });
      } else if (notification.relatedModel === 'Match' && notification.relatedId) {
        navigation.navigate('OwnerDettaglioPrenotazione', { bookingId: notification.relatedId });
      } else if (notification.relatedModel === 'Struttura' && notification.relatedId) {
        navigation.navigate('StrutturaDashboard', { strutturaId: notification.relatedId });
      }
    }
  };

  // Player-only
  const handleAcceptRequest = async (notification: Notification) => {
    if (!notification.relatedId) return;
    const success = await acceptFollowRequest(notification.relatedId, notification._id);
    if (success) {
      showAlert({ type: 'success', title: 'Successo', message: 'Richiesta di follow accettata' });
      await fetchUnreadCount();
    } else {
      showAlert({ type: 'error', title: 'Errore', message: 'Non è stato possibile accettare la richiesta' });
    }
  };

  // Player-only
  const handleRejectRequest = (notification: Notification) => {
    if (!notification.relatedId) return;
    showAlert({
      type: 'warning',
      title: 'Rifiuta richiesta',
      message: 'Vuoi rifiutare questa richiesta di follow?',
      showCancel: true,
      confirmText: 'Rifiuta',
      cancelText: 'Annulla',
      onConfirm: async () => {
        const success = await rejectFollowRequest(notification.relatedId!, notification._id);
        if (!success) {
          showAlert({ type: 'error', title: 'Errore', message: 'Non è stato possibile rifiutare la richiesta' });
        }
        await fetchUnreadCount();
      },
    });
  };

  const handleDelete = (notificationId: string) => {
    showAlert({
      type: 'warning',
      title: 'Elimina notifica',
      message: 'Vuoi eliminare questa notifica?',
      showCancel: true,
      confirmText: 'Elimina',
      cancelText: 'Annulla',
      onConfirm: () => deleteNotification(notificationId),
    });
  };

  const handleMarkAllAsRead = () => {
    if (unreadCount === 0) return;
    showAlert({
      type: 'info',
      title: 'Segna tutte come lette',
      message: `Vuoi segnare tutte le ${unreadCount} notifiche come lette?`,
      showCancel: true,
      confirmText: 'Conferma',
      cancelText: 'Annulla',
      onConfirm: async () => {
        await markAllAsRead();
        await loadNotifications();
      },
    });
  };

  // ─── Helpers visuali ──────────────────────────────────────────────────────

  const getNotificationIcon = (type: string): React.ComponentProps<typeof Ionicons>['name'] => {
    if (role === 'player') {
      switch (type) {
        case 'new_follower':   return 'person-add';
        case 'follow_back':    return 'people';
        case 'match_invite':   return 'mail';
        case 'match_start':    return 'play';
        case 'match_result':   return 'trophy';
        case 'match_join':     return 'person-add';
        default:               return 'notifications';
      }
    } else {
      switch (type) {
        case 'new_booking':        return 'calendar';
        case 'booking_cancelled':  return 'close-circle';
        case 'booking_confirmed':  return 'checkmark-circle';
        case 'match_join':         return 'person-add';
        case 'match_result':       return 'trophy';
        default:                   return 'notifications';
      }
    }
  };

  const getNotificationColor = (type: string): string => {
    if (role === 'player') {
      switch (type) {
        case 'new_follower':  return '#4CAF50';
        case 'follow_back':   return '#2196F3';
        case 'match_invite':  return '#FF9800';
        case 'match_start':   return '#9C27B0';
        case 'match_result':  return '#FFD700';
        case 'match_join':    return '#00BCD4';
        default:              return '#757575';
      }
    } else {
      switch (type) {
        case 'new_booking':        return '#4CAF50';
        case 'booking_cancelled':  return '#f44336';
        case 'booking_confirmed':  return '#2196F3';
        case 'match_join':         return '#FF9800';
        case 'match_result':       return '#FFD700';
        default:                   return '#757575';
      }
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60)     return 'Adesso';
    if (diffInSeconds < 3600)   return `${Math.floor(diffInSeconds / 60)}m fa`;
    if (diffInSeconds < 86400)  return `${Math.floor(diffInSeconds / 3600)}h fa`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}g fa`;
    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  };

  const emptySubtitle =
    role === 'player'
      ? 'Riceverai qui le notifiche sulle tue attività'
      : 'Riceverai qui le notifiche sulle tue strutture';

  // ─── Render helpers ───────────────────────────────────────────────────────

  const renderRightActions = (notificationId: string) => (
    <Pressable
      style={styles.deleteAction}
      onPress={() => handleDelete(notificationId)}
    >
      <Ionicons name="trash-outline" size={24} color="#fff" />
    </Pressable>
  );

  const renderNotification = ({ item }: { item: Notification }) => {
    const isPendingFollowRequest =
      role === 'player' &&
      item.type === 'new_follower' &&
      item.relatedModel === 'Friendship' &&
      !!item.relatedId;

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
              <Text style={styles.notificationTime}>{formatTimeAgo(item.createdAt)}</Text>

              {/* Pulsanti Accetta / Rifiuta – solo player, solo richieste follow pending */}
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

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={['top']}>

        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={23} color="#000" />
          </Pressable>

          <Text style={styles.headerTitle}>Notifiche</Text>

          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            {/* Pulsante Inviti – solo player */}
            {role === 'player' && (
              <Pressable
                style={[styles.invitesButtonContainer, { position: 'relative' }]}
                onPress={() => navigation.navigate('TuttiInviti', { initialFilter: 'pending' })}
              >
                <Ionicons name="mail-outline" size={20} color="#2196F3" />
                <Text style={styles.invitesButtonText}>Inviti</Text>
                {pendingInvitesCount > 0 && (
                  <View style={styles.invitesBadge}>
                    <Text style={styles.invitesBadgeText}>
                      {pendingInvitesCount > 99 ? '99+' : pendingInvitesCount}
                    </Text>
                  </View>
                )}
              </Pressable>
            )}

            {/* Segna tutte come lette */}
            {unreadCount > 0 && (
              <Pressable style={styles.markAllButton} onPress={handleMarkAllAsRead}>
                <Ionicons name="checkmark-done" size={20} color="#2196F3" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <Pressable
            style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
              Tutte
            </Text>
          </Pressable>

          <Pressable
            style={[styles.filterTab, filter === 'unread' && styles.filterTabActive]}
            onPress={() => setFilter('unread')}
          >
            <Text style={[styles.filterTabText, filter === 'unread' && styles.filterTabTextActive]}>
              Non lette
              {unreadCount > 0 && (
                <Text style={styles.filterBadge}> ({unreadCount})</Text>
              )}
            </Text>
          </Pressable>
        </View>

        {/* Content */}
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
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>
              {filter === 'unread' ? 'Nessuna notifica non letta' : 'Nessuna notifica'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'unread' ? 'Tutte le notifiche sono state lette' : emptySubtitle}
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
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

export default BaseNotificheScreen;
