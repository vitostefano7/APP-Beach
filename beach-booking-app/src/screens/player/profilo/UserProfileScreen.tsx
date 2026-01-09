import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useContext, useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { AuthContext } from "../../../context/AuthContext";
import { DashboardStackParamList } from "../../../navigation/DashboardStack";
import API_URL from "../../../config/api";
import { Avatar } from "../../../components/Avatar";
import { styles } from "../styles-player/UserProfileScreen.styles";

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
  };
  friendshipStatus?: 'none' | 'pending' | 'accepted'; // Il TUO status verso di loro
  isPrivate?: boolean;
  message?: string;
  hasIncomingRequest?: boolean; // Hanno una richiesta pending verso di te
  theyFollowMe?: boolean; // Ti seguono già (accepted)
};

export default function UserProfileScreen() {
  const { token, user: currentUser } = useContext(AuthContext);
  const navigation = useNavigation<UserProfileNavigationProp>();
  const route = useRoute<UserProfileRouteProp>();

  const { userId } = route.params;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UserProfileData | null>(null);
  const [sendingRequest, setSendingRequest] = useState(false);

  // Ricarica il profilo quando la schermata viene focalizzata
  useFocusEffect(
    React.useCallback(() => {
      loadUserProfile();
    }, [userId])
  );

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

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
        const newStatus = result.isPending ? "pending" : "accepted";
        console.log("✅ [UserProfile] Setting new friendshipStatus:", newStatus);
        
        setData((prev) => {
          if (!prev) return prev;
          const updated = {
            ...prev,
            friendshipStatus: newStatus,
          };
          console.log("✅ [UserProfile] Data updated, new friendshipStatus:", updated.friendshipStatus);
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

  const handleBack = () => {
    const backTo = route.params?.backTo;
    if (backTo) {
      const parent = navigation.getParent();
      if (parent) {
        parent.navigate(backTo.tab as never, {
          screen: backTo.screen,
          params: backTo.params,
        } as never);
        return;
      }
    }
    navigation.goBack();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
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
          <Pressable onPress={handleBack} style={styles.backButton}>
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

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </Pressable>
        <Text style={styles.headerTitle}>Profilo</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView}>
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

          {/* Stats - Hidden if private and not friend */}
          {!isPrivateProfile && (
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{data.stats.matchesPlayed}</Text>
                <Text style={styles.statLabel}>Partite giocate</Text>
              </View>
              {data.stats.commonMatchesCount !== undefined && data.stats.commonMatchesCount > 0 && (
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{data.stats.commonMatchesCount}</Text>
                  <Text style={styles.statLabel}>Partite insieme</Text>
                </View>
              )}
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
          ) : isFriend ? (
            <View style={styles.friendBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.friendBadgeText}>Segui già</Text>
            </View>
          ) : canSendRequest ? (
            <Pressable
              style={[styles.addFriendButton, sendingRequest && styles.addFriendButtonDisabled]}
              onPress={handleSendFriendRequest}
              disabled={sendingRequest}
            >
              {sendingRequest ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="person-add" size={20} color="#fff" />
                  <Text style={styles.addFriendButtonText}>
                    {data.user.profilePrivacy === 'private' ? 'Richiedi di seguire' : 'Segui'}
                  </Text>
                </>
              )}
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
