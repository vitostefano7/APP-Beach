// utils/generateAnnualCalendar.ts
import CampoCalendarDay from "../models/CampoCalendarDay";
import { generateHalfHourSlots } from "./generateSlot";

const WEEK_MAP = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export const generateAnnualCalendarForCampo = async (
  campoId: string,
  openingHours: any,
  year = new Date().getFullYear()
) => {
  const days = [];

  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);

  for (
    let d = new Date(start);
    d <= end;
    d.setDate(d.getDate() + 1)
  ) {
    const weekday = WEEK_MAP[d.getDay()];
    const config = openingHours[weekday];
    const date = d.toISOString().split("T")[0];

    days.push({
      campo: campoId,
      date,
      slots: config.enabled
        ? generateHalfHourSlots(config.open, config.close)
        : [],
    });
  }

  await CampoCalendarDay.insertMany(days);
};
