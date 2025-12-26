import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import API_URL from "../../../config/api";

export default function SetupPreferencesScreen({ route, navigation }: any) {
  const { userId, token, name } = route.params || {};

  const [city, setCity] = useState("");
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const sports = ["Beach Volley", "Volley"];

  const toggleSport = (sport: string) => {
    if (selectedSports.includes(sport)) {
      setSelectedSports(selectedSports.filter((s) => s !== sport));
    } else {
      setSelectedSports([...selectedSports, sport]);
    }
  };

  const handleSkip = () => {
    // Torna alla schermata Login
    navigation.replace("Login");
  };

  const handleSave = async () => {
    console.log("🚀 [SETUP] Inizio salvataggio preferenze");
    console.log("📍 [SETUP] Città inserita:", city);
    console.log("🏐 [SETUP] Sport selezionati:", selectedSports);
    console.log("🔑 [SETUP] Token presente:", !!token);

    // Se non abbiamo il token, semplicemente skippa
    if (!token) {
      console.log("⚠️ [SETUP] Nessun token disponibile, skip al login");
      handleSkip();
      return;
    }

    setLoading(true);

    try {
      // Salva sport preferiti
      console.log("📤 [SETUP] Invio preferenze generali...");
      const res = await fetch(`${API_URL}/users/preferences`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          favoriteSports: selectedSports,
        }),
      });

      console.log("📥 [SETUP] Risposta preferenze generali:", res.status);

      // Se ha inserito una città, salva anche la location preferita CON GEOCODING
      if (city.trim()) {
        console.log("🌍 [SETUP] Inizio geocoding per città:", city.trim());
        
        const geocodeUrl = 
          `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(city.trim())},Italia&` +
          `format=json&limit=1`;
        
        console.log("🔗 [SETUP] URL geocoding:", geocodeUrl);

        // Geocoding: converti città → coordinate
        const geocodeResponse = await fetch(geocodeUrl, {
          headers: {
            'User-Agent': 'SportBookingApp/1.0',
          },
        });

        const geocodeData = await geocodeResponse.json();
        console.log("📊 [SETUP] Risposta geocoding:", geocodeData);

        let locationData;
        if (geocodeData && geocodeData.length > 0) {
          locationData = {
            city: city.trim(),
            lat: parseFloat(geocodeData[0].lat),
            lng: parseFloat(geocodeData[0].lon),
            radius: 30, // ✅ 30 km
          };
          console.log("✅ [SETUP] Geocoding riuscito:", locationData);
        } else {
          locationData = {
            city: city.trim(),
            lat: 45.4642,
            lng: 9.19,
            radius: 30, // ✅ 30 km
          };
          console.warn("⚠️ [SETUP] Geocoding fallito, uso coordinate Milano");
          console.log("📍 [SETUP] Location fallback:", locationData);
        }

        console.log("📤 [SETUP] Invio location preferita...");
        console.log("📦 [SETUP] Body:", JSON.stringify(locationData, null, 2));

        const locationRes = await fetch(`${API_URL}/users/preferences/location`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(locationData),
        });

        console.log("📥 [SETUP] Risposta location:", locationRes.status);
        
        if (locationRes.ok) {
          const locationResData = await locationRes.json();
          console.log("✅ [SETUP] Location salvata:", locationResData);
        } else {
          const errorData = await locationRes.json();
          console.error("❌ [SETUP] Errore salvataggio location:", errorData);
        }
      } else {
        console.log("⏭️ [SETUP] Nessuna città inserita, skip geocoding");
      }

      if (res.ok) {
        console.log("✅ [SETUP] Salvataggio completato, navigo al login");
        navigation.replace("Login");
      } else {
        console.error("❌ [SETUP] Errore salvataggio preferenze, procedo al login");
        handleSkip();
      }
    } catch (error) {
      console.error("💥 [SETUP] Errore durante salvataggio:", error);
      console.error("📍 [SETUP] Stack trace:", (error as Error).stack);
      // Anche in caso di errore, vai al login
      handleSkip();
    } finally {
      setLoading(false);
      console.log("🏁 [SETUP] Processo completato");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Welcome */}
          <View style={styles.welcomeSection}>
            <View style={styles.iconCircle}>
              <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
            </View>
            <Text style={styles.welcomeTitle}>
              Benvenuto{name ? `, ${name}` : ""}!
            </Text>
            <Text style={styles.welcomeSubtitle}>
              Account creato con successo 🎉
            </Text>
          </View>

          {/* Setup */}
          <View style={styles.setupSection}>
            <View style={styles.headerSection}>
              <Ionicons name="settings-outline" size={28} color="#2979ff" />
              <Text style={styles.setupTitle}>
                Configura le tue preferenze
              </Text>
            </View>
            <Text style={styles.setupDescription}>
              Questi dati ci aiutano a mostrarti le strutture più vicine a te.
              Puoi saltare questo passaggio e configurarle in seguito.
            </Text>

            {/* Location */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                📍 Dove giochi di solito?
                <Text style={styles.optional}> (opzionale)</Text>
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons name="location-outline" size={20} color="#666" />
                <TextInput
                  style={styles.input}
                  placeholder="Es. Milano, Roma, Napoli..."
                  value={city}
                  onChangeText={setCity}
                  autoCapitalize="words"
                />
              </View>
              <Text style={styles.hint}>
                Ti mostreremo le strutture entro 30 km dalla tua città
              </Text>
            </View>

            {/* Sports */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                🏐 Quali sport ti piacciono?
                <Text style={styles.optional}> (opzionale)</Text>
              </Text>
              <View style={styles.sportsGrid}>
                {sports.map((sport) => (
                  <Pressable
                    key={sport}
                    style={[
                      styles.sportChip,
                      selectedSports.includes(sport) && styles.sportChipActive,
                    ]}
                    onPress={() => toggleSport(sport)}
                  >
                    <Ionicons
                      name={
                        selectedSports.includes(sport)
                          ? "checkmark-circle"
                          : "ellipse-outline"
                      }
                      size={24}
                      color={selectedSports.includes(sport) ? "#2979ff" : "#999"}
                    />
                    <Text
                      style={[
                        styles.sportText,
                        selectedSports.includes(sport) && styles.sportTextActive,
                      ]}
                    >
                      {sport}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={24} color="#2979ff" />
              <Text style={styles.infoText}>
                Potrai modificare queste preferenze in qualsiasi momento dal tuo
                profilo
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Salta</Text>
          </Pressable>

          <Pressable
            style={styles.saveButton}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? "Salvataggio..." : "Salva e continua"}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fafafa",
  },

  container: {
    flex: 1,
  },

  content: {
    padding: 20,
  },

  welcomeSection: {
    alignItems: "center",
    paddingVertical: 32,
    marginBottom: 24,
  },

  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  welcomeTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 8,
    textAlign: "center",
  },

  welcomeSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },

  setupSection: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  headerSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },

  setupTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a1a1a",
  },

  setupDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 24,
  },

  inputGroup: {
    marginBottom: 24,
  },

  label: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 12,
  },

  optional: {
    color: "#999",
    fontWeight: "500",
    fontSize: 14,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "#e9ecef",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: "#1a1a1a",
    fontWeight: "500",
  },

  hint: {
    fontSize: 12,
    color: "#999",
    marginTop: 8,
    fontStyle: "italic",
  },

  sportsGrid: {
    gap: 12,
  },

  sportChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "#e9ecef",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  sportChipActive: {
    borderColor: "#2979ff",
    backgroundColor: "#F0F7FF",
  },

  sportText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },

  sportTextActive: {
    color: "#2979ff",
    fontWeight: "700",
  },

  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#E3F2FD",
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },

  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#1565C0",
    lineHeight: 18,
  },

  footer: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },

  skipButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
  },

  skipButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#666",
  },

  saveButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#2979ff",
  },

  saveButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "white",
  },
});