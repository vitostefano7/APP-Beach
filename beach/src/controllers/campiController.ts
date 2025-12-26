import { Request, Response } from "express";
import Campo from "../models/Campo";
import Struttura from "../models/Strutture";
import CampoCalendarDay from "../models/campoCalendarDay";
import { AuthRequest } from "../middleware/authMiddleware";
import Booking from "../models/Booking"; // ✅ AGGIUNTO


/* =====================================================
   UTILS
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

const generateAnnualCalendarForCampo = async (
  campo: any,
  year: number = new Date().getFullYear()
) => {
  const days: any[] = [];

  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const weekday = WEEK_MAP[d.getDay()];
    const daySchedule = campo.weeklySchedule[weekday];
    const date = d.toISOString().split("T")[0];

    days.push({
      campo: campo._id,
      date,
      slots: daySchedule.enabled
        ? generateHalfHourSlots(daySchedule.open, daySchedule.close)
        : [],
    });
  }

  console.log(`📅 Generazione calendario annuale per campo ${campo.name}: ${days.length} giorni`);
  
  // Usa bulkWrite per evitare duplicati in caso di rigenerazione
  const operations = days.map(day => ({
    updateOne: {
      filter: { campo: day.campo, date: day.date },
      update: { $set: { slots: day.slots } },
      upsert: true,
    },
  }));

  await CampoCalendarDay.bulkWrite(operations);
  console.log(`✅ Calendario salvato per ${campo.name}`);
};

/* =====================================================
   GET /campi/struttura/:id (PUBLIC)
   Restituisce solo campi ATTIVI
===================================================== */
export const getCampiByStruttura = async (req: Request, res: Response) => {
  try {
    console.log("🏟️  GET /campi/struttura/:id (PUBLIC)");
    
    const campi = await Campo.find({
      struttura: req.params.id,
      isActive: true,
    }).sort({ name: 1 });

    console.log(`✅ Trovati ${campi.length} campi attivi`);
    res.json(campi);
  } catch (err) {
    console.error("❌ getCampiByStruttura error:", err);
    res.status(500).json({ message: "Errore caricamento campi" });
  }
};

/* =====================================================
   GET /campi/owner/struttura/:id (OWNER)
   Restituisce TUTTI i campi (anche non attivi)
===================================================== */
export const getAllCampiByStruttura = async (req: AuthRequest, res: Response) => {
  try {
    console.log("🔐 GET /campi/owner/struttura/:id (OWNER)");
    console.log("👤 User ID:", req.user?.id);
    console.log("🏢 Struttura ID:", req.params.id);

    // Verifica che la struttura appartenga all'utente
    const struttura = await Struttura.findOne({
      _id: req.params.id,
      owner: req.user!.id,
    });

    if (!struttura) {
      console.log("❌ Struttura non trovata o non autorizzato");
      return res.status(403).json({ message: "Non autorizzato" });
    }

    // Trova TUTTI i campi (anche isActive: false)
    const campi = await Campo.find({
      struttura: req.params.id,
    }).sort({ name: 1 });
    
    console.log(`✅ Trovati ${campi.length} campi totali`);
    res.json(campi);
  } catch (err) {
    console.error("❌ getAllCampiByStruttura error:", err);
    res.status(500).json({ message: "Errore caricamento campi" });
  }
};

/* =====================================================
   POST /campi (OWNER)
   Crea campi + genera calendario annuale automatico
===================================================== */
export const createCampi = async (req: AuthRequest, res: Response) => {
  try {
    console.log("🆕 POST /campi (CREATE)");
    const { strutturaId, campi } = req.body;

    if (!strutturaId || !campi || campi.length === 0) {
      return res.status(400).json({ 
        message: "ID struttura e campi sono obbligatori" 
      });
    }

    // Verifica ownership
    const struttura = await Struttura.findOne({
      _id: strutturaId,
      owner: req.user!.id,
      isDeleted: false,
    });

    if (!struttura) {
      return res.status(404).json({ 
        message: "Struttura non trovata o non autorizzato" 
      });
    }

    // Validazione
    for (const campo of campi) {
      if (!campo.name || !campo.sport || !campo.surface || !campo.pricePerHour) {
        return res.status(400).json({ 
          message: "Tutti i campi devono avere nome, sport, superficie e prezzo" 
        });
      }
    }

    // Crea i campi con weeklySchedule default
    const campiToCreate = campi.map((c: any) => ({
      struttura: strutturaId,
      name: c.name,
      sport: c.sport,
      surface: c.surface,
      maxPlayers: c.maxPlayers || 4,
      indoor: c.indoor || false,
      pricePerHour: c.pricePerHour,
      isActive: true,
      weeklySchedule: c.weeklySchedule || {
        monday: { enabled: true, open: "09:00", close: "22:00" },
        tuesday: { enabled: true, open: "09:00", close: "22:00" },
        wednesday: { enabled: true, open: "09:00", close: "22:00" },
        thursday: { enabled: true, open: "09:00", close: "22:00" },
        friday: { enabled: true, open: "09:00", close: "22:00" },
        saturday: { enabled: true, open: "09:00", close: "22:00" },
        sunday: { enabled: true, open: "09:00", close: "22:00" },
      },
    }));

    const createdCampi = await Campo.insertMany(campiToCreate);
    console.log(`✅ ${createdCampi.length} campi creati per struttura ${strutturaId}`);

    // 🔥 GENERAZIONE CALENDARIO ANNUALE AUTOMATICA
       console.log("🚀 Avvio generazione calendari annuali...");
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    
    for (const campo of createdCampi) {
      console.log(`📅 Generazione ${currentYear} e ${nextYear} per ${campo.name}...`);
      await generateAnnualCalendarForCampo(campo, currentYear);
      await generateAnnualCalendarForCampo(campo, nextYear);
    }
    console.log(`✅ Tutti i calendari generati (${currentYear} + ${nextYear})`);

    res.status(201).json({
      message: "Campi e calendari creati con successo",
      campi: createdCampi,
    });
  } catch (err) {
    console.error("❌ createCampi error:", err);
    res.status(500).json({ message: "Errore creazione campi" });
  }
};

/* =====================================================
   GET /campi/:id (PUBLIC)
===================================================== */
export const getCampoById = async (req: Request, res: Response) => {
  try {
    console.log("🏟️  GET /campi/:id");
    const campo = await Campo.findById(req.params.id);

    if (!campo) {
      return res.status(404).json({ message: "Campo non trovato" });
    }

    console.log("📋 Campo caricato:", campo.name, "- isActive:", campo.isActive);
    res.json(campo);
  } catch (err) {
    console.error("❌ getCampoById error:", err);
    res.status(500).json({ message: "Errore caricamento campo" });
  }
};

/* =====================================================
   GET /campi/:id/calendar?month=YYYY-MM (PUBLIC)
===================================================== */
export const getCampoCalendarByMonth = async (
  req: Request,
  res: Response
) => {
  try {
    console.log("📅 GET /campi/:id/calendar");
    const { id } = req.params;
    const { month } = req.query;

    if (!month || typeof month !== "string") {
      return res.status(400).json({ message: "month richiesto (YYYY-MM)" });
    }

    const days = await CampoCalendarDay.find({
      campo: id,
      date: { $regex: `^${month}` },
    }).sort({ date: 1 });

    console.log(`✅ Trovati ${days.length} giorni per ${month}`);
    res.json(days);
  } catch (error) {
    console.error("❌ getCampoCalendarByMonth error:", error);
    res.status(500).json({ message: "Errore calendario" });
  }
};

/* =====================================================
   PUT /campi/:id (OWNER)
===================================================== */
export const updateCampo = async (req: AuthRequest, res: Response) => {
  try {
    console.log("✏️  PUT /campi/:id (UPDATE)");
    const campo = await Campo.findById(req.params.id);

    if (!campo) {
      return res.status(404).json({ message: "Campo non trovato" });
    }

    // Verifica ownership
    const struttura = await Struttura.findOne({
      _id: campo.struttura,
      owner: req.user!.id,
    });

    if (!struttura) {
      return res.status(403).json({ message: "Non autorizzato" });
    }

    const { name, sport, surface, maxPlayers, indoor, pricePerHour, isActive, weeklySchedule } = req.body;

    if (name) campo.name = name;
    if (sport) campo.sport = sport;
    if (surface) campo.surface = surface;
    if (maxPlayers !== undefined) campo.maxPlayers = maxPlayers;
    if (indoor !== undefined) campo.indoor = indoor;
    if (pricePerHour !== undefined) campo.pricePerHour = pricePerHour;
    if (isActive !== undefined) campo.isActive = isActive;
    
    // Se cambiano gli orari settimanali, rigenera il calendario
    if (weeklySchedule) {
      campo.weeklySchedule = weeklySchedule;
      console.log("📅 weeklySchedule modificato, rigenerazione calendario...");
      await generateAnnualCalendarForCampo(campo);
    }

    await campo.save();

    console.log("✅ Campo aggiornato:", campo.name);
    res.json({
      message: "Campo aggiornato con successo",
      campo,
    });
  } catch (err) {
    console.error("❌ updateCampo error:", err);
    res.status(500).json({ message: "Errore aggiornamento campo" });
  }
};

/* =====================================================
   DELETE /campi/:id (OWNER)
===================================================== */
export const deleteCampo = async (req: AuthRequest, res: Response) => {
  try {
    console.log("🗑️  DELETE /campi/:id");
    console.log("🔍 Campo ID:", req.params.id);
    
    const campo = await Campo.findById(req.params.id);

    if (!campo) {
      console.log("❌ Campo non trovato");
      return res.status(404).json({ message: "Campo non trovato" });
    }

    // Verifica ownership
    const struttura = await Struttura.findOne({
      _id: campo.struttura,
      owner: req.user!.id,
    });

    if (!struttura) {
      console.log("❌ Non autorizzato");
      return res.status(403).json({ message: "Non autorizzato" });
    }

    const campoNome = campo.name;
    
    // Elimina anche il calendario associato
    await CampoCalendarDay.deleteMany({ campo: req.params.id });
    console.log("✅ Calendario eliminato");
    
    await Campo.findByIdAndDelete(req.params.id);

    console.log("✅ Campo eliminato:", campoNome);
    res.json({ message: "Campo eliminato con successo" });
  } catch (err) {
    console.error("❌ deleteCampo error:", err);
    res.status(500).json({ message: "Errore eliminazione campo" });
  }
};

// campoController.ts - Aggiungi/modifica queste funzioni

/**
 * 📌 CHIUDE UN GIORNO COMPLETAMENTE
 * DELETE /campi/:campoId/calendar/:date
 */
export const closeCalendarDay = async (req: AuthRequest, res: Response) => {
  try {
    const { campoId, date } = req.params;
    const ownerId = req.user!.id;

    console.log(`🔒 Chiusura giorno ${date} per campo ${campoId}`);

    // Verifica che il campo appartenga all'owner
    const campo = await Campo.findById(campoId).populate("struttura");
    if (!campo) {
      return res.status(404).json({ message: "Campo non trovato" });
    }

    if ((campo.struttura as any).owner.toString() !== ownerId) {
      return res.status(403).json({ message: "Non autorizzato" });
    }

    // Trova il giorno nel calendario
    let calendarDay = await CampoCalendarDay.findOne({
      campo: campoId,
      date,
    });

    if (!calendarDay) {
      return res.status(404).json({ message: "Giorno non trovato" });
    }

    // ❌ Cancella tutte le prenotazioni confermате per questo giorno
    const bookingsToCancel = await Booking.find({
      campo: campoId,
      date,
      status: "confirmed",
    });

    if (bookingsToCancel.length > 0) {
      console.log(`⚠️ Trovate ${bookingsToCancel.length} prenotazioni da cancellare`);
      
      await Booking.updateMany(
        {
          campo: campoId,
          date,
          status: "confirmed",
        },
        {
          $set: { status: "cancelled" },
        }
      );

      console.log(`✅ ${bookingsToCancel.length} prenotazioni cancellate`);
    }

    // 🔒 Svuota tutti gli slot (giorno chiuso)
    calendarDay.slots = [];
    calendarDay.isClosed = true;
    await calendarDay.save();

    console.log("✅ Giorno chiuso completamente");
    res.json({ 
      message: "Giorno chiuso con successo",
      cancelledBookings: bookingsToCancel.length,
      calendarDay 
    });
  } catch (err) {
    console.error("❌ closeCalendarDay error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * 📌 RIAPRE UN GIORNO CHIUSO
 * POST /campi/:campoId/calendar/:date/reopen
 */
export const reopenCalendarDay = async (req: AuthRequest, res: Response) => {
  try {
    const { campoId, date } = req.params;
    const ownerId = req.user!.id;

    console.log(`🔓 Riapertura giorno ${date} per campo ${campoId}`);

    // Verifica che il campo appartenga all'owner
    const campo = await Campo.findById(campoId).populate("struttura");
    if (!campo) {
      return res.status(404).json({ message: "Campo non trovato" });
    }

    if ((campo.struttura as any).owner.toString() !== ownerId) {
      return res.status(403).json({ message: "Non autorizzato" });
    }

    // Trova o crea il giorno nel calendario
    let calendarDay = await CampoCalendarDay.findOne({
      campo: campoId,
      date,
    });

    if (!calendarDay) {
      return res.status(404).json({ message: "Giorno non trovato" });
    }

    // 🔓 Ricrea gli slot con orari di default (8:00-22:00, ogni 30 min)
    const slots = [];
    for (let h = 8; h <= 21; h++) {
      for (let m of [0, 30]) {
        const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        slots.push({ time, enabled: true });
      }
    }

    calendarDay.slots = slots;
    calendarDay.isClosed = false;
    await calendarDay.save();

    console.log("✅ Giorno riaperto con successo");
    res.json(calendarDay);
  } catch (err) {
    console.error("❌ reopenCalendarDay error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * 📌 MODIFICA SINGOLO SLOT
 * PUT /campi/:campoId/calendar/:date/slot
 */
export const updateCalendarSlot = async (req: AuthRequest, res: Response) => {
  try {
    const { campoId, date } = req.params;
    const { time, enabled } = req.body;
    const ownerId = req.user!.id;

    console.log(`🔄 Update slot ${date} ${time} → ${enabled}`);

    // Verifica che il campo appartenga all'owner
    const campo = await Campo.findById(campoId).populate("struttura");
    if (!campo) {
      return res.status(404).json({ message: "Campo non trovato" });
    }

    if ((campo.struttura as any).owner.toString() !== ownerId) {
      return res.status(403).json({ message: "Non autorizzato" });
    }

    const calendarDay = await CampoCalendarDay.findOne({
      campo: campoId,
      date,
    });

    if (!calendarDay) {
      return res.status(404).json({ message: "Giorno non trovato" });
    }

    const slot = calendarDay.slots.find((s: any) => s.time === time);
    if (!slot) {
      return res.status(404).json({ message: "Slot non trovato" });
    }

    // ⚠️ Se lo slot viene disabilitato, cancella eventuali prenotazioni
    if (enabled === false) {
      const bookingToCancel = await Booking.findOne({
        campo: campoId,
        date,
        startTime: time,
        status: "confirmed",
      });

      if (bookingToCancel) {
        console.log(`⚠️ Prenotazione trovata per slot ${time}, cancellazione in corso...`);
        bookingToCancel.status = "cancelled";
        await bookingToCancel.save();
        console.log("✅ Prenotazione cancellata");
      }
    }

    slot.enabled = enabled;
    await calendarDay.save();

    res.json(calendarDay);
  } catch (err) {
    console.error("❌ updateCalendarSlot error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};
