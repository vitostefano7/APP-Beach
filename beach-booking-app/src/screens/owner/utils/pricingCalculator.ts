import { ICampo, PricingRules, DurationPrice } from "../models/Campo";

/**
 * 🧮 CALCOLA IL PREZZO FINALE DELLA PRENOTAZIONE
 * 
 * @param campo - Il campo con le regole di pricing
 * @param duration - Durata in ore (1 o 1.5)
 * @param startTime - Orario di inizio (es. "18:30")
 * @returns Prezzo finale calcolato
 */
export const calculateBookingPrice = (
  campo: ICampo,
  duration: number, // 1 o 1.5
  startTime?: string
): number => {
  const pricing = campo.pricingRules;

  // 🔒 FLAT MODE - usa sempre flatPrices
  if (pricing.mode === "flat") {
    return duration === 1
      ? pricing.flatPrices.oneHour
      : pricing.flatPrices.oneHourHalf;
  }

  // 🎯 ADVANCED MODE
  // 1. Parte dai prezzi base
  let selectedPrices: DurationPrice = pricing.basePrices;

  // 2. Se c'è una fascia oraria che copre questo orario, usa quella
  if (pricing.timeSlotPricing.enabled && startTime) {
    const timeSlot = pricing.timeSlotPricing.slots.find(
      (slot) => startTime >= slot.start && startTime < slot.end
    );
    if (timeSlot) {
      selectedPrices = timeSlot.prices;
    }
  }

  // Ritorna il prezzo in base alla durata
  return duration === 1
    ? selectedPrices.oneHour
    : selectedPrices.oneHourHalf;
};

/**
 * 📊 BREAKDOWN DEL PREZZO (per mostrare all'owner/user)
 */
export const getPriceBreakdown = (
  campo: ICampo,
  duration: number,
  startTime?: string
) => {
  const pricing = campo.pricingRules;

  if (pricing.mode === "flat") {
    const price =
      duration === 1
        ? pricing.flatPrices.oneHour
        : pricing.flatPrices.oneHourHalf;

    return {
      mode: "flat",
      duration,
      total: price,
      appliedRule: "flat",
    };
  }

  // ADVANCED MODE
  let appliedRule = "base";
  let selectedPrices = pricing.basePrices;

  // Check time slot
  if (pricing.timeSlotPricing.enabled && startTime) {
    const timeSlot = pricing.timeSlotPricing.slots.find(
      (slot) => startTime >= slot.start && startTime < slot.end
    );
    if (timeSlot) {
      selectedPrices = timeSlot.prices;
      appliedRule = `timeSlot:${timeSlot.label}`;
    }
  }

  const finalPrice =
    duration === 1 ? selectedPrices.oneHour : selectedPrices.oneHourHalf;

  return {
    mode: "advanced",
    duration,
    startTime,
    appliedRule,
    total: Math.round(finalPrice * 100) / 100,
  };
};

/**
 * 📋 OTTIENI RIEPILOGO PREZZI DETTAGLIATO (per DettaglioCampoScreen)
 */
export const getDetailedPriceSummary = (campo: ICampo): {
  mode: string;
  base: { oneHour: number; oneHourHalf: number };
  timeSlots?: Array<{ label: string; times: string; oneHour: number; oneHourHalf: number }>;
} => {
  const pricing = campo.pricingRules;

  if (pricing.mode === "flat") {
    return {
      mode: "flat",
      base: {
        oneHour: pricing.flatPrices.oneHour,
        oneHourHalf: pricing.flatPrices.oneHourHalf,
      },
    };
  }

  // ADVANCED MODE
  const result: any = {
    mode: "advanced",
    base: {
      oneHour: pricing.basePrices.oneHour,
      oneHourHalf: pricing.basePrices.oneHourHalf,
    },
  };

  // Aggiungi fasce orarie se presenti
  if (pricing.timeSlotPricing.enabled && pricing.timeSlotPricing.slots.length > 0) {
    result.timeSlots = pricing.timeSlotPricing.slots.map((slot) => ({
      label: slot.label,
      times: `${slot.start}-${slot.end}`,
      oneHour: slot.prices.oneHour,
      oneHourHalf: slot.prices.oneHourHalf,
    }));
  }

  return result;
};