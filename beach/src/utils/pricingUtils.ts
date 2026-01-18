import { PricingRules, DurationPrice } from "../models/Campo";

/**
 * 🎯 CALCOLO DETERMINISTICO DEL PREZZO
 * 
 * Gerarchia (dalla più alta alla più bassa):
 * 1. Prezzo speciale per data specifica
 * 2. Prezzo speciale per periodo
 * 3. Fascia oraria con giorno della settimana specifico
 * 4. Fascia oraria generica (tutti i giorni)
 * 5. Prezzo base (solo in modalità advanced)
 * 6. Prezzo fisso (flat mode)
 * 
 * @param pricingRules - Regole di pricing del campo
 * @param date - Data della prenotazione (formato YYYY-MM-DD)
 * @param startTime - Orario di inizio (formato HH:MM)
 * @param duration - Durata: "1h" o "1.5h"
 * @returns DurationPrice con oneHour e oneHourHalf
 */
export type PriceResult = {
  totalPrice: number;
  unitPrice?: number;
  appliedPricingMode: "split" | "standard";
  appliedPlayerCount?: number;
};

export function calculatePrice(
  pricingRules: PricingRules,
  date: string,
  startTime: string,
  duration: "1h" | "1.5h",
  options?: { isCostSplittingEnabled?: boolean; numberOfPeople?: number }
): PriceResult {
  const numberOfPeople = options?.numberOfPeople;

  // Prezzo calcolato usando la gerarchia esistente
  const basePrices = getPricesForSlot(pricingRules, date, startTime);
  const totalStandard = duration === "1h" ? basePrices.oneHour : basePrices.oneHourHalf;

  // Se la struttura permette lo split e il campo ha playerCountPricing abilitato
  if (
    options?.isCostSplittingEnabled &&
    pricingRules.playerCountPricing?.enabled &&
    Array.isArray(pricingRules.playerCountPricing.prices) &&
    typeof numberOfPeople === "number"
  ) {
    const match = pricingRules.playerCountPricing.prices.find((p) => p.count === numberOfPeople);
    if (match) {
      const perPerson = duration === "1h" ? match.prices.oneHour : match.prices.oneHourHalf;
      const totalPrice = perPerson * numberOfPeople;
      return {
        totalPrice,
        unitPrice: roundToTwo(perPerson),
        appliedPricingMode: "split",
        appliedPlayerCount: numberOfPeople,
      };
    }
    // Se non trovato, fallback verrà applicato più sotto (opzione permissiva)
  }

  // Modalità standard (o fallback): restituisce totalStandard e, se numberOfPeople fornito, anche unitPrice calcolato
  if (typeof numberOfPeople === "number" && numberOfPeople > 0) {
    const unit = roundToTwo(totalStandard / numberOfPeople);
    return { totalPrice: totalStandard, unitPrice: unit, appliedPricingMode: "standard" };
  }

  return { totalPrice: totalStandard, appliedPricingMode: "standard" };
}

function roundToTwo(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * 🎯 OTTIENI I PREZZI PER UNO SLOT SPECIFICO
 * Segue la gerarchia deterministica
 * 
 * @param pricingRules - Regole di pricing del campo
 * @param date - Data della prenotazione (formato YYYY-MM-DD)
 * @param startTime - Orario di inizio (formato HH:MM)
 * @returns DurationPrice con i prezzi per 1h e 1.5h
 */
export function getPricesForSlot(
  pricingRules: PricingRules,
  date: string,
  startTime: string
): DurationPrice {
  // LIVELLO 1A: Override per data specifica
  if (pricingRules.dateOverrides?.enabled && pricingRules.dateOverrides.dates.length > 0) {
    const dateOverride = pricingRules.dateOverrides.dates.find((d) => d.date === date);
    if (dateOverride) {
      console.log(`💰 [LEVEL 1A] Date override: ${dateOverride.label}`);
      return dateOverride.prices;
    }
  }

  // LIVELLO 1B: Override per periodo
  if (pricingRules.periodOverrides?.enabled && pricingRules.periodOverrides.periods.length > 0) {
    const periodOverride = pricingRules.periodOverrides.periods.find(
      (p) => date >= p.startDate && date <= p.endDate
    );
    if (periodOverride) {
      console.log(`💰 [LEVEL 1B] Period override: ${periodOverride.label}`);
      return periodOverride.prices;
    }
  }

  // LIVELLO 2: Fascia oraria con giorno della settimana specifico
  if (pricingRules.timeSlotPricing?.enabled && pricingRules.timeSlotPricing.slots.length > 0) {
    const dayOfWeek = getDayOfWeek(date); // 0=dom, 1=lun, ..., 6=sab

    // Prima cerca fasce con daysOfWeek definito
    const specificSlot = pricingRules.timeSlotPricing.slots.find((slot) => {
      if (!slot.daysOfWeek || slot.daysOfWeek.length === 0) {
        return false; // Skip fasce generiche
      }
      if (!slot.daysOfWeek.includes(dayOfWeek)) {
        return false; // Giorno non corrisponde
      }
      return isTimeInRange(startTime, slot.start, slot.end);
    });

    if (specificSlot) {
      console.log(`💰 [LEVEL 2] Time slot with day: ${specificSlot.label}`);
      return specificSlot.prices;
    }
  }

  // LIVELLO 3: Fascia oraria generica (senza daysOfWeek)
  if (pricingRules.timeSlotPricing?.enabled && pricingRules.timeSlotPricing.slots.length > 0) {
    const genericSlot = pricingRules.timeSlotPricing.slots.find((slot) => {
      if (slot.daysOfWeek && slot.daysOfWeek.length > 0) {
        return false; // Skip fasce specifiche
      }
      return isTimeInRange(startTime, slot.start, slot.end);
    });

    if (genericSlot) {
      console.log(`💰 [LEVEL 3] Generic time slot: ${genericSlot.label}`);
      return genericSlot.prices;
    }
  }

  // LIVELLO 4: Prezzo base (solo in modalità advanced)
  if (pricingRules.mode === "advanced") {
    console.log(`💰 [LEVEL 4] Base price (advanced mode)`);
    return pricingRules.basePrices;
  }

  // LIVELLO 5: Prezzo fisso (flat mode)
  console.log(`💰 [LEVEL 5] Flat price`);
  return pricingRules.flatPrices;
}

/**
 * 📅 OTTIENI IL GIORNO DELLA SETTIMANA DA UNA DATA
 * @param date - Data in formato YYYY-MM-DD
 * @returns Numero del giorno (0=domenica, 1=lunedì, ..., 6=sabato)
 */
function getDayOfWeek(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  const dateObj = new Date(year, month - 1, day);
  return dateObj.getDay();
}

/**
 * ⏰ VERIFICA SE UN ORARIO È ALL'INTERNO DI UN RANGE
 * @param time - Orario da verificare (formato HH:MM)
 * @param start - Orario di inizio range (formato HH:MM)
 * @param end - Orario di fine range (formato HH:MM)
 * @returns true se time è >= start e < end
 */
function isTimeInRange(time: string, start: string, end: string): boolean {
  const timeMinutes = timeToMinutes(time);
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);

  return timeMinutes >= startMinutes && timeMinutes < endMinutes;
}

/**
 * 🕐 CONVERTI ORARIO IN MINUTI
 * @param time - Orario in formato HH:MM
 * @returns Numero di minuti dalla mezzanotte
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * 🔍 VALIDA LE REGOLE DI PRICING
 * Verifica che non ci siano sovrapposizioni allo stesso livello
 * 
 * @param pricingRules - Regole da validare
 * @returns Array di errori (vuoto se tutto ok)
 */
export function validatePricingRules(pricingRules: PricingRules): string[] {
  const errors: string[] = [];

  // Valida date overrides (non devono avere date duplicate)
  if (pricingRules.dateOverrides?.enabled && pricingRules.dateOverrides.dates.length > 0) {
    const dates = pricingRules.dateOverrides.dates.map((d) => d.date);
    const uniqueDates = new Set(dates);
    if (dates.length !== uniqueDates.size) {
      errors.push("Date overrides: alcune date sono duplicate");
    }
  }

  // Valida period overrides (non devono sovrapporsi)
  if (pricingRules.periodOverrides?.enabled && pricingRules.periodOverrides.periods.length > 0) {
    const periods = pricingRules.periodOverrides.periods;
    for (let i = 0; i < periods.length; i++) {
      for (let j = i + 1; j < periods.length; j++) {
        const p1 = periods[i];
        const p2 = periods[j];
        
        // Controlla sovrapposizione
        if (
          (p1.startDate <= p2.endDate && p1.endDate >= p2.startDate) ||
          (p2.startDate <= p1.endDate && p2.endDate >= p1.startDate)
        ) {
          errors.push(
            `Period overrides: sovrapposizione tra "${p1.label}" e "${p2.label}"`
          );
        }
      }
    }
  }

  // Valida time slots (non devono sovrapporsi allo stesso livello)
  if (pricingRules.timeSlotPricing?.enabled && pricingRules.timeSlotPricing.slots.length > 0) {
    const slots = pricingRules.timeSlotPricing.slots;

    // Separa fasce con daysOfWeek da quelle senza
    const specificSlots = slots.filter((s) => s.daysOfWeek && s.daysOfWeek.length > 0);
    const genericSlots = slots.filter((s) => !s.daysOfWeek || s.daysOfWeek.length === 0);

    // Valida fasce generiche (non devono sovrapporsi)
    for (let i = 0; i < genericSlots.length; i++) {
      for (let j = i + 1; j < genericSlots.length; j++) {
        const s1 = genericSlots[i];
        const s2 = genericSlots[j];

        if (timeSlotsOverlap(s1.start, s1.end, s2.start, s2.end)) {
          errors.push(
            `Time slots generici: sovrapposizione tra "${s1.label}" e "${s2.label}"`
          );
        }
      }
    }

    // Valida fasce specifiche (non devono sovrapporsi per lo stesso giorno)
    for (let i = 0; i < specificSlots.length; i++) {
      for (let j = i + 1; j < specificSlots.length; j++) {
        const s1 = specificSlots[i];
        const s2 = specificSlots[j];

        // Controlla se hanno giorni in comune
        const commonDays = s1.daysOfWeek!.filter((day) => s2.daysOfWeek!.includes(day));

        if (commonDays.length > 0 && timeSlotsOverlap(s1.start, s1.end, s2.start, s2.end)) {
          errors.push(
            `Time slots specifici: sovrapposizione tra "${s1.label}" e "${s2.label}" per i giorni ${commonDays.join(", ")}`
          );
        }
      }
    }
  }

  return errors;
}

/**
 * ⏰ VERIFICA SOVRAPPOSIZIONE TRA DUE RANGE ORARI
 */
function timeSlotsOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const start1Min = timeToMinutes(start1);
  const end1Min = timeToMinutes(end1);
  const start2Min = timeToMinutes(start2);
  const end2Min = timeToMinutes(end2);

  return start1Min < end2Min && start2Min < end1Min;
}

/**
 * 📊 OTTIENI ANTEPRIMA PREZZI PER UN GIORNO
 * Utile per mostrare all'utente come variano i prezzi durante la giornata
 * 
 * @param pricingRules - Regole di pricing
 * @param date - Data (formato YYYY-MM-DD)
 * @param startHour - Ora di inizio (default 0)
 * @param endHour - Ora di fine (default 24)
 * @returns Array di slot con prezzi
 */
export function getPricingPreview(
  pricingRules: PricingRules,
  date: string,
  startHour: number = 0,
  endHour: number = 24
): Array<{
  time: string;
  label: string;
  prices: DurationPrice;
}> {
  const preview: Array<{ time: string; label: string; prices: DurationPrice }> = [];
  let currentLabel = "";
  let currentPrices: DurationPrice | null = null;

  for (let hour = startHour; hour < endHour; hour++) {
    const time = `${String(hour).padStart(2, "0")}:00`;
    const prices = getPricesForSlot(pricingRules, date, time);

    // Determina la label
    let label = pricingRules.mode === "flat" ? "Prezzo fisso" : "Prezzo base";

    // Controlla se c'è un override
    if (pricingRules.dateOverrides?.enabled) {
      const dateOverride = pricingRules.dateOverrides.dates.find((d) => d.date === date);
      if (dateOverride) {
        label = dateOverride.label;
      }
    }

    if (pricingRules.periodOverrides?.enabled && label === (pricingRules.mode === "flat" ? "Prezzo fisso" : "Prezzo base")) {
      const periodOverride = pricingRules.periodOverrides.periods.find(
        (p) => date >= p.startDate && date <= p.endDate
      );
      if (periodOverride) {
        label = periodOverride.label;
      }
    }

    if (pricingRules.timeSlotPricing?.enabled && label === (pricingRules.mode === "flat" ? "Prezzo fisso" : "Prezzo base")) {
      const dayOfWeek = getDayOfWeek(date);
      const slot =
        pricingRules.timeSlotPricing.slots.find(
          (s) =>
            s.daysOfWeek &&
            s.daysOfWeek.includes(dayOfWeek) &&
            isTimeInRange(time, s.start, s.end)
        ) ||
        pricingRules.timeSlotPricing.slots.find(
          (s) => (!s.daysOfWeek || s.daysOfWeek.length === 0) && isTimeInRange(time, s.start, s.end)
        );
      if (slot) {
        label = slot.label;
      }
    }

    // Aggiungi solo se cambiano label o prezzi
    if (
      label !== currentLabel ||
      !currentPrices ||
      prices.oneHour !== currentPrices.oneHour ||
      prices.oneHourHalf !== currentPrices.oneHourHalf
    ) {
      preview.push({ time, label, prices });
      currentLabel = label;
      currentPrices = prices;
    }
  }

  return preview;
}