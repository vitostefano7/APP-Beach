import React, { useState, useContext, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  TextInput,
  Image,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';
import { Avatar } from '../../components/Avatar';
import API_URL from '../../config/api';
import { StyleSheet } from 'react-native';

interface User {
  _id: string;
  name: string;
  surname: string;
  username: string;
  avatarUrl?: string;
  friendshipStatus?: 'none' | 'pending' | 'accepted';
  followStatus?: 'none' | 'following'; // Stato follow per ogni struttura
}

interface Struttura {
  _id: string;
  name: string;
  images: string[];
  location: {
    city: string;
  };
}

interface Post {
  _id: string;
  content: string;
  image?: string;
  user?: User;
  struttura?: {
    _id: string;
    name: string;
    images: string[];
  };
  isStrutturaPost: boolean;
  likes: string[];
  comments: any[];
  createdAt: string;
}

export default function OwnerCommunityScreen() {
  const navigation = useNavigation<any>();
  const { token, user } = useContext(AuthContext);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadPosts();
    }, [])
  );

  const loadPosts = async () => {
    try {
      setLoadingPosts(true);
      // Carica solo i post delle proprie strutture (filtro strutture)
      const response = await fetch(`${API_URL}/community/posts?filter=strutture`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Errore caricamento posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const handleLikePost = async (postId: string) => {
    try {
      const res = await fetch(`${API_URL}/community/posts/${postId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setPosts(prevPosts =>
          prevPosts.map(post => {
            if (post._id === postId) {
              const newLikes = data.liked
                ? [...post.likes, user?.id || '']
                : post.likes.filter(id => id !== user?.id);
              return { ...post, likes: newLikes };
            }
            return post;
          })
        );
      }
    } catch (error) {
      console.error('Errore like post:', error);
    }
  };

  const handleCommentPost = (postId: string) => {
    navigation.navigate('PostDetail', { postId });
  };

  const renderPost = ({ item }: { item: Post }) => {
    const isStruttura = item.isStrutturaPost && item.struttura;
    const displayName = isStruttura ? item.struttura!.name : (item.user?.name || 'Utente sconosciuto');
    const displayAvatar = isStruttura ? item.struttura!.images[0] : item.user?.avatarUrl;

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          {isStruttura ? (
            <Image
              source={{ uri: displayAvatar }}
              style={styles.strutturaAvatar}
            />
          ) : (
            <Avatar
              avatarUrl={displayAvatar}
              name={displayName}
              size={40}
            />
          )}
          <View style={styles.postHeaderText}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              {isStruttura && <Ionicons name="business" size={16} color="#2196F3" />}
              <Text style={styles.postAuthor}>{displayName}</Text>
            </View>
            {isStruttura && item.struttura?.location?.city && (
              <Text style={styles.strutturaLocation}>{item.struttura.location.city}</Text>
            )}
            <Text style={styles.postTime}>
              {new Date(item.createdAt).toLocaleDateString('it-IT')}
            </Text>
          </View>
        </View>

        <Text style={styles.postContent}>{item.content}</Text>

        {item.image && (
          <Image
            source={{ uri: item.image }}
            style={styles.postImage}
            resizeMode="cover"
          />
        )}

        <View style={styles.postActions}>
          <Pressable
            style={styles.postAction}
            onPress={() => handleLikePost(item._id)}
          >
            <Ionicons
              name={item.likes?.includes(user?.id || '') ? 'heart' : 'heart-outline'}
              size={24}
              color={item.likes?.includes(user?.id || '') ? '#FF5252' : '#666'}
            />
            <Text style={styles.postActionText}>{item.likes?.length || 0}</Text>
          </Pressable>

          <Pressable
            style={styles.postAction}
            onPress={() => handleCommentPost(item._id)}
          >
            <Ionicons name="chatbubble-outline" size={22} color="#666" />
            <Text style={styles.postActionText}>{item.comments?.length || 0}</Text>
          </Pressable>

          <Pressable style={styles.postAction}>
            <Ionicons name="share-social-outline" size={22} color="#666" />
          </Pressable>
        </View>
      </View>
    );
  };



  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community</Text>
        <Pressable
          style={styles.searchButton}
          onPress={() => {
            // TODO: Navigate to search screen
            console.log('Navigate to search');
          }}
        >
          <Ionicons name="search" size={24} color="#2196F3" />
        </Pressable>
      </View>

      {/* Content */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        renderItem={renderPost}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          loadingPosts ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color="#2196F3" />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="newspaper-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>
                Nessun post delle tue strutture
              </Text>
              <Pressable
                style={styles.emptyButton}
                onPress={() => navigation.navigate('OwnerCreatePost')}
              >
                <Text style={styles.emptyButtonText}>Crea il primo post</Text>
              </Pressable>
            </View>
          )
        }
      />

      {/* FAB per creare post */}
      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate('OwnerCreatePost')}
      >
        <Ionicons name="add" size={28} color="white" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#212121',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  listContent: {
    paddingBottom: 100,
  },
  postCard: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  strutturaAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  strutturaLocation: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  postAuthor: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  postTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  postContent: {
    fontSize: 15,
    color: '#212121',
    lineHeight: 22,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    gap: 24,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  postActionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 24,
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
