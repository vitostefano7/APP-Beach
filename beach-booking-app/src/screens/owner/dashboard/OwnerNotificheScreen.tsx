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
import { useNotifications, Notification } from '../../player/dashboard/hooks/useNotifications';
import { AuthContext } from '../../../context/AuthContext';
import API_URL from '../../../config/api';
import { styles } from '../styles/OwnerNotificheScreen.styles';

type FilterType = 'all' | 'unread';

const OwnerNotificheScreen = () => {
  const navigation = useNavigation<any>();
  const { token } = useContext(AuthContext);
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
  } = useNotifications();

  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Carica notifiche quando la schermata è visibile
  useFocusEffect(
    useCallback(() => {
      console.log("🔄 [OwnerNotifiche] Caricamento notifiche...");
      loadNotifications();
      fetchUnreadCount();
    }, [filter])
  );

  const loadNotifications = async () => {
    console.log("📡 [OwnerNotifiche] Fetching notifiche con filtro:", filter);
    const isReadFilter = filter === 'unread' ? false : undefined;
    await fetchNotifications(isReadFilter);
    console.log("✅ [OwnerNotifiche] Notifiche caricate:", notifications.length);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    await fetchUnreadCount();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: Notification) => {
    console.log("👆 [OwnerNotifiche] Pressed notifica:", notification._id, "type:", notification.type);
    
    // Marca come letta se non lo è già
    if (!notification.isRead) {
      console.log("📖 [OwnerNotifiche] Marking as read:", notification._id);
      await markAsRead(notification._id);
    }

    // Naviga alla risorsa correlata
    if (notification.type === 'match_join' && notification.relatedId) {
      console.log("🎯 [OwnerNotifiche] Navigating to booking for match_join:", notification.relatedId);
      navigation.navigate('OwnerDettaglioPrenotazione', {
        bookingId: notification.relatedId,
      });
    } else if (notification.type === 'match_result' && notification.relatedId) {
      console.log("🏆 [OwnerNotifiche] Navigating to booking for match_result:", notification.relatedId);
      navigation.navigate('OwnerDettaglioPrenotazione', {
        bookingId: notification.relatedId,
      });
    } else if (notification.relatedModel === 'Booking' && notification.relatedId) {
      console.log("🏐 [OwnerNotifiche] Navigating to booking:", notification.relatedId);
      navigation.navigate('OwnerDettaglioPrenotazione', {
        bookingId: notification.relatedId,
      });
    } else if (notification.relatedModel === 'Match' && notification.relatedId) {
      console.log("🎯 [OwnerNotifiche] Navigating to match:", notification.relatedId);
      // Per ora navighiamo alla prenotazione associata al match
      // In futuro potremmo avere una schermata dedicata per i match
      navigation.navigate('OwnerDettaglioPrenotazione', {
        bookingId: notification.relatedId,
      });
    } else if (notification.relatedModel === 'Struttura' && notification.relatedId) {
      console.log("🏢 [OwnerNotifiche] Navigating to struttura:", notification.relatedId);
      navigation.navigate('StrutturaDashboard', {
        strutturaId: notification.relatedId,
      });
    } else {
      console.log("❓ [OwnerNotifiche] Unknown relatedModel:", notification.relatedModel);
    }
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
      case 'new_booking':
        return 'calendar';
      case 'booking_cancelled':
        return 'close-circle';
      case 'booking_confirmed':
        return 'checkmark-circle';
      case 'match_join':
        return 'person-add';
      case 'match_result':
        return 'trophy';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'new_booking':
        return '#4CAF50';
      case 'booking_cancelled':
        return '#f44336';
      case 'booking_confirmed':
        return '#2196F3';
      case 'match_join':
        return '#FF9800';
      case 'match_result':
        return '#FFD700';
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
            </View>

            {!item.isRead && <View style={styles.unreadDot} />}
          </View>
        </Pressable>
      </Swipeable>
    );
  };

  const filteredNotifications = notifications;

  console.log("🎨 [OwnerNotifiche] Rendering with", filteredNotifications.length, "notifications, unread:", unreadCount);

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
                : 'Riceverai qui le notifiche sulle tue strutture'}
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

export default OwnerNotificheScreen;