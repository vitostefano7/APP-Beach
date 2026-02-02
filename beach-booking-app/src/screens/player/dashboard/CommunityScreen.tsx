import React, { useState, useContext, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../../context/AuthContext';
import {
  CommunityHeader,
  CommunityTabBar,
  QuickInputBar,
  PostCard,
  CommunityTheme,
} from '../../../components/Community';
import { usePosts, usePostInteractions } from '../../../components/Community/hooks';
import { Post, CommunityTab } from '../../../types/community.types';
import { useCustomAlert } from '../../../hooks/useCustomAlert';

export default function CommunityScreen() {
  console.log('🚀 COMMUNITY SCREEN (PLAYER) MOUNTED');

  const navigation = useNavigation<any>();
  const { token, user } = useContext(AuthContext);

  // State
  const [activeTab, setActiveTab] = useState<CommunityTab>('tutti');
  const flatListRef = useRef<FlatList>(null);
  const currentScrollOffset = useRef<number>(0);

  const { showAlert, AlertComponent } = useCustomAlert();

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
    filter: 'following', // Player vede solo post di chi segue
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

  // Load posts on focus
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Community screen focused, loading posts');
      loadPosts();
    }, [loadPosts])
  );

  const handleLike = async (postId: string) => {
    await likePost(postId);
  };

  const handleShare = (postId: string) => {
    console.log('🔗 Share post:', postId);
    // TODO: Implement share functionality
  };

  const handleCreatePost = () => {
    navigation.navigate('CreatePost');
  };

  const handleInputFocus = (postId: string, inputBottomEdge?: number) => {
    console.log('📍 [CommunityScreen] Input focused on post:', postId, 'bottomEdge:', inputBottomEdge);
    
    if (inputBottomEdge && flatListRef.current) {
      // Get screen height and keyboard position
      const screenHeight = Dimensions.get('window').height;
      const keyboardHeight = 288; // From logs
      const keyboardTop = screenHeight - keyboardHeight;
      
      // Calculate gaps
      const currentGap = keyboardTop - inputBottomEdge;
      const desiredGap = 100; // 100px space between input and keyboard
      
      console.log('📏 [CommunityScreen] Scroll calculation:', {
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
        console.log(`⬆️ [CommunityScreen] Scrolling from ${Math.round(currentScrollOffset.current)}px to ${Math.round(newOffset)}px (+${Math.round(scrollAmount)}px)`);
        
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({
            offset: Math.max(0, newOffset),
            animated: true,
          });
        }, 100);
      } else {
        console.log('✅ [CommunityScreen] Gap is sufficient, no scroll needed');
      }
    }
  };

  const handleAuthorPress = (authorId: string, isStructure: boolean) => {
    console.log('👤 [CommunityScreen] Author pressed:', { authorId, isStructure });
    if (isStructure) {
      navigation.navigate('StrutturaDetail', { strutturaId: authorId });
    } else {
      navigation.navigate('ProfiloUtente', { userId: authorId });
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
      showAlert({
        type: 'error',
        title: 'Errore',
        message: 'Impossibile eliminare il post. Riprova.',
      });
    }
  };

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      currentUserId={user?.id}
      token={token || ''}
      onLike={handleLike}
      onShare={handleShare}
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
        {activeTab === 'tutti' 
          ? 'Segui amici e strutture per vedere i loro post!'
          : 'Non ci sono eventi al momento'}
      </Text>
      {activeTab === 'tutti' && (
        <View style={styles.emptyActions}>
          <Text 
            style={styles.emptyLink}
            onPress={() => navigation.navigate('CercaAmici')}
          >
            Trova amici
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <>
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
        <View style={styles.content}>
        {/* Header */}
        <CommunityHeader
          title="Community"
          onSearchPress={() => navigation.navigate('CercaAmici')}
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
              <QuickInputBar
                avatarUrl={user?.avatarUrl}
                userName={user?.name}
                placeholder="Cosa stai organizzando?"
                onPress={handleCreatePost}
              />
            }
            ListEmptyComponent={renderEmptyState()}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
    <AlertComponent />
    </>
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
  emptyActions: {
    marginTop: CommunityTheme.spacing.xl,
  },
  emptyLink: {
    fontSize: 16,
    fontWeight: '600',
    color: CommunityTheme.colors.primary,
  },
});
