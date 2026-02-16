import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../Avatar/Avatar';

interface RecentUser {
  _id: string;
  name: string;
  surname?: string;
  username: string;
  avatarUrl?: string;
  preferredSports?: string[];
  commonMatchesCount?: number;
  mutualFriendsCount?: number;
}

interface RecentStruttura {
  _id: string;
  name: string;
  images: string[];
  location: {
    address: string;
    city: string;
  };
  isFollowing?: boolean;
}

interface RecentUserCardProps {
  user: RecentUser;
  onPress: () => void;
}

interface RecentStrutturaCardProps {
  struttura: RecentStruttura;
  onPress: () => void;
}

export function RecentUserCard({ user, onPress }: RecentUserCardProps) {
  return (
    <Pressable style={styles.userCard} onPress={onPress}>
      <Avatar
        name={user.name}
        surname={user.surname}
        avatarUrl={user.avatarUrl}
        size={50}
        backgroundColor="#E3F2FD"
        textColor="#2196F3"
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName} numberOfLines={1}>
          {user.surname ? `${user.name} ${user.surname}` : user.name}
        </Text>
        <Text style={styles.userUsername} numberOfLines={1}>
          @{user.username}
        </Text>
        {user.commonMatchesCount !== undefined && user.commonMatchesCount > 0 && (
          <Text style={styles.commonMatchesText}>
            {user.commonMatchesCount} {user.commonMatchesCount === 1 ? 'partita insieme' : 'partite insieme'}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

export function RecentStrutturaCard({ struttura, onPress }: RecentStrutturaCardProps) {
  return (
    <Pressable style={styles.strutturaCard} onPress={onPress}>
      {struttura.images && struttura.images[0] ? (
        <Image
          source={{ uri: struttura.images[0] }}
          style={styles.strutturaImage}
        />
      ) : (
        <View style={styles.strutturaImagePlaceholder}>
          <Ionicons name="business" size={24} color="#2196F3" />
        </View>
      )}
      <View style={styles.strutturaInfo}>
        <Text style={styles.strutturaName} numberOfLines={1}>
          {struttura.name}
        </Text>
        <View style={styles.strutturaLocation}>
          <Ionicons name="location" size={10} color="#666" />
          <Text style={styles.strutturaLocationText} numberOfLines={1}>
            {struttura.location.city}
          </Text>
        </View>
      </View>
      {struttura.isFollowing && (
        <View style={styles.followingBadge}>
          <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  userUsername: {
    fontSize: 12,
    color: '#666',
  },
  commonMatchesText: {
    fontSize: 11,
    color: '#2196F3',
    marginTop: 2,
    fontWeight: '500',
  },
  strutturaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    position: 'relative',
  },
  strutturaImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  strutturaImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  strutturaInfo: {
    flex: 1,
    gap: 2,
  },
  strutturaName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  strutturaLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  strutturaLocationText: {
    fontSize: 12,
    color: '#666',
  },
  followingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 2,
  },
});
