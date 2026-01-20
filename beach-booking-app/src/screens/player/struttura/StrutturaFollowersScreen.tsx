import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useContext, useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { AuthContext } from "../../../context/AuthContext";
import { DashboardStackParamList } from "../../../navigation/DashboardStack";
import API_URL from "../../../config/api";

type StrutturaFollowersRouteProp = RouteProp<DashboardStackParamList, "StrutturaFollowers">;
type StrutturaFollowersNavigationProp = NativeStackNavigationProp<DashboardStackParamList, "StrutturaFollowers">;

type User = {
  _id: string;
  name: string;
  username?: string;
  avatarUrl?: string;
};

export default function StrutturaFollowersScreen() {
  const { token } = useContext(AuthContext);
  const navigation = useNavigation<StrutturaFollowersNavigationProp>();
  const route = useRoute<StrutturaFollowersRouteProp>();

  const { strutturaId, strutturaName, type } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    loadUsers();
  }, [strutturaId, type]);

  const loadUsers = async (isRefresh = false) => {
    if (!token || !strutturaId) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const endpoint = type === "followers" 
        ? `/community/strutture/${strutturaId}/followers`
        : `/community/strutture/${strutturaId}/following`;

      const res = await fetch(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(data.followers || data.following || []);
      } else {
        console.error("❌ [StrutturaFollowers] Error:", res.status);
        setUsers([]);
      }
    } catch (error) {
      console.error("❌ [StrutturaFollowers] Exception:", error);
      setUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleUserPress = (userId: string) => {
    navigation.navigate("ProfiloUtente", { userId });
  };

  const renderUser = ({ item }: { item: User }) => (
    <Pressable
      style={styles.userItem}
      onPress={() => handleUserPress(item._id)}
    >
      <View style={styles.avatarContainer}>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={24} color="#2196F3" />
          </View>
        )}
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        {item.username && (
          <Text style={styles.userUsername}>@{item.username}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </Pressable>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </Pressable>
          <Text style={styles.headerTitle}>
            {type === "followers" ? "Follower" : "Following"}
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {type === "followers" ? "Follower" : "Following"}
          </Text>
          {strutturaName && (
            <Text style={styles.headerSubtitle}>{strutturaName}</Text>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {users.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>
            {type === "followers" ? "Nessun follower" : "Non segue nessuno"}
          </Text>
          <Text style={styles.emptySubtext}>
            {type === "followers" 
              ? "Questa struttura non ha ancora follower"
              : "Questa struttura non segue ancora nessuno"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={renderUser}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadUsers(true)}
              colors={["#2196F3"]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = {
  safe: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center" as const,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#1a1a1a",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#666",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center" as const,
  },
  listContainer: {
    padding: 16,
  },
  userItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E3F2FD",
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#1a1a1a",
  },
  userUsername: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
};
