import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export type StatsCardType = "performance" | "social" | "venues";

export interface StatsCardProps {
  type: StatsCardType;
  data: any;
}

export const StatsCard: React.FC<StatsCardProps> = ({ type, data }) => {
  const getGradientColors = () => {
    switch (type) {
      case "performance":
        return ["#FF6B35", "#FF8A65"];
      case "social":
        return ["#2196F3", "#42A5F5"];
      case "venues":
        return ["#9C27B0", "#BA68C8"];
      default:
        return ["#FF6B35", "#FF8A65"];
    }
  };

  const renderPerformanceCard = () => (
    <LinearGradient colors={getGradientColors()} style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Ionicons name="trophy" size={24} color="#fff" />
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
              <Ionicons name="flame" size={20} color="#fff" />
              <Text style={styles.highlightText}>
                Streak più lunga: <Text style={styles.highlightValue}>{data.longestStreak}</Text> vittorie
              </Text>
            </View>
          </>
        )}
      </View>
    </LinearGradient>
  );

  const renderSocialCard = () => (
    <LinearGradient colors={getGradientColors()} style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Ionicons name="people" size={24} color="#fff" />
          <Text style={styles.cardTitle}>Compagni di gioco</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItemLarge}>
            <Text style={[styles.statValue, { color: "#fff" }]}>
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
    </LinearGradient>
  );

  const renderVenuesCard = () => (
    <LinearGradient colors={getGradientColors()} style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Ionicons name="location" size={24} color="#fff" />
          <Text style={styles.cardTitle}>Club frequentati</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItemLarge}>
            <Text style={[styles.statValue, { color: "#fff" }]}>
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
                    <Ionicons name="star" size={16} color="#FFB300" />
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
              <Ionicons name="time" size={20} color="#fff" />
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
            <Ionicons name="calendar" size={20} color="#fff" />
            <Text style={styles.highlightText}>
              Giorno preferito: <Text style={styles.highlightValue}>{data.preferredDay}</Text>
            </Text>
          </View>
        )}

        {data.matchesThisMonth !== undefined && (
          <View style={[styles.highlightBox, { marginTop: 8 }]}>
            <Ionicons name="today" size={20} color="#fff" />
            <Text style={styles.highlightText}>
              Questo mese: <Text style={styles.highlightValue}>{data.matchesThisMonth}</Text> {data.matchesThisMonth === 1 ? "partita" : "partite"}
            </Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );

  return (
    <>
      {type === "performance" && renderPerformanceCard()}
      {type === "social" && renderSocialCard()}
      {type === "venues" && renderVenuesCard()}
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    minHeight: 280,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#fff",
    marginLeft: 10,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 6,
  },
  statItem: {
    flex: 1,
    minWidth: "40%",
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
  },
  statItemLarge: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginVertical: 12,
  },
  secondaryStats: {
    gap: 6,
  },
  secondaryStatRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 7,
  },
  secondaryStatLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
  },
  secondaryStatValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  highlightBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: 10,
    borderRadius: 10,
    gap: 8,
  },
  highlightTextContainer: {
    flex: 1,
  },
  highlightText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    flex: 1,
  },
  highlightValue: {
    fontWeight: "700",
    color: "#fff",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
    marginBottom: 10,
  },
  playersList: {
    gap: 8,
  },
  playerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 10,
    borderRadius: 10,
  },
  playerRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
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
    color: "#fff",
    marginBottom: 2,
  },
  playerMatches: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  venuesList: {
    gap: 8,
  },
  venueItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 10,
    borderRadius: 10,
  },
  venueRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  venueInfo: {
    flex: 1,
  },
  venueName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 2,
  },
  venueDetails: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
});
