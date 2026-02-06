import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useContext, useMemo } from "react";
// Debounce utility
function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";
import API_URL from "../config/api";
import { AuthContext } from "../context/AuthContext";
import { useCustomAlert } from "../hooks/useCustomAlert";

type UserPreferences = {
  pushNotifications: boolean;
  darkMode: boolean;
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
  const { token, user, updateUser } = useContext(AuthContext);
  const { showAlert, AlertComponent } = useCustomAlert();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Preferenze
  const [pushNotifications, setPushNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [profilePrivacy, setProfilePrivacy] = useState<"public" | "private">("public");
  const [city, setCity] = useState("");
  const [radius, setRadius] = useState("30"); // ✅ 30 km default
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [timeSlot, setTimeSlot] = useState<string | null>(null);

  // Geocoding
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState<any[]>([]);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [showLocationPreview, setShowLocationPreview] = useState(false);
  const [previewCoordinates, setPreviewCoordinates] = useState<{lat: number, lng: number} | null>(null);

  const sports = ["Volley", "Beach Volley", "Beach Tennis", "Tennis", "Padel", "Calcio", "Calcetto", "Calciotto", "Calcio a 7", "Basket"];
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
      // Carica privacy dal profilo utente
      setProfilePrivacy(user?.profilePrivacy || "public");

      // Carica altre preferenze
      const res = await fetch(`${API_URL}/users/preferences`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const prefs: UserPreferences = await res.json();
        setPushNotifications(prefs.pushNotifications);
        setDarkMode(prefs.darkMode);
        setCity(prefs.preferredLocation?.city || "");
        setRadius(prefs.preferredLocation?.radius?.toString() || "30");
        if (prefs.preferredLocation) {
          setSelectedCoordinates({
            lat: prefs.preferredLocation.lat,
            lng: prefs.preferredLocation.lng,
          });
        } else {
          setSelectedCoordinates(null);
        }
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

  // Debounced version
  const debouncedSearchCitySuggestions = useMemo(() => debounce(searchCitySuggestions, 500), []);

  const selectCity = (suggestion: any) => {
    const cityName = suggestion.address?.city || suggestion.address?.town || suggestion.address?.village || suggestion.name;
    setCity(cityName);
    const coords = {
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
    };
    setSelectedCoordinates(coords);
    setPreviewCoordinates(coords);
    setShowCitySuggestions(false);
    setCitySuggestions([]);
    setShowLocationPreview(true);
  };

  const handleSave = async () => {
    console.log("🚀 [PREF] Inizio salvataggio preferenze");
    console.log("📍 [PREF] Città:", city);
    console.log("📏 [PREF] Raggio:", radius);
    console.log("🏐 [PREF] Sport:", selectedSports);
    console.log("⏰ [PREF] Fascia oraria:", timeSlot);
    console.log("🔔 [PREF] Push notifications:", pushNotifications);
    console.log("🌙 [PREF] Dark mode:", darkMode);
    console.log("🔒 [PREF] Profile Privacy:", profilePrivacy);

    if (city.trim() && !selectedCoordinates) {
      showAlert({
        type: 'warning',
        title: 'Seleziona una citta',
        message: 'Per favore scegli la citta dai suggerimenti per confermare le coordinate.'
      });
      return;
    }

    // Validazione raggio
    const radiusValue = parseInt(radius) || 30;
    if (radiusValue < 1 || radiusValue > 100) {
      showAlert({
        type: 'error',
        title: 'Raggio non valido',
        message: 'Il raggio deve essere compreso tra 1 e 100 km.',
        buttons: [{ text: "OK", style: "default" }]
      });
      return;
    }

    setSaving(true);

    try {
      // Salva privacy profilo
      console.log("📤 [PREF] Invio privacy profilo...");
      const profileRes = await fetch(`${API_URL}/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ profilePrivacy }),
      });

      if (profileRes.ok) {
        const updatedUser = await profileRes.json();
        console.log("✅ [PREF] Privacy profilo aggiornata:", updatedUser.profilePrivacy);
        console.log("📦 [PREF] Dati utente completi dal server:", JSON.stringify(updatedUser, null, 2));
        // Aggiorna il context con i dati freschi dal server
        await updateUser(updatedUser);
        console.log("✅ [PREF] Context aggiornato con profilePrivacy:", updatedUser.profilePrivacy);
      } else {
        const errorData = await profileRes.json();
        console.error("❌ [PREF] Errore privacy profilo:", errorData);
      }

      // Salva preferenze generali
      console.log("📤 [PREF] Invio preferenze generali...");
      const generalPayload = {
        pushNotifications,
        darkMode,
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

      // Salva location se presente (richiede coordinate selezionate)
      if (city.trim()) {
        console.log("🌍 [PREF] Salvataggio location per città:", city.trim());
        
        console.log("[PREF] Uso coordinate selezionate dall'utente");
        const locationData = {
          city: city.trim(),
          lat: selectedCoordinates!.lat,
          lng: selectedCoordinates!.lng,
          radius: parseInt(radius) || 30,
        };

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
        console.log("[PREF] Nessuna citta inserita, skip location");
      }

      if (generalRes.ok) {
        console.log("✅ [PREF] Salvataggio completato!");
        showAlert({ type: 'success', title: 'Successo', message: 'Preferenze salvate con successo!' });
        navigation.goBack();
      } else {
        console.error("❌ [PREF] Errore nel salvataggio generale");
        showAlert({ type: 'error', title: 'Errore', message: 'Impossibile salvare le preferenze' });
      }
    } catch (error) {
      console.error("💥 [PREF] Errore durante salvataggio:", error);
      console.error("📍 [PREF] Stack trace:", (error as Error).stack);
      showAlert({ type: 'error', title: 'Errore', message: 'Impossibile salvare le preferenze' });
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
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </Pressable>
          <Text style={styles.headerTitle}>Preferenze</Text>
          <Pressable
            style={styles.headerSaveButton}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.headerSaveButtonText}>
              {saving ? "..." : "Salva"}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* PRIVACY */}
          <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-outline" size={24} color="#2979ff" />
            <Text style={styles.sectionTitle}>Privacy</Text>
          </View>

          <Text style={styles.privacyLabel}>Visibilità profilo</Text>
          <Text style={styles.privacyDescription}>
            Pubblico: chiunque può seguirti e vedere il tuo profilo{"\n"}
            Privato: devi approvare chi vuole seguirti
          </Text>
          <View style={styles.privacyOptions}>
            {[
              { value: "public", label: "Pubblico", icon: "globe-outline" },
              { value: "private", label: "Privato", icon: "lock-closed-outline" },
            ].map((option) => (
              <Pressable
                key={option.value}
                style={[
                  styles.privacyOption,
                  profilePrivacy === option.value && styles.privacyOptionActive,
                ]}
                onPress={() => setProfilePrivacy(option.value as any)}
              >
                <Ionicons
                  name={option.icon as any}
                  size={24}
                  color={profilePrivacy === option.value ? "#2979ff" : "#666"}
                />
                <Text
                  style={[
                    styles.privacyOptionText,
                    profilePrivacy === option.value && styles.privacyOptionTextActive,
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
                onChangeText={(text) => {
                  setCity(text);
                  setSelectedCoordinates(null);
                  setPreviewCoordinates(null);
                  debouncedSearchCitySuggestions(text);
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
                  Coordinate confermate: {selectedCoordinates.lat.toFixed(4)}, {selectedCoordinates.lng.toFixed(4)}
                </Text>
              </View>
            )}
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
      </KeyboardAvoidingView>

      <Modal
        visible={showLocationPreview && !!previewCoordinates}
        animationType="slide"
        transparent
        onRequestClose={() => setShowLocationPreview(false)}
      >
        <View style={styles.mapModalOverlay}>
          <View style={styles.mapModalContent}>
            <View style={styles.mapModalHeader}>
              <Text style={styles.mapModalTitle}>Conferma posizione</Text>
              <Pressable onPress={() => setShowLocationPreview(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>

            {previewCoordinates && (
              <MapView
                style={styles.mapPreview}
                region={{
                  latitude: previewCoordinates.lat,
                  longitude: previewCoordinates.lng,
                  latitudeDelta: 0.2,
                  longitudeDelta: 0.2,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
              >
                <Marker
                  coordinate={{
                    latitude: previewCoordinates.lat,
                    longitude: previewCoordinates.lng,
                  }}
                  title={city}
                />
              </MapView>
            )}

            <Text style={styles.mapModalHint}>
              Verifica che il punto sulla mappa sia corretto per la citta selezionata.
            </Text>

            <View style={styles.mapModalActions}>
              <Pressable
                style={styles.mapModalSecondary}
                onPress={() => {
                  setShowLocationPreview(false);
                  setSelectedCoordinates(null);
                }}
              >
                <Text style={styles.mapModalSecondaryText}>Modifica</Text>
              </Pressable>
              <Pressable
                style={styles.mapModalPrimary}
                onPress={() => setShowLocationPreview(false)}
              >
                <Text style={styles.mapModalPrimaryText}>Conferma</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <AlertComponent />
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a1a1a",
  },

  headerSaveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#2979ff",
  },

  headerSaveButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "white",
  },

  container: {
    flex: 1,
  },

  content: {
    padding: 20,
    paddingBottom: 100,
  },
  keyboardAvoid: {
    flex: 1,
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
    fontSize: 16,
    fontWeight: "800",
    color: "#1a1a1a",
  },

  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },

  settingInfo: {
    flex: 1,
    paddingRight: 16,
  },

  settingLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },

  settingDescription: {
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
  },

  privacyLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
  },

  privacyDescription: {
    fontSize: 11,
    color: "#666",
    lineHeight: 16,
    marginBottom: 12,
  },

  privacyOptions: {
    flexDirection: "row",
    gap: 10,
  },

  privacyOption: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
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
    fontSize: 12,
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
    fontSize: 13,
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 12,
  },

  input: {
    flex: 1,
    fontSize: 14,
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
    paddingHorizontal: 12,
    paddingVertical: 12,
  },

  sportChipActive: {
    borderColor: "#2979ff",
    backgroundColor: "#F0F7FF",
  },

  sportText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },

  sportTextActive: {
    color: "#2979ff",
    fontWeight: "700",
  },

  timeSlotsGrid: {
    gap: 10,
  },

  timeSlotCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
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
    fontSize: 13,
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
    fontWeight: '500',
  },

  mapModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },
  mapModalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
  },
  mapModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  mapModalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  mapPreview: {
    height: 220,
    borderRadius: 12,
    overflow: "hidden",
  },
  mapModalHint: {
    fontSize: 12,
    color: "#666",
    marginTop: 12,
  },
  mapModalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  mapModalSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#f1f1f1",
    alignItems: "center",
  },
  mapModalSecondaryText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#666",
  },
  mapModalPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#2979ff",
    alignItems: "center",
  },
  mapModalPrimaryText: {
    fontSize: 14,
    fontWeight: "700",
    color: "white",
  },
});
