import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  Switch,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import API_URL from "../../../config/api";

import { styles } from "../styles/ModificaStruttura-styles";
import {
  AVAILABLE_AMENITIES,
  DAYS,
  OpeningHours,
  DEFAULT_OPENING_HOURS,
  isCustomAmenity,
} from "../utils/ModificaStruttura-utils";

export default function ModificaStrutturaScreen() {
  const { token } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { strutturaId } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [openingHours, setOpeningHours] = useState<OpeningHours>(DEFAULT_OPENING_HOURS);
  
  // ✅ Amenities attive
  const [amenities, setAmenities] = useState<string[]>([]);
  
  // ✅ Amenities custom salvate (anche se disattivate)
  const [customAmenities, setCustomAmenities] = useState<string[]>([]);
  
  // ✅ Modal input custom
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customAmenityInput, setCustomAmenityInput] = useState("");

  useEffect(() => {
    loadStruttura();
  }, []);

  const loadStruttura = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/strutture/${strutturaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Struttura non trovata");

      const data = await response.json();

      setName(data.name || "");
      setDescription(data.description || "");
      setAddress(data.location?.address || "");
      setCity(data.location?.city || "");
      setIsActive(data.isActive !== false);

      if (data.openingHours && Object.keys(data.openingHours).length > 0) {
        setOpeningHours(data.openingHours);
      }

      // ✅ Carica amenities
      if (data.amenities) {
        if (Array.isArray(data.amenities)) {
          setAmenities(data.amenities);
          
          // Estrai custom amenities (anche disattivate saranno in questo array)
          const customs = data.amenities.filter((a: string) => isCustomAmenity(a));
          setCustomAmenities(customs);
        } else {
          const activeAmenities = Object.entries(data.amenities)
            .filter(([_, value]) => value === true)
            .map(([key]) => key);
          setAmenities(activeAmenities);
          
          const customs = activeAmenities.filter((a: string) => isCustomAmenity(a));
          setCustomAmenities(customs);
        }
      }
    } catch (error) {
      console.error("❌ Errore caricamento struttura:", error);
      Alert.alert("Errore", "Impossibile caricare la struttura", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Toggle amenity predefinita o custom
  const toggleAmenity = (key: string) => {
    setAmenities((prev) =>
      prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]
    );
  };

  // ✅ Aggiungi custom amenity
  const addCustomAmenity = () => {
    const trimmed = customAmenityInput.trim();
    
    if (!trimmed) {
      Alert.alert("Errore", "Inserisci il nome del servizio");
      return;
    }

    if (customAmenities.includes(trimmed)) {
      Alert.alert("Attenzione", "Questo servizio è già presente");
      return;
    }

    // Aggiungi sia alla lista custom che alle amenities attive
    setCustomAmenities((prev) => [...prev, trimmed]);
    setAmenities((prev) => [...prev, trimmed]);
    setCustomAmenityInput("");
    setShowCustomModal(false);
  };

  // ✅ Elimina definitivamente custom amenity
  const removeCustomAmenity = (amenity: string) => {
    Alert.alert("Rimuovi servizio", `Vuoi rimuovere definitivamente "${amenity}"?`, [
      { text: "Annulla", style: "cancel" },
      {
        text: "Rimuovi",
        style: "destructive",
        onPress: () => {
          setCustomAmenities((prev) => prev.filter((a) => a !== amenity));
          setAmenities((prev) => prev.filter((a) => a !== amenity));
        },
      },
    ]);
  };

  const toggleDayClosed = (day: string) => {
    setOpeningHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], closed: !prev[day].closed },
    }));
  };

  const updateOpeningHour = (day: string, type: "open" | "close", value: string) => {
    setOpeningHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [type]: value },
    }));
  };

  const handleToggleActive = () => {
    if (isActive) {
      Alert.alert(
        "Disattiva struttura",
        "Disattivando la struttura, non sarà più visibile agli utenti e non potranno essere effettuate nuove prenotazioni. Continuare?",
        [
          { text: "Annulla", style: "cancel" },
          { text: "Disattiva", style: "destructive", onPress: () => setIsActive(false) },
        ]
      );
    } else {
      setIsActive(true);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Errore", "Il nome è obbligatorio");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${API_URL}/strutture/${strutturaId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description,
          amenities, // Solo le attive
          openingHours,
          isActive,
        }),
      });

      if (response.ok) {
        Alert.alert("Successo", "Struttura aggiornata con successo!", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        const error = await response.json();
        Alert.alert("Errore", error.message || "Impossibile aggiornare la struttura");
      }
    } catch (error) {
      Alert.alert("Errore", "Errore di connessione");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color="#2196F3" style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </Pressable>
        <Text style={styles.headerTitle}>Modifica Struttura</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* STATO */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusLeft}>
              <View style={[styles.statusIcon, isActive ? styles.statusIconActive : styles.statusIconInactive]}>
                <Ionicons name={isActive ? "checkmark-circle" : "close-circle"} size={24} color={isActive ? "#4CAF50" : "#E53935"} />
              </View>
              <View>
                <Text style={styles.statusTitle}>Struttura {isActive ? "attiva" : "non attiva"}</Text>
                <Text style={styles.statusSubtitle}>{isActive ? "Visibile agli utenti" : "Nascosta agli utenti"}</Text>
              </View>
            </View>
            <Switch value={isActive} onValueChange={handleToggleActive} trackColor={{ false: "#E0E0E0", true: "#4CAF50" }} thumbColor={isActive ? "white" : "#f4f3f4"} />
          </View>
          {!isActive && (
            <View style={styles.warningBox}>
              <Ionicons name="warning" size={16} color="#FF9800" />
              <Text style={styles.warningText}>La struttura è nascosta. Gli utenti non possono vederla o prenotare.</Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Informazioni base</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Nome struttura *</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nome struttura" placeholderTextColor="#999" />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Descrizione</Text>
          <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Descrizione..." placeholderTextColor="#999" multiline numberOfLines={4} />
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#2196F3" />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoText}>Indirizzo e posizione non possono essere modificati</Text>
            <Text style={styles.infoAddress}>{address || "Non disponibile"}, {city}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Orari di apertura</Text>

        {DAYS.map(({ key, label }) => (
          <View key={key} style={styles.dayRow}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayLabel}>{label}</Text>
              <View style={styles.dayToggle}>
                <Text style={styles.dayToggleLabel}>{openingHours[key]?.closed ? "Chiuso" : "Aperto"}</Text>
                <Switch value={!openingHours[key]?.closed} onValueChange={() => toggleDayClosed(key)} trackColor={{ false: "#E0E0E0", true: "#2196F3" }} />
              </View>
            </View>
            {!openingHours[key]?.closed && (
              <View style={styles.timeRow}>
                <View style={styles.timeInputContainer}>
                  <Ionicons name="time-outline" size={16} color="#666" />
                  <TextInput style={styles.timeInput} value={openingHours[key]?.open || "09:00"} onChangeText={(v) => updateOpeningHour(key, "open", v)} placeholder="09:00" placeholderTextColor="#999" />
                </View>
                <Text style={styles.timeSeparator}>→</Text>
                <View style={styles.timeInputContainer}>
                  <Ionicons name="time-outline" size={16} color="#666" />
                  <TextInput style={styles.timeInput} value={openingHours[key]?.close || "22:00"} onChangeText={(v) => updateOpeningHour(key, "close", v)} placeholder="22:00" placeholderTextColor="#999" />
                </View>
              </View>
            )}
          </View>
        ))}

        <Text style={styles.sectionTitle}>Servizi disponibili ({amenities.length})</Text>

        {/* PREDEFINITE */}
        {AVAILABLE_AMENITIES.map(({ key, label, icon }) => (
          <View key={key} style={styles.amenityRow}>
            <View style={styles.amenityLeft}>
              <View style={[styles.amenityIcon, amenities.includes(key) && styles.amenityIconActive]}>
                <Ionicons name={icon as any} size={20} color={amenities.includes(key) ? "#2196F3" : "#666"} />
              </View>
              <Text style={styles.amenityLabel}>{label}</Text>
            </View>
            <Switch value={amenities.includes(key)} onValueChange={() => toggleAmenity(key)} trackColor={{ false: "#E0E0E0", true: "#2196F3" }} />
          </View>
        ))}

        {/* ✅ CUSTOM (tutte, anche disattivate) */}
        {customAmenities.map((customAmenity) => {
          const isActive = amenities.includes(customAmenity);
          
          return (
            <View key={customAmenity} style={styles.amenityRow}>
              <View style={styles.amenityLeft}>
                <View style={[styles.amenityIcon, isActive && styles.amenityIconActive]}>
                  <Ionicons name="add-circle" size={20} color={isActive ? "#2196F3" : "#666"} />
                </View>
                <Text style={[styles.amenityLabel, !isActive && { color: "#999" }]}>
                  {customAmenity}
                </Text>
                <View style={styles.customBadge}>
                  <Text style={styles.customBadgeText}>Custom</Text>
                </View>
              </View>
              <View style={styles.amenityActions}>
                <Switch value={isActive} onValueChange={() => toggleAmenity(customAmenity)} trackColor={{ false: "#E0E0E0", true: "#2196F3" }} />
                <Pressable onPress={() => removeCustomAmenity(customAmenity)} style={styles.deleteButton} hitSlop={8}>
                  <Ionicons name="trash-outline" size={22} color="#E53935" />
                </Pressable>
              </View>
            </View>
          );
        })}

        {/* AGGIUNGI */}
        <Pressable style={styles.addCustomButton} onPress={() => setShowCustomModal(true)}>
          <Ionicons name="add-circle-outline" size={20} color="#2196F3" />
          <Text style={styles.addCustomButtonText}>Aggiungi servizio personalizzato</Text>
        </Pressable>

        <Pressable style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={handleSave} disabled={saving}>
          <Ionicons name="checkmark-circle" size={24} color="white" />
          <Text style={styles.saveButtonText}>{saving ? "Salvataggio..." : "Salva modifiche"}</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ✅ MODAL CUSTOM AMENITY */}
      <Modal visible={showCustomModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => {
            setShowCustomModal(false);
            setCustomAmenityInput("");
          }} />
          
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuovo servizio</Text>
              <Pressable onPress={() => {
                setShowCustomModal(false);
                setCustomAmenityInput("");
              }}>
                <Ionicons name="close" size={28} color="#333" />
              </Pressable>
            </View>

            <TextInput
              style={styles.modalInput}
              value={customAmenityInput}
              onChangeText={setCustomAmenityInput}
              placeholder="Es: Campo da calcetto, Spazio bimbi..."
              placeholderTextColor="#999"
              autoFocus
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowCustomModal(false);
                  setCustomAmenityInput("");
                }}
              >
                <Text style={styles.modalCancelText}>Annulla</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalAddButton,
                  !customAmenityInput.trim() && styles.modalAddButtonDisabled,
                ]}
                onPress={addCustomAmenity}
                disabled={!customAmenityInput.trim()}
              >
                <Text style={styles.modalAddText}>Aggiungi</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}