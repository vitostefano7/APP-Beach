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
    username: string;
    avatarUrl?: string;
  };
  friendshipId: string;
  friendsSince?: string;
};

type FriendsResponse = {
  friends: FriendItem[];
  total: number;
};

export default function FriendsListScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<ProfileStackParamList, "FriendsList">>();
  const { token } = useContext(AuthContext);

  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"followers" | "following">(
    route.params?.filter ?? "followers"
  );

  useEffect(() => {
    if (route.params?.filter) {
      setFilter(route.params.filter);
    }
  }, [route.params?.filter]);

  const loadFriends = useCallback(async () => {
    if (!token) return;

    try {
      if (!refreshing) {
        setLoading(true);
      }
      const query = `limit=100&skip=0&type=${filter}`;
      const res = await fetch(`${API_URL}/friends?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        console.log("Errore caricamento amici:", res.status);
        setFriends([]);
        return;
      }

      const json = (await res.json()) as FriendsResponse;
      setFriends(json.friends || []);
    } catch (error) {
      console.error("Errore caricamento amici:", error);
      setFriends([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, refreshing, filter]);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  const onRefresh = () => {
    setRefreshing(true);
    loadFriends();
  };

  const renderItem = ({ item }: { item: FriendItem }) => {
    return (
      <Pressable
        onPress={() =>
          navigation.navigate("Dashboard", {
            screen: "ProfiloUtente",
            params: {
              userId: item.user._id,
              backTo: {
                tab: "Profilo",
                screen: "FriendsList",
                params: { filter },
              },
            },
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
          <Text style={styles.friendName}>{item.user.name}</Text>
          <Text style={styles.friendUsername}>@{item.user.username}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </Pressable>
        <Text style={styles.headerTitle}>Amici</Text>
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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Caricamento lista...</Text>
        </View>
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.friendshipId || item.user._id}
          renderItem={renderItem}
          contentContainerStyle={friends.length === 0 ? styles.emptyList : styles.list}
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
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
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
    paddingVertical: 12,
    backgroundColor: "#f8f9fa",
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
    color: "#666",
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
  friendName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  friendUsername: {
    fontSize: 13,
    color: "#666",
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
});
