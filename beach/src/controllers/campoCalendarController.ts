import { Request, Response } from "express";
import Campo from "../models/Campo";
import CampoCalendarDay from "../models/campoCalendarDay";
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

    console.log("📅 GET calendario mensile campo:", id, "month:", month);

    if (!month || typeof month !== "string") {
      console.log("❌ Mese non fornito");
      return res.status(400).json({ message: "month richiesto (YYYY-MM)" });
    }

    console.log("🔍 Cercando campo...");
    const campo = await Campo.findById(id);
    if (!campo) {
      console.log("❌ Campo non trovato:", id);
      return res.status(404).json({ message: "Campo non trovato" });
    }

    console.log("🔄 Garantendo calendario futuro...");
    // 🔥 GARANTISCE IL FUTURO
    await ensureCalendarAhead(campo);

    console.log("🔍 Cercando giorni calendario...");
    const days = await CampoCalendarDay.find({
      campo: id,
      date: { $regex: `^${month}` },
    }).sort({ date: 1 });

    console.log("📤 Invio calendario mensile");
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

    console.log("🔒 Chiusura giorno calendario:", campoId, date);

    console.log("🔍 Verificando campo ownership...");
    const campo = await Campo.findById(campoId).populate("struttura");
    if (!campo) {
      console.log("❌ Campo non trovato:", campoId);
      return res.status(404).json({ message: "Campo non trovato" });
    }

    if ((campo.struttura as any).owner.toString() !== req.user!.id) {
      console.log("❌ Non autorizzato per campo:", campoId);
      return res.status(403).json({ message: "Non autorizzato" });
    }

    console.log("🔍 Cercando giorno calendario...");
    const calendarDay = await CampoCalendarDay.findOne({ campo: campoId, date });
    if (!calendarDay) {
      console.log("❌ Giorno non trovato:", date);
      return res.status(404).json({ message: "Giorno non trovato" });
    }

    console.log("🔍 Cercando prenotazioni da cancellare...");
    const bookings = await Booking.find({
      campo: campoId,
      date,
      status: "confirmed",
    });

    if (bookings.length > 0) {
      console.log("🗑️ Cancellando prenotazioni...");
      await Booking.updateMany(
        { campo: campoId, date, status: "confirmed" },
        { $set: { status: "cancelled" } }
      );
    }

    console.log("🔒 Salvando chiusura giorno...");
    calendarDay.slots = [];
    calendarDay.isClosed = true;
    await calendarDay.save();

    console.log("📤 Invio risposta chiusura giorno");
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

    console.log("🔓 Riapertura giorno calendario:", campoId, date);

    console.log("🔍 Verificando campo ownership...");
    const campo = await Campo.findById(campoId).populate("struttura");
    if (!campo) {
      console.log("❌ Campo non trovato:", campoId);
      return res.status(404).json({ message: "Campo non trovato" });
    }

    if ((campo.struttura as any).owner.toString() !== req.user!.id) {
      console.log("❌ Non autorizzato per campo:", campoId);
      return res.status(403).json({ message: "Non autorizzato" });
    }

    console.log("🔍 Cercando giorno calendario...");
    const calendarDay = await CampoCalendarDay.findOne({ campo: campoId, date });
    if (!calendarDay) {
      console.log("❌ Giorno non trovato:", date);
      return res.status(404).json({ message: "Giorno non trovato" });
    }

    console.log("🔓 Ricreando slot per riapertura...");
    const weekday = WEEK_MAP[new Date(date).getDay()];
    const schedule = campo.weeklySchedule[weekday];

    calendarDay.slots = schedule.enabled
      ? generateHalfHourSlots(schedule.open, schedule.close)
      : [];

    calendarDay.isClosed = false;
    await calendarDay.save();

    console.log("📤 Invio risposta riapertura giorno");
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

    console.log("🔄 Update slot calendario:", campoId, date, time, "→", enabled);

    console.log("🔍 Verificando campo ownership...");
    const campo = await Campo.findById(campoId).populate("struttura");
    if (!campo) {
      console.log("❌ Campo non trovato:", campoId);
      return res.status(404).json({ message: "Campo non trovato" });
    }

    if ((campo.struttura as any).owner.toString() !== req.user!.id) {
      console.log("❌ Non autorizzato per campo:", campoId);
      return res.status(403).json({ message: "Non autorizzato" });
    }

    console.log("🔍 Cercando giorno calendario...");
    const calendarDay = await CampoCalendarDay.findOne({ campo: campoId, date });
    if (!calendarDay) {
      console.log("❌ Giorno non trovato:", date);
      return res.status(404).json({ message: "Giorno non trovato" });
    }

    const slot = calendarDay.slots.find((s: any) => s.time === time);
    if (!slot) {
      console.log("❌ Slot non trovato:", time);
      return res.status(404).json({ message: "Slot non trovato" });
    }

    if (enabled === false) {
      console.log("🔍 Cercando prenotazione per slot...");
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

    console.log("💾 Salvando aggiornamento slot...");
    slot.enabled = enabled;
    await calendarDay.save();

    console.log("📤 Invio risposta aggiornamento slot");
    res.json(calendarDay);
  } catch (err) {
    console.error("❌ updateCalendarSlot error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};
