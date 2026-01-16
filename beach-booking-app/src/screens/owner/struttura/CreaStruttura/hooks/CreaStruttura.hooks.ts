import { useState, useRef } from "react";
import { Alert } from "react-native";
import {
  Campo,
  OpeningHours,
  PricingRules,
} from "../types/CreaStruttura.types";

/* =========================
   CREA STRUTTURA – CORE
========================= */

export function useCreaStruttura() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  /* =====================
     STEP 1 – INFO
  ===================== */
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [addressInput, setAddressInput] = useState("");
  const [selectedAddress, setSelectedAddress] = useState("");
  const [city, setCity] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [isCostSplittingEnabled, setIsCostSplittingEnabled] = useState(false);

  /* =====================
     AUTOCOMPLETE
  ===================== */
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  /* =====================
     STEP 2 – IMMAGINI
  ===================== */
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  /* =====================
     STEP 3 – ORARI
  ===================== */
  const [openingHours, setOpeningHours] = useState<OpeningHours>({
    monday: { closed: false, slots: [{ open: "09:00", close: "22:00" }] },
    tuesday: { closed: false, slots: [{ open: "09:00", close: "22:00" }] },
    wednesday: { closed: false, slots: [{ open: "09:00", close: "22:00" }] },
    thursday: { closed: false, slots: [{ open: "09:00", close: "22:00" }] },
    friday: { closed: false, slots: [{ open: "09:00", close: "22:00" }] },
    saturday: { closed: false, slots: [{ open: "09:00", close: "22:00" }] },
    sunday: { closed: false, slots: [{ open: "09:00", close: "22:00" }] },
  });

  /* =====================
     STEP 4 – SERVIZI
  ===================== */
  const [amenities, setAmenities] = useState<string[]>([]);
  const [customAmenities, setCustomAmenities] = useState<string[]>([]);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customAmenityInput, setCustomAmenityInput] = useState("");

  /* =====================
     STEP 5 – CAMPI
  ===================== */
  const [campi, setCampi] = useState<Campo[]>([]);

  /* =====================
     PRICING MODAL
  ===================== */
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [editingCampoId, setEditingCampoId] = useState<string | null>(null);
  const [tempPricing, setTempPricing] = useState<PricingRules | null>(null);
  const [showDaysModal, setShowDaysModal] = useState(false);
  const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<"date" | "period-start" | "period-end">("date");
  const [editingDateIndex, setEditingDateIndex] = useState<number | null>(null);
  const [editingPeriodIndex, setEditingPeriodIndex] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  /* =====================
     HANDLERS ORARI
  ===================== */

  const toggleDayClosed = (day: string) => {
    setOpeningHours(prev => ({
      ...prev,
      [day]: { ...prev[day], closed: !prev[day].closed },
    }));
  };

  const updateTimeSlot = (day: string, index: number, field: "open" | "close", value: string) => {
    setOpeningHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.map((slot, i) => 
          i === index ? { ...slot, [field]: value } : slot
        )
      }
    }));
  };

  const addTimeSlot = (day: string) => {
    setOpeningHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: [...prev[day].slots, { open: "09:00", close: "22:00" }]
      }
    }));
  };

  const removeTimeSlot = (day: string, index: number) => {
    if (openingHours[day].slots.length <= 1) return;
    setOpeningHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.filter((_, i) => i !== index)
      }
    }));
  };

  const updateOpeningHour = (day: string, type: "open" | "close", value: string) => {
    // Legacy function - now updates first slot
    updateTimeSlot(day, 0, type, value);
  };

  /* =====================
     HANDLERS CAMPI
  ===================== */

  const addCampo = () => {
    setCampi((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: "",
        sport: "",
        surface: "",
        maxPlayers: 4,
        indoor: false,
        pricingRules: {
          mode: "flat",
          flatPrices: { oneHour: 20, oneHourHalf: 28 },
          basePrices: { oneHour: 20, oneHourHalf: 28 },
          timeSlotPricing: { enabled: false, slots: [] },
          dateOverrides: { enabled: false, dates: [] },
          periodOverrides: { enabled: false, periods: [] },
        },
      },
    ]);
  };

  const updateCampo = (id: string, field: keyof Campo, value: any) => {
    setCampi((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;

        const updated = { ...c, [field]: value };

        if (field === "sport") {
          if (value === "beach_volley") updated.surface = "sand";
          if (value === "volley") updated.surface = updated.indoor ? "pvc" : "cement";
        }

        if (field === "indoor" && c.sport === "volley") {
          updated.surface = value ? "pvc" : "cement";
        }

        return updated;
      })
    );
  };

  const removeCampo = (id: string) => {
    Alert.alert("Elimina campo", "Sei sicuro?", [
      { text: "Annulla", style: "cancel" },
      {
        text: "Elimina",
        style: "destructive",
        onPress: () =>
          setCampi((prev) => prev.filter((c) => c.id !== id)),
      },
    ]);
  };

  /* =====================
     PRICING - NAVIGATION
  ===================== */
  // Note: Pricing configuration is handled by a separate screen
  // openPricingModal will be handled in the component with navigation

  const openPricingModal = (campoId: string) => {
    const campo = campi.find((c) => c.id === campoId);
    if (!campo) return;

    setEditingCampoId(campoId);
    setTempPricing({
      ...campo.pricingRules,
      dateOverrides: campo.pricingRules.dateOverrides ?? {
        enabled: false,
        dates: [],
      },
      periodOverrides: campo.pricingRules.periodOverrides ?? {
        enabled: false,
        periods: [],
      },
    });
    setShowPricingModal(true);
  };

  const closePricingModal = () => {
    setShowPricingModal(false);
    setEditingCampoId(null);
    setTempPricing(null);
  };

  const savePricing = () => {
    if (!editingCampoId || !tempPricing) return;

    setCampi((prev) =>
      prev.map((c) =>
        c.id === editingCampoId
          ? { ...c, pricingRules: tempPricing }
          : c
      )
    );

    closePricingModal();
  };

  return {
    /* state */
    currentStep,
    loading,
    name,
    description,
    addressInput,
    selectedAddress,
    city,
    lat,
    lng,
    suggestions,
    showSuggestions,
    loadingSuggestions,
    selectedImages,
    uploadingImages,
    openingHours,
    amenities,
    customAmenities,
    showCustomModal,
    customAmenityInput,
    campi,
    showPricingModal,
    tempPricing,
    editingCampoId,
    showDaysModal,
    editingSlotIndex,
    showDatePicker,
    datePickerMode,
    editingDateIndex,
    editingPeriodIndex,
    selectedMonth,

    /* setters */
    setCurrentStep,
    setLoading,
    setName,
    setDescription,
    setAddressInput,
    setSelectedAddress,
    setCity,
    setLat,
    setLng,
    setSuggestions,
    setShowSuggestions,
    setLoadingSuggestions,
    setSelectedImages,
    setUploadingImages,
    setOpeningHours,
    setAmenities,
    setCustomAmenities,
    setShowCustomModal,
    setCustomAmenityInput,
    setCampi,
    setShowPricingModal,
    setTempPricing,
    setShowDaysModal,
    setEditingSlotIndex,
    setShowDatePicker,
    setDatePickerMode,
    setEditingDateIndex,
    setEditingPeriodIndex,
    setSelectedMonth,
    setIsCostSplittingEnabled,
    isCostSplittingEnabled,

    /* handlers orari */
    toggleDayClosed,
    updateOpeningHour,
    updateTimeSlot,
    addTimeSlot,
    removeTimeSlot,

    /* handlers campi */
    addCampo,
    updateCampo,
    removeCampo,
    openPricingModal,
    closePricingModal,
    savePricing,
    
    /* ref */
    timeoutRef,
  };
}