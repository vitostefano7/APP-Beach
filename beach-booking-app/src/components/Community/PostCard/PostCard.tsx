import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, Pressable, StyleSheet, TextInput, ActivityIndicator, ScrollView, Keyboard, KeyboardEvent, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CommunityTheme } from '../communityTheme';
import Avatar from '../../Avatar/Avatar';
import { Post, Comment } from '../../../types/community.types';
import { useComments } from '../hooks';
import { useAlert } from '../../../context/AlertContext';

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  token: string;
  onLike: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare: (postId: string) => void;
  onAuthorPress?: (authorId: string, isStructure: boolean) => void;
  onDeletePost?: (postId: string) => void;
  onEditPost?: (postId: string, content: string) => Promise<boolean | void> | boolean | void;
  activeEditPostId?: string | null;
  onSetActiveEditPostId?: (postId: string | null) => void;
  isLiked?: boolean;
  strutturaId?: string;
  onInputFocus?: (postId: string, inputBottomEdge?: number) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  token,
  onLike,
  onComment,
  onShare,
  onAuthorPress,
  onDeletePost,
  onEditPost,
  activeEditPostId,
  onSetActiveEditPostId,
  isLiked,
  strutturaId,
  onInputFocus,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<Comment[]>(post.comments || []);
  const [commentText, setCommentText] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editPostText, setEditPostText] = useState(post.content || '');
  const [savingPostEdit, setSavingPostEdit] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const inputRef = useRef<TextInput>(null);
  const editInputRef = useRef<TextInput>(null);
  const cardRef = useRef<View>(null);
  const hasExternalEditControl = typeof onSetActiveEditPostId === 'function';
  const isEditingCurrentPost = hasExternalEditControl
    ? activeEditPostId === post._id
    : isEditingPost;

  const { showAlert } = useAlert();

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      'keyboardWillShow',
      (e: KeyboardEvent) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );

    const keyboardDidShow = Keyboard.addListener(
      'keyboardDidShow',
      (e: KeyboardEvent) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      'keyboardWillHide',
      (e: KeyboardEvent) => {
        setKeyboardHeight(0);
      }
    );

    const keyboardDidHide = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardDidShow.remove();
      keyboardWillHide.remove();
      keyboardDidHide.remove();
    };
  }, [post._id]);

  useEffect(() => {
    setEditPostText(post.content || '');
  }, [post.content, post._id]);

  useEffect(() => {
    if (isEditingCurrentPost) {
      setTimeout(() => {
        editInputRef.current?.focus();
      }, 0);
    }
  }, [isEditingCurrentPost]);

  const { posting, postComment } = useComments({
    token,
    postId: post._id,
    strutturaId,
    onCommentAdded: (newComment) => {
      setComments(prev => [...prev, newComment]);
      setCommentText('');
      Keyboard.dismiss();
    },
  });
  // Determine if post is from a structure or user
  const isStrutturaPost = !!(post.isStrutturaPost && post.struttura);
  const strutturaData = post.struttura;
  
  const displayName = isStrutturaPost 
    ? strutturaData?.name || 'Struttura' 
    : post.user?.surname 
      ? `${post.user.name} ${post.user.surname}` 
      : (post.user?.name || 'Utente sconosciuto');
  const displayAvatar = isStrutturaPost 
    ? strutturaData?.images?.[0] 
    : post.user?.avatarUrl;
  const authorId = isStrutturaPost 
    ? strutturaData?._id 
    : post.user?._id;

  const liked = isLiked ?? post.likes?.includes(currentUserId || '');
  const likesCount = post.likes?.length || 0;
  const commentsCount = comments.length;
  
  // Check if current user owns this post
  const isOwnPost = post.user?._id === currentUserId;

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      if (diffDays === 1) return '1 giorno fa';
      if (diffDays < 7) return `${diffDays} giorni fa`;
      return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
    }
    if (diffHours > 0) return `${diffHours}h fa`;
    return 'Ora';
  };

  const handleCommentPress = () => {
    console.log('💬 [PostCard] Comment button pressed:', {
      postId: post._id,
      expanded,
      commentsCount: comments.length,
      keyboardHeight,
    });
    if (onComment) {
      onComment(post._id);
    } else {
      setExpanded(!expanded);
    }
  };

  const handleInputFocus = () => {
    console.log('🎯 [PostCard] Input focused:', {
      postId: post._id,
      keyboardHeight,
    });
    
    // Measure input position on screen
    if (inputRef.current) {
      inputRef.current.measureInWindow((x, y, width, height) => {
        const bottomEdge = y + height;
        console.log('📐 [PostCard] Input position on screen:', {
          postId: post._id,
          x: Math.round(x),
          y: Math.round(y),
          width: Math.round(width),
          height: Math.round(height),
          bottomEdge: Math.round(bottomEdge),
        });
        
        // Notify parent with measured position
        onInputFocus?.(post._id, bottomEdge);
      });
    } else {
      // Fallback if measurement fails
      onInputFocus?.(post._id);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    console.log('📤 [PostCard] Submitting comment:', {
      postId: post._id,
      textLength: commentText.length,
      keyboardHeight,
    });
    await postComment(commentText);
  };

  const handleDeletePost = () => {
    setMenuVisible(false);
    showAlert({
      type: 'error',
      title: 'Elimina post',
      message: 'Sei sicuro di voler eliminare questo post?',
      showCancel: true,
      cancelText: 'Annulla',
      confirmText: 'Elimina',
      onConfirm: () => onDeletePost?.(post._id),
    });
  };

  const handleStartEditPost = () => {
    setMenuVisible(false);
    setEditPostText(post.content || '');
    if (hasExternalEditControl) {
      onSetActiveEditPostId?.(post._id);
    } else {
      setIsEditingPost(true);
    }
  };

  const handleCancelEditPost = () => {
    if (hasExternalEditControl) {
      onSetActiveEditPostId?.(null);
    } else {
      setIsEditingPost(false);
    }
    setEditPostText(post.content || '');
  };

  const handleSaveEditPost = async () => {
    const trimmedContent = editPostText.trim();

    if (!trimmedContent) {
      showAlert({
        type: 'warning',
        title: 'Contenuto non valido',
        message: 'Il contenuto del post non può essere vuoto.',
      });
      return;
    }

    if (trimmedContent.length > 1000) {
      showAlert({
        type: 'warning',
        title: 'Contenuto troppo lungo',
        message: 'Massimo 1000 caratteri.',
      });
      return;
    }

    if (!onEditPost) {
      showAlert({
        type: 'error',
        title: 'Errore',
        message: 'Modifica non disponibile in questa schermata.',
      });
      return;
    }

    const saveTimeoutMs = 12000;

    try {
      setSavingPostEdit(true);
      const editResult = await Promise.race<boolean | void>([
        onEditPost(post._id, trimmedContent),
        new Promise<boolean>((resolve) => {
          setTimeout(() => resolve(false), saveTimeoutMs);
        }),
      ]);

      if (editResult === false) {
        showAlert({
          type: 'error',
          title: 'Timeout salvataggio',
          message: 'La modifica sta impiegando troppo tempo. Riprova.',
        });
        return;
      }
      if (hasExternalEditControl) {
        onSetActiveEditPostId?.(null);
      } else {
        setIsEditingPost(false);
      }
    } catch (error) {
      console.error('Error saving edited post:', error);
      showAlert({
        type: 'error',
        title: 'Errore',
        message: 'Impossibile salvare la modifica. Riprova.',
      });
    } finally {
      setSavingPostEdit(false);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    showAlert({
      type: 'warning',
      title: 'Elimina commento',
      message: 'Sei sicuro di voler eliminare questo commento?',
      showCancel: true,
      cancelText: 'Annulla',
      confirmText: 'Elimina',
      onConfirm: async () => {
        try {
          const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'}/community/posts/${post._id}/comments/${commentId}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            setComments(prev => prev.filter(c => c._id !== commentId));
          }
        } catch (error) {
          console.error('Error deleting comment:', error);
        }
      },
    });
  };

  const renderComment = ({ item }: { item: Comment }) => {
    const isStructureComment = !!item.struttura;
    const commentUser = item.user as Comment['user'] & { surname?: string; username?: string };
    
    // Log per debug
    if (!isStructureComment) {
      console.log('👤 [PostCard] Comment user data:', {
        commentId: item._id,
        userName: commentUser?.name,
        userSurname: commentUser?.surname,
        userUsername: commentUser?.username,
        fullUser: commentUser,
      });
    }
    
    const displayName = isStructureComment 
      ? item.struttura!.name 
      : commentUser?.surname 
        ? `${commentUser.name} ${commentUser.surname}` 
        : (commentUser?.name || commentUser?.username || 'Utente');
    const displayAvatar = isStructureComment 
      ? item.struttura!.images[0] 
      : item.user?.avatarUrl;
    
    // Check if current user owns this comment
    const isOwnComment = !isStructureComment && item.user._id === currentUserId;

    return (
      <View style={styles.commentItem}>
        {isStructureComment ? (
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
          <View style={styles.commentBubble}>
            <View style={styles.commentHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                {isStructureComment && (
                  <Ionicons name="business" size={12} color={CommunityTheme.colors.primary} />
                )}
                <Text style={styles.commentAuthor}>{displayName}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.commentTime}>{formatTimeAgo(item.createdAt)}</Text>
                {isOwnComment && (
                  <TouchableOpacity 
                    onPress={() => handleDeleteComment(item._id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="ellipsis-vertical" size={16} color={CommunityTheme.colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <Text style={styles.commentText}>{item.text}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <>
      <View style={styles.card} ref={cardRef}>
        {/* Post Header */}
        <View style={styles.headerContainer}>
        <Pressable 
          style={styles.header}
          onPress={() => authorId && onAuthorPress?.(authorId, isStrutturaPost)}
        >
          {isStrutturaPost ? (
            <Image
              source={{ uri: displayAvatar }}
              style={styles.structureAvatar}
            />
          ) : (
            <Avatar
              avatarUrl={displayAvatar}
              name={displayName}
              size={40}
            />
          )}
          <View style={styles.headerText}>
            <View style={styles.authorRow}>
              {isStrutturaPost && (
                <Ionicons 
                  name="business" 
                  size={16} 
                  color={CommunityTheme.colors.primary} 
                  style={{ marginRight: 4 }}
                />
              )}
              <Text style={styles.authorName}>{displayName}</Text>
            </View>
            {isStrutturaPost && post.struttura?.location?.city && (
              <Text style={styles.location}>{post.struttura.location.city}</Text>
            )}
            <Text style={styles.timestamp}>{formatTimeAgo(post.createdAt)}</Text>
          </View>
        </Pressable>
        {isOwnPost && (
          <View style={styles.postMenuWrapper}>
          <TouchableOpacity 
            onPress={() => setMenuVisible(prev => !prev)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.postMenuButton}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={CommunityTheme.colors.textSecondary} />
          </TouchableOpacity>
          {menuVisible && (
            <View style={styles.dropdownMenu}>
              <TouchableOpacity style={styles.dropdownItem} onPress={handleStartEditPost}>
                <Text style={styles.dropdownItemText}>Modifica il post</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownItem} onPress={handleDeletePost}>
                <Text style={[styles.dropdownItemText, styles.dropdownItemDelete]}>Elimina il post</Text>
              </TouchableOpacity>
            </View>
          )}
          </View>
        )}
      </View>

      {/* Post Content */}
      {isEditingCurrentPost ? (
        <View style={styles.editContainer}>
          <TextInput
            ref={editInputRef}
            style={styles.editInput}
            value={editPostText}
            onChangeText={setEditPostText}
            multiline
            maxLength={1000}
            placeholder="Modifica contenuto post"
            placeholderTextColor={CommunityTheme.colors.textTertiary}
          />
          <View style={styles.editActionsRow}>
            <TouchableOpacity style={styles.editCancelButton} onPress={handleCancelEditPost} disabled={savingPostEdit}>
              <Text style={styles.editCancelText}>Annulla</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.editSaveButton} onPress={handleSaveEditPost} disabled={savingPostEdit}>
              {savingPostEdit ? (
                <ActivityIndicator size="small" color={CommunityTheme.colors.cardBackground} />
              ) : (
                <Text style={styles.editSaveText}>Salva</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <Text style={styles.content}>{post.content}</Text>
      )}

      {/* Post Image */}
      {post.image && (
        <Image
          source={{ uri: post.image }}
          style={styles.image}
          resizeMode="cover"
        />
      )}

      {/* Post Actions */}
      <View style={styles.actions}>
        <Pressable 
          style={styles.action}
          onPress={() => onLike(post._id)}
        >
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={24}
            color={liked ? CommunityTheme.colors.like : CommunityTheme.colors.comment}
          />
          {likesCount > 0 && (
            <Text style={[styles.actionText, liked && styles.actionTextLiked]}>
              {likesCount}
            </Text>
          )}
        </Pressable>

        <Pressable 
          style={styles.action}
          onPress={handleCommentPress}
        >
          <Ionicons
            name={expanded ? 'chatbubble' : 'chatbubble-outline'}
            size={22}
            color={expanded ? CommunityTheme.colors.primary : CommunityTheme.colors.comment}
          />
          {commentsCount > 0 && (
            <Text style={[styles.actionText, expanded && { color: CommunityTheme.colors.primary }]}>
              {commentsCount}
            </Text>
          )}
        </Pressable>

        <Pressable 
          style={styles.action}
          onPress={() => onShare(post._id)}
        >
          <Ionicons
            name="share-social-outline"
            size={22}
            color={CommunityTheme.colors.share}
          />
        </Pressable>
      </View>

      {/* Comments Section */}
      {expanded && (
        <View style={styles.commentsSection}>
          {/* Comments List */}
          {comments.length > 0 && (
            <ScrollView 
              style={styles.commentsListContainer}
              nestedScrollEnabled
              showsVerticalScrollIndicator={true}
            >
              {comments.map((item) => (
                <View key={item._id}>
                  {renderComment({ item })}
                </View>
              ))}
            </ScrollView>
          )}

          {/* Comment Input */}
          <View style={styles.commentInputContainer}>
            <Avatar
              avatarUrl={isStrutturaPost && strutturaId ? post.struttura?.images[0] : post.user?.avatarUrl}
              name={currentUserId || 'User'}
              size={32}
            />
            <TextInput
              ref={inputRef}
              style={styles.commentInput}
              placeholder="Scrivi un commento..."
              placeholderTextColor={CommunityTheme.colors.textTertiary}
              value={commentText}
              onChangeText={setCommentText}
              onFocus={handleInputFocus}
              multiline
              maxLength={500}
            />
            <Pressable 
              style={[styles.sendButton, (!commentText.trim() || posting) && styles.sendButtonDisabled]}
              onPress={handleSubmitComment}
              disabled={!commentText.trim() || posting}
            >
              {posting ? (
                <ActivityIndicator size="small" color={CommunityTheme.colors.primary} />
              ) : (
                <Ionicons 
                  name="send" 
                  size={20} 
                  color={commentText.trim() ? CommunityTheme.colors.primary : CommunityTheme.colors.textTertiary}
                />
              )}
            </Pressable>
          </View>
        </View>
      )}
    </View>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: CommunityTheme.colors.cardBackground,
    borderRadius: CommunityTheme.borderRadius.md,
    marginHorizontal: CommunityTheme.spacing.lg,
    marginBottom: CommunityTheme.spacing.md,
    padding: CommunityTheme.spacing.lg,
    ...CommunityTheme.shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  structureAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerText: {
    marginLeft: CommunityTheme.spacing.md,
    flex: 1,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    ...CommunityTheme.typography.postAuthor,
  },
  location: {
    fontSize: 13,
    color: CommunityTheme.colors.textSecondary,
    marginTop: 2,
  },
  timestamp: {
    ...CommunityTheme.typography.postTime,
    marginTop: 2,
  },
  content: {
    ...CommunityTheme.typography.postContent,
    marginBottom: CommunityTheme.spacing.md,
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: CommunityTheme.borderRadius.md,
    marginBottom: CommunityTheme.spacing.md,
  },
  actions: {
    flexDirection: 'row',
    paddingTop: CommunityTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: CommunityTheme.colors.borderLight,
    gap: CommunityTheme.spacing.xxl,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: CommunityTheme.colors.textSecondary,
    fontWeight: '500',
  },
  actionTextLiked: {
    color: CommunityTheme.colors.like,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: CommunityTheme.spacing.md,
  },
  postMenuButton: {
    padding: CommunityTheme.spacing.xs,
  },
  postMenuWrapper: {
    position: 'relative',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 28,
    right: 0,
    minWidth: 150,
    backgroundColor: CommunityTheme.colors.cardBackground,
    borderRadius: CommunityTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: CommunityTheme.colors.borderLight,
    zIndex: 10,
    overflow: 'hidden',
    ...CommunityTheme.shadows.card,
  },
  dropdownItem: {
    paddingVertical: CommunityTheme.spacing.sm,
    paddingHorizontal: CommunityTheme.spacing.md,
  },
  dropdownItemText: {
    fontSize: 14,
    color: CommunityTheme.colors.textPrimary,
    fontWeight: '500',
  },
  dropdownItemDelete: {
    color: CommunityTheme.colors.like,
  },
  editContainer: {
    marginBottom: CommunityTheme.spacing.md,
  },
  editInput: {
    backgroundColor: CommunityTheme.colors.background,
    borderRadius: CommunityTheme.borderRadius.sm,
    paddingHorizontal: CommunityTheme.spacing.md,
    paddingVertical: CommunityTheme.spacing.sm,
    fontSize: 15,
    color: CommunityTheme.colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editActionsRow: {
    marginTop: CommunityTheme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: CommunityTheme.spacing.sm,
  },
  editCancelButton: {
    paddingVertical: CommunityTheme.spacing.xs,
    paddingHorizontal: CommunityTheme.spacing.md,
  },
  editCancelText: {
    color: CommunityTheme.colors.textSecondary,
    fontWeight: '600',
  },
  editSaveButton: {
    backgroundColor: CommunityTheme.colors.primary,
    borderRadius: CommunityTheme.borderRadius.sm,
    paddingVertical: CommunityTheme.spacing.xs,
    paddingHorizontal: CommunityTheme.spacing.md,
    minWidth: 64,
    alignItems: 'center',
  },
  editSaveText: {
    color: CommunityTheme.colors.cardBackground,
    fontWeight: '600',
  },
  commentsSection: {
    marginTop: CommunityTheme.spacing.md,
    paddingTop: CommunityTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: CommunityTheme.colors.borderLight,
  },
  commentsListContainer: {
    maxHeight: 400,
    marginBottom: CommunityTheme.spacing.md,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: CommunityTheme.spacing.md,
    gap: CommunityTheme.spacing.sm,
    alignItems: 'center',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentContent: {
    flex: 1,
  },
  commentBubble: {
    backgroundColor: CommunityTheme.colors.background,
    borderRadius: CommunityTheme.borderRadius.sm,
    padding: CommunityTheme.spacing.sm,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: CommunityTheme.colors.textPrimary,
  },
  commentTime: {
    fontSize: 11,
    color: CommunityTheme.colors.textTertiary,
  },
  commentText: {
    fontSize: 14,
    color: CommunityTheme.colors.textPrimary,
    lineHeight: 18,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: CommunityTheme.spacing.sm,
    backgroundColor: CommunityTheme.colors.background,
    borderRadius: CommunityTheme.borderRadius.lg,
    padding: CommunityTheme.spacing.sm,
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    color: CommunityTheme.colors.textPrimary,
    maxHeight: 80,
    paddingVertical: 4,
  },
  sendButton: {
    padding: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
