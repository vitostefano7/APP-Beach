import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type StatsCardType = "performance" | "social" | "venues";

export interface StatsCardProps {
  type: StatsCardType;
  data: any;
}

export const StatsCard: React.FC<StatsCardProps> = ({ type, data }) => {
  const renderPerformanceCard = () => (
    <View style={styles.cardContent}>
      <View style={styles.cardHeader}>
        <Ionicons name="trophy" size={24} color="#FF6B35" />
        <Text style={styles.cardTitle}>Performance</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{data.matchesPlayed || 0}</Text>
          <Text style={styles.statLabel}>Partite</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: "#4CAF50" }]}>
            {data.wins || 0}
          </Text>
          <Text style={styles.statLabel}>Vittorie</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: "#F44336" }]}>
            {data.losses || 0}
          </Text>
          <Text style={styles.statLabel}>Sconfitte</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: "#FF9800" }]}>
            {data.winRate || 0}%
          </Text>
          <Text style={styles.statLabel}>Win Rate</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.secondaryStats}>
        <View style={styles.secondaryStatRow}>
          <Text style={styles.secondaryStatLabel}>Set vinti</Text>
          <Text style={styles.secondaryStatValue}>{data.setsWon || 0}</Text>
        </View>
        <View style={styles.secondaryStatRow}>
          <Text style={styles.secondaryStatLabel}>Set persi</Text>
          <Text style={styles.secondaryStatValue}>{data.setsLost || 0}</Text>
        </View>
        <View style={styles.secondaryStatRow}>
          <Text style={styles.secondaryStatLabel}>Punti segnati</Text>
          <Text style={styles.secondaryStatValue}>{data.totalPointsScored || 0}</Text>
        </View>
      </View>

      {data.longestStreak > 0 && (
        <>
          <View style={styles.divider} />
          <View style={styles.highlightBox}>
            <Ionicons name="flame" size={20} color="#FF6B35" />
            <Text style={styles.highlightText}>
              Streak più lunga: <Text style={styles.highlightValue}>{data.longestStreak}</Text> vittorie
            </Text>
          </View>
        </>
      )}
    </View>
  );

  const renderSocialCard = () => (
    <View style={styles.cardContent}>
      <View style={styles.cardHeader}>
        <Ionicons name="people" size={24} color="#2196F3" />
        <Text style={styles.cardTitle}>Compagni di gioco</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItemLarge}>
          <Text style={[styles.statValue, { color: "#2196F3" }]}>
            {data.totalPeopleMet || 0}
          </Text>
          <Text style={styles.statLabel}>Persone incontrate</Text>
        </View>
      </View>

      {data.topPlayers && data.topPlayers.length > 0 && (
        <>
          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Giocato più spesso con:</Text>
          <View style={styles.playersList}>
            {data.topPlayers.slice(0, 5).map((player: any, index: number) => (
              <View key={player.userId} style={styles.playerItem}>
                <View style={styles.playerRank}>
                  <Text style={styles.playerRankText}>{index + 1}</Text>
                </View>
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName} numberOfLines={1}>
                    {player.name || player.username || "Giocatore"}
                  </Text>
                  <Text style={styles.playerMatches}>
                    {player.matchCount} {player.matchCount === 1 ? "partita" : "partite"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );

  const renderVenuesCard = () => (
    <View style={styles.cardContent}>
      <View style={styles.cardHeader}>
        <Ionicons name="location" size={24} color="#9C27B0" />
        <Text style={styles.cardTitle}>Club frequentati</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItemLarge}>
          <Text style={[styles.statValue, { color: "#9C27B0" }]}>
            {data.totalVenues || 0}
          </Text>
          <Text style={styles.statLabel}>Strutture visitate</Text>
        </View>
      </View>

      {data.topVenues && data.topVenues.length > 0 && (
        <>
          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Le tue strutture preferite:</Text>
          <View style={styles.venuesList}>
            {data.topVenues.slice(0, 5).map((venue: any, index: number) => (
              <View key={venue._id || index} style={styles.venueItem}>
                <View style={styles.venueRank}>
                  <Ionicons name="star" size={14} color="#FFB300" />
                </View>
                <View style={styles.venueInfo}>
                  <Text style={styles.venueName} numberOfLines={1}>
                    {venue.name}
                  </Text>
                  <Text style={styles.venueDetails}>
                    {venue.visitCount} {venue.visitCount === 1 ? "visita" : "visite"}
                    {venue.city && ` • ${venue.city}`}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      {data.lastMatch && (
        <>
          <View style={styles.divider} />
          <View style={styles.highlightBox}>
            <Ionicons name="time" size={20} color="#9C27B0" />
            <View style={styles.highlightTextContainer}>
              <Text style={styles.highlightText}>Ultima partita</Text>
              <Text style={styles.highlightValue}>
                {new Date(data.lastMatch.date).toLocaleDateString("it-IT")} • {data.lastMatch.campo}
              </Text>
            </View>
          </View>
        </>
      )}

      {data.preferredDay && (
        <View style={[styles.highlightBox, { marginTop: 8 }]}>
          <Ionicons name="calendar" size={20} color="#9C27B0" />
          <Text style={styles.highlightText}>
            Giorno preferito: <Text style={styles.highlightValue}>{data.preferredDay}</Text>
          </Text>
        </View>
      )}

      {data.matchesThisMonth !== undefined && (
        <View style={[styles.highlightBox, { marginTop: 8 }]}>
          <Ionicons name="today" size={20} color="#9C27B0" />
          <Text style={styles.highlightText}>
            Questo mese: <Text style={styles.highlightValue}>{data.matchesThisMonth}</Text> {data.matchesThisMonth === 1 ? "partita" : "partite"}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.card}>
      {type === "performance" && renderPerformanceCard()}
      {type === "social" && renderSocialCard()}
      {type === "venues" && renderVenuesCard()}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 300,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    marginLeft: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 8,
  },
  statItem: {
    flex: 1,
    minWidth: "40%",
    alignItems: "center",
    paddingVertical: 12,
  },
  statItemLarge: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 16,
  },
  secondaryStats: {
    gap: 8,
  },
  secondaryStatRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  secondaryStatLabel: {
    fontSize: 14,
    color: "#666",
  },
  secondaryStatValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  highlightBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  highlightTextContainer: {
    flex: 1,
  },
  highlightText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  highlightValue: {
    fontWeight: "700",
    color: "#1a1a1a",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 12,
  },
  playersList: {
    gap: 10,
  },
  playerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  playerRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
  },
  playerRankText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  playerMatches: {
    fontSize: 13,
    color: "#666",
  },
  venuesList: {
    gap: 10,
  },
  venueItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  venueRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFF3E0",
    justifyContent: "center",
    alignItems: "center",
  },
  venueInfo: {
    flex: 1,
  },
  venueName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  venueDetails: {
    fontSize: 13,
    color: "#666",
  },
});
