import { Request, Response } from "express";
import Campo from "../models/Campo";
import CampoCalendarDay from "../models/CampoCalendarDay";
import Booking from "../models/Booking";
import { AuthRequest } from "../middleware/authMiddleware";

/* =====================================================
   COSTANTI & UTILS
===================================================== */

const WEEK_MAP = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

const DEFAULT_MONTHS_AHEAD = 15;

/**
 * Genera slot ogni 30 minuti
 */
const generateHalfHourSlots = (open: string, close: string) => {
  const slots: { time: string; enabled: boolean }[] = [];
  let [h, m] = open.split(":").map(Number);

  while (true) {
    const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    if (time >= close) break;

    slots.push({ time, enabled: true });

    m += 30;
    if (m >= 60) {
      h++;
      m = 0;
    }
  }

  return slots;
};

/**
 * 🔥 FUNZIONE CHIAVE
 * Garantisce che il calendario esista almeno fino a +N mesi
 */
const ensureCalendarAhead = async (campo: any, monthsAhead = DEFAULT_MONTHS_AHEAD) => {
  const today = new Date();
  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() + monthsAhead);

  const lastDay = await CampoCalendarDay.findOne({ campo: campo._id })
    .sort({ date: -1 });

  let startDate = lastDay
    ? new Date(lastDay.date)
    : new Date(today);

  startDate.setDate(startDate.getDate() + 1);

  if (startDate > targetDate) return;

  const daysToInsert: any[] = [];

  for (let d = new Date(startDate); d <= targetDate; d.setDate(d.getDate() + 1)) {
    const weekday = WEEK_MAP[d.getDay()];
    const schedule = campo.weeklySchedule[weekday];

    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

    daysToInsert.push({
      campo: campo._id,
      date: dateStr,
      isClosed: !schedule.enabled,
      slots: schedule.enabled
        ? generateHalfHourSlots(schedule.open, schedule.close)
        : [],
    });
  }

  if (daysToInsert.length > 0) {
    await CampoCalendarDay.insertMany(daysToInsert);
    console.log(
      `📅 Calendar extended for ${campo.name}: +${daysToInsert.length} days`
    );
  }
};

/* =====================================================
   GET /campi/:id/calendar?month=YYYY-MM
===================================================== */
export const getCampoCalendarByMonth = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { month } = req.query;

    if (!month || typeof month !== "string") {
      return res.status(400).json({ message: "month richiesto (YYYY-MM)" });
    }

    const campo = await Campo.findById(id);
    if (!campo) {
      return res.status(404).json({ message: "Campo non trovato" });
    }

    // 🔥 GARANTISCE IL FUTURO
    await ensureCalendarAhead(campo);

    const days = await CampoCalendarDay.find({
      campo: id,
      date: { $regex: `^${month}` },
    }).sort({ date: 1 });

    res.json(days);
  } catch (err) {
    console.error("❌ getCampoCalendarByMonth error:", err);
    res.status(500).json({ message: "Errore calendario" });
  }
};

/* =====================================================
   DELETE /campi/:campoId/calendar/:date
   Chiude un giorno
===================================================== */
export const closeCalendarDay = async (req: AuthRequest, res: Response) => {
  try {
    const { campoId, date } = req.params;

    const campo = await Campo.findById(campoId).populate("struttura");
    if (!campo) return res.status(404).json({ message: "Campo non trovato" });

    if ((campo.struttura as any).owner.toString() !== req.user!.id) {
      return res.status(403).json({ message: "Non autorizzato" });
    }

    const calendarDay = await CampoCalendarDay.findOne({ campo: campoId, date });
    if (!calendarDay) {
      return res.status(404).json({ message: "Giorno non trovato" });
    }

    const bookings = await Booking.find({
      campo: campoId,
      date,
      status: "confirmed",
    });

    if (bookings.length > 0) {
      await Booking.updateMany(
        { campo: campoId, date, status: "confirmed" },
        { $set: { status: "cancelled" } }
      );
    }

    calendarDay.slots = [];
    calendarDay.isClosed = true;
    await calendarDay.save();

    res.json({
      message: "Giorno chiuso",
      cancelledBookings: bookings.length,
      calendarDay,
    });
  } catch (err) {
    console.error("❌ closeCalendarDay error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};

/* =====================================================
   POST /campi/:campoId/calendar/:date/reopen
===================================================== */
export const reopenCalendarDay = async (req: AuthRequest, res: Response) => {
  try {
    const { campoId, date } = req.params;

    const campo = await Campo.findById(campoId).populate("struttura");
    if (!campo) return res.status(404).json({ message: "Campo non trovato" });

    if ((campo.struttura as any).owner.toString() !== req.user!.id) {
      return res.status(403).json({ message: "Non autorizzato" });
    }

    const calendarDay = await CampoCalendarDay.findOne({ campo: campoId, date });
    if (!calendarDay) {
      return res.status(404).json({ message: "Giorno non trovato" });
    }

    const weekday = WEEK_MAP[new Date(date).getDay()];
    const schedule = campo.weeklySchedule[weekday];

    calendarDay.slots = schedule.enabled
      ? generateHalfHourSlots(schedule.open, schedule.close)
      : [];

    calendarDay.isClosed = false;
    await calendarDay.save();

    res.json(calendarDay);
  } catch (err) {
    console.error("❌ reopenCalendarDay error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};

/* =====================================================
   PUT /campi/:campoId/calendar/:date/slot
===================================================== */
export const updateCalendarSlot = async (req: AuthRequest, res: Response) => {
  try {
    const { campoId, date } = req.params;
    const { time, enabled } = req.body;

    const campo = await Campo.findById(campoId).populate("struttura");
    if (!campo) return res.status(404).json({ message: "Campo non trovato" });

    if ((campo.struttura as any).owner.toString() !== req.user!.id) {
      return res.status(403).json({ message: "Non autorizzato" });
    }

    const calendarDay = await CampoCalendarDay.findOne({ campo: campoId, date });
    if (!calendarDay) {
      return res.status(404).json({ message: "Giorno non trovato" });
    }

    const slot = calendarDay.slots.find((s: any) => s.time === time);
    if (!slot) {
      return res.status(404).json({ message: "Slot non trovato" });
    }

    if (enabled === false) {
      await Booking.updateMany(
        {
          campo: campoId,
          date,
          startTime: time,
          status: "confirmed",
        },
        { $set: { status: "cancelled" } }
      );
    }

    slot.enabled = enabled;
    await calendarDay.save();

    res.json(calendarDay);
  } catch (err) {
    console.error("❌ updateCalendarSlot error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};
