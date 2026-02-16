import React from 'react';
import { View, Text, Image, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Struttura {
  _id: string;
  name: string;
  description?: string;
  images: string[];
  location: {
    address: string;
    city: string;
  };
  isFollowing?: boolean;
}

interface StrutturaCardProps {
  struttura: Struttura;
  onPress: () => void;
  onFollow: () => void;
  isFollowing: boolean;
  isLoading?: boolean;
  showDescription?: boolean;
}

export default function StrutturaCard({
  struttura,
  onPress,
  onFollow,
  isFollowing,
  isLoading = false,
  showDescription = true,
}: StrutturaCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.left}>
        {struttura.images && struttura.images[0] ? (
          <Image
            source={{ uri: struttura.images[0] }}
            style={styles.image}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="business" size={30} color="#2196F3" />
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {struttura.name}
          </Text>
          <View style={styles.location}>
            <Ionicons name="location" size={12} color="#666" />
            <Text style={styles.locationText} numberOfLines={1}>
              {struttura.location.city}
            </Text>
          </View>
          {showDescription && struttura.description && (
            <Text style={styles.description} numberOfLines={2}>
              {struttura.description}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.right}>
        <Pressable
          style={[
            styles.followButton,
            isFollowing && styles.followingButton,
          ]}
          onPress={(e) => {
            e.stopPropagation();
            onFollow();
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : isFollowing ? (
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          ) : (
            <Ionicons name="add-circle" size={20} color="#fff" />
          )}
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locationText: {
    fontSize: 13,
    color: '#666',
  },
  description: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  right: {
    marginLeft: 8,
  },
  followButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  followingButton: {
    backgroundColor: '#e8f5e9',
  },
});
