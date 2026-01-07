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
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useContext, useState, useEffect, useCallback } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
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
  const [images, setImages] = useState<string[]>([]);

  const [openingHours, setOpeningHours] = useState<OpeningHours>(DEFAULT_OPENING_HOURS);
  const [expandedDays, setExpandedDays] = useState<{ [key: string]: boolean }>({});
  
  const [amenities, setAmenities] = useState<string[]>([]);
  const [customAmenities, setCustomAmenities] = useState<string[]>([]);
  
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customAmenityInput, setCustomAmenityInput] = useState("");

  const loadStruttura = async () => {
    try {
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
      setImages(data.images || []);

      if (data.openingHours && Object.keys(data.openingHours).length > 0) {
        setOpeningHours(data.openingHours);
      }

      if (data.amenities) {
        if (Array.isArray(data.amenities)) {
          setAmenities(data.amenities);
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

  // ✅ Caricamento iniziale
  useEffect(() => {
    loadStruttura();
  }, []);

  // ✅ Ricarica quando torni dalla schermata (senza loop)
  useFocusEffect(
    useCallback(() => {
      // Ricarica solo se non è il primo render
      loadStruttura();
    }, [strutturaId])
  );

  const toggleAmenity = (key: string) => {
    setAmenities((prev) =>
      prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]
    );
  };

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

    setCustomAmenities((prev) => [...prev, trimmed]);
    setAmenities((prev) => [...prev, trimmed]);
    setCustomAmenityInput("");
    setShowCustomModal(false);
  };

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

  const toggleDayExpanded = (day: string) => {
    setExpandedDays((prev) => ({
      ...prev,
      [day]: !prev[day],
    }));
  };

  const toggleDayClosed = (day: string) => {
    setOpeningHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], closed: !prev[day].closed },
    }));
  };

  const updateTimeSlot = (day: string, slotIndex: number, type: "open" | "close", value: string) => {
    setOpeningHours((prev) => {
      const dayHours = prev[day];
      const updatedSlots = [...dayHours.slots];
      updatedSlots[slotIndex] = { ...updatedSlots[slotIndex], [type]: value };
      return {
        ...prev,
        [day]: { ...dayHours, slots: updatedSlots },
      };
    });
  };

  const addTimeSlot = (day: string) => {
    setOpeningHours((prev) => {
      const dayHours = prev[day];
      return {
        ...prev,
        [day]: {
          ...dayHours,
          slots: [...dayHours.slots, { open: "09:00", close: "22:00" }],
        },
      };
    });
  };

  const removeTimeSlot = (day: string, slotIndex: number) => {
    setOpeningHours((prev) => {
      const dayHours = prev[day];
      if (dayHours.slots.length <= 1) return prev;
      const updatedSlots = dayHours.slots.filter((_, i) => i !== slotIndex);
      return {
        ...prev,
        [day]: { ...dayHours, slots: updatedSlots },
      };
    });
  };

  const handleToggleActive = () => {
    if (isActive) {
      Alert.alert(
        "Disattiva struttura",
        "La struttura non sarà più visibile agli utenti. Continuare?",
        [
          { text: "Annulla", style: "cancel" },
          { text: "Disattiva", style: "destructive", onPress: () => setIsActive(false) },
        ]
      );
    } else {
      setIsActive(true);
    }
  };

  const handleSave = async (forceUpdate = false) => {
    if (!name.trim()) {
      Alert.alert("Errore", "Il nome è obbligatorio");
      return;
    }

    console.log("💾 === SAVING STRUTTURA ===");
    console.log("📋 Name:", name);
    console.log("📝 Description:", description);
    console.log("🎯 Amenities:", amenities);
    console.log("🕒 OpeningHours:");
    console.log(JSON.stringify(openingHours, null, 2));
    console.log("✅ IsActive:", isActive);
    console.log("🔄 ForceUpdate:", forceUpdate);

    setSaving(true);

    try {
      const body = {
        name,
        description,
        amenities,
        openingHours,
        isActive,
        forceUpdate,
      };

      console.log("📤 Sending request to:", `${API_URL}/strutture/${strutturaId}`);
      console.log("📦 Body:", JSON.stringify(body, null, 2));

      const response = await fetch(`${API_URL}/strutture/${strutturaId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      console.log("📥 Response status:", response.status);

      if (response.status === 409) {
        // Conflitto: ci sono prenotazioni che verranno cancellate
        const data = await response.json();
        console.log("⚠️ Conflict detected:", data);
        
        Alert.alert(
          "⚠️ Attenzione",
          `Modificando gli orari ${data.affectedBookings} prenotazione${data.affectedBookings > 1 ? 'i' : ''} future ${data.affectedBookings > 1 ? 'verranno cancellate' : 'verrà cancellata'}.\n\nVuoi continuare comunque?`,
          [
            { text: "Annulla", style: "cancel" },
            { 
              text: "Continua", 
              style: "destructive",
              onPress: () => handleSave(true) // Richiama con forceUpdate=true
            },
          ]
        );
        setSaving(false);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Success:", data);
        Alert.alert("Successo", "Struttura aggiornata!", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        const error = await response.json();
        console.error("❌ Error response:", error);
        Alert.alert("Errore", error.message || "Impossibile aggiornare la struttura");
      }
    } catch (error) {
      console.error("❌ Fetch error:", error);
      Alert.alert("Errore", "Errore di connessione: " + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Caricamento...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </Pressable>
        <Text style={styles.headerTitle}>Modifica Struttura</Text>
        <Pressable 
          onPress={() => handleSave(false)}
          disabled={saving}
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        >
          {saving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="checkmark" size={18} color="white" />
              <Text style={styles.saveButtonText}>Salva</Text>
            </>
          )}
        </Pressable>
      </View>

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false} 
        keyboardShouldPersistTaps="handled"
      >
        {/* STATUS TOGGLE */}
        <Pressable 
          style={[styles.statusCard, !isActive && styles.statusCardInactive]}
          onPress={handleToggleActive}
        >
          <View style={styles.statusContent}>
            <View style={[styles.statusIconContainer, !isActive && styles.statusIconContainerInactive]}>
              <Ionicons 
                name={isActive ? "checkmark-circle" : "close-circle"} 
                size={28} 
                color={isActive ? "#4CAF50" : "#F44336"} 
              />
            </View>
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>
                {isActive ? "Struttura attiva" : "Struttura non attiva"}
              </Text>
              <Text style={styles.statusSubtitle}>
                {isActive ? "Visibile e prenotabile" : "Nascosta agli utenti"}
              </Text>
            </View>
            <Switch 
              value={isActive} 
              onValueChange={handleToggleActive}
              trackColor={{ false: "#E0E0E0", true: "#4CAF50" }}
              thumbColor="white"
            />
          </View>
        </Pressable>

        {/* 📸 SEZIONE IMMAGINI */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="images" size={20} color="#9C27B0" />
            <Text style={styles.cardTitle}>Immagini ({images.length}/10)</Text>
          </View>

          {images.length === 0 ? (
            <Pressable
              style={styles.emptyImagesBox}
              onPress={() => navigation.navigate("GestisciImmaginiStruttura", {
                strutturaId: strutturaId
              })}
            >
              <View style={styles.emptyImagesIconContainer}>
                <Ionicons name="images-outline" size={40} color="#9C27B0" />
              </View>
              <Text style={styles.emptyImagesTitle}>Nessuna foto</Text>
              <Text style={styles.emptyImagesSubtitle}>
                Aggiungi foto per rendere la tua struttura più attraente
              </Text>
              <View style={styles.addImagesButton}>
                <Ionicons name="add" size={18} color="white" />
                <Text style={styles.addImagesButtonText}>Aggiungi foto</Text>
              </View>
            </Pressable>
          ) : (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imagesScroll}
              >
                {images.map((img, index) => (
                  <View key={index} style={styles.imagePreviewCard}>
                    <Image
                      source={{ uri: `${API_URL}${img}` }}
                      style={styles.imagePreview}
                      resizeMode="cover"
                    />
                    {index === 0 && (
                      <View style={styles.mainImageBadge}>
                        <Ionicons name="star" size={10} color="white" />
                        <Text style={styles.mainImageBadgeText}>Principale</Text>
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>

              <Pressable
                style={styles.manageImagesButton}
                onPress={() => navigation.navigate("GestisciImmaginiStruttura", {
                  strutturaId: strutturaId
                })}
              >
                <View style={styles.manageImagesIconContainer}>
                  <Ionicons name="create" size={16} color="#9C27B0" />
                </View>
                <Text style={styles.manageImagesText}>Gestisci immagini</Text>
                <Ionicons name="arrow-forward" size={16} color="#9C27B0" />
              </Pressable>
            </>
          )}
        </View>

        {/* INFO BASE */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle" size={20} color="#2196F3" />
            <Text style={styles.cardTitle}>Informazioni base</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nome struttura</Text>
            <TextInput 
              style={styles.input} 
              value={name} 
              onChangeText={setName} 
              placeholder="Nome struttura" 
              placeholderTextColor="#999" 
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Descrizione</Text>
            <TextInput 
              style={[styles.input, styles.textArea]} 
              value={description} 
              onChangeText={setDescription} 
              placeholder="Descrizione della struttura..." 
              placeholderTextColor="#999" 
              multiline 
              numberOfLines={4} 
            />
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="location" size={16} color="#666" />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoBoxTitle}>Indirizzo (non modificabile)</Text>
              <Text style={styles.infoBoxText}>{address}, {city}</Text>
            </View>
          </View>
        </View>

        {/* ORARI */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="time" size={20} color="#FF9800" />
            <Text style={styles.cardTitle}>Orari di apertura</Text>
          </View>

          {DAYS.map(({ key, label }) => (
            <View key={key} style={styles.dayCard}>
              <Pressable onPress={() => toggleDayExpanded(key)} style={styles.dayHeader}>
                <View style={styles.dayHeaderLeft}>
                  <Ionicons 
                    name={expandedDays[key] ? "chevron-down" : "chevron-forward"} 
                    size={20} 
                    color="#666" 
                  />
                  <Text style={styles.dayLabel}>{label}</Text>
                </View>
                <View style={styles.dayStatusContainer}>
                  <Text style={[styles.dayStatus, openingHours[key]?.closed && styles.dayStatusClosed]}>
                    {openingHours[key]?.closed ? "Chiuso" : "Aperto"}
                  </Text>
                  <Switch 
                    value={!openingHours[key]?.closed} 
                    onValueChange={() => toggleDayClosed(key)}
                    trackColor={{ false: "#E0E0E0", true: "#2196F3" }}
                    thumbColor="white"
                  />
                </View>
              </Pressable>
              
              {expandedDays[key] && !openingHours[key]?.closed && (
                <>
                  {openingHours[key]?.slots.map((slot, slotIndex) => (
                    <View key={slotIndex} style={styles.slotCard}>
                      <View style={styles.slotHeader}>
                        <View style={styles.slotBadge}>
                          <Text style={styles.slotBadgeText}>Fascia {slotIndex + 1}</Text>
                        </View>
                        {openingHours[key].slots.length > 1 && (
                          <Pressable onPress={() => removeTimeSlot(key, slotIndex)} style={styles.deleteSlotBtn}>
                            <Ionicons name="trash-outline" size={18} color="#FF5252" />
                          </Pressable>
                        )}
                      </View>
                      
                      <View style={styles.timeContainer}>
                        <View style={styles.timeBox}>
                          <Ionicons name="sunny" size={14} color="#FF9800" />
                          <TextInput 
                            style={styles.timeInput} 
                            value={slot.open} 
                            onChangeText={(v) => updateTimeSlot(key, slotIndex, "open", v)} 
                            placeholder="09:00" 
                            placeholderTextColor="#999"
                            keyboardType="numbers-and-punctuation"
                          />
                        </View>
                        
                        <View style={styles.timeDivider}>
                          <View style={styles.timeDividerLine} />
                          <Ionicons name="arrow-forward" size={12} color="#2196F3" />
                          <View style={styles.timeDividerLine} />
                        </View>
                        
                        <View style={styles.timeBox}>
                          <Ionicons name="moon" size={14} color="#9C27B0" />
                          <TextInput 
                            style={styles.timeInput} 
                            value={slot.close} 
                            onChangeText={(v) => updateTimeSlot(key, slotIndex, "close", v)} 
                            placeholder="22:00" 
                            placeholderTextColor="#999"
                            keyboardType="numbers-and-punctuation"
                          />
                        </View>
                      </View>
                    </View>
                  ))}
                  
                  <Pressable onPress={() => addTimeSlot(key)} style={styles.addSlotBtn}>
                    <Ionicons name="add-circle-outline" size={20} color="#2196F3" />
                    <Text style={styles.addSlotBtnText}>Aggiungi fascia oraria</Text>
                  </Pressable>
                </>
              )}
            </View>
          ))}
        </View>

        {/* SERVIZI */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="star" size={20} color="#FFC107" />
            <Text style={styles.cardTitle}>Servizi ({amenities.length})</Text>
          </View>

          <View style={styles.amenitiesGrid}>
            {AVAILABLE_AMENITIES.map(({ key, label, icon }) => {
              const isSelected = amenities.includes(key);
              return (
                <Pressable 
                  key={key} 
                  style={[styles.amenityChip, isSelected && styles.amenityChipActive]}
                  onPress={() => toggleAmenity(key)}
                >
                  <Ionicons 
                    name={icon as any} 
                    size={18} 
                    color={isSelected ? "#2196F3" : "#999"} 
                  />
                  <Text style={[styles.amenityChipText, isSelected && styles.amenityChipTextActive]}>
                    {label}
                  </Text>
                  {isSelected && (
                    <View style={styles.amenityCheck}>
                      <Ionicons name="checkmark" size={12} color="white" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* CUSTOM AMENITIES */}
          {customAmenities.map((customAmenity) => {
            const isSelected = amenities.includes(customAmenity);
            return (
              <View key={customAmenity} style={styles.customAmenityCard}>
                <Pressable 
                  style={[styles.customAmenityContent, isSelected && styles.customAmenityContentActive]}
                  onPress={() => toggleAmenity(customAmenity)}
                >
                  <View style={[styles.customIcon, isSelected && styles.customIconActive]}>
                    <Ionicons name="star" size={16} color={isSelected ? "#FF9800" : "#999"} />
                  </View>
                  <Text style={[styles.customAmenityText, isSelected && styles.customAmenityTextActive]}>
                    {customAmenity}
                  </Text>
                  <View style={styles.customBadge}>
                    <Text style={styles.customBadgeText}>Custom</Text>
                  </View>
                  {isSelected && (
                    <View style={styles.amenityCheck}>
                      <Ionicons name="checkmark" size={12} color="white" />
                    </View>
                  )}
                </Pressable>
                <Pressable 
                  onPress={() => removeCustomAmenity(customAmenity)} 
                  style={styles.deleteCustomButton}
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" size={22} color="#F44336" />
                </Pressable>
              </View>
            );
          })}

          <Pressable style={styles.addServiceButton} onPress={() => setShowCustomModal(true)}>
            <View style={styles.addServiceIconContainer}>
              <Ionicons name="add" size={20} color="#2196F3" />
            </View>
            <Text style={styles.addServiceText}>Aggiungi servizio personalizzato</Text>
            <Ionicons name="arrow-forward" size={16} color="#2196F3" />
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL */}
      <Modal visible={showCustomModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Pressable 
            style={styles.modalBackdrop} 
            onPress={() => {
              setShowCustomModal(false);
              setCustomAmenityInput("");
            }} 
          />
          
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <Ionicons name="add-circle" size={24} color="#2196F3" />
              </View>
              <Text style={styles.modalTitle}>Nuovo servizio</Text>
              <Text style={styles.modalSubtitle}>Aggiungi un servizio personalizzato alla tua struttura</Text>
            </View>

            <TextInput
              style={styles.modalInput}
              value={customAmenityInput}
              onChangeText={setCustomAmenityInput}
              placeholder="Es: Spazio bimbi, Wi-Fi gratuito..."
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
                <Ionicons name="add" size={18} color="white" />
                <Text style={styles.modalAddText}>Aggiungi</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}