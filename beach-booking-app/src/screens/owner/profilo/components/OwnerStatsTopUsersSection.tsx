import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "../../../../components/Avatar";
import SportIcon from "../../../../components/SportIcon";

interface UserInfo {
  _id: string;
  name: string;
  surname?: string;
  avatarUrl?: string;
}

interface TopUserItem {
  id: string;
  fullName: string;
  count: number;
}

interface SportCounter {
  sport: string;
  count: number;
}

interface OwnerStatsTopUsersSectionProps {
  topUsers: TopUserItem[];
  users: UserInfo[];
  expandedTopUsers: Record<string, boolean>;
  topUserSportsByUser: Record<string, SportCounter[]>;
  onToggleUser: (userId: string) => void;
}

export function OwnerStatsTopUsersSection({
  topUsers,
  users,
  expandedTopUsers,
  topUserSportsByUser,
  onToggleUser,
}: OwnerStatsTopUsersSectionProps) {
  return (
    <View style={styles.topSection}>
      <Text style={styles.topTitle}>Top 5 Utenti</Text>
      <View style={styles.spacer} />

      {topUsers.length > 0 ? (
        topUsers.map((item, index) => {
          const userObj = users.find((u) => u._id === item.id);
          const displayName = userObj
            ? `${userObj.name}${userObj.surname ? ` ${userObj.surname}` : ""}`
            : item.fullName;
          const isOpen = !!expandedTopUsers[item.id];
          const topSports = topUserSportsByUser[item.id] || [];

          return (
            <View key={item.id}>
              <Pressable
                onPress={() => onToggleUser(item.id)}
                style={({ pressed }) => [styles.topItem, isOpen && styles.topItemOpen, pressed && { opacity: 0.9 }]}
              >
                <View style={styles.topRank}>
                  <Text style={styles.topRankText}>{index + 1}</Text>
                </View>
                <Avatar
                  name={userObj?.name || displayName}
                  surname={userObj?.surname}
                  avatarUrl={userObj?.avatarUrl}
                  size={32}
                />
                <Text style={styles.topUserName} numberOfLines={1}>
                  {displayName}
                </Text>
                <View style={styles.topItemRightMeta}>
                  <Text style={styles.topCount}>{item.count} prenotazioni</Text>
                  <Ionicons
                    name={isOpen ? "chevron-up" : "chevron-down"}
                    size={18}
                    color="#888"
                  />
                </View>
              </Pressable>

              {isOpen && (
                <View style={styles.expandedPanel}>
                  {topSports.length > 0 ? (
                    topSports.map((sportItem) => (
                      <View key={`${item.id}-${sportItem.sport}`} style={styles.expandedSportRow}>
                        <View style={styles.expandedSportLeft}>
                          <SportIcon sport={sportItem.sport} size={16} color="#2196F3" />
                          <Text style={styles.expandedSportName} numberOfLines={1}>
                            {sportItem.sport}
                          </Text>
                        </View>
                        <Text style={styles.expandedSportCount}>{sportItem.count} pren.</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.expandedEmpty}>Nessun dato sport disponibile</Text>
                  )}
                </View>
              )}
            </View>
          );
        })
      ) : (
        <View style={styles.emptyChart}>
          <Ionicons name="people-outline" size={48} color="#ccc" />
          <Text style={styles.emptyChartText}>Nessun dato disponibile</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  topTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a1a1a",
  },
  spacer: {
    height: 12,
  },
  topItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  topItemOpen: {
    marginBottom: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  topRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2196F3",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  topRankText: {
    color: "white",
    fontSize: 14,
    fontWeight: "800",
  },
  topUserName: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  topCount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },
  topItemRightMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 8,
  },
  expandedPanel: {
    backgroundColor: "white",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 10,
    marginTop: 0,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  expandedSportRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingVertical: 6,
  },
  expandedSportLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  expandedSportName: {
    flex: 1,
    fontSize: 14,
    color: "#1a1a1a",
    fontWeight: "700",
  },
  expandedSportCount: {
    fontSize: 13,
    color: "#666",
    fontWeight: "700",
  },
  expandedEmpty: {
    fontSize: 13,
    color: "#999",
    fontWeight: "600",
    paddingVertical: 8,
  },
  emptyChart: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyChartText: {
    marginTop: 12,
    fontSize: 14,
    color: "#999",
    fontWeight: "600",
  },
});