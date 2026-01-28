import { Campo, Slot } from "../types/field";

/* =======================
   PRICING UTILS (CLIENT-SIDE)
======================= */

/**
 * 📅 Ottieni il giorno della settimana da una data
 * 0 = domenica, 1 = lunedì, ..., 6 = sabato
 */
export function getDayOfWeek(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  const dateObj = new Date(year, month - 1, day);
  return dateObj.getDay();
}

/**
 * ⏰ Verifica se un orario è in un range
 */
export function isTimeInRange(time: string, start: string, end: string): boolean {
  const timeToMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const timeMin = timeToMinutes(time);
  const startMin = timeToMinutes(start);
  const endMin = timeToMinutes(end);

  return timeMin >= startMin && timeMin < endMin;
}

/**
 * 🎯 CALCOLO DETERMINISTICO DEL PREZZO
 * Implementa la gerarchia completa lato client
 */
export function calculatePrice(
  campo: Campo,
  duration: number,
  dateStr?: string,
  startTime?: string
): number {
  const pricing = campo.pricingRules;

  // Fallback al vecchio sistema
  if (!pricing || !pricing.mode) {
    return campo.pricePerHour * duration;
  }

  // FLAT MODE
  if (pricing.mode === "flat") {
    return duration === 1
      ? pricing.flatPrices?.oneHour ?? campo.pricePerHour
      : pricing.flatPrices?.oneHourHalf ?? campo.pricePerHour * 1.4;
  }

  // ADVANCED MODE
  let selectedPrices = pricing.basePrices;

  // LIVELLO 1A: Date Override (priorità massima)
  if (pricing.dateOverrides?.enabled && dateStr) {
    const dateOverride = pricing.dateOverrides.dates?.find(
      (d) => d.date === dateStr
    );
    if (dateOverride) {
      return duration === 1
        ? dateOverride.prices.oneHour
        : dateOverride.prices.oneHourHalf;
    }
  }

  // LIVELLO 1B: Period Override
  if (pricing.periodOverrides?.enabled && dateStr) {
    const periodOverride = pricing.periodOverrides.periods?.find(
      (p) => dateStr >= p.startDate && dateStr <= p.endDate
    );
    if (periodOverride) {
      return duration === 1
        ? periodOverride.prices.oneHour
        : periodOverride.prices.oneHourHalf;
    }
  }

  // LIVELLO 2: Time Slot con daysOfWeek
  if (
    pricing.timeSlotPricing?.enabled &&
    startTime &&
    dateStr
  ) {
    const dayOfWeek = getDayOfWeek(dateStr);

    const specificSlot = pricing.timeSlotPricing.slots?.find((slot) => {
      if (!slot.daysOfWeek || slot.daysOfWeek.length === 0) return false;
      if (!slot.daysOfWeek.includes(dayOfWeek)) return false;
      return isTimeInRange(startTime, slot.start, slot.end);
    });

    if (specificSlot) {
      return duration === 1
        ? specificSlot.prices.oneHour
        : specificSlot.prices.oneHourHalf;
    }
  }

  // LIVELLO 3: Time Slot generico
  if (pricing.timeSlotPricing?.enabled && startTime) {
    const genericSlot = pricing.timeSlotPricing.slots?.find((slot) => {
      if (slot.daysOfWeek && slot.daysOfWeek.length > 0) return false;
      return isTimeInRange(startTime, slot.start, slot.end);
    });

    if (genericSlot) {
      return duration === 1
        ? genericSlot.prices.oneHour
        : genericSlot.prices.oneHourHalf;
    }
  }

  // LIVELLO 4: Base price
  if (duration === 1) {
    return selectedPrices?.oneHour ?? campo.pricePerHour;
  }

  return selectedPrices?.oneHourHalf ?? campo.pricePerHour * 1.4;
}

/**
 * 📊 Label prezzo generico (con range se necessario)
 */
export function getPriceLabel(campo: Campo, duration: number): string {
  const pricing = campo.pricingRules;

  if (!pricing || pricing.mode === "flat") {
    const price = calculatePrice(campo, duration);
    return `€${price.toFixed(2)}`;
  }

  let minPrice = calculatePrice(campo, duration);
  let maxPrice = minPrice;

  pricing.dateOverrides?.dates?.forEach((d) => {
    const price = duration === 1 ? d.prices.oneHour : d.prices.oneHourHalf;
    minPrice = Math.min(minPrice, price);
    maxPrice = Math.max(maxPrice, price);
  });

  pricing.periodOverrides?.periods?.forEach((p) => {
    const price = duration === 1 ? p.prices.oneHour : p.prices.oneHourHalf;
    minPrice = Math.min(minPrice, price);
    maxPrice = Math.max(maxPrice, price);
  });

  pricing.timeSlotPricing?.slots?.forEach((s) => {
    const price = duration === 1 ? s.prices.oneHour : s.prices.oneHourHalf;
    minPrice = Math.min(minPrice, price);
    maxPrice = Math.max(maxPrice, price);
  });

  return minPrice !== maxPrice
    ? `da €${minPrice.toFixed(2)}`
    : `€${minPrice.toFixed(2)}`;
}

/**
 * 🎯 Prezzo per una data specifica (card durata)
 */
export function getPriceLabelForDate(
  campo: Campo,
  duration: number,
  dateStr: string,
  availableSlots: Slot[]
): string {
  if (availableSlots.length === 0) {
    return getPriceLabel(campo, duration);
  }

  const prices = availableSlots.map((slot) =>
    calculatePrice(campo, duration, dateStr, slot.time)
  );

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  return minPrice === maxPrice
    ? `€${minPrice.toFixed(2)}`
    : `da €${minPrice.toFixed(2)}`;
}

/**
 * 🏷️ Label della fascia di prezzo applicata
 */
export function getPricingLabel(
  campo: Campo,
  dateStr: string,
  startTime: string
): string | null {
  const pricing = campo.pricingRules;

  if (!pricing || pricing.mode === "flat") return null;

  const dateOverride = pricing.dateOverrides?.dates?.find(
    (d) => d.date === dateStr
  );
  if (dateOverride) return `📅 ${dateOverride.label}`;

  const periodOverride = pricing.periodOverrides?.periods?.find(
    (p) => dateStr >= p.startDate && dateStr <= p.endDate
  );
  if (periodOverride) return `📆 ${periodOverride.label}`;

  if (pricing.timeSlotPricing?.enabled) {
    const dayOfWeek = getDayOfWeek(dateStr);

    const specificSlot = pricing.timeSlotPricing.slots.find((slot) => {
      if (!slot.daysOfWeek || slot.daysOfWeek.length === 0) return false;
      if (!slot.daysOfWeek.includes(dayOfWeek)) return false;
      return isTimeInRange(startTime, slot.start, slot.end);
    });

    if (specificSlot) return `⏰ ${specificSlot.label}`;

    const genericSlot = pricing.timeSlotPricing.slots.find((slot) => {
      if (slot.daysOfWeek && slot.daysOfWeek.length > 0) return false;
      return isTimeInRange(startTime, slot.start, slot.end);
    });

    if (genericSlot) return `⏰ ${genericSlot.label}`;
  }

  return null;
}
