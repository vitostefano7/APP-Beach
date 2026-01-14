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
  comments: {
    _id: string;
    text: string;
    user: {
      _id: string;
      name: string;
      avatarUrl?: string;
    };
    struttura?: {
      _id: string;
      name: string;
      images: string[];
    };
    createdAt: string;
  }[];
  createdAt: string;
}

export default function OwnerCommunityScreen() {
  const navigation = useNavigation<any>();
  const { token, user } = useContext(AuthContext);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});
  const [postingComment, setPostingComment] = useState<Set<string>>(new Set());
  const [userStructures, setUserStructures] = useState<Struttura[]>([]);
  const [loadingStructures, setLoadingStructures] = useState(false);
  const [structureModalVisible, setStructureModalVisible] = useState(false);
  const [structureComments, setStructureComments] = useState<Set<string>>(new Set()); // Track commenti fatti come struttura
  const [selectedStructure, setSelectedStructure] = useState<Struttura | null>(null); // Struttura attualmente selezionata
  const [selectedPostForComment, setSelectedPostForComment] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadUserStructures();
      loadPosts();
    }, [])
  );

  // Ricarica i post quando cambia la struttura selezionata
  useEffect(() => {
    if (selectedStructure) {
      console.log('🔄 Struttura cambiata, ricarico post per:', selectedStructure.name);
      loadPosts();
    }
  }, [selectedStructure]);

  // Seleziona automaticamente la prima struttura se non ne è selezionata una
  useEffect(() => {
    if (userStructures.length > 0 && !selectedStructure) {
      setSelectedStructure(userStructures[0]);
      console.log('🏢 Auto-selected first structure:', userStructures[0].name);
    }
  }, [userStructures]);

  const loadUserStructures = async () => {
    console.log('🏢 [OwnerCommunity] Loading user structures...');
    try {
      setLoadingStructures(true);
      const response = await fetch(`${API_URL}/strutture/owner/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Strutture caricate:', data.length);
        data.forEach((s: Struttura, i: number) => {
          console.log(`  ${i + 1}. ${s.name} (${s._id})`);
        });
        setUserStructures(data);
      } else {
        console.error('❌ Errore caricamento strutture:', response.status);
        setUserStructures([]);
      }
    } catch (error) {
      console.error('💥 Errore caricamento strutture:', error);
      setUserStructures([]);
    } finally {
      setLoadingStructures(false);
    }
  };

  const loadPosts = async () => {
    console.log('🔄 [OwnerCommunity] Starting loadPosts...');
    console.log('🔑 Token exists:', !!token);
    console.log('👤 User:', user?.id, user?.name);
    console.log('🏢 Selected structure:', selectedStructure?.name, selectedStructure?._id);
    
    try {
      setLoadingPosts(true);
      
      // Aggiungi strutturaId alla query se è selezionata una struttura
      let url = `${API_URL}/community/posts?limit=50&offset=0`;
      if (selectedStructure) {
        url += `&strutturaId=${selectedStructure._id}`;
        console.log('🏢 Filtering posts for structure:', selectedStructure.name);
      }
      console.log('🌐 Fetching from:', url);
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).catch(fetchError => {
        console.error('💥 Fetch error:', fetchError);
        throw fetchError;
      });

      console.log('📡 Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API error:', response.status, errorText);
        setPosts([]);
        return;
      }

      let data;
      try {
        data = await response.json();
        console.log('✅ JSON parsed successfully');
        console.log('📦 Data type:', typeof data);
        console.log('📦 Is array:', Array.isArray(data));
        console.log('📦 Has posts property:', data && 'posts' in data);
        console.log('📦 Data keys:', data ? Object.keys(data) : 'null');
      } catch (parseError) {
        console.error('💥 JSON parse error:', parseError);
        setPosts([]);
        return;
      }
      
      // Gestisci sia {posts: [...]} che [...]
      let allPosts: Post[] = [];
      
      if (Array.isArray(data)) {
        console.log('📋 Data is array, length:', data.length);
        allPosts = data;
      } else if (data && typeof data === 'object' && 'posts' in data && Array.isArray(data.posts)) {
        console.log('📋 Data has posts property, length:', data.posts.length);
        allPosts = data.posts;
      } else {
        console.warn('⚠️ Unexpected API response format');
        console.warn('⚠️ Data:', JSON.stringify(data, null, 2));
        allPosts = [];
      }
      
      console.log('🔍 Total posts received:', allPosts.length);
      
      // Filtra solo i posts delle strutture
      const strutturaPosts = allPosts.filter((post: Post) => {
        const isStruttura = post.isStrutturaPost === true;
        if (isStruttura) {
          console.log('🏢 Struttura post found:', post._id, post.struttura?.name);
        }
        return isStruttura;
      });
      
      console.log('✅ Filtered struttura posts:', strutturaPosts.length);
      
      // Ripopola i commenti struttura dal backend (se hanno strutturaId)
      const newStructureComments = new Set<string>();
      strutturaPosts.forEach(post => {
        post.comments?.forEach(comment => {
          if (comment.struttura) {
            newStructureComments.add(comment._id);
          }
        });
      });
      setStructureComments(newStructureComments);
      console.log('📋 Repopulated structure comments:', newStructureComments.size);
      
      setPosts(strutturaPosts);
      
    } catch (error: any) {
      console.error('💥 Exception in loadPosts:');
      console.error('   Name:', error?.name);
      console.error('   Message:', error?.message);
      console.error('   Stack:', error?.stack);
      setPosts([]);
    } finally {
      console.log('🏁 loadPosts completed');
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

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handlePostComment = async (postId: string) => {
    const commentText = commentInputs[postId]?.trim();
    if (!commentText) return;

    if (!selectedStructure) {
      Alert.alert('Errore', 'Seleziona una struttura dall\'header');
      return;
    }

    console.log('💬 handlePostComment with structure:', selectedStructure.name);
    await postComment(postId, selectedStructure._id);
  };

  const postComment = async (postId: string, strutturaId: string) => {
    const commentText = commentInputs[postId]?.trim();
    if (!commentText) return;

    setPostingComment(prev => new Set(prev).add(postId));

    try {
      const response = await fetch(`${API_URL}/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          text: commentText,
          strutturaId: strutturaId // Specifica quale struttura sta commentando
        }),
      });

      console.log('📡 Comment API call:', {
        url: `${API_URL}/community/posts/${postId}/comments`,
        method: 'POST',
        body: { text: commentText, strutturaId: strutturaId }
      });

      if (response.ok) {
        const newComment = await response.json();
        console.log('📝 New comment created:', JSON.stringify(newComment, null, 2));
        console.log('🏢 Comment has struttura:', !!newComment.struttura);
        
        // Traccia che questo commento è stato fatto come struttura
        if (newComment.struttura && newComment._id) {
          setStructureComments(prev => new Set(prev).add(newComment._id));
          console.log('📋 Tracked structure comment:', newComment._id);
        }
        
        // Aggiorna lo stato locale con il commento completo dal backend
        setPosts(prevPosts =>
          prevPosts.map(post => {
            if (post._id === postId) {
              return {
                ...post,
                comments: [...(post.comments || []), newComment],
              };
            }
            return post;
          })
        );

        // Espandi automaticamente i commenti per vedere il nuovo commento
        setExpandedComments(prev => {
          const newSet = new Set(prev);
          newSet.add(postId);
          return newSet;
        });

        // Pulisci input e chiudi modal
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
        setStructureModalVisible(false);
        setSelectedPostForComment(null);
      }
    } catch (error) {
      console.error('Errore pubblicazione commento:', error);
      Alert.alert('Errore', 'Impossibile pubblicare il commento');
    } finally {
      setPostingComment(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      const response = await fetch(`${API_URL}/community/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Aggiorna lo stato locale
        setPosts(prevPosts =>
          prevPosts.map(post => {
            if (post._id === postId) {
              return {
                ...post,
                comments: post.comments?.filter(comment => comment._id !== commentId) || [],
              };
            }
            return post;
          })
        );
        
        // Rimuovi dal tracking se era un commento struttura
        setStructureComments(prev => {
          const newSet = new Set(prev);
          newSet.delete(commentId);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Errore eliminazione commento:', error);
      Alert.alert('Errore', 'Impossibile eliminare il commento');
    }
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
            onPress={() => toggleComments(item._id)}
          >
            <Ionicons name="chatbubble-outline" size={22} color="#666" />
            <Text style={styles.postActionText}>{item.comments?.length || 0}</Text>
          </Pressable>

          <Pressable style={styles.postAction}>
            <Ionicons name="share-social-outline" size={22} color="#666" />
          </Pressable>
        </View>

        {/* Sezione commenti espansa */}
        {expandedComments.has(item._id) && (
          <View style={styles.commentsSection}>
            {/* Lista commenti esistenti */}
            {item.comments && item.comments.length > 0 && (
              <View style={styles.commentsList}>
                {item.comments.map((comment: any) => {
                  // Determina se il commento è fatto da una struttura
                  const isStructureComment = !!comment.struttura;
                  const commentStructure = comment.struttura;
                  
                  const displayName = isStructureComment && commentStructure 
                    ? commentStructure.name 
                    : (comment.user?.name || 'Utente');
                  const displayAvatar = isStructureComment && commentStructure 
                    ? commentStructure.images?.[0] 
                    : comment.user?.avatarUrl;
                  
                  console.log('💬 Rendering comment:', {
                    commentId: comment._id,
                    isStructureComment,
                    hasStruttura: !!comment.struttura,
                    userId: comment.user?._id,
                    currentUserId: user?.id,
                    displayName,
                    structureFound: !!commentStructure
                  });

                  return (
                    <View key={`comment-${comment._id}`} style={styles.commentItem}>
                      {isStructureComment && commentStructure ? (
                        <Image
                          source={{ uri: displayAvatar }}
                          style={styles.strutturaAvatar}
                        />
                      ) : (
                        <Avatar
                          avatarUrl={displayAvatar}
                          name={displayName}
                          size={32}
                        />
                      )}
                      <View style={styles.commentContent}>
                        <View style={styles.commentHeader}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            {isStructureComment && commentStructure && (
                              <Ionicons name="business" size={14} color="#2196F3" />
                            )}
                            <Text style={styles.commentAuthor}>{displayName}</Text>
                          </View>
                          <Text style={styles.commentTime}>
                            {new Date(comment.createdAt).toLocaleDateString('it-IT')}
                          </Text>
                        </View>
                        <Text style={styles.commentText}>{comment.text}</Text>
                      </View>
                      {/* Pulsante elimina se è il proprietario del commento */}
                      {comment.user?._id === user?.id && (
                        <Pressable
                          style={styles.deleteCommentButton}
                          onPress={() => handleDeleteComment(item._id, comment._id)}
                        >
                          <Ionicons name="trash-outline" size={16} color="#999" />
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* Input per nuovo commento */}
            <View style={styles.commentInputContainer}>
              {selectedStructure ? (
                <Image
                  source={{ uri: selectedStructure.images[0] }}
                  style={styles.commentInputAvatar}
                />
              ) : (
                <Avatar
                  avatarUrl={user?.avatarUrl}
                  name={user?.name || 'Tu'}
                  size={32}
                />
              )}
              <View style={styles.commentInputWrapper}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Scrivi un commento..."
                  value={commentInputs[item._id] || ''}
                  onChangeText={(text) =>
                    setCommentInputs(prev => ({ ...prev, [item._id]: text }))
                  }
                  multiline
                  maxLength={500}
                />
                <Pressable
                  style={[
                    styles.postCommentButton,
                    (!commentInputs[item._id]?.trim() || postingComment.has(item._id)) && styles.postCommentButtonDisabled
                  ]}
                  onPress={() => {
                    console.log('🚀 Send button pressed for post:', item._id);
                    console.log('📝 Comment text:', commentInputs[item._id]);
                    handlePostComment(item._id);
                  }}
                  disabled={!commentInputs[item._id]?.trim() || postingComment.has(item._id)}
                >
                  {postingComment.has(item._id) ? (
                    <ActivityIndicator size="small" color="#2196F3" />
                  ) : (
                    <Ionicons name="send" size={18} color="white" />
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };



  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Community</Text>
          
          {/* Selettore struttura */}
          {userStructures.length > 0 && (
            <Pressable
              style={styles.structureSelector}
              onPress={() => setStructureModalVisible(true)}
            >
              {selectedStructure && (
                <>
                  <Image
                    source={{ uri: selectedStructure.images[0] }}
                    style={styles.selectedStructureAvatar}
                  />
                  <Text style={styles.selectedStructureName} numberOfLines={1}>
                    {selectedStructure.name}
                  </Text>
                </>
              )}
              <Ionicons name="chevron-down" size={16} color="#666" />
            </Pressable>
          )}
        </View>
        
        <Pressable
          style={styles.searchButton}
          onPress={() => {
            navigation.navigate('OwnerCercaAmiciScreen');
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

      {/* Modal selezione struttura */}
      <Modal
        visible={structureModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setStructureModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cambia struttura</Text>
              <Pressable
                onPress={() => setStructureModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>
              Seleziona con quale struttura operare
            </Text>

            <FlatList
              data={userStructures}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => {
                const isSelected = selectedStructure?._id === item._id;
                return (
                  <Pressable
                    style={[
                      styles.structureOption,
                      isSelected && styles.structureOptionSelected
                    ]}
                    onPress={() => {
                      console.log('🏢 Structure changed to:', item.name);
                      setSelectedStructure(item);
                      setStructureModalVisible(false);
                    }}
                  >
                    <Image
                      source={{ uri: item.images[0] }}
                      style={styles.structureOptionImage}
                    />
                    <View style={styles.structureOptionInfo}>
                      <Text style={styles.structureOptionName}>{item.name}</Text>
                      <Text style={styles.structureOptionLocation}>
                        {item.location.city}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color="#2196F3" />
                    )}
                  </Pressable>
                );
              }}
              contentContainerStyle={styles.structuresList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

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
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 4,
  },
  structureSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 4,
    maxWidth: '90%',
  },
  selectedStructureAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  selectedStructureName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
    flex: 1,
    marginRight: 4,
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
  commentsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  commentsList: {
    marginBottom: 16,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  commentContent: {
    flex: 1,
    marginLeft: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginRight: 8,
  },
  commentTime: {
    fontSize: 12,
    color: '#999',
  },
  commentText: {
    fontSize: 14,
    color: '#212121',
    lineHeight: 20,
  },
  deleteCommentButton: {
    padding: 4,
    marginLeft: 8,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  commentInputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginLeft: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    color: '#212121',
    maxHeight: 80,
  },
  postCommentButton: {
    marginLeft: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postCommentButtonDisabled: {
    backgroundColor: '#ccc',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    maxHeight: '70%',
    width: '90%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
  },
  closeButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  structuresList: {
    padding: 20,
  },
  structureOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  structureOptionSelected: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  structureOptionImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  structureOptionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  structureOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  structureOptionLocation: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});
