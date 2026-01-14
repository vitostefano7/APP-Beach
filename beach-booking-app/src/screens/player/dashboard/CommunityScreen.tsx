import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  FlatList,
  Image,
  ActivityIndicator,
  Dimensions,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../../context/AuthContext';
import { Avatar } from '../../../components/Avatar';
import { styles } from './styles/CommunityScreen.styles';
import API_URL from '../../../config/api';

const { width: screenWidth } = Dimensions.get('window');

type Post = {
  _id: string;
  user: {
    _id: string;
    name: string;
    avatarUrl?: string;
  };
  struttura?: {
    _id: string;
    name: string;
    images: string[];
    location: {
      city: string;
    };
  };
  isStrutturaPost: boolean;
  content: string;
  image?: string;
  likes: string[];
  comments: Array<{
    _id: string;
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
    text: string;
    createdAt: string;
  }>;
  createdAt: string;
};

type Event = {
  _id: string;
  title: string;
  date: string;
  location: string;
  participants: number;
  maxParticipants: number;
  image?: string;
};

export default function CommunityScreen() {
  console.log('🚀 ========================================');
  console.log('🚀 COMMUNITY SCREEN COMPONENT MOUNTED/RENDERED');
  console.log('🚀 ========================================');

  const navigation = useNavigation<any>();
  const { token, user } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState<'feed' | 'events' | 'rankings'>('feed');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});
  const [postingComment, setPostingComment] = useState<Set<string>>(new Set());

  // Log quando cambia lo state dei posts
  useEffect(() => {
    console.log('========================================');
    console.log('🔵 STATE POSTS AGGIORNATO:');
    console.log('   Numero posts nello state:', posts.length);
    if (posts.length > 0) {
      console.log('   IDs posts:', posts.map(p => p._id));
      console.log('   Autori posts:', posts.map(p => p.user?.name || 'Utente sconosciuto'));
    }
    console.log('========================================\n');
  }, [posts]);

  // Ricarica quando la schermata viene focussata (es. dopo creazione post)
  useFocusEffect(
    React.useCallback(() => {
      console.log('========================================');
      console.log('🔄 COMMUNITY SCREEN FOCUSED');
      console.log('   activeTab:', activeTab);
      console.log('========================================');
      loadCommunityData();
    }, [activeTab])
  );

  useEffect(() => {
    loadCommunityData();
  }, [activeTab]);

  const loadCommunityData = async () => {
    try {
      setLoading(true);

      if (activeTab === 'feed') {
        await loadPosts();
      } else if (activeTab === 'events') {
        await loadEvents();
      }

    } catch (error) {
      console.error('Errore caricamento community:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadPosts = async () => {
    try {
      console.log('========================================');
      console.log('📡 CARICAMENTO POSTS DA API');
      console.log('========================================');
      console.log('API_URL:', API_URL);
      console.log('Token presente:', !!token);
      console.log('Token (primi 20 char):', token?.substring(0, 20) + '...');
      console.log('User ID:', user?.id);
      console.log('User name:', user?.name);

      const url = `${API_URL}/community/posts?limit=20&offset=0`;
      console.log('URL completo:', url);

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('Response status:', res.status);
      console.log('Response ok:', res.ok);

      if (res.ok) {
        const data = await res.json();
        console.log('✅ RISPOSTA RICEVUTA:');
        console.log('Numero posts:', data.posts?.length || 0);
        console.log('Total:', data.total);
        console.log('HasMore:', data.hasMore);

        if (data.posts && data.posts.length > 0) {
          console.log('========================================');
          console.log('🎯 DETTAGLIO TUTTI I', data.posts.length, 'POSTS:');
          console.log('========================================');

          data.posts.forEach((post: any, index: number) => {
            console.log(`\n📄 POST #${index + 1}:`);
            console.log('─────────────────────────────────────');
            console.log('  🆔 ID:', post._id);
            console.log('  👤 User ID:', post.user?._id);
            console.log('  👤 User name:', post.user?.name);
            console.log('  👤 User avatarUrl:', post.user?.avatarUrl);
            console.log('  📝 Content:', post.content);
            console.log('  🖼️  Image URL:', post.image || 'NESSUNA');
            console.log('  ❤️  Likes (array):', JSON.stringify(post.likes));
            console.log('  ❤️  Likes count:', post.likes?.length || 0);
            console.log('  💬 Comments count:', post.comments?.length || 0);
            if (post.comments && post.comments.length > 0) {
              console.log('  💬 Comments:', JSON.stringify(post.comments));
            }
            console.log('  📅 CreatedAt:', post.createdAt);
            console.log('  📅 UpdatedAt:', post.updatedAt);
            console.log('─────────────────────────────────────');
          });

          console.log('\n========================================');
          console.log('📊 RIEPILOGO:');
          console.log('   Total posts:', data.posts.length);
          console.log('   Posts con immagine:', data.posts.filter((p: any) => p.image).length);
          console.log('   Posts senza immagine:', data.posts.filter((p: any) => !p.image).length);
          console.log('========================================\n');
        } else {
          console.log('========================================');
          console.log('⚠️  ARRAY POSTS VUOTO O NON PRESENTE');
          console.log('   data:', JSON.stringify(data));
          console.log('   data.posts:', data.posts);
          console.log('========================================\n');
        }

        console.log('🔄 Aggiorno state con', data.posts?.length || 0, 'posts...');
        setPosts(data.posts || []);
        console.log('✅ State aggiornato!');
      } else {
        const errorText = await res.text();
        console.error('❌ ERRORE API POSTS:');
        console.error('Status:', res.status);
        console.error('Response:', errorText);
        setPosts([]);
      }
    } catch (error: any) {
      console.error('========================================');
      console.error('❌ ERRORE CARICAMENTO POST:');
      console.error('Tipo errore:', error.name);
      console.error('Messaggio:', error.message);
      console.error('Stack:', error.stack);
      console.error('========================================');
      setPosts([]);
    }
  };

  const loadEvents = async () => {
    try {
      // TODO: Implementare endpoint API per gli eventi
      // const res = await fetch(`${API_URL}/community/events`, {
      //   headers: { Authorization: `Bearer ${token}` },
      // });
      // if (res.ok) {
      //   const data = await res.json();
      //   setEvents(data);
      // }

      // Mock data temporaneo
      setEvents([]);
    } catch (error) {
      console.error('Errore caricamento eventi:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCommunityData();
  };

  const handleLikePost = async (postId: string) => {
    try {
      console.log('❤️ Like post:', postId);
      const res = await fetch(`${API_URL}/community/posts/${postId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        console.log('✅ Like aggiornato:', data.liked);

        // Aggiorna lo stato locale
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
      } else {
        console.error('❌ Errore like:', res.status);
      }
    } catch (error) {
      console.error('❌ Errore like post:', error);
    }
  };

  const handleCommentPost = (postId: string) => {
    console.log('💬 Toggle comments for post:', postId);
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

    setPostingComment(prev => new Set(prev).add(postId));

    try {
      const response = await fetch(`${API_URL}/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: commentText }),
      });

      if (response.ok) {
        const newComment = await response.json();
        console.log('📝 New comment created:', newComment);
        
        // Aggiorna lo stato locale
        setPosts(prevPosts =>
          prevPosts.map(post => {
            if (post._id === postId) {
              return {
                ...post,
                comments: [...post.comments, newComment],
              };
            }
            return post;
          })
        );

        // Espandi automaticamente i commenti
        setExpandedComments(prev => {
          const newSet = new Set(prev);
          newSet.add(postId);
          return newSet;
        });

        // Pulisci input
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      }
    } catch (error) {
      console.error('Errore pubblicazione commento:', error);
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
                comments: post.comments.filter(comment => comment._id !== commentId),
              };
            }
            return post;
          })
        );
      }
    } catch (error) {
      console.error('Errore eliminazione commento:', error);
    }
  };

  const handleJoinEvent = (eventId: string) => {
    console.log('Join event:', eventId);
    // TODO: Implementare iscrizione evento
  };

  const getTimeUntilEvent = (eventDate: string) => {
    const now = new Date();
    const event = new Date(eventDate);
    const diffMs = event.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `Tra ${diffDays}g`;
    if (diffHours > 0) return `Tra ${diffHours}h`;
    return 'Oggi';
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>Community</Text>
        <Pressable
          style={styles.searchButton}
          onPress={() => {
            navigation.navigate('CercaAmici');
          }}
        >
          <Ionicons name="search" size={24} color="#2196F3" />
        </Pressable>
      </View>

      <View style={styles.tabBar}>
        <Pressable
          style={({pressed}) => [styles.tab, activeTab === 'feed' && styles.tabActive, pressed && styles.tabPressed]}
          onPress={() => setActiveTab('feed')}
        >
          <Ionicons
            name="newspaper-outline"
            size={20}
            color={activeTab === 'feed' ? 'white' : '#999'}
          />
          <Text style={[styles.tabText, activeTab === 'feed' && styles.tabTextActive]}>
            Feed
          </Text>
        </Pressable>

        <Pressable
          style={({pressed}) => [styles.tab, activeTab === 'events' && styles.tabActive, pressed && styles.tabPressed]}
          onPress={() => setActiveTab('events')}
        >
          <Ionicons
            name="calendar-outline"
            size={20}
            color={activeTab === 'events' ? 'white' : '#999'}
          />
          <Text style={[styles.tabText, activeTab === 'events' && styles.tabTextActive]}>
            Eventi
          </Text>
        </Pressable>

        <Pressable
          style={({pressed}) => [styles.tab, activeTab === 'rankings' && styles.tabActive, pressed && styles.tabPressed]}
          onPress={() => setActiveTab('rankings')}
        >
          <Ionicons
            name="trophy-outline"
            size={20}
            color={activeTab === 'rankings' ? 'white' : '#999'}
          />
          <Text style={[styles.tabText, activeTab === 'rankings' && styles.tabTextActive]}>
            Classifiche
          </Text>
        </Pressable>
      </View>
    </View>
  );

  const renderPost = ({ item }: { item: Post }) => {
    // Dati utente o struttura
    const isStruttura = item.isStrutturaPost && item.struttura;
    const displayName = isStruttura ? item.struttura!.name : (item.user?.name || 'Utente sconosciuto');
    const displayAvatar = isStruttura ? item.struttura!.images[0] : item.user?.avatarUrl;

    if (!item.user && !isStruttura) {
      console.warn('⚠️ POST SENZA USER E SENZA STRUTTURA:', item._id, '- Mostro con placeholder');
    }

    console.log('🎨 RENDERING POST:', {
      id: item._id,
      isStruttura,
      author: displayName,
      content: item.content.substring(0, 50) + '...',
      hasImage: !!item.image,
      likes: item.likes?.length || 0,
      comments: item.comments?.length || 0
    });

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

          {/* Pulsante Follow per strutture */}
          {isStruttura && (
            <Pressable
              style={styles.followPostButton}
              onPress={() => navigation.navigate('StrutturaDetail', { strutturaId: item.struttura!._id })}
            >
              <Ionicons name="add-circle-outline" size={20} color="#2196F3" />
            </Pressable>
          )}
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

                  return (
                    <View key={`comment-${comment._id}`} style={styles.commentItem}>
                      {isStructureComment && commentStructure ? (
                        <Image
                          source={{ uri: displayAvatar }}
                          style={styles.commentAvatar}
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
              <Avatar
                avatarUrl={user?.avatarUrl}
                name={user?.name || 'Tu'}
                size={32}
              />
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
                  onPress={() => handlePostComment(item._id)}
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

  const renderEvent = ({ item }: { item: Event }) => (
    <Pressable style={styles.eventCard} onPress={() => console.log('View event:', item._id)}>
      {/* Header con immagine e overlay */}
      <View style={styles.eventImageContainer}>
        <Image
          source={{ uri: item.image || 'https://via.placeholder.com/400x200?text=Beach+Event' }}
          style={styles.eventImage}
          resizeMode="cover"
        />
        {/* Gradient overlay */}
        <View style={styles.eventImageOverlay} />

        {/* Time badge */}
        <View style={styles.eventTimeBadge}>
          <Text style={styles.eventTimeBadgeText}>{getTimeUntilEvent(item.date)}</Text>
        </View>

        {/* Title and time on image */}
        <View style={styles.eventImageInfo}>
          <Text style={styles.eventTitleOnImage}>{item.title}</Text>
          <Text style={styles.eventTimeOnImage}>
            {new Date(item.date).toLocaleTimeString('it-IT', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
      </View>

      {/* Content section */}
      <View style={styles.eventContent}>
        <View style={styles.eventInfo}>
          <View style={styles.eventDetail}>
            <Ionicons name="location" size={16} color="#2196F3" />
            <Text style={styles.eventDetailText}>{item.location}</Text>
          </View>

          {/* Participants avatars */}
          <View style={styles.eventParticipantsRow}>
            <View style={styles.participantsAvatars}>
              <View style={[styles.participantAvatar, { zIndex: 3 }]}>
                <Ionicons name="person" size={14} color="white" />
              </View>
              <View style={[styles.participantAvatar, { zIndex: 2, marginLeft: -8 }]}>
                <Ionicons name="person" size={14} color="white" />
              </View>
              {item.participants > 2 && (
                <View style={[styles.participantAvatar, { zIndex: 1, marginLeft: -8 }]}>
                  <Text style={styles.participantAvatarText}>+{item.participants - 2}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.eventActions}>
          <Pressable style={styles.eventActionButton}>
            <Ionicons name="information-circle-outline" size={18} color="#2196F3" />
            <Text style={styles.eventActionText}>Indicazioni</Text>
          </Pressable>

          <Pressable
            style={styles.eventJoinButton}
            onPress={() => handleJoinEvent(item._id)}
          >
            <Ionicons name="people" size={18} color="white" />
            <Text style={styles.eventJoinButtonText}>
              Partecipa ({item.participants}/{item.maxParticipants})
            </Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );

  const renderRankings = () => (
    <View style={styles.rankingsContainer}>
      <View style={styles.comingSoonContainer}>
        <Ionicons name="trophy" size={64} color="#ccc" />
        <Text style={styles.comingSoonTitle}>Classifiche in arrivo</Text>
        <Text style={styles.comingSoonText}>
          Presto potrai vedere le classifiche dei migliori giocatori e squadre
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Ionicons
        name={activeTab === 'feed' ? 'newspaper-outline' : 'calendar-outline'}
        size={64}
        color="#ccc"
      />
      <Text style={styles.emptyStateTitle}>
        {activeTab === 'feed' ? 'Nessun post' : 'Nessun evento'}
      </Text>
      <Text style={styles.emptyStateText}>
        {activeTab === 'feed'
          ? 'Sii il primo a condividere qualcosa con la community!'
          : 'Non ci sono eventi in programma al momento'}
      </Text>
      <Pressable
        style={styles.emptyStateButton}
        onPress={() => {
          if (activeTab === 'feed') {
            navigation.navigate('CreatePost');
          } else {
            console.log('Create event - Coming soon');
          }
        }}
      >
        <Text style={styles.emptyStateButtonText}>
          {activeTab === 'feed' ? 'Crea un post' : 'Crea un evento'}
        </Text>
      </Pressable>
    </View>
  );

  const renderContent = () => {
    console.log('🖼️  RENDER CONTENT - activeTab:', activeTab, 'loading:', loading, 'posts.length:', posts.length);

    if (loading) {
      console.log('   → Mostro loader');
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Caricamento...</Text>
        </View>
      );
    }

    if (activeTab === 'feed') {
      if (posts.length > 0) {
        console.log('   → Mostro FlatList con', posts.length, 'posts');
        return (
          <FlatList
            data={posts}
            renderItem={renderPost}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        );
      } else {
        console.log('   → Mostro empty state (nessun post)');
        return (
          <ScrollView
            style={styles.container}
            contentContainerStyle={{ flex: 1, paddingBottom: 100 }}
          >
            {renderEmptyState()}
          </ScrollView>
        );
      }
    }

    if (activeTab === 'events') {
      if (events.length > 0) {
        return (
          <FlatList
            data={events}
            renderItem={renderEvent}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        );
      } else {
        return (
          <ScrollView
            style={styles.container}
            contentContainerStyle={{ flex: 1, paddingBottom: 100 }}
          >
            {renderEmptyState()}
          </ScrollView>
        );
      }
    }

    if (activeTab === 'rankings') {
      return (
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {renderRankings()}
        </ScrollView>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {renderHeader()}
      {renderContent()}
      
      {/* FAB per creare post */}
      <Pressable
        style={styles.fab}
        onPress={() => {
          console.log('➡️  Navigazione a CreatePost');
          navigation.navigate('CreatePost');
        }}
      >
        <Ionicons name="add" size={28} color="white" />
      </Pressable>
    </SafeAreaView>
  );
}
