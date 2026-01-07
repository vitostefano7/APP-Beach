import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { AuthContext } from "../../../context/AuthContext";
import { DashboardStackParamList } from "../../../navigation/DashboardStack";
import API_URL from "../../../config/api";
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
  };
  stats: {
    matchesPlayed: number;
    commonMatchesCount?: number;
  };
  friendshipStatus?: 'none' | 'pending' | 'accepted';
};

export default function UserProfileScreen() {
  const { token, user: currentUser } = useContext(AuthContext);
  const navigation = useNavigation<UserProfileNavigationProp>();
  const route = useRoute<UserProfileRouteProp>();

  const { userId } = route.params;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UserProfileData | null>(null);
  const [sendingRequest, setSendingRequest] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  const loadUserProfile = async () => {
    if (!token || !userId) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/users/${userId}/public-profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        console.error("Error loading user profile:", res.status);
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!token || !userId || sendingRequest) return;

    try {
      setSendingRequest(true);
      const res = await fetch(`${API_URL}/friends/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ friendId: userId }),
      });

      if (res.ok) {
        // Update friendship status
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            friendshipStatus: "pending",
          };
        });
      }
    } catch (error) {
      console.error("Error sending friend request:", error);
    } finally {
      setSendingRequest(false);
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

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </Pressable>
        <Text style={styles.headerTitle}>Profilo</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {data.user.avatarUrl ? (
              <Image source={{ uri: data.user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={48} color="#2196F3" />
              </View>
            )}
          </View>

          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.username}>@{data.user.username}</Text>

          {/* Stats */}
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

          {/* Action Buttons */}
          {isCurrentUser ? (
            <View style={styles.currentUserBadge}>
              <Text style={styles.currentUserText}>Il tuo profilo</Text>
            </View>
          ) : isFriend ? (
            <View style={styles.friendBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.friendBadgeText}>Amici</Text>
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
                  <Text style={styles.addFriendButtonText}>Segui</Text>
                </>
              )}
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
