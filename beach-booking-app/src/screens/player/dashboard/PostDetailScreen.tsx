import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  FlatList,
  Image,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Easing,
  Modal,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { AuthContext } from '../../../context/AuthContext';
import { Avatar } from '../../../components/Avatar';
import { styles } from './styles/PostDetailScreen.styles';
import API_URL from '../../../config/api';

type Comment = {
  _id: string;
  user: {
    _id: string;
    name: string;
    surname?: string;
    username?: string;
    avatarUrl?: string;
  };
  text: string;
  createdAt: string;
};

type Post = {
  _id: string;
  user: {
    _id: string;
    name: string;
    surname?: string;
    username?: string;
    avatarUrl?: string;
  };
  content: string;
  image?: string;
  likes: string[];
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
};

export default function PostDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { token, user } = useContext(AuthContext);

  const { postId } = route.params;
  const tabBarHeight = useBottomTabBarHeight();

  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<Post | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // UI state for input focus and send button animation
  const [isFocused, setIsFocused] = useState(false);
  const sendScale = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const commentInputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadPost();
  }, [postId]);

  const loadPost = async () => {
    try {
      setLoading(true);
      console.log('Loading post:', postId);

      const res = await fetch(`${API_URL}/community/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setPost(data.post);
      } else {
        console.error('Error loading post:', res.status);
        Alert.alert('Errore', 'Impossibile caricare il post');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading post:', error);
      Alert.alert('Errore', 'Errore di connessione');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleLikePost = async () => {
    if (!post) return;

    try {
      const res = await fetch(`${API_URL}/community/posts/${postId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const newLikes = data.liked
          ? [...post.likes, user?.id || '']
          : post.likes.filter(id => id !== user?.id);
        setPost({ ...post, likes: newLikes });
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !post) return;

    try {
      setSubmittingComment(true);

      const res = await fetch(`${API_URL}/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: newComment.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setPost({
          ...post,
          comments: [...post.comments, data.comment],
        });
        setNewComment('');
        setIsModalVisible(false);
      } else {
        const error = await res.text();
        Alert.alert('Errore', error || 'Impossibile aggiungere il commento');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Errore', 'Errore di connessione');
    } finally {
      setSubmittingComment(false);
    }
  };

  const renderComment = ({ item }: { item: Comment }) => {
    const commentUserName = item.user?.name || 'Utente';
    const fullName = item.user?.surname ? `${commentUserName} ${item.user.surname}` : commentUserName;

    return (
      <View style={styles.commentItem}>
        <Avatar
          avatarUrl={item.user?.avatarUrl}
          name={fullName}
          size={32}
        />
        <View style={styles.commentContent}>
          <View style={styles.commentBubble}>
            <View style={styles.commentMeta}>
              <Text style={styles.commentAuthor}>{fullName}</Text>
              <Text style={styles.commentTime}>{new Date(item.createdAt).toLocaleDateString('it-IT')}</Text>
            </View>
            <Text style={styles.commentText}>{item.text}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Caricamento post...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerContainer}>
          <Text>Post non trovato</Text>
        </View>
      </SafeAreaView>
    );
  }

  const postUserName = post.user?.name || 'Utente';
  const postFullName = post.user?.surname ? `${postUserName} ${post.user.surname}` : postUserName;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </Pressable>
          <Text style={styles.headerTitle}>Post</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* Post */}
          <View style={styles.postCard}>
            <View style={styles.postHeader}>
              <Avatar
                avatarUrl={post.user?.avatarUrl}
                name={postFullName}
                size={40}
              />
              <View style={styles.postHeaderText}>
                <Text style={styles.postAuthor}>{postFullName}</Text>
                <Text style={styles.postTime}>
                  {new Date(post.createdAt).toLocaleDateString('it-IT')}
                </Text>
              </View>
            </View>

            <Text style={styles.postContent}>{post.content}</Text>

            {post.image && (
              <Image
                source={{ uri: post.image }}
                style={styles.postImage}
                resizeMode="cover"
              />
            )}

            <View style={styles.postActions}>
              <Pressable
                style={styles.postAction}
                onPress={handleLikePost}
              >
                <Ionicons
                  name={post.likes?.includes(user?.id || '') ? 'heart' : 'heart-outline'}
                  size={24}
                  color={post.likes?.includes(user?.id || '') ? '#FF5252' : '#666'}
                />
                <Text style={styles.postActionText}>{post.likes?.length || 0}</Text>
              </Pressable>

              <View style={styles.postAction}>
                <Ionicons name="chatbubble-outline" size={22} color="#666" />
                <Text style={styles.postActionText}>{post.comments?.length || 0}</Text>
              </View>

              <Pressable style={styles.postAction}>
                <Ionicons name="share-social-outline" size={22} color="#666" />
              </Pressable>
            </View>
          </View>

          {/* Comments Section */}
          <View style={[styles.commentsSection, { marginBottom: tabBarHeight + 100 }]}>
            <Text style={styles.commentsTitle}>
              Commenti ({post.comments?.length || 0})
            </Text>

            {post.comments && post.comments.length > 0 && (
              <FlatList
                data={post.comments}
                renderItem={renderComment}
                keyExtractor={(item) => item._id}
                scrollEnabled={false}
                contentContainerStyle={styles.commentsList}
              />
            )}

            {/* Pulsante per aprire modale commento */}
            <TouchableOpacity
              style={styles.addCommentButton}
              onPress={() => setIsModalVisible(true)}
            >
              <Avatar
                avatarUrl={user?.avatarUrl}
                name={user?.name || 'Tu'}
                size={32}
              />
              <View style={styles.addCommentPlaceholder}>
                <Text style={styles.addCommentText}>Scrivi un commento...</Text>
              </View>
              <Ionicons name="create-outline" size={20} color="#a0aec0" />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Modale per scrivere commento */}
        <Modal
          visible={isModalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setIsModalVisible(false)}
          onShow={() => {
            setTimeout(() => {
              commentInputRef.current?.focus();
            }, 200);
          }}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={() => setIsModalVisible(false)}
            />
            <KeyboardAvoidingView
              style={styles.modalKeyboardAvoid}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Scrivi un commento</Text>
                <TouchableOpacity
                  onPress={() => {
                    setIsModalVisible(false);
                    setNewComment('');
                  }}
                >
                  <Ionicons name="close" size={28} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalBody}
                contentContainerStyle={styles.modalBodyContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.modalInputContainer}>
                  <TextInput
                    ref={(ref) => {
                      commentInputRef.current = ref;
                    }}
                    style={styles.modalInput}
                    placeholder="Cosa ne pensi?"
                    placeholderTextColor="#a0aec0"
                    value={newComment}
                    onChangeText={setNewComment}
                    multiline
                    maxLength={500}
                    textAlignVertical="top"
                    autoFocus={isModalVisible}
                  />
                  <Text style={styles.modalCharCounter}>
                    {newComment.length}/500
                  </Text>
                </View>
              </ScrollView>

              <TouchableOpacity
                style={[
                  styles.modalSendButton,
                  (!newComment.trim() || submittingComment) && styles.modalSendButtonDisabled,
                ]}
                onPress={handleSubmitComment}
                disabled={!newComment.trim() || submittingComment}
              >
                {submittingComment ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.modalSendButtonText}>Pubblica commento</Text>
                )}
              </TouchableOpacity>
            </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
