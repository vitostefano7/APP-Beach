import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import API_URL from "../config/api";

export default function InserisciRisultatoScreen({ route, navigation }: any) {
  const { bookingId } = route.params;
  const { token } = useContext(AuthContext);

  const [sets, setSets] = useState([
    { teamA: "", teamB: "" },
    { teamA: "", teamB: "" },
    { teamA: "", teamB: "" },
  ]);

  const update = (i: number, team: "A" | "B", value: string) => {
    setSets((prev) => {
      const copy = [...prev];
      copy[i] = {
        ...copy[i],
        [team === "A" ? "teamA" : "teamB"]: value,
      };
      return copy;
    });
  };

  const submit = async () => {
    const parsed = sets
      .filter((s) => s.teamA && s.teamB)
      .map((s) => ({
        teamA: Number(s.teamA),
        teamB: Number(s.teamB),
      }));

    if (parsed.length < 2) {
      Alert.alert("Errore", "Inserisci almeno 2 set");
      return;
    }

    await fetch(`${API_URL}/matches/from-booking/${bookingId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sets: parsed }),
    });

    navigation.goBack();
  };

  const getWinner = (teamA: string, teamB: string) => {
    const a = Number(teamA);
    const b = Number(teamB);
    if (!teamA || !teamB) return null;
    if (a > b) return "A";
    if (b > a) return "B";
    return null;
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* HEADER FISSO */}
      <View style={styles.headerContainer}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </Pressable>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Inserisci risultato</Text>
          <Text style={styles.subtitle}>Compila i risultati dei set giocati</Text>
        </View>
      </View>

      {/* CONTENUTO SCROLLABILE */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.teamsHeader}>
          <View style={styles.teamBox}>
            <View style={[styles.teamBadge, { backgroundColor: "#4CAF50" }]}>
              <Text style={styles.teamBadgeText}>A</Text>
            </View>
            <Text style={styles.teamLabel}>Team A</Text>
          </View>
          <View style={styles.vs}>
            <Text style={styles.vsText}>VS</Text>
          </View>
          <View style={styles.teamBox}>
            <View style={[styles.teamBadge, { backgroundColor: "#2196F3" }]}>
              <Text style={styles.teamBadgeText}>B</Text>
            </View>
            <Text style={styles.teamLabel}>Team B</Text>
          </View>
        </View>

        <View style={styles.setsContainer}>
          {sets.map((s, i) => {
            const winner = getWinner(s.teamA, s.teamB);
            return (
              <View key={i} style={styles.setCard}>
                <View style={styles.setHeader}>
                  <Text style={styles.setLabel}>SET {i + 1}</Text>
                  {winner && (
                    <View style={styles.winnerBadge}>
                      <Text style={styles.winnerText}>Vince Team {winner}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.scoreRow}>
                  <View style={styles.scoreInputWrapper}>
                    <TextInput
                      style={[styles.scoreInput, winner === "A" && styles.winnerInput]}
                      keyboardType="numeric"
                      maxLength={2}
                      value={s.teamA}
                      onChangeText={(v) => update(i, "A", v)}
                      placeholder="0"
                      placeholderTextColor="#ccc"
                    />
                    {winner === "A" && (
                      <View style={styles.winnerMark}>
                        <Text style={styles.winnerMarkText}>✓</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.separator}>
                    <Text style={styles.separatorText}>—</Text>
                  </View>
                  <View style={styles.scoreInputWrapper}>
                    <TextInput
                      style={[styles.scoreInput, winner === "B" && styles.winnerInput]}
                      keyboardType="numeric"
                      maxLength={2}
                      value={s.teamB}
                      onChangeText={(v) => update(i, "B", v)}
                      placeholder="0"
                      placeholderTextColor="#ccc"
                    />
                    {winner === "B" && (
                      <View style={styles.winnerMark}>
                        <Text style={styles.winnerMarkText}>✓</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FOOTER FISSO */}
      <View style={styles.footer}>
        <Pressable style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Annulla</Text>
        </Pressable>
        <Pressable style={styles.saveButton} onPress={submit}>
          <Text style={styles.saveText}>Salva risultato</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },

  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a1a1a",
  },
  subtitle: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
    marginTop: 2,
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },

  teamsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  teamBox: {
    alignItems: "center",
    flex: 1,
  },
  teamBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  teamBadgeText: {
    color: "white",
    fontSize: 24,
    fontWeight: "800",
  },
  teamLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  vs: {
    paddingHorizontal: 16,
  },
  vsText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#999",
    letterSpacing: 1,
  },

  setsContainer: {
    gap: 16,
  },
  setCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  setHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  setLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#666",
    letterSpacing: 0.5,
  },
  winnerBadge: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  winnerText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#F57C00",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scoreInputWrapper: {
    flex: 1,
    position: "relative",
  },
  scoreInput: {
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "#e9ecef",
    borderRadius: 12,
    height: 72,
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    color: "#1a1a1a",
  },
  winnerInput: {
    backgroundColor: "#E8F5E9",
    borderColor: "#4CAF50",
  },
  winnerMark: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#4CAF50",
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  winnerMarkText: {
    color: "white",
    fontSize: 14,
    fontWeight: "800",
  },
  separator: {
    paddingHorizontal: 16,
  },
  separatorText: {
    fontSize: 24,
    color: "#ccc",
    fontWeight: "300",
  },

  footer: {
    backgroundColor: "white",
    padding: 20,
    paddingBottom: 32,
    flexDirection: "row",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e9ecef",
  },
  cancelText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "700",
  },
  saveButton: {
    flex: 2,
    backgroundColor: "#2196F3",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
});