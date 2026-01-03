import { Slot, CalendarDay } from "../types/field";
import {
  isPastDate,
  isPastSlot,
  toLocalDateString,
} from "../../../utils-player/FieldDetailsScreen-utils";

/* =======================
   CALENDAR UTILS
======================= */

/**
 * 🔗 Verifica se ci sono slot consecutivi disponibili
 */
export function hasConsecutiveAvailability(
  slots: Slot[],
  startIndex: number,
  durationHours: number
): boolean {
  const slotsNeeded = durationHours * 2;

  if (startIndex + slotsNeeded > slots.length) {
    return false;
  }

  for (let i = 0; i < slotsNeeded; i++) {
    const slot = slots[startIndex + i];
    if (!slot || !slot.enabled) {
      return false;
    }
  }

  return true;
}

/**
 * ✅ Filtra gli slot prenotabili per una durata
 */
export function getAvailableSlots(
  slots: Slot[],
  durationHours: number,
  dateStr: string
): Slot[] {
  return slots.filter((slot, index) => {
    if (isPastSlot(dateStr, slot.time)) return false;
    if (!slot.enabled) return false;

    return hasConsecutiveAvailability(slots, index, durationHours);
  });
}

/**
 * 📆 Ritorna i giorni del mese (con padding iniziale)
 */
export function getDaysInMonth(currentMonth: Date): (Date | null)[] {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const days: (Date | null)[] = [];

  // Padding prima del primo giorno del mese
  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push(null);
  }

  // Giorni reali
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }

  return days;
}

/**
 * 📌 Dati del giorno selezionato
 */
export function getDayData(
  calendar: CalendarDay[],
  date: Date | null
): CalendarDay | null {
  if (!date) return null;

  const dateStr = toLocalDateString(date);
  return calendar.find((d) => d.date === dateStr) ?? null;
}

/**
 * 🎯 Stato del giorno (per colore indicatore)
 */
export function getDayStatus(
  dayData: CalendarDay | null
): "unknown" | "closed" | "full" | "partial" | "available" {
  if (!dayData) return "unknown";
  if (dayData.isClosed || dayData.slots.length === 0) return "closed";

  const enabled = dayData.slots.filter((s) => s.enabled).length;
  const total = dayData.slots.length;

  if (enabled === 0) return "full";
  if (enabled === total) return "available";

  return "partial";
}
