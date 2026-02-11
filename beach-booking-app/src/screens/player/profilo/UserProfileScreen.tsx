import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Image,
  TextInput,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useContext, useEffect, useState, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Keyboard, KeyboardEvent } from 'react-native';

import { AuthContext } from "../../../context/AuthContext";
import { DashboardStackParamList } from "../../../navigation/DashboardStack";
import API_URL from "../../../config/api";
import { Avatar } from "../../../components/Avatar";
import { CommunityTheme } from "../../components/Community/communityTheme";
import { styles } from "../styles-player/UserProfileScreen.styles";
import { PostCard } from '../../../components/Community/PostCard/PostCard';

type UserProfileRouteProp = RouteProp<DashboardStackParamList, "ProfiloUtente">;
type UserProfileNavigationProp = NativeStackNavigationProp<DashboardStackParamList, "ProfiloUtente">;

type UserProfileData = {
  user: {
    _id: string;
    name: string;
    surname?: string;
    username: string;
    avatarUrl?: string;
    preferredSports?: string[];
    profilePrivacy?: 'public' | 'private';
  };
  stats: {
    matchesPlayed: number;
    commonMatchesCount?: number;
    followersCount?: number;
    followingCount?: number;
  };
  friendshipStatus?: 'none' | 'pending' | 'accepted'; // Il TUO status verso di loro
  friendshipId?: string; // ID della friendship per unfollow
  isPrivate?: boolean;
  message?: string;
  hasIncomingRequest?: boolean; // Hanno una richiesta pending verso di te
  theyFollowMe?: boolean; // Ti seguono già (accepted)
};

type Post = {
  _id: string;
  user: {
    _id: string;
    name: string;
    avatarUrl?: string;
  };
  content: string;
  image?: string;
  likes: string[];
  comments: Array<{
    _id: string;
    user: { name: string; surname?: string; lastName?: string; avatarUrl?: string };
    text: string;
  }>;
  createdAt: string;
};

export default function UserProfileScreen() {
  const { token, user: currentUser } = useContext(AuthContext);
  const navigation = useNavigation<UserProfileNavigationProp>();
  const route = useRoute<UserProfileRouteProp>();

  const { userId } = route.params;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UserProfileData | null>(null);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [unfollowing, setUnfollowing] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [visibleComments, setVisibleComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});
  const [postingComment, setPostingComment] = useState<Set<string>>(new Set());
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [activeInputPostId, setActiveInputPostId] = useState<string | null>(null);
  const currentScrollOffset = useRef(0);

  // Supporto opzionale blur (expo-blur). Se non presente useremo un overlay semitrasparente
  let BlurViewImpl: any = View;
  let hasBlur = false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('expo-blur');
    BlurViewImpl = mod.BlurView || View;
    hasBlur = !!(mod && mod.BlurView);
  } catch (e) {
    BlurViewImpl = View;
    hasBlur = false;
  }

  // Ricarica il profilo quando la schermata viene focalizzata
  useFocusEffect(
    React.useCallback(() => {
      loadUserProfile();
      loadUserPosts();
    }, [userId])
  );

  useEffect(() => {
    loadUserProfile();
    loadUserPosts();
  }, [userId]);

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

  const loadUserProfile = async () => {
    if (!token || !userId) return;

    try {
      setLoading(true);
      console.log("🔍 [UserProfile] Caricamento profilo per userId:", userId);

      const res = await fetch(`${API_URL}/users/${userId}/public-profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("📡 [UserProfile] Response status:", res.status);

      if (res.ok) {
        const json = await res.json();
        console.log("📦 [UserProfile] Dati ricevuti:", JSON.stringify(json, null, 2));
        console.log("👤 [UserProfile] User:", json.user?.name, json.user?._id);
        console.log("🤝 [UserProfile] friendshipStatus:", json.friendshipStatus);
        console.log("🔒 [UserProfile] isPrivate:", json.isPrivate);
        
        // Se siamo amici, ottieni l'ID della friendship per poter unfollow
        if (json.friendshipStatus === 'accepted') {
          try {
            const statusRes = await fetch(`${API_URL}/friends/status/${userId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              json.friendshipId = statusData.friendship?._id || statusData.friendshipId;
              console.log("🤝 [UserProfile] friendshipId:", json.friendshipId);
            }
          } catch (error) {
            console.error("❌ [UserProfile] Error getting friendship ID:", error);
          }
        }
        
        setData(json);
      } else {
        console.error("❌ [UserProfile] Error loading user profile:", res.status);
        const errorText = await res.text();
        console.error("❌ [UserProfile] Error text:", errorText);
      }
    } catch (error) {
      console.error("❌ [UserProfile] Exception:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserPosts = async () => {
    if (!token || !userId) return;

    try {
      setLoadingPosts(true);
      console.log("📝 [UserProfile] Caricamento posts per userId:", userId);

      const res = await fetch(`${API_URL}/users/${userId}/posts?limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("📡 [UserProfile] Posts response status:", res.status);

      if (res.ok) {
        const json = await res.json();
        console.log("📦 [UserProfile] Posts ricevuti:", json.posts?.length || 0);
        setPosts(json.posts || []);
      } else if (res.status === 403) {
        // Profilo privato e non lo segui
        console.log("🔒 [UserProfile] Posts non accessibili (profilo privato)");
        setPosts([]);
      } else {
        console.error("❌ [UserProfile] Error loading posts:", res.status);
        setPosts([]);
      }
    } catch (error) {
      console.error("❌ [UserProfile] Exception loading posts:", error);
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!token || !userId || sendingRequest) {
      console.log("⚠️ [UserProfile] Cannot send request:", { hasToken: !!token, userId, sendingRequest });
      return;
    }

    console.log("📤 [UserProfile] Sending follow request to:", userId);
    console.log("📤 [UserProfile] Current friendshipStatus:", data?.friendshipStatus);

    try {
      setSendingRequest(true);
      const res = await fetch(`${API_URL}/friends/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ recipientId: userId }),
      });

      console.log("📡 [UserProfile] Response status:", res.status);

      if (res.ok) {
        const result = await res.json();
        console.log("✅ [UserProfile] Follow request SUCCESS:", JSON.stringify(result, null, 2));
        console.log("✅ [UserProfile] isPending:", result.isPending);
        console.log("✅ [UserProfile] Friendship ID:", result.friendship?._id);
        
        // Update friendship status based on backend response
        // isPending = true means private profile (pending approval)
        // isPending = false means public profile (accepted immediately)
        const newStatus: UserProfileData['friendshipStatus'] = result.isPending ? 'pending' : 'accepted';
        console.log("✅ [UserProfile] Setting new friendshipStatus:", newStatus);
        
        setData((prev) => {
          if (!prev) return prev;
          const updated: UserProfileData = {
            ...prev,
            friendshipStatus: newStatus,
            friendshipId: result.friendship?._id,
          };
          console.log("✅ [UserProfile] Data updated, new friendshipStatus:", updated.friendshipStatus, "friendshipId:", updated.friendshipId);
          return updated;
        });
      } else {
        const errorData = await res.json();
        console.error("❌ [UserProfile] Follow request FAILED:", errorData);
        console.error("❌ [UserProfile] Status:", res.status);
      }
    } catch (error) {
      console.error("❌ [UserProfile] Exception sending friend request:", error);
    } finally {
      setSendingRequest(false);
      console.log("🏁 [UserProfile] Request completed");
    }
  };

  const handleUnfollow = async () => {
    if (!token || !userId || !data?.friendshipId || unfollowing) {
      console.log("⚠️ [UserProfile] Cannot unfollow:", { hasToken: !!token, userId, friendshipId: data?.friendshipId, unfollowing });
      return;
    }

    console.log("📤 [UserProfile] Unfollowing user:", userId, "friendshipId:", data.friendshipId);

    try {
      setUnfollowing(true);
      const res = await fetch(`${API_URL}/friends/request/${data.friendshipId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("📡 [UserProfile] Unfollow response status:", res.status);

      if (res.ok) {
        console.log("✅ [UserProfile] Unfollow SUCCESS");
        
        setData((prev) => {
          if (!prev) return prev;
          const updated: UserProfileData = {
            ...prev,
            friendshipStatus: 'none',
            friendshipId: undefined,
          };
          console.log("✅ [UserProfile] Data updated, new friendshipStatus:", updated.friendshipStatus);
          return updated;
        });
      } else {
        const errorData = await res.json();
        console.error("❌ [UserProfile] Unfollow FAILED:", errorData);
        console.error("❌ [UserProfile] Status:", res.status);
      }
    } catch (error) {
      console.error("❌ [UserProfile] Exception unfollowing:", error);
    } finally {
      setUnfollowing(false);
      console.log("🏁 [UserProfile] Unfollow completed");
    }
  };

  const handleChat = async () => {
    if (!token || !userId || !data) return;

    try {
      console.log("💬 [UserProfile] Starting chat with:", userId);
      
      // Use GET method with userId in path
      const res = await fetch(`${API_URL}/api/conversations/direct/${userId}`, {
        method: 'GET',
        headers: { 
          Authorization: `Bearer ${token}` 
        },
      });

      if (res.ok) {
        const conversation = await res.json();
        console.log("✅ [UserProfile] Conversation obtained:", conversation._id);
        
        const displayName = data.user.surname 
          ? `${data.user.name} ${data.user.surname}`
          : data.user.name;
        
        console.log("👤 [UserProfile] Chatting with:", displayName);
        
        // Navigate to ChatScreen with correct parameters
        navigation.navigate("Chat", {
          conversationId: conversation._id,
          userName: displayName,
          userId: data.user._id,
          userAvatar: data.user.avatarUrl,
          isUserChat: true,
          otherUser: {
            _id: data.user._id,
            name: data.user.name,
            surname: data.user.surname,
            avatarUrl: data.user.avatarUrl,
          }
        } as any);
      } else {
        const errorText = await res.text();
        console.error("❌ [UserProfile] Failed to get conversation:", res.status, errorText);
      }
    } catch (error) {
      console.error("❌ [UserProfile] Exception starting chat:", error);
    }
  };


  const handleLike = async (postId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/posts/${postId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPosts(prev => prev.map(p => p._id === postId ? { ...p, likes: p.likes.includes(currentUser?.id || '') ? p.likes.filter(id => id !== currentUser?.id) : [...p.likes, currentUser?.id || ''] } : p));
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const toggleComments = (postId: string) => {
    setVisibleComments(prev => ({ ...prev, [postId]: !prev[postId] }));
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
        setVisibleComments(prev => {
          const newSet = { ...prev };
          newSet[postId] = true;
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

  const scrollViewRef = useRef<ScrollView>(null);

  // Keyboard management for post cards
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener('keyboardWillShow', (e: KeyboardEvent) => {
      console.log('🎹 [UserProfile] Keyboard WILL show:', {
        height: e.endCoordinates.height,
        screenY: e.endCoordinates.screenY,
      });
      setKeyboardHeight(e.endCoordinates.height);
    });
    const keyboardDidShow = Keyboard.addListener('keyboardDidShow', (e: KeyboardEvent) => {
      console.log('🎹 [UserProfile] Keyboard DID show:', {
        height: e.endCoordinates.height,
      });
      setKeyboardHeight(e.endCoordinates.height);
    });
    const keyboardWillHide = Keyboard.addListener('keyboardWillHide', () => {
      console.log('🎹 [UserProfile] Keyboard WILL hide');
      setKeyboardHeight(0);
      setActiveInputPostId(null);
    });
    const keyboardDidHide = Keyboard.addListener('keyboardDidHide', () => {
      console.log('🎹 [UserProfile] Keyboard DID hide');
      setKeyboardHeight(0);
      setActiveInputPostId(null);
    });
    return () => {
      keyboardWillShow.remove();
      keyboardDidShow.remove();
      keyboardWillHide.remove();
      keyboardDidHide.remove();
    };
  }, []);

  const handleInputFocus = (postId: string, inputBottomEdge?: number) => {
    console.log('📍 [UserProfile] Input focused on post:', postId, 'bottomEdge:', inputBottomEdge);
    setActiveInputPostId(postId);
    
    if (inputBottomEdge && scrollViewRef.current) {
      const screenHeight = Dimensions.get('window').height;
      // Use current keyboardHeight or default to 288 (typical keyboard height)
      const effectiveKeyboardHeight = keyboardHeight || 288;
      const keyboardTop = screenHeight - effectiveKeyboardHeight;
      
      // Calculate gaps
      const currentGap = keyboardTop - inputBottomEdge;
      const desiredGap = 100; // 100px space between input and keyboard
      
      console.log('📏 [UserProfile] Scroll calculation:', {
        screenHeight: Math.round(screenHeight),
        keyboardTop: Math.round(keyboardTop),
        inputBottomEdge: Math.round(inputBottomEdge),
        currentGap: Math.round(currentGap),
        desiredGap,
        keyboardHeight: Math.round(effectiveKeyboardHeight),
        currentScrollOffset: Math.round(currentScrollOffset.current),
      });
      
      if (currentGap < desiredGap) {
        const scrollAmount = desiredGap - currentGap;
        const newOffset = currentScrollOffset.current + scrollAmount;
        console.log(`⬆️ [UserProfile] Scrolling from ${Math.round(currentScrollOffset.current)}px to ${Math.round(newOffset)}px (+${Math.round(scrollAmount)}px)`);
        
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, newOffset),
            animated: true,
          });
        }, 100);
      } else {
        console.log('✅ [UserProfile] Gap is sufficient, no scroll needed');
      }
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </Pressable>
          <Text style={styles.headerTitle}>Profilo</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </Pressable>
          <Text style={styles.headerTitle}>Profilo</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#999" />
          <Text style={styles.errorText}>Profilo non trovato</Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayName = data.user.surname
    ? `${data.user.name} ${data.user.surname}`
    : data.user.name;

  const isCurrentUser = data.user._id === currentUser?.id;
  const canSendRequest = !isCurrentUser && (!data.friendshipStatus || data.friendshipStatus === 'none');
  const isPending = data.friendshipStatus === 'pending';
  const isFriend = data.friendshipStatus === 'accepted';
  const isPrivateProfile = data.isPrivate && !isFriend;

  // Blocca la visualizzazione dei post se profilo privato o richiesta pending
  const canSeePosts = !isPrivateProfile && !isPending;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </Pressable>
        <Text style={styles.headerTitle}>Profilo</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 100 }}
        onScroll={(e) => {
          currentScrollOffset.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Avatar
              name={data.user.name}
              surname={data.user.surname}
              avatarUrl={data.user.avatarUrl}
              size="large"
              fallbackIcon="person"
            />
            {data.user.profilePrivacy === 'private' && (
              <View style={styles.privateBadge}>
                <Ionicons name="lock-closed" size={16} color="#666" />
              </View>
            )}
          </View>

          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.username}>@{data.user.username}</Text>

          {/* Show if they follow you or want to follow you */}
          {data.theyFollowMe && !isPending && !isFriend && (
            <View style={styles.followsYouBadge}>
              <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
              <Text style={styles.followsYouText}>Ti segue</Text>
            </View>
          )}
          {data.hasIncomingRequest && !data.theyFollowMe && !isPending && !isFriend && (
            <View style={styles.incomingRequestBadge}>
              <Ionicons name="heart-outline" size={18} color="#E91E63" />
              <Text style={styles.incomingRequestText}>Vuole seguirti</Text>
            </View>
          )}

          {/* Privacy Warning */}
          {isPrivateProfile && (
            <View style={styles.privateWarning}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" />
              <Text style={styles.privateWarningText}>
                {data.message || 'Questo profilo è privato'}
              </Text>
            </View>
          )}

          {/* Stats Cards - Hidden if private and not friend */}
          {!isPrivateProfile && (
            <View style={styles.statsCardsContainer}>
              {/* Partite Card */}
              <View style={styles.statsCard}>
                <View style={styles.statsCardHeader}>
                  <Ionicons name="trophy" size={18} color="#2196F3" />
                  <Text style={styles.statsCardTitle}>Partite</Text>
                </View>
                <View style={styles.statsCardContent}>
                  <View style={styles.statsCardItem}>
                    <Text style={styles.statsCardValue}>{data.stats.matchesPlayed}</Text>
                    <Text style={styles.statsCardLabel}>Giocate</Text>
                  </View>
                  {data.stats.commonMatchesCount !== undefined && data.stats.commonMatchesCount > 0 && (
                    <View style={styles.statsCardItem}>
                      <Text style={styles.statsCardValue}>{data.stats.commonMatchesCount}</Text>
                      <Text style={styles.statsCardLabel}>Insieme</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Community Card - Clickable */}
              <Pressable
                style={styles.statsCard}
                onPress={() => {
                  navigation.navigate("FriendsList", { userId, filter: "all" } as never);
                }}
              >
                <View style={styles.statsCardHeader}>
                  <Ionicons name="people" size={18} color="#4CAF50" />
                  <Text style={styles.statsCardTitle}>Community</Text>
                </View>
                <View style={styles.statsCardContent}>
                  {data.stats.followersCount !== undefined && (
                    <View style={styles.statsCardItem}>
                      <Text style={styles.statsCardValue}>{data.stats.followersCount}</Text>
                      <Text style={styles.statsCardLabel}>Follower</Text>
                    </View>
                  )}
                  {data.stats.followingCount !== undefined && (
                    <View style={styles.statsCardItem}>
                      <Text style={styles.statsCardValue}>{data.stats.followingCount}</Text>
                      <Text style={styles.statsCardLabel}>Following</Text>
                    </View>
                  )}
                </View>
                <View style={styles.statsCardFooter}>
                  <Text style={styles.statsCardLink}>Vedi</Text>
                  <Ionicons name="chevron-forward" size={14} color="#2196F3" />
                </View>
              </Pressable>
            </View>
          )}

          {/* Action Buttons */}
          {isCurrentUser ? (
            <View style={styles.currentUserBadge}>
              <Text style={styles.currentUserText}>Il tuo profilo</Text>
            </View>
          ) : isPending ? (
            <View style={styles.pendingBadge}>
              <Ionicons name="time-outline" size={20} color="#FF9800" />
              <Text style={styles.pendingBadgeText}>Richiesta inviata</Text>
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 10 }}>
            {canSendRequest && (
              <Pressable
                style={{ backgroundColor: sendingRequest ? '#ccc' : '#2196F3', borderRadius: 25, paddingHorizontal: data.user.profilePrivacy === 'private' ? 25 : 15, paddingVertical: 12, width: data.user.profilePrivacy === 'private' ? '90%' : '48%', marginHorizontal: 5, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}
                onPress={handleSendFriendRequest}
                disabled={sendingRequest}
              >
                {sendingRequest ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="person-add" size={20} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: 'bold', marginLeft: 5 }} numberOfLines={1}>
                      {data.user.profilePrivacy === 'private' ? 'Richiedi di seguire' : 'Segui'}
                    </Text>
                  </>
                )}
              </Pressable>
            )}
            {isFriend && (
              <Pressable
                style={{ backgroundColor: unfollowing ? '#ccc' : '#FF5722', borderRadius: 25, paddingHorizontal: 25, paddingVertical: 12, width: '48%', marginHorizontal: 5, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}
                onPress={handleUnfollow}
                disabled={unfollowing}
              >
                {unfollowing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="person-remove" size={20} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: 'bold', marginLeft: 5 }}>Smetti di seguire</Text>
                  </>
                )}
              </Pressable>
            )}
            {!isCurrentUser && (isFriend || data.user.profilePrivacy === 'public') && (
              <Pressable style={{ backgroundColor: '#2196F3', borderRadius: 25, paddingHorizontal: 15, paddingVertical: 12, width: '48%', marginHorizontal: 5, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }} onPress={handleChat}>
                <Ionicons name="chatbubble-outline" size={20} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: 'bold', marginLeft: 5 }}>Chat</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Posts Section - Always render; if not allowed, overlay blur + lock */}
        <View style={{ position: 'relative' }}>
          <View style={styles.postsSection}>
            <View style={styles.postsSectionHeader}>
              <Text style={styles.postsSectionTitle}>Post</Text>
              {loadingPosts && <ActivityIndicator size="small" color="#2196F3" />}
            </View>

            {posts.length > 0 ? (
              posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  currentUserId={currentUser?.id}
                  token={token}
                  onLike={handleLike}
                  onShare={() => {}}
                  isLiked={post.likes.includes(currentUser?.id || '')}
                  onInputFocus={handleInputFocus}
                />
              ))
            ) : !loadingPosts ? (
              <View style={styles.emptyPosts}>
                <Ionicons name="newspaper-outline" size={48} color="#ccc" />
                <Text style={styles.emptyPostsText}>Nessun post pubblicato</Text>
              </View>
            ) : null}
          </View>

          {!canSeePosts && (
            <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
              {hasBlur ? (
                <BlurViewImpl intensity={80} tint="light" style={StyleSheet.absoluteFill} />
              ) : (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.7)' }]} />
              )}

              <View style={{ backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 12, padding: 24, alignItems: 'center', width: '80%' }}>
                <Ionicons name="lock-closed" size={56} color="#666" style={{ marginBottom: 12 }} />
                <Text style={{ color: '#333', fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>I post di questo utente sono visibili solo ai follower approvati.</Text>
                {isPending ? (
                  <Text style={{ color: '#666', fontSize: 14, marginTop: 8, textAlign: 'center' }}>La tua richiesta di follow è in attesa di approvazione.</Text>
                ) : null}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
