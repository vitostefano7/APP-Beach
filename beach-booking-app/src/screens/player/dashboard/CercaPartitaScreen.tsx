import { useCallback, useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import { AuthContext } from "../../../context/AuthContext";
import API_URL from "../../../config/api";

type MatchItem = {
  _id: string;
  createdBy?: {
    _id?: string;
    name?: string;
    username?: string;
  };
  players?: Array<{
    user?: { _id?: string; name?: string };
    status?: "pending" | "confirmed";
    team?: "A" | "B";
  }>;
  maxPlayers?: number;
  isPublic?: boolean;
  status?: "draft" | "open" | "full" | "completed" | "cancelled";
  booking?: {
    _id?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    bookingType?: "private" | "public";
    campo?: {
      name?: string;
      struttura?: {
        name?: string;
        location?: { city?: string };
      };
    };
  };
  createdAt?: string;
};

const getPlayersCount = (players: MatchItem["players"], status?: "pending" | "confirmed") => {
  if (!players || players.length === 0) return 0;
  if (!status) return players.length;
  return players.filter((player) => player.status === status).length;
};

const parseMatchStart = (match: MatchItem) => {
  if (!match.booking?.date || !match.booking?.startTime) return null;
  try {
    return new Date(`${match.booking.date}T${match.booking.startTime}`);
  } catch {
    return null;
  }
};

export default function CercaPartitaScreen() {
  const { token, user } = useContext(AuthContext);
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchItem[]>([]);

  const loadMatches = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      console.log("🔍 [CercaPartita] Caricamento match con token:", token ? "presente" : "MANCANTE");

      const res = await fetch(`${API_URL}/matches?status=open`, {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      console.log("📡 [CercaPartita] Status risposta:", res.status);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: `Errore ${res.status}` }));
        console.error("❌ [CercaPartita] Errore risposta:", errorData);
        
        if (res.status === 401 || res.status === 403) {
          throw new Error("Non autorizzato");
        }
        throw new Error(errorData.message || `Errore ${res.status}`);
      }

      const data = await res.json();
      
      console.log("📦 [CercaPartita] Dati ricevuti:", JSON.stringify(data).substring(0, 200));

      const rawMatches: MatchItem[] = Array.isArray(data)
        ? data
        : Array.isArray(data.matches)
          ? data.matches
          : Array.isArray(data.data)
            ? data.data
            : [];

      console.log(`✅ [CercaPartita] ${rawMatches.length} match grezzi trovati`);

      const now = new Date();
      const filtered = rawMatches.filter((match) => {
        if (!match?._id) return false;
        if (match.status && ["completed", "cancelled", "full"].includes(match.status)) {
          return false;
        }
        if (match.isPublic === false) return false;

        const confirmedPlayers = getPlayersCount(match.players, "confirmed");
        const maxPlayers = match.maxPlayers || 0;
        if (maxPlayers <= 0 || confirmedPlayers >= maxPlayers) return false;

        const start = parseMatchStart(match);
        if (start && start <= now) return false;

        const alreadyJoined = match.players?.some((player) => player.user?._id === user?.id);
        if (alreadyJoined) return false;

        return true;
      });

      const sorted = filtered.sort((a, b) => {
        const dateA = parseMatchStart(a)?.getTime() ?? 0;
        const dateB = parseMatchStart(b)?.getTime() ?? 0;
        return dateA - dateB;
      });

      console.log(`✅ [CercaPartita] ${sorted.length} match dopo filtri - tutto OK, impostando state`);

      setMatches(sorted);
      console.log(`✅ [CercaPartita] State impostato con successo`);
    } catch (err: any) {
      console.error("❌ [CercaPartita] Errore caricamento partite disponibili:", err);
      console.error("❌ [CercaPartita] Stack trace:", err.stack);
      setError(err.message || "Impossibile caricare le partite");
      setMatches([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadMatches();
    }, [loadMatches])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadMatches();
  };

  const renderMatchCard = ({ item }: { item: MatchItem }) => {
    const confirmedPlayers = getPlayersCount(item.players, "confirmed");
    const pendingPlayers = getPlayersCount(item.players, "pending");
    const maxPlayers = item.maxPlayers || 0;
    const available = Math.max(maxPlayers - confirmedPlayers, 0);
    const maxPerTeam = maxPlayers > 0 ? Math.ceil(maxPlayers / 2) : 0;
    const teamA = item.players?.filter((player) => player.team === "A" && player.status === "confirmed").length || 0;
    const teamB = item.players?.filter((player) => player.team === "B" && player.status === "confirmed").length || 0;
    const bookingId = item.booking?._id;

    return (
      <Pressable
        style={styles.card}
        onPress={() => {
          if (!bookingId) {
            Alert.alert("Errore", "ID prenotazione non disponibile");
            return;
          }
          navigation.navigate("DettaglioPrenotazione", { bookingId });
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>
              {item.booking?.campo?.name || "Partita disponibile"}
            </Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{available} posti</Text>
            </View>
          </View>
          <Text style={styles.cardSubtitle}>
            {item.booking?.campo?.struttura?.name || "Struttura"}
            {item.booking?.campo?.struttura?.location?.city
              ? ` - ${item.booking.campo.struttura.location.city}`
              : ""}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.infoText}>
            {item.booking?.date || "Data da definire"}
          </Text>
          <Ionicons name="time-outline" size={16} color="#666" style={styles.infoIcon} />
          <Text style={styles.infoText}>
            {item.booking?.startTime || "--:--"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="people-outline" size={16} color="#666" />
          <Text style={styles.infoText}>
            {confirmedPlayers}/{maxPlayers} confermati
          </Text>
          {pendingPlayers > 0 && (
            <Text style={styles.pendingText}>+{pendingPlayers} in attesa</Text>
          )}
        </View>

        {maxPlayers > 2 && (
          <View style={styles.teamRow}>
            <Text style={styles.teamText}>Team A: {teamA}/{maxPerTeam}</Text>
            <Text style={styles.teamSeparator}>•</Text>
            <Text style={styles.teamText}>Team B: {teamB}/{maxPerTeam}</Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.creatorText}>
            Creato da {item.createdBy?.name || "utente"}
          </Text>
          <View style={styles.detailsButton}>
            <Text style={styles.detailsButtonText}>Dettagli</Text>
            <Ionicons name="chevron-forward" size={16} color="#2196F3" />
          </View>
        </View>
      </Pressable>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Caricamento partite...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </Pressable>
        <Text style={styles.headerTitle}>Cerca una partita</Text>
        <View style={styles.headerSpacer} />
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={loadMatches}>
            <Text style={styles.retryButtonText}>Riprova</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item._id}
          renderItem={renderMatchCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={56} color="#ccc" />
              <Text style={styles.emptyTitle}>Nessuna partita disponibile</Text>
              <Text style={styles.emptySubtitle}>
                Al momento non ci sono partite con posti liberi.
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
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    marginBottom: 10,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#333",
    flex: 1,
  },
  badge: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2196F3",
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  infoIcon: {
    marginLeft: 8,
  },
  infoText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },
  pendingText: {
    fontSize: 12,
    color: "#FF9800",
    fontWeight: "700",
    marginLeft: 6,
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  teamText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  teamSeparator: {
    color: "#bbb",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 10,
  },
  creatorText: {
    fontSize: 12,
    color: "#999",
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailsButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2196F3",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#eee",
    borderStyle: "dashed",
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#666",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
    marginTop: 6,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginVertical: 12,
  },
  retryButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
});
