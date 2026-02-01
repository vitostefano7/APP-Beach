import React, { useState, useContext, useEffect, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  Modal,
  Pressable,
  Image,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';
import API_URL from '../../config/api';
import {
  CommunityHeader,
  CommunityTabBar,
  QuickInputBar,
  PostCard,
  CommunityTheme,
} from '../../components/Community';
import { usePosts, usePostInteractions } from '../../components/Community/hooks';
import { Post, Struttura, CommunityTab } from '../../types/community.types';

export default function OwnerCommunityScreen() {
  const navigation = useNavigation<any>();
  const { token, user } = useContext(AuthContext);

  // State
  const [activeTab, setActiveTab] = useState<CommunityTab>('tutti');
  const [userStructures, setUserStructures] = useState<Struttura[]>([]);
  const [loadingStructures, setLoadingStructures] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState<Struttura | null>(null);
  const [structureModalVisible, setStructureModalVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const currentScrollOffset = useRef<number>(0);

  // Custom hooks
  const {
    posts,
    loading,
    refreshing,
    loadPosts,
    refreshPosts,
    updatePost,
  } = usePosts({
    token: token || '',
    userId: user?.id,
    strutturaId: selectedStructure?._id,
    filter: 'all',
  });

  const { likePost } = usePostInteractions({
    token: token || '',
    userId: user?.id,
    onLikeToggled: (postId, isLiked) => {
      updatePost(postId, {
        likes: isLiked
          ? [...(posts.find(p => p._id === postId)?.likes || []), user?.id || '']
          : posts.find(p => p._id === postId)?.likes.filter(id => id !== user?.id) || [],
      });
    },
  });

  // Load structures on mount
  useFocusEffect(
    useCallback(() => {
      loadUserStructures();
      loadPosts();
    }, [])
  );

  // Reload posts when structure changes
  useEffect(() => {
    if (selectedStructure) {
      console.log('🔄 Structure changed, reloading posts for:', selectedStructure.name);
      loadPosts();
    }
  }, [selectedStructure, loadPosts]);

  // Auto-select first structure
  useEffect(() => {
    if (userStructures.length > 0 && !selectedStructure) {
      setSelectedStructure(userStructures[0]);
      console.log('🏢 Auto-selected first structure:', userStructures[0].name);
    }
  }, [userStructures, selectedStructure]);

  const loadUserStructures = async () => {
    console.log('🏢 Loading user structures...');
    try {
      setLoadingStructures(true);
      const response = await fetch(`${API_URL}/strutture/owner/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Structures loaded:', data.length);
        setUserStructures(data);
      } else {
        console.error('❌ Error loading structures:', response.status);
        setUserStructures([]);
      }
    } catch (error) {
      console.error('💥 Error loading structures:', error);
      setUserStructures([]);
    } finally {
      setLoadingStructures(false);
    }
  };

  const handleLike = async (postId: string) => {
    await likePost(postId);
  };

  const handleShare = (postId: string) => {
    console.log('🔗 Share post:', postId);
    // TODO: Implement share functionality
  };

  const handleCreatePost = () => {
    if (!selectedStructure) {
      // Show alert to select structure first
      return;
    }
    navigation.navigate('OwnerCreatePost', { strutturaId: selectedStructure._id });
  };

  const handleAuthorPress = (authorId: string, isStructure: boolean) => {
    console.log('👤 [OwnerCommunityScreen] Author pressed:', { authorId, isStructure });
    if (isStructure) {
      navigation.navigate('StrutturaDetail', { strutturaId: authorId });
    } else {
      navigation.navigate('UserProfile', { userId: authorId });
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'}/community/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        // Refresh posts to remove the deleted one
        await refreshPosts();
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleInputFocus = (postId: string, inputBottomEdge?: number) => {
    console.log('📍 [OwnerCommunityScreen] Input focused on post:', postId, 'bottomEdge:', inputBottomEdge);
    
    if (inputBottomEdge && flatListRef.current) {
      const screenHeight = Dimensions.get('window').height;
      const keyboardHeight = 288;
      const keyboardTop = screenHeight - keyboardHeight;
      
      const currentGap = keyboardTop - inputBottomEdge;
      const desiredGap = 100;
      
      console.log('📏 [OwnerCommunityScreen] Scroll calculation:', {
        screenHeight: Math.round(screenHeight),
        keyboardTop: Math.round(keyboardTop),
        inputBottomEdge: Math.round(inputBottomEdge),
        currentGap: Math.round(currentGap),
        desiredGap,
        currentScrollOffset: Math.round(currentScrollOffset.current),
      });
      
      if (currentGap < desiredGap) {
        const scrollAmount = desiredGap - currentGap;
        const newOffset = currentScrollOffset.current + scrollAmount;
        console.log(`⬆️ [OwnerCommunityScreen] Scrolling from ${Math.round(currentScrollOffset.current)}px to ${Math.round(newOffset)}px (+${Math.round(scrollAmount)}px)`);
        
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({
            offset: Math.max(0, newOffset),
            animated: true,
          });
        }, 100);
      } else {
        console.log('✅ [OwnerCommunityScreen] Gap is sufficient, no scroll needed');
      }
    }
  };

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      currentUserId={user?.id}
      token={token || ''}
      onLike={handleLike}
      onShare={handleShare}
      strutturaId={selectedStructure?._id}
      onInputFocus={handleInputFocus}
      onAuthorPress={handleAuthorPress}
      onDeletePost={handleDeletePost}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="newspaper-outline" size={64} color={CommunityTheme.colors.textTertiary} />
      <Text style={styles.emptyText}>Nessun post</Text>
      <Text style={styles.emptySubtext}>
        {selectedStructure 
          ? `Sii il primo a postare per ${selectedStructure.name}!`
          : 'Seleziona una struttura per vedere i post'}
      </Text>
      {selectedStructure && (
        <Pressable style={styles.emptyButton} onPress={handleCreatePost}>
          <Text style={styles.emptyButtonText}>Crea un post</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.content}>
        {/* Header with structure selector */}
        <CommunityHeader
          title="Community"
          selectedStructure={selectedStructure}
          onStructurePress={() => setStructureModalVisible(true)}
          onSearchPress={() => navigation.navigate('OwnerCercaAmiciScreen')}
          showNotification={false}
          showSearch={true}
        />

        {/* Tab bar */}
        <CommunityTabBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={[
            { id: 'tutti', label: 'Tutti' },
            { id: 'post', label: 'Post' },
          ]}
        />

        {/* Content */}
        {loading && posts.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={CommunityTheme.colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={posts}
            keyExtractor={(item) => item._id}
            renderItem={renderPost}
            contentContainerStyle={styles.listContent}
            refreshing={refreshing}
            onRefresh={refreshPosts}
            onScroll={(event) => {
              currentScrollOffset.current = event.nativeEvent.contentOffset.y;
            }}
            scrollEventThrottle={16}
            onScrollToIndexFailed={(info) => {
              console.warn('Failed to scroll to index:', info);
              setTimeout(() => {
                flatListRef.current?.scrollToOffset({
                  offset: info.averageItemLength * info.index,
                  animated: true,
                });
              }, 100);
            }}
            ListHeaderComponent={
              selectedStructure ? (
                <QuickInputBar
                  showStructureAvatar={true}
                  structureImageUrl={selectedStructure.images[0]}
                  placeholder="Cosa vuoi condividere?"
                  onPress={handleCreatePost}
                />
              ) : null
            }
            ListEmptyComponent={renderEmptyState()}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
      </KeyboardAvoidingView>

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
                <Ionicons name="close" size={24} color={CommunityTheme.colors.textSecondary} />
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
                      isSelected && styles.structureOptionSelected,
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
                      <Ionicons 
                        name="checkmark-circle" 
                        size={24} 
                        color={CommunityTheme.colors.primary} 
                      />
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CommunityTheme.colors.background,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingVertical: CommunityTheme.spacing.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: CommunityTheme.spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: CommunityTheme.colors.textPrimary,
    marginTop: CommunityTheme.spacing.lg,
  },
  emptySubtext: {
    fontSize: 15,
    color: CommunityTheme.colors.textSecondary,
    marginTop: CommunityTheme.spacing.sm,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: CommunityTheme.spacing.xxl,
    backgroundColor: CommunityTheme.colors.primary,
    paddingHorizontal: CommunityTheme.spacing.xxl,
    paddingVertical: CommunityTheme.spacing.md,
    borderRadius: CommunityTheme.borderRadius.md,
  },
  emptyButtonText: {
    color: CommunityTheme.colors.cardBackground,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: CommunityTheme.colors.cardBackground,
    borderRadius: CommunityTheme.borderRadius.lg,
    maxHeight: '70%',
    width: '90%',
    ...CommunityTheme.shadows.card,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: CommunityTheme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: CommunityTheme.colors.borderLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: CommunityTheme.colors.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: CommunityTheme.colors.textSecondary,
    paddingHorizontal: CommunityTheme.spacing.xl,
    paddingBottom: CommunityTheme.spacing.lg,
  },
  structuresList: {
    padding: CommunityTheme.spacing.xl,
  },
  structureOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CommunityTheme.colors.background,
    padding: CommunityTheme.spacing.lg,
    borderRadius: CommunityTheme.borderRadius.md,
    marginBottom: CommunityTheme.spacing.md,
  },
  structureOptionSelected: {
    backgroundColor: CommunityTheme.colors.primaryLight,
    borderWidth: 2,
    borderColor: CommunityTheme.colors.primary,
  },
  structureOptionImage: {
    width: 50,
    height: 50,
    borderRadius: CommunityTheme.borderRadius.sm,
  },
  structureOptionInfo: {
    flex: 1,
    marginLeft: CommunityTheme.spacing.md,
  },
  structureOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: CommunityTheme.colors.textPrimary,
  },
  structureOptionLocation: {
    fontSize: 14,
    color: CommunityTheme.colors.textSecondary,
    marginTop: 2,
  },
});
