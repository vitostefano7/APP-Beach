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
import { useState, useContext } from "react";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../../context/AuthContext";
import API_URL from "../../../config/api";

export default function SetupPreferencesScreen({ route, navigation }: any) {
  const { login } = useContext(AuthContext);
  const { userId, token, name, email, role, avatarUrl } = route.params || {};

  const [city, setCity] = useState("");
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Geocoding
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState<any[]>([]);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{lat: number, lng: number} | null>(null);

  const sports = ["Beach Volley", "Volley"];

  const toggleSport = (sport: string) => {
    if (selectedSports.includes(sport)) {
      setSelectedSports(selectedSports.filter((s) => s !== sport));
    } else {
      setSelectedSports([...selectedSports, sport]);
    }
  };

  const searchCitySuggestions = async (searchText: string) => {
    if (searchText.length < 2) {
      setCitySuggestions([]);
      setShowCitySuggestions(false);
      return;
    }

    try {
      const geocodeUrl = 
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(searchText)},Italia&` +
        `format=json&limit=5`;
      
      const geocodeResponse = await fetch(geocodeUrl, {
        headers: { 'User-Agent': 'SportBookingApp/1.0' },
      });

      const geocodeData = await geocodeResponse.json();
      
      if (geocodeData && geocodeData.length > 0) {
        // Filtra solo risultati in Italia
        const italianResults = geocodeData.filter((result: any) => {
          const lat = parseFloat(result.lat);
          const lng = parseFloat(result.lon);
          return lat >= 35.5 && lat <= 47.1 && lng >= 6.6 && lng <= 18.5;
        });
        
        setCitySuggestions(italianResults);
        setShowCitySuggestions(italianResults.length > 0);
      }
    } catch (error) {
      console.error("Errore ricerca città:", error);
    }
  };

  const selectCity = (suggestion: any) => {
    const cityName = suggestion.address?.city || suggestion.address?.town || suggestion.address?.village || suggestion.name;
    setCity(cityName);
    setSelectedCoordinates({
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon)
    });
    setShowCitySuggestions(false);
    setCitySuggestions([]);
  };

  // ✅ Funzione per fare login automatico
  const performLogin = async () => {
    if (!token) {
      console.log("⚠️ [SETUP] Nessun token, navigo al Login");
      navigation.replace("Login");
      return;
    }

    try {
      const userData = {
        id: userId,
        name: name,
        email: email,
        role: role,
        avatarUrl: avatarUrl,
        createdAt: new Date().toISOString(),
      };

      console.log("🔐 [SETUP] Eseguo login automatico con:", userData);
      await login(token, userData);
      console.log("✅ [SETUP] Login completato!");
    } catch (error) {
      console.error("❌ [SETUP] Errore durante login:", error);
      navigation.replace("Login");
    }
  };

  const handleSkip = async () => {
    console.log("⏭️ [SETUP] Skip preferenze, login automatico");
    await performLogin();
  };

  const handleSave = async () => {
    console.log("🚀 [SETUP] Inizio salvataggio preferenze");
    console.log("📍 [SETUP] Città inserita:", city);
    console.log("🏐 [SETUP] Sport selezionati:", selectedSports);
    console.log("🔑 [SETUP] Token presente:", !!token);

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
        console.log("🌍 [SETUP] Salvataggio location per città:", city.trim());
        
        let locationData;
        
        // Se l'utente ha selezionato dalle coordinate suggerite, usa quelle
        if (selectedCoordinates) {
          console.log("✅ [SETUP] Uso coordinate selezionate dall'utente");
          locationData = {
            city: city.trim(),
            lat: selectedCoordinates.lat,
            lng: selectedCoordinates.lng,
            radius: 30,
          };
        } else {
          // Altrimenti fai geocoding automatico
          console.log("🌍 [SETUP] Inizio geocoding automatico per città:", city.trim());
          
          const geocodeUrl = 
            `https://nominatim.openstreetmap.org/search?` +
            `q=${encodeURIComponent(city.trim())},Italia&` +
            `format=json&limit=1`;
          
          console.log("🔗 [SETUP] URL geocoding:", geocodeUrl);

          const geocodeResponse = await fetch(geocodeUrl, {
            headers: {
              'User-Agent': 'SportBookingApp/1.0',
            },
          });

          const geocodeData = await geocodeResponse.json();
          console.log("📊 [SETUP] Risposta geocoding:", geocodeData);

          let locationDataTemp;
          if (geocodeData && geocodeData.length > 0) {
            const lat = parseFloat(geocodeData[0].lat);
            const lng = parseFloat(geocodeData[0].lon);
            
            // Verifica che le coordinate siano ragionevoli per l'Italia
            if (lat >= 35.5 && lat <= 47.1 && lng >= 6.6 && lng <= 18.5) {
              locationDataTemp = {
                city: city.trim(),
                lat,
                lng,
                radius: 30,
              };
              console.log("✅ [SETUP] Geocoding riuscito con coordinate valide:", locationDataTemp);
            } else {
              console.warn("⚠️ [SETUP] Coordinate fuori dall'Italia:", { lat, lng });
              locationDataTemp = {
                city: city.trim(),
                lat: 45.4642,
                lng: 9.19,
                radius: 30,
              };
            }
          } else {
            locationDataTemp = {
              city: city.trim(),
              lat: 45.4642,
              lng: 9.19,
              radius: 30,
            };
            console.warn("⚠️ [SETUP] Geocoding fallito, uso coordinate Milano");
          }
          
          locationData = locationDataTemp;
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

      console.log("✅ [SETUP] Salvataggio completato, procedo con login");
      
      // ✅ Esegui login automatico dopo aver salvato le preferenze
      await performLogin();

    } catch (error) {
      console.error("💥 [SETUP] Errore durante salvataggio:", error);
      console.error("📍 [SETUP] Stack trace:", (error as Error).stack);
      // Anche in caso di errore, fai login
      await performLogin();
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
                  onChangeText={(text) => {
                    setCity(text);
                    searchCitySuggestions(text);
                  }}
                  autoCapitalize="words"
                />
              </View>
              
              {/* Suggerimenti città */}
              {showCitySuggestions && citySuggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  {citySuggestions.map((suggestion, index) => {
                    const cityName = suggestion.address?.city || suggestion.address?.town || suggestion.address?.village || suggestion.name;
                    const region = suggestion.address?.state || suggestion.address?.region || '';
                    
                    return (
                      <Pressable
                        key={index}
                        style={styles.suggestionItem}
                        onPress={() => selectCity(suggestion)}
                      >
                        <Ionicons name="location" size={18} color="#2196F3" />
                        <View style={styles.suggestionText}>
                          <Text style={styles.suggestionCity}>{cityName}</Text>
                          <Text style={styles.suggestionDetails}>{region}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#999" />
                      </Pressable>
                    );
                  })}
                </View>
              )}
              
              {selectedCoordinates && (
                <View style={styles.coordinatesInfo}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  <Text style={styles.coordinatesText}>
                    ✓ Coordinate confermate
                  </Text>
                </View>
              )}
              
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

  // Suggerimenti città
  suggestionsContainer: {
    marginTop: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    flex: 1,
  },
  suggestionCity: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  suggestionDetails: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  coordinatesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    padding: 10,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
  },
  coordinatesText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
  },
});