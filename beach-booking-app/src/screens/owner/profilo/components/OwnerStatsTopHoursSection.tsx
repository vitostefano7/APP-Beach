import { View, Text, Pressable, StyleSheet } from "react-native";
import { Avatar } from "../../../../components/Avatar";

interface UserInfo {
  _id: string;
  name: string;
  surname?: string;
  avatarUrl?: string;
}

interface TopHourItem {
  hour: number;
  count: number;
}

interface TopSlotUser {
  userId: string;
  name: string;
  count: number;
}

interface OwnerStatsTopHoursSectionProps {
  topHours: TopHourItem[];
  topUsersBySlot: Record<number, TopSlotUser[]>;
  users: UserInfo[];
  expandedSlots: Record<string, boolean>;
  selectedDurationHours: number;
  topDurationFilter: 1 | 1.5;
  onSetTopDurationFilter: (value: 1 | 1.5) => void;
  onToggleSlot: (slotKey: string) => void;
  onOpenUserProfile: (userId: string) => void;
  formatSlotTime: (decimalHour: number) => string;
}

export function OwnerStatsTopHoursSection({
  topHours,
  topUsersBySlot,
  users,
  expandedSlots,
  selectedDurationHours,
  topDurationFilter,
  onSetTopDurationFilter,
  onToggleSlot,
  onOpenUserProfile,
  formatSlotTime,
}: OwnerStatsTopHoursSectionProps) {
  return (
    <View style={styles.topSection}>
      <View style={styles.topTitleRow}>
        <Text style={styles.topTitle}>Top 5 Fasce Orarie</Text>
        <View style={styles.slotToggle}>
          <Pressable
            style={[styles.slotToggleBtn, topDurationFilter === 1 && styles.slotToggleBtnActive]}
            onPress={() => onSetTopDurationFilter(1)}
          >
            <Text style={[styles.slotToggleBtnText, topDurationFilter === 1 && styles.slotToggleBtnTextActive]}>
              1h
            </Text>
          </Pressable>
          <Pressable
            style={[styles.slotToggleBtn, topDurationFilter === 1.5 && styles.slotToggleBtnActive]}
            onPress={() => onSetTopDurationFilter(1.5)}
          >
            <Text style={[styles.slotToggleBtnText, topDurationFilter === 1.5 && styles.slotToggleBtnTextActive]}>
              1.5h
            </Text>
          </Pressable>
        </View>
      </View>

      {topHours.map((item, index) => {
        const key = item.hour.toString();
        const isOpen = !!expandedSlots[key];
        const usersForSlot = topUsersBySlot[item.hour] || [];

        return (
          <View key={key}>
            <Pressable
              onPress={() => onToggleSlot(key)}
              style={({ pressed }) => [styles.topItem, isOpen && styles.topItemOpen, pressed && { opacity: 0.9 }]}
            >
              <View style={styles.topRank}>
                <Text style={styles.topRankText}>{index + 1}</Text>
              </View>
              <Text style={styles.topHour}>
                {formatSlotTime(item.hour)} - {formatSlotTime(item.hour + selectedDurationHours)}
              </Text>
              <Text style={styles.topCount}>{item.count} prenotazioni</Text>
            </Pressable>

            {isOpen && (
              <View style={styles.expandedPanel}>
                {usersForSlot.length > 0 ? (
                  usersForSlot.map((slotUser) => {
                    const userObj = users.find((x) => x._id === slotUser.userId);
                    const avatarUrl = userObj?.avatarUrl || undefined;
                    const displayName = userObj
                      ? `${userObj.name}${userObj.surname ? " " + userObj.surname : ""}`
                      : slotUser.name;

                    return (
                      <Pressable
                        key={slotUser.userId}
                        style={styles.expandedUserRow}
                        onPress={() => onOpenUserProfile(slotUser.userId)}
                      >
                        <Avatar
                          name={userObj?.name || displayName}
                          surname={userObj?.surname}
                          avatarUrl={avatarUrl}
                          size={36}
                        />
                        <Text style={styles.expandedUserName} numberOfLines={1}>
                          {displayName}
                        </Text>
                        <Text style={styles.expandedUserCount}>{slotUser.count} pren.</Text>
                      </Pressable>
                    );
                  })
                ) : (
                  <Text style={styles.expandedEmpty}>Nessun utente</Text>
                )}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  topSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  topTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  topTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a1a1a",
  },
  slotToggle: {
    flexDirection: "row",
    backgroundColor: "#F0F0F0",
    borderRadius: 14,
    padding: 1,
  },
  slotToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  slotToggleBtnActive: {
    backgroundColor: "#2196F3",
  },
  slotToggleBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#888",
  },
  slotToggleBtnTextActive: {
    color: "white",
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
  topHour: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  topCount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
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
  expandedUserRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  expandedUserName: {
    flex: 1,
    fontSize: 14,
    color: "#1a1a1a",
    fontWeight: "700",
  },
  expandedUserCount: {
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
});