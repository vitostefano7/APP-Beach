// seeds/generateCalendar.ts

import CampoCalendarDay from "../models/campoCalendarDay";
import { generateDatesForMonths } from "./calendarUtils";

// Genera slot mezz'ora tra open e close
function generateHalfHourSlots(open: string, close: string) {
  const slots: { time: string; enabled: boolean }[] = [];
  let [h, m] = open.split(":").map(Number);
  const [hEnd, mEnd] = close.split(":").map(Number);
  while (h < hEnd || (h === hEnd && m < mEnd)) {
    const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    slots.push({ time, enabled: true });
    m += 30;
    if (m >= 60) {
      h++;
      m = 0;
    }
  }
  return slots;
}

export async function generateCalendar(campi: any[]) {
  const MONTHS_TO_GENERATE = 1;
  console.log(`📅 Creazione calendario per ${campi.length} campi (${MONTHS_TO_GENERATE} mese/i, rolling weeklySchedule)...`);

  const dates = generateDatesForMonths(MONTHS_TO_GENERATE);
  const calendarDocs: any[] = [];
  const WEEK_MAP = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

  for (const campo of campi) {
    for (const dateStr of dates) {
      const date = new Date(dateStr + "T12:00:00");
      const weekday = WEEK_MAP[date.getDay()] as keyof typeof campo.weeklySchedule;
      const schedule = campo.weeklySchedule && campo.weeklySchedule[weekday];

      let allSlots: any[] = [];
      if (schedule && schedule.enabled && schedule.open && schedule.close) {
        allSlots = generateHalfHourSlots(schedule.open, schedule.close);
      }

      calendarDocs.push({
        campo: campo._id,
        date: dateStr,
        slots: allSlots,
        isClosed: !schedule || !schedule.enabled || allSlots.length === 0,
      });
    }
  }

  const calendar = await CampoCalendarDay.insertMany(calendarDocs);
  console.log(`✅ Creati ${calendar.length} giorni di calendario (${campi.length} campi × ${dates.length} giorni)`);
  return calendar;
}
