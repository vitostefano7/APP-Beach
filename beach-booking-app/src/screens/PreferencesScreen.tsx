import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useContext } from "react";
import { Ionicons } from "@expo/vector-icons";
import API_URL from "../config/api";
import { AuthContext } from "../context/AuthContext";

type UserPreferences = {
  pushNotifications: boolean;
  darkMode: boolean;
  privacyLevel: "public" | "friends" | "private";
  preferredLocation?: {
    city: string;
    lat: number;
    lng: number;
    radius: number;
  };
  favoriteSports?: string[];
  preferredTimeSlot?: "morning" | "afternoon" | "evening";
};

export default function PreferencesScreen({ navigation }: any) {
  const { token } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Preferenze
  const [pushNotifications, setPushNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [privacyLevel, setPrivacyLevel] = useState<"public" | "friends" | "private">("public");
  const [city, setCity] = useState("");
  const [radius, setRadius] = useState("30"); // ✅ 30 km default
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [timeSlot, setTimeSlot] = useState<string | null>(null);

  const sports = ["Beach Volley", "Volley"];
  const timeSlots = [
    { value: "morning", label: "Mattina (6:00 - 12:00)", icon: "sunny" },
    { value: "afternoon", label: "Pomeriggio (12:00 - 18:00)", icon: "partly-sunny" },
    { value: "evening", label: "Sera (18:00 - 24:00)", icon: "moon" },
  ];

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/users/preferences`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const prefs: UserPreferences = await res.json();
        setPushNotifications(prefs.pushNotifications);
        setDarkMode(prefs.darkMode);
        setPrivacyLevel(prefs.privacyLevel);
        setCity(prefs.preferredLocation?.city || "");
        setRadius(prefs.preferredLocation?.radius?.toString() || "10");
        setSelectedSports(prefs.favoriteSports || []);
        setTimeSlot(prefs.preferredTimeSlot || null);
      }
    } catch (error) {
      console.error("Errore caricamento preferenze:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSport = (sport: string) => {
    if (selectedSports.includes(sport)) {
      setSelectedSports(selectedSports.filter((s) => s !== sport));
    } else {
      setSelectedSports([...selectedSports, sport]);
    }
  };

  const handleSave = async () => {
    console.log("🚀 [PREF] Inizio salvataggio preferenze");
    console.log("📍 [PREF] Città:", city);
    console.log("📏 [PREF] Raggio:", radius);
    console.log("🏐 [PREF] Sport:", selectedSports);
    console.log("⏰ [PREF] Fascia oraria:", timeSlot);
    console.log("🔔 [PREF] Push notifications:", pushNotifications);
    console.log("🌙 [PREF] Dark mode:", darkMode);
    console.log("🔒 [PREF] Privacy:", privacyLevel);

    setSaving(true);

    try {
      // Salva preferenze generali
      console.log("📤 [PREF] Invio preferenze generali...");
      const generalPayload = {
        pushNotifications,
        darkMode,
        privacyLevel,
        favoriteSports: selectedSports,
        preferredTimeSlot: timeSlot || undefined,
      };
      console.log("📦 [PREF] Payload generali:", JSON.stringify(generalPayload, null, 2));

      const generalRes = await fetch(`${API_URL}/users/preferences`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(generalPayload),
      });

      console.log("📥 [PREF] Risposta preferenze generali:", generalRes.status);

      if (!generalRes.ok) {
        const errorData = await generalRes.json();
        console.error("❌ [PREF] Errore preferenze generali:", errorData);
      }

      // Salva location se presente CON GEOCODING
      if (city.trim()) {
        console.log("🌍 [PREF] Inizio geocoding per città:", city.trim());
        
        const geocodeUrl = 
          `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(city.trim())},Italia&` +
          `format=json&limit=1`;
        
        console.log("🔗 [PREF] URL geocoding:", geocodeUrl);

        // Geocoding: converti città → coordinate
        const geocodeResponse = await fetch(geocodeUrl, {
          headers: {
            'User-Agent': 'SportBookingApp/1.0',
          },
        });

        console.log("📡 [PREF] Status geocoding:", geocodeResponse.status);

        const geocodeData = await geocodeResponse.json();
        console.log("📊 [PREF] Risposta geocoding:", JSON.stringify(geocodeData, null, 2));

        let locationData;
        if (geocodeData && geocodeData.length > 0) {
          // ✅ Trovate coordinate reali!
          locationData = {
            city: city.trim(),
            lat: parseFloat(geocodeData[0].lat),
            lng: parseFloat(geocodeData[0].lon),
            radius: parseInt(radius) || 30,
          };
          console.log("✅ [PREF] Geocoding riuscito!");
          console.log("📍 [PREF] Coordinate trovate:", locationData);
        } else {
          // ❌ Geocoding fallito, usa Milano di default
          locationData = {
            city: city.trim(),
            lat: 45.4642,
            lng: 9.19,
            radius: parseInt(radius) || 30,
          };
          console.warn("⚠️ [PREF] Geocoding fallito per:", city.trim());
          console.log("📍 [PREF] Uso coordinate Milano come fallback");
        }

        console.log("📤 [PREF] Invio location preferita...");
        console.log("📦 [PREF] Body location:", JSON.stringify(locationData, null, 2));

        const locationRes = await fetch(`${API_URL}/users/preferences/location`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(locationData),
        });

        console.log("📥 [PREF] Risposta location:", locationRes.status);

        if (locationRes.ok) {
          const locationResData = await locationRes.json();
          console.log("✅ [PREF] Location salvata con successo!");
          console.log("💾 [PREF] Dati salvati:", JSON.stringify(locationResData, null, 2));
        } else {
          const errorData = await locationRes.json();
          console.error("❌ [PREF] Errore salvataggio location:", errorData);
        }
      } else {
        console.log("⏭️ [PREF] Nessuna città inserita, skip geocoding");
      }

      if (generalRes.ok) {
        console.log("✅ [PREF] Salvataggio completato!");
        Alert.alert("Successo", "Preferenze salvate con successo!");
        navigation.goBack();
      } else {
        console.error("❌ [PREF] Errore nel salvataggio generale");
        Alert.alert("Errore", "Impossibile salvare le preferenze");
      }
    } catch (error) {
      console.error("💥 [PREF] Errore durante salvataggio:", error);
      console.error("📍 [PREF] Stack trace:", (error as Error).stack);
      Alert.alert("Errore", "Impossibile salvare le preferenze");
    } finally {
      setSaving(false);
      console.log("🏁 [PREF] Processo completato");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Caricamento...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </Pressable>
        <Text style={styles.headerTitle}>Preferenze</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        

        {/* PRIVACY */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-outline" size={24} color="#2979ff" />
            <Text style={styles.sectionTitle}>Privacy</Text>
          </View>

          <Text style={styles.privacyLabel}>Livello di privacy</Text>
          <View style={styles.privacyOptions}>
            {[
              { value: "public", label: "Pubblico", icon: "globe-outline" },
              { value: "friends", label: "Amici", icon: "people-outline" },
              { value: "private", label: "Privato", icon: "lock-closed-outline" },
            ].map((option) => (
              <Pressable
                key={option.value}
                style={[
                  styles.privacyOption,
                  privacyLevel === option.value && styles.privacyOptionActive,
                ]}
                onPress={() => setPrivacyLevel(option.value as any)}
              >
                <Ionicons
                  name={option.icon as any}
                  size={24}
                  color={privacyLevel === option.value ? "#2979ff" : "#666"}
                />
                <Text
                  style={[
                    styles.privacyOptionText,
                    privacyLevel === option.value && styles.privacyOptionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* LOCATION PREFERITA */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={24} color="#2979ff" />
            <Text style={styles.sectionTitle}>Posizione Preferita</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Città</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="business-outline" size={20} color="#666" />
              <TextInput
                style={styles.input}
                placeholder="Es. Milano, Roma..."
                value={city}
                onChangeText={setCity}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Raggio di ricerca (km)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={20} color="#666" />
              <TextInput
                style={styles.input}
                placeholder="10"
                value={radius}
                onChangeText={setRadius}
                keyboardType="numeric"
              />
            </View>
            <Text style={styles.hint}>
              Mostreremo strutture entro {radius || "10"} km dalla tua città
            </Text>
          </View>
        </View>

        {/* SPORT PREFERITI */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="basketball-outline" size={24} color="#2979ff" />
            <Text style={styles.sectionTitle}>Sport Preferiti</Text>
          </View>

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

        {/* FASCIA ORARIA PREFERITA */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={24} color="#2979ff" />
            <Text style={styles.sectionTitle}>Fascia Oraria Preferita</Text>
          </View>

          <View style={styles.timeSlotsGrid}>
            {timeSlots.map((slot) => (
              <Pressable
                key={slot.value}
                style={[
                  styles.timeSlotCard,
                  timeSlot === slot.value && styles.timeSlotCardActive,
                ]}
                onPress={() =>
                  setTimeSlot(timeSlot === slot.value ? null : slot.value)
                }
              >
                <Ionicons
                  name={slot.icon as any}
                  size={32}
                  color={timeSlot === slot.value ? "#2979ff" : "#666"}
                />
                <Text
                  style={[
                    styles.timeSlotText,
                    timeSlot === slot.value && styles.timeSlotTextActive,
                  ]}
                >
                  {slot.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* NOTIFICHE E APP */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="notifications-outline" size={24} color="#2979ff" />
            <Text style={styles.sectionTitle}>Notifiche e App</Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Notifiche Push</Text>
              <Text style={styles.settingDescription}>
                Ricevi notifiche per prenotazioni e aggiornamenti
              </Text>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: "#e9ecef", true: "#a3cfff" }}
              thumbColor={pushNotifications ? "#2979ff" : "#f4f3f4"}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Modalità Scura</Text>
              <Text style={styles.settingDescription}>
                Tema scuro per l'interfaccia
              </Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: "#e9ecef", true: "#a3cfff" }}
              thumbColor={darkMode ? "#2979ff" : "#f4f3f4"}
            />
          </View>
        </View>

        {/* INFO */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color="#2979ff" />
          <Text style={styles.infoText}>
            Queste preferenze ci aiutano a personalizzare la tua esperienza e
            mostrarti le strutture più rilevanti per te
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? "Salvataggio..." : "Salva modifiche"}
          </Text>
          <Ionicons name="checkmark" size={20} color="white" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fafafa",
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    fontSize: 16,
    color: "#666",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a1a1a",
  },

  container: {
    flex: 1,
  },

  content: {
    padding: 20,
    paddingBottom: 100,
  },

  section: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a1a1a",
  },

  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },

  settingInfo: {
    flex: 1,
    paddingRight: 16,
  },

  settingLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },

  settingDescription: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },

  privacyLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 12,
  },

  privacyOptions: {
    flexDirection: "row",
    gap: 12,
  },

  privacyOption: {
    flex: 1,
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "transparent",
  },

  privacyOptionActive: {
    backgroundColor: "#E3F2FD",
    borderColor: "#2979ff",
  },

  privacyOptionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },

  privacyOptionTextActive: {
    color: "#2979ff",
    fontWeight: "700",
  },

  inputGroup: {
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
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
    paddingVertical: 14,
  },

  sportChipActive: {
    borderColor: "#2979ff",
    backgroundColor: "#F0F7FF",
  },

  sportText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666",
  },

  sportTextActive: {
    color: "#2979ff",
    fontWeight: "700",
  },

  timeSlotsGrid: {
    gap: 12,
  },

  timeSlotCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "transparent",
  },

  timeSlotCardActive: {
    backgroundColor: "#E3F2FD",
    borderColor: "#2979ff",
  },

  timeSlotText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },

  timeSlotTextActive: {
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
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },

  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#2979ff",
    shadowColor: "#2979ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  saveButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "white",
  },
});