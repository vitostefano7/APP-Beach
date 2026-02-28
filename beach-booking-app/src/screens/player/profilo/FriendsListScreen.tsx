import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { RouteProp } from "@react-navigation/native";

import { AuthContext } from "../../../context/AuthContext";
import API_URL from "../../../config/api";
import { Avatar } from "../../../components/Avatar";
import { ProfileStackParamList } from "../../../navigation/ProfilePlayerStack";

type FriendItem = {
  user: {
    _id: string;
    name: string;
    surname?: string;
    username: string;
    avatarUrl?: string;
    profilePrivacy?: 'public' | 'private';
    isPrivate?: boolean;
  };
  friendshipId: string;
  friendsSince?: string;
  friendshipStatus?: 'none' | 'pending' | 'accepted';
  direction?: 'outgoing' | 'incoming';
};

type FriendsResponse = {
  friends: FriendItem[];
  total: number;
};

export default function FriendsListScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<ProfileStackParamList, "FriendsList">>();
  const { token, user: currentUser } = useContext(AuthContext);

  const targetUserId = route.params?.userId;
  const isViewingOwnFriends = !targetUserId || targetUserId === currentUser?.id;

  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"followers" | "following">(
    (route.params?.filter === "all" ? "followers" : route.params?.filter) ?? "followers"
  );
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (route.params?.filter && route.params.filter !== "all") {
      setFilter(route.params.filter);
    } else if (route.params?.filter === "all") {
      setFilter("followers");
    }
  }, [route.params?.filter]);

  const loadFriends = useCallback(async () => {
    if (!token) return;

    try {
      if (!refreshing) {
        setLoading(true);
      }
      const queryParams = new URLSearchParams({
        limit: '100',
        skip: '0',
        type: filter,
      });
      if (targetUserId) {
        queryParams.append('userId', targetUserId);
      }
      const query = queryParams.toString();
      const endpoint = targetUserId && targetUserId !== currentUser?.id 
        ? `${API_URL}/users/${targetUserId}/friends?${query}`
        : `${API_URL}/friends?${query}`;
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 404) {
          setErrorMessage("Questa lista non è disponibile per profili privati.");
        } else {
          console.log("Errore caricamento amici:", res.status);
        }
        setFriends([]);
        return;
      }

      setErrorMessage(null);
      const json = (await res.json()) as FriendsResponse;
      const friendsData = json.friends || [];

      // Per i follower, carica anche i following per verificare se sono amici (solo se stiamo vedendo i nostri amici)
      if (filter === "followers" && isViewingOwnFriends) {
        const followingRes = await fetch(`${API_URL}/friends?type=following&limit=1000&skip=0`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (followingRes.ok) {
          const followingJson = await followingRes.json();
          const followingIdsSet: Set<string> = new Set(followingJson.friends.map((f: any) => f.user._id as string));
          setFollowingIds(followingIdsSet);
        } else {
          setFollowingIds(new Set());
        }
        
        setFriends(friendsData);
      } else {
        setFriends(friendsData);
        if (!isViewingOwnFriends) {
          setFollowingIds(new Set()); // Non necessario per amici altrui
        }
      }
    } catch (error) {
      console.error("Errore caricamento amici:", error);
      setFriends([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, refreshing, filter, targetUserId, isViewingOwnFriends]);

  const followUser = useCallback(async (userId: string) => {
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/friends/request`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ recipientId: userId }),
      });

      if (res.ok) {
        // Ricarica la lista per aggiornare lo status
        loadFriends();
      } else {
        console.error("Errore nel seguire l'utente");
      }
    } catch (error) {
      console.error("Errore nel seguire l'utente:", error);
    }
  }, [token, loadFriends]);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  const onRefresh = () => {
    setRefreshing(true);
    loadFriends();
  };

  const renderItem = ({ item }: { item: FriendItem }) => {
    const isFollowing = followingIds.has(item.user._id);
    const isPrivateProfile = item.user.profilePrivacy === 'private' || item.user.isPrivate === true;

    return (
      <Pressable
        onPress={() =>
          navigation.navigate("ProfiloUtente", {
            userId: item.user._id,
          })
        }
        style={({ pressed }) => [styles.friendRow, pressed && styles.friendRowPressed]}
      >
        <Avatar
          name={item.user.name}
          surname={item.user.surname}
          avatarUrl={item.user.avatarUrl}
          size={48}
          fallbackIcon="person"
        />
        <View style={styles.friendInfo}>
          <View style={styles.nameContainer}>
            <Text style={styles.friendName}>
              {item.user.name} {item.user.surname || ''}
            </Text>
            {isPrivateProfile && (
              <Ionicons name="lock-closed" size={14} color="#666" style={styles.privateIcon} />
            )}
          </View>
          <Text style={styles.friendUsername}>@{item.user.username}</Text>
        </View>
        {filter === "followers" && isViewingOwnFriends && (
          <View style={styles.actionContainer}>
            {isFollowing ? (
              <Text style={styles.followingText}>Segui già</Text>
            ) : (
              <Pressable
                style={styles.followButton}
                onPress={() => followUser(item.user._id)}
              >
                <Text style={styles.followButtonText}>Segui</Text>
              </Pressable>
            )}
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </Pressable>
          <Text style={styles.headerTitle}>
            {isViewingOwnFriends ? "Account Seguiti & Follower" : "Account Seguiti & Follower"}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.filterRow}>
          <Pressable
            style={[styles.filterButton, filter === "followers" && styles.filterButtonActive]}
            onPress={() => setFilter("followers")}
          >
            <Text
              style={[
                styles.filterText,
                filter === "followers" && styles.filterTextActive,
              ]}
            >
              Follower
            </Text>
          </Pressable>
          <Pressable
            style={[styles.filterButton, filter === "following" && styles.filterButtonActive]}
            onPress={() => setFilter("following")}
          >
            <Text
              style={[
                styles.filterText,
                filter === "following" && styles.filterTextActive,
              ]}
            >
              Following
            </Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Caricamento lista...</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.errorContainer}>
          <Ionicons name="information-circle-outline" size={48} color="#ccc" />
          <Text style={styles.errorTitle}>Lista non disponibile</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.friendshipId || item.user._id}
          renderItem={renderItem}
          contentContainerStyle={[
            { paddingBottom: 100 },
            friends.length === 0 ? styles.emptyList : styles.list
          ]}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#ccc" />
              <Text style={styles.emptyTitle}>
                {filter === "followers" ? "Nessun follower" : "Nessun following"}
              </Text>
              <Text style={styles.emptyText}>
                {filter === "followers"
                  ? "Ancora nessuno ti segue."
                  : "Non stai seguendo nessuno."}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  filterRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
  },
  filterButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ececec",
  },
  filterButtonActive: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2196F3",
  },
  filterTextActive: {
    color: "white",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#777",
  },
  list: {
    padding: 16,
  },
  emptyList: {
    flexGrow: 1,
    padding: 16,
  },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "white",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ececec",
    marginBottom: 12,
  },
  friendRowPressed: {
    opacity: 0.7,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  friendInfo: {
    flex: 1,
    gap: 4,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  friendName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  privateIcon: {
    marginLeft: 4,
  },
  friendUsername: {
    fontSize: 13,
    color: "#666",
  },
  actionContainer: {
    alignItems: "flex-end",
  },
  followingText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  friendRowContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  followButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: "center",
  },
  followButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  emptyText: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 10,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  errorText: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
  },
});
