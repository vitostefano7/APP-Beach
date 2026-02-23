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
import { resolveImageUrl } from "../../../utils/imageUtils";
import { searchAddress } from "./CreaStruttura/utils/CreaStruttura.utils";
import AmenityIcon from "../../../components/AmenityIcon";

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
  const { strutturaId, scrollTo } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [isCostSplittingEnabled, setIsCostSplittingEnabled] = useState(false);

  // Address autocomplete states
  const [addressInput, setAddressInput] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [numeroCivico, setNumeroCivico] = useState("");
  const [updatingCoordinates, setUpdatingCoordinates] = useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const [openingHours, setOpeningHours] = useState<OpeningHours>(DEFAULT_OPENING_HOURS);
  const [expandedDays, setExpandedDays] = useState<{ [key: string]: boolean }>({});
  
  const [amenities, setAmenities] = useState<string[]>([]);
  const [customAmenities, setCustomAmenities] = useState<{name: string, icon: string}[]>([]);
  
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showToggleActiveModal, setShowToggleActiveModal] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState<string>('star');
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);
  const [alertModal, setAlertModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons?: Array<{
      text: string;
      style?: 'default' | 'cancel' | 'destructive';
      onPress?: () => void;
    }>;
    icon?: string;
  }>({
    visible: false,
    title: '',
    message: '',
    buttons: [{ text: 'OK', onPress: () => setAlertModal(prev => ({ ...prev, visible: false })) }]
  });
  
  // Lista icone disponibili per servizi personalizzati (solo extra, senza duplicare le predefinite)
  const predefinedAmenityIconNames = new Set(
    AVAILABLE_AMENITIES.map((amenity) =>
      typeof amenity.icon === "string" ? amenity.icon : amenity.icon.name
    )
  );

  const availableIcons = [
    { name: 'star', label: 'Generico' },
    { name: 'sparkles', label: 'Premium' },
    { name: 'leaf', label: 'Eco' },
    { name: 'paw', label: 'Pet' },
    { name: 'game-controller', label: 'Gaming' },
    { name: 'musical-notes', label: 'Musica' },
    { name: 'videocam', label: 'Video' },
    { name: 'camera', label: 'Foto' },
    { name: 'book', label: 'Lettura' },
    { name: 'briefcase', label: 'Business' },
    { name: 'bed', label: 'Relax' },
    { name: 'key', label: 'Accesso' },
    { name: 'shield-checkmark', label: 'Sicurezza' },
    { name: 'construct', label: 'Tecnico' },
  ].filter((icon) => !predefinedAmenityIconNames.has(icon.name));
  
  const [customAmenityInput, setCustomAmenityInput] = useState("");
  const scrollViewRef = React.useRef<ScrollView>(null);
  const openingHoursSectionY = React.useRef(0);

  const loadStruttura = async () => {
    try {
      const response = await fetch(`${API_URL}/strutture/${strutturaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Struttura non trovata");

      const data = await response.json();

      setName(data.name || "");
      setDescription(data.description || "");
      setPhone(data.phone || data.phoneNumber || "");
      setAddress(data.location?.address || "");
      setCity(data.location?.city || "");
      setIsActive(data.isActive !== false);
      setImages(data.images || []);
      setIsCostSplittingEnabled(!!data.isCostSplittingEnabled);

      // Initialize address autocomplete states
      const fullAddress = data.location?.address || "";
      const savedNumeroCivico = data.location?.numeroCivico || "";

      // Se abbiamo un numero civico salvato separatamente, usalo
      // Altrimenti, prova ad estrarlo dall'indirizzo completo
      let finalNumeroCivico = savedNumeroCivico;
      let addressWithoutNumero = fullAddress;

      if (!savedNumeroCivico && fullAddress) {
        // Estrai numero civico dall'indirizzo completo se non è salvato separatamente
        const numeroMatch = fullAddress.match(/,\s*(\d+[a-zA-Z]?)\s*$/);
        if (numeroMatch) {
          finalNumeroCivico = numeroMatch[1];
          addressWithoutNumero = fullAddress.replace(/,\s*\d+[a-zA-Z]?\s*$/, '').trim();
        }
      }

      setAddress(addressWithoutNumero);
      setAddressInput(addressWithoutNumero);
      setSelectedAddress(addressWithoutNumero);
      setLat(data.location?.lat?.toString() || "");
      setLng(data.location?.lng?.toString() || "");
      setNumeroCivico(finalNumeroCivico);

      if (data.openingHours && Object.keys(data.openingHours).length > 0) {
        setOpeningHours(data.openingHours);
      }

      if (data.amenities) {
        if (Array.isArray(data.amenities)) {
          setAmenities(data.amenities);
          const customs = data.amenities.filter((a: string) => isCustomAmenity(a)).map(name => ({ name, icon: 'star' }));
          setCustomAmenities(customs);
        } else {
          const activeAmenities = Object.entries(data.amenities)
            .filter(([_, value]) => value === true)
            .map(([key]) => key);
          setAmenities(activeAmenities);
          const customs = activeAmenities.filter((a: string) => isCustomAmenity(a)).map(name => ({ name, icon: 'star' }));
          setCustomAmenities(customs);
        }
      }
    } catch (error) {
      console.error("❌ Errore caricamento struttura:", error);
      showAlert("Errore", "Impossibile caricare la struttura", [
        { text: "OK", onPress: () => navigation.goBack() },
      ], "alert-circle");
    } finally {
      setLoading(false);
    }
  };

  // Address autocomplete functions
  const handleAddressChange = (text: string) => {
    setAddressInput(text);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      if (text.length < 3) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setLoadingSuggestions(true);
      try {
        const res = await searchAddress(text);
        setSuggestions(res);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 700);
  };

  const selectPlace = (place: any) => {
    setShowSuggestions(false);

    let addressWithoutNumber = place.display_name;
    let extractedNumeroCivico = "";

    // Controlla se l'indirizzo contiene un numero civico
    const numeroMatch = addressWithoutNumber.match(/(\d+[a-zA-Z]?)\s*$/);
    if (numeroMatch) {
      extractedNumeroCivico = numeroMatch[1];
      // Rimuovi il numero civico dall'indirizzo
      addressWithoutNumber = addressWithoutNumber.replace(/\s+\d+[a-zA-Z]?\s*$/, '').trim();
      addressWithoutNumber = addressWithoutNumber.replace(/,\s*\d+[a-zA-Z]?\s*$/, '').trim();
    }

    setAddressInput(addressWithoutNumber);
    setSelectedAddress(addressWithoutNumber);
    setAddress(addressWithoutNumber);
    setLat(place.lat);
    setLng(place.lon);

    // Se è stato estratto un numero civico, inseriscilo automaticamente
    if (extractedNumeroCivico) {
      setNumeroCivico(extractedNumeroCivico);
    }

    const city =
      place.address?.city ||
      place.address?.town ||
      place.address?.village ||
      place.address?.municipality ||
      "";

    setCity(city);
  };

  // Funzione per aggiornare le coordinate quando cambia il numero civico
  const updateCoordinatesWithNumeroCivico = React.useCallback(async (fullAddress: string) => {
    if (!fullAddress.trim()) return;

    setUpdatingCoordinates(true);
    try {
      const results = await searchAddress(fullAddress);
      if (results && results.length > 0) {
        const bestMatch = results[0];
        setLat(bestMatch.lat);
        setLng(bestMatch.lon);
        console.log("📍 Coordinate aggiornate per indirizzo completo:", fullAddress);
        console.log("📍 Nuove coordinate:", bestMatch.lat, bestMatch.lon);
      } else {
        console.log("⚠️ Nessun risultato trovato per indirizzo con numero civico, mantengo coordinate originali");
      }
    } catch (error) {
      console.log("⚠️ Errore nell'aggiornamento coordinate, mantengo quelle originali");
    } finally {
      setUpdatingCoordinates(false);
    }
  }, []);

  // Effetto per aggiornare le coordinate quando cambia il numero civico
  React.useEffect(() => {
    if (selectedAddress && numeroCivico.trim()) {
      const fullAddress = `${selectedAddress}, ${numeroCivico}`;
      // Debounce per evitare troppe chiamate API
      const timeoutId = setTimeout(() => {
        updateCoordinatesWithNumeroCivico(fullAddress);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [selectedAddress, numeroCivico, updateCoordinatesWithNumeroCivico]);

  // ✅ Caricamento iniziale
  useEffect(() => {
    loadStruttura();
  }, []);

  useEffect(() => {
    if (loading || scrollTo !== "openingHours") return;

    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: Math.max(openingHoursSectionY.current - 12, 0),
        animated: true,
      });
      navigation.setParams({ scrollTo: undefined });
    }, 200);

    return () => clearTimeout(timer);
  }, [loading, scrollTo, navigation]);

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
      showAlert("Errore", "Inserisci il nome del servizio", undefined, "alert-circle");
      return;
    }

    if (customAmenities.some(ca => ca.name === trimmed)) {
      showAlert("Attenzione", "Questo servizio è già presente", undefined, "alert-circle");
      return;
    }

    const newCustomAmenity = { name: trimmed, icon: selectedIcon };
    setCustomAmenities((prev) => [...prev, newCustomAmenity]);
    setAmenities((prev) => [...prev, trimmed]);
    setCustomAmenityInput("");
    setSelectedIcon('star'); // reset to default
    setShowCustomModal(false);
  };

  const removeCustomAmenity = (amenity: {name: string, icon: string}) => {
    showAlert("Rimuovi servizio", `Vuoi rimuovere definitivamente "${amenity.name}"?`, [
      { text: "Annulla", style: "cancel" },
      {
        text: "Rimuovi",
        style: "destructive",
        onPress: () => {
          setCustomAmenities((prev) => prev.filter((a) => a.name !== amenity.name));
          setAmenities((prev) => prev.filter((a) => a !== amenity.name));
        },
      },
    ], "help-circle");
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
    // Crea una versione temporanea degli orari con la modifica
    const tempHours = { ...openingHours };
    const dayHours = tempHours[day];
    const updatedSlots = [...dayHours.slots];
    updatedSlots[slotIndex] = { ...updatedSlots[slotIndex], [type]: value };
    tempHours[day] = { ...dayHours, slots: updatedSlots };

    // Valida che non ci siano sovrapposizioni
    const validation = validateOpeningHours(tempHours);
    if (!validation.isValid) {
      showAlert("Errore", validation.error!, undefined, "alert-circle");
      return;
    }

    // Se valido, applica la modifica
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
    // Crea una versione temporanea degli orari con il nuovo slot
    const tempHours = { ...openingHours };
    const dayHours = tempHours[day];
    tempHours[day] = {
      ...dayHours,
      slots: [...dayHours.slots, { open: "09:00", close: "22:00" }],
    };

    // Valida che non ci siano sovrapposizioni
    const validation = validateOpeningHours(tempHours);
    if (!validation.isValid) {
      showAlert("Errore", `Impossibile aggiungere una nuova fascia: ${validation.error}`, undefined, "alert-circle");
      return;
    }

    // Se valido, applica la modifica
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
      setShowToggleActiveModal(true);
    } else {
      setIsActive(true);
    }
  };

  const showAlert = (
    title: string,
    message: string,
    buttons?: Array<{
      text: string;
      style?: 'default' | 'cancel' | 'destructive';
      onPress?: () => void;
    }>,
    icon?: string
  ) => {
    setAlertModal({
      visible: true,
      title,
      message,
      buttons: buttons || [{ text: 'OK', onPress: () => setAlertModal(prev => ({ ...prev, visible: false })) }],
      icon
    });
  };

  const validateOpeningHours = (hours: OpeningHours): { isValid: boolean; error?: string } => {
    for (const day of Object.keys(hours)) {
      const dayData = hours[day];
      if (dayData.closed) continue;

      const slots = dayData.slots;
      if (slots.length <= 1) continue;

      // Ordina gli slots per ora di apertura
      const sortedSlots = [...slots].sort((a, b) => {
        const timeA = a.open.split(':').map(Number);
        const timeB = b.open.split(':').map(Number);
        return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
      });

      // Controlla sovrapposizioni
      for (let i = 0; i < sortedSlots.length - 1; i++) {
        const current = sortedSlots[i];
        const next = sortedSlots[i + 1];

        const currentClose = current.close.split(':').map(Number);
        const nextOpen = next.open.split(':').map(Number);

        const currentCloseMinutes = currentClose[0] * 60 + currentClose[1];
        const nextOpenMinutes = nextOpen[0] * 60 + nextOpen[1];

        if (currentCloseMinutes > nextOpenMinutes) {
          const dayName = DAYS.find(d => d.key === day)?.label || day;
          return {
            isValid: false,
            error: `${dayName}: La fascia ${current.open}-${current.close} si sovrappone con ${next.open}-${next.close}`
          };
        }
      }
    }
    return { isValid: true };
  };

  const performSave = async (forceUpdate = false) => {
    if (!name.trim()) {
      showAlert("Errore", "Il nome è obbligatorio", undefined, "alert-circle");
      return;
    }
    if (!selectedAddress || !city || !lat || !lng) {
      showAlert("Errore", "Seleziona un indirizzo valido dalla lista dei suggerimenti", undefined, "alert-circle");
      return;
    }

    // Valida che non ci siano sovrapposizioni negli orari
    const hoursValidation = validateOpeningHours(openingHours);
    if (!hoursValidation.isValid) {
      showAlert("Errore negli orari", hoursValidation.error!, undefined, "alert-circle");
      return;
    }

    // Controlla che non ci siano due numeri civici
    const hasNumeroInAddress = /\d+[a-zA-Z]?\s*$/.test(selectedAddress.trim());
    const hasNumeroCivicoInput = numeroCivico.trim().length > 0;

    if (hasNumeroInAddress && hasNumeroCivicoInput) {
      showAlert(
        "Errore",
        "L'indirizzo selezionato contiene già un numero civico. Rimuovi il numero civico dal campo separato o seleziona un indirizzo senza numero civico.",
        undefined,
        "alert-circle"
      );
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
      const fullAddress = numeroCivico.trim()
        ? `${selectedAddress}, ${numeroCivico}`
        : selectedAddress;

      const body = {
        name,
        description,
        phone: phone.trim(),
        location: {
          address: fullAddress,
          city,
          numeroCivico: numeroCivico.trim(),
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
        amenities,
        openingHours,
        isActive,
        forceUpdate,
        isCostSplittingEnabled,
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
        
        showAlert(
          "⚠️ Attenzione",
          `Modificando gli orari ${data.affectedBookings} prenotazione${data.affectedBookings > 1 ? 'i' : ''} future ${data.affectedBookings > 1 ? 'verranno cancellate' : 'verrà cancellata'}.\n\nVuoi continuare comunque?`,
          [
            { text: "Annulla", style: "cancel" },
            { 
              text: "Continua", 
              style: "destructive",
              onPress: () => performSave(true) // Richiama con forceUpdate=true
            },
          ],
          "alert-triangle"
        );
        setSaving(false);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Success:", data);
        showAlert("Successo", "Struttura aggiornata!", [
          { text: "OK", onPress: () => navigation.goBack() },
        ], "checkmark-circle");
      } else {
        const error = await response.json();
        console.error("❌ Error response:", error);
        showAlert("Errore", error.message || "Impossibile aggiornare la struttura", undefined, "alert-circle");
      }
    } catch (error) {
      console.error("❌ Fetch error:", error);
      showAlert("Errore", "Errore di connessione: " + (error as Error).message, undefined, "alert-circle");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    setShowSaveConfirmModal(true);
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
          onPress={handleSave}
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
        ref={scrollViewRef}
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
              trackColor={{ false: "#F44336", true: "#4CAF50" }}
              thumbColor="white"
            />
          </View>
        </Pressable>

        {/* SPLIT PRICE TOGGLE */}
        <Pressable style={styles.statusCard}>
          <View style={styles.statusContent}>
            <View style={styles.statusIconContainer}>
              <Ionicons name="people" size={28} color="#2196F3" />
            </View>
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>Divisione prezzo per persona</Text>
              <Text style={styles.statusSubtitle}>Se attivo, i giocatori vedranno il prezzo per persona</Text>
            </View>
            <Switch
              value={isCostSplittingEnabled}
              onValueChange={() => setIsCostSplittingEnabled((v) => !v)}
              trackColor={{ false: "#F44336", true: "#2196F3" }}
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
                      source={{ uri: resolveImageUrl(img) }}
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

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Numero di telefono</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Es: +39 333 1234567"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Indirizzo</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={addressInput}
                onChangeText={handleAddressChange}
                placeholder="Cerca via/piazza (senza numero civico)..."
                placeholderTextColor="#999"
              />
              {loadingSuggestions && (
                <View style={styles.inputIcon}>
                  <ActivityIndicator size="small" color="#2196F3" />
                </View>
              )}
            </View>

            {showSuggestions && (
              <View style={styles.suggestionsContainer}>
                {suggestions.map((suggestion, index) => (
                  <Pressable
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => selectPlace(suggestion)}
                  >
                    <Ionicons name="location" size={16} color="#666" />
                    <Text style={styles.suggestionText} numberOfLines={2}>
                      {suggestion.display_name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <Text style={styles.inputHint}>
            💡 Cerca prima la via/piazza. Se l'indirizzo include un numero civico, verrà automaticamente separato.
            Le coordinate GPS verranno aggiornate automaticamente per maggiore precisione.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Numero civico</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, !selectedAddress && styles.inputDisabled]}
                value={numeroCivico}
                onChangeText={setNumeroCivico}
                placeholder={selectedAddress ? "Es: 15, 25A, 10/B... (auto-riempito se presente)" : "Seleziona prima un indirizzo"}
                placeholderTextColor="#999"
                keyboardType="default"
                editable={!!selectedAddress}
              />
              {updatingCoordinates && (
                <View style={styles.inputIcon}>
                  <ActivityIndicator size="small" color="#2196F3" />
                </View>
              )}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Città</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={city}
              editable={false}
              placeholder="Rilevata automaticamente"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* ORARI */}
        <View
          style={styles.card}
          onLayout={(event) => {
            openingHoursSectionY.current = event.nativeEvent.layout.y;
          }}
        >
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
                  <AmenityIcon icon={icon} size={18} color={isSelected ? "#2196F3" : "#999"} />
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
            const isSelected = amenities.includes(customAmenity.name);
            return (
              <View key={customAmenity.name} style={styles.customAmenityCard}>
                <Pressable 
                  style={[styles.customAmenityContent, isSelected && styles.customAmenityContentActive]}
                  onPress={() => toggleAmenity(customAmenity.name)}
                >
                  <View style={[styles.customIcon, isSelected && styles.customIconActive]}>
                    <Ionicons name={customAmenity.icon as any} size={16} color={isSelected ? "#FF9800" : "#999"} />
                  </View>
                  <Text style={[styles.customAmenityText, isSelected && styles.customAmenityTextActive]}>
                    {customAmenity.name}
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

            <Text style={styles.iconSelectionTitle}>Scegli un'icona</Text>
            <View style={styles.iconGrid}>
              {availableIcons.map((icon) => (
                <Pressable
                  key={icon.name}
                  style={[
                    styles.iconOption,
                    selectedIcon === icon.name && styles.iconOptionSelected,
                  ]}
                  onPress={() => setSelectedIcon(icon.name)}
                >
                  <View style={{ alignItems: "center", gap: 4 }}>
                    <Ionicons
                      name={icon.name as any}
                      size={24}
                      color={selectedIcon === icon.name ? "#2196F3" : "#666"}
                    />
                    <Text
                      numberOfLines={2}
                      style={{
                        fontSize: 10,
                        color: selectedIcon === icon.name ? "#2196F3" : "#666",
                        fontWeight: "600",
                        textAlign: "center",
                        maxWidth: 56,
                        lineHeight: 12,
                      }}
                    >
                      {icon.label}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>

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

      {/* SAVE CONFIRM MODAL */}
      <Modal visible={showSaveConfirmModal} animationType="fade" transparent>
        <View style={styles.centeredModalOverlay}>
          <View style={styles.centeredModalContent}>
            <View style={styles.centeredModalHeader}>
              <View style={styles.centeredModalIconContainer}>
                <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
              </View>
              <Text style={styles.centeredModalTitle}>Conferma Aggiornamento</Text>
              <Text style={styles.centeredModalSubtitle}>
                Vuoi salvare le modifiche alla struttura?
              </Text>
            </View>

            <View style={styles.centeredModalActions}>
              <Pressable
                style={styles.centeredModalCancelButton}
                onPress={() => setShowSaveConfirmModal(false)}
              >
                <Text style={styles.centeredModalCancelText}>Annulla</Text>
              </Pressable>
              <Pressable
                style={styles.centeredModalConfirmButton}
                onPress={() => {
                  setShowSaveConfirmModal(false);
                  performSave(false);
                }}
              >
                <Ionicons name="checkmark" size={20} color="white" />
                <Text style={styles.centeredModalConfirmText}>Salva</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* GENERIC ALERT MODAL */}
      <Modal visible={alertModal.visible} animationType="fade" transparent>
        <View style={styles.centeredModalOverlay}>
          <View style={styles.centeredModalContent}>
            <View style={styles.centeredModalHeader}>
              <View style={styles.centeredModalIconContainer}>
                <Ionicons name={alertModal.icon as any || "information-circle"} size={32} color="#2196F3" />
              </View>
              <Text style={styles.centeredModalTitle}>{alertModal.title}</Text>
              <Text style={styles.centeredModalSubtitle}>{alertModal.message}</Text>
            </View>

            <View style={styles.centeredModalActions}>
              {alertModal.buttons?.map((button, index) => (
                <Pressable
                  key={index}
                  style={[
                    button.style === 'destructive' ? styles.centeredModalConfirmButton :
                    button.style === 'cancel' ? styles.centeredModalCancelButton :
                    styles.centeredModalConfirmButton,
                    button.style === 'destructive' && { backgroundColor: '#F44336' }
                  ]}
                  onPress={() => {
                    setAlertModal(prev => ({ ...prev, visible: false }));
                    button.onPress?.();
                  }}
                >
                  {button.style === 'destructive' && (
                    <Ionicons name="trash" size={20} color="white" />
                  )}
                  {button.style === 'cancel' && (
                    <Ionicons name="close" size={20} color="white" />
                  )}
                  {!button.style && (
                    <Ionicons name="checkmark" size={20} color="white" />
                  )}
                  <Text style={[
                    styles.centeredModalConfirmText,
                    button.style === 'cancel' && { color: '#666' }
                  ]}>
                    {button.text}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* TOGGLE ACTIVE MODAL */}
      <Modal visible={showToggleActiveModal} animationType="fade" transparent>
        <View style={styles.centeredModalOverlay}>
          <View style={styles.centeredModalContent}>
            <View style={styles.centeredModalHeader}>
              <View style={styles.centeredModalIconContainer}>
                <Ionicons name="warning" size={32} color="#FF9800" />
              </View>
              <Text style={styles.centeredModalTitle}>Disattiva struttura</Text>
              <Text style={styles.centeredModalSubtitle}>
                La struttura non sarà più visibile agli utenti e non potrà essere prenotata.
                Continuare con la disattivazione?
              </Text>
            </View>

            <View style={styles.centeredModalActions}>
              <Pressable
                style={styles.centeredModalCancelButton}
                onPress={() => setShowToggleActiveModal(false)}
              >
                <Text style={styles.centeredModalCancelText}>Annulla</Text>
              </Pressable>
              <Pressable
                style={styles.centeredModalConfirmButton}
                onPress={() => {
                  setIsActive(false);
                  setShowToggleActiveModal(false);
                }}
              >
                <Ionicons name="close-circle" size={20} color="white" />
                <Text style={styles.centeredModalConfirmText}>Disattiva</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}