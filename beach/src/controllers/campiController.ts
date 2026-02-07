import { Request, Response } from "express";
import Campo from "../models/Campo";
import Struttura from "../models/Strutture";
import CampoCalendarDay from "../models/campoCalendarDay";
import { AuthRequest } from "../middleware/authMiddleware";
import Booking from "../models/Booking";


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

    let allSlots: { time: string; enabled: boolean }[] = [];

    // ✅ SOLO NUOVO FORMATO: slots array
    if (daySchedule?.enabled && daySchedule.slots && Array.isArray(daySchedule.slots)) {
      daySchedule.slots.forEach((timeSlot: any) => {
        const slotsForThisRange = generateHalfHourSlots(timeSlot.open, timeSlot.close);
        allSlots.push(...slotsForThisRange);
      });
    }

    days.push({
      campo: campo._id,
      date,
      slots: allSlots,
      isClosed: allSlots.length === 0,
    });
  }

  console.log(`📅 Generazione calendario annuale per campo ${campo.name}: ${days.length} giorni`);
  
  // Usa bulkWrite per evitare duplicati in caso di rigenerazione
  const operations = days.map(day => ({
    updateOne: {
      filter: { campo: day.campo, date: day.date },
      update: { $set: { slots: day.slots, isClosed: day.isClosed } },
      upsert: true,
    },
  }));

  await CampoCalendarDay.bulkWrite(operations);
  console.log(`✅ Calendario salvato per ${campo.name}`);
};

/**
 * Controlla se ci sono prenotazioni future che verrebbero impattate dalla modifica degli orari
 */
const checkBookingsImpact = async (
  campo: any,
  newWeeklySchedule: any
): Promise<{ affected: number; bookings: any[] }> => {
  const today = new Date().toISOString().split("T")[0];
  
  // Prendi tutte le prenotazioni future per questo campo
  const futureBookings = await Booking.find({
    campo: campo._id,
    date: { $gte: today },
    status: { $in: ["confirmed", "pending"] },
  }).lean();

  if (futureBookings.length === 0) {
    return { affected: 0, bookings: [] };
  }

  const affectedBookings = [];

  // Per ogni prenotazione, controlla se gli slot sono ancora disponibili nei nuovi orari
  for (const booking of futureBookings) {
    const bookingDate = new Date(booking.date + "T12:00:00");
    const weekday = WEEK_MAP[bookingDate.getDay()];
    const newDaySchedule = newWeeklySchedule[weekday];

    // Se il giorno è disabilitato o non ha slot, la prenotazione è impattata
    if (!newDaySchedule?.enabled || !newDaySchedule.slots || newDaySchedule.slots.length === 0) {
      affectedBookings.push(booking);
      continue;
    }

    // Controlla se lo slot della prenotazione rientra nei nuovi orari
    const bookingStartTime = booking.startTime;
    let slotAvailable = false;

    for (const timeSlot of newDaySchedule.slots) {
      if (bookingStartTime >= timeSlot.open && bookingStartTime < timeSlot.close) {
        slotAvailable = true;
        break;
      }
    }

    if (!slotAvailable) {
      affectedBookings.push(booking);
    }
  }

  return {
    affected: affectedBookings.length,
    bookings: affectedBookings,
  };
};

/* =====================================================
   GET /campi/struttura/:id (PUBLIC)
   Restituisce solo campi ATTIVI
===================================================== */
export const getCampiByStruttura = async (req: Request, res: Response) => {
  try {
    console.log("🏟️  GET /campi/struttura/:id (PUBLIC)");
    
    console.log("🔍 Cercando campi attivi per struttura:", req.params.id);
    const campi = await Campo.find({
      struttura: req.params.id,
      isActive: true,
    }).populate('sport').sort({ name: 1 });

    console.log(`✅ Trovati ${campi.length} campi attivi`);
    console.log("📤 Invio lista campi attivi");
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

    console.log("🔍 Verificando struttura ownership...");
    // Verifica che la struttura appartenga all'utente
    const struttura = await Struttura.findOne({
      _id: req.params.id,
      owner: req.user!.id,
    });

    if (!struttura) {
      console.log("❌ Struttura non trovata o non autorizzato");
      return res.status(403).json({ message: "Non autorizzato" });
    }

    console.log("🔍 Cercando tutti i campi per struttura...");
    // Trova TUTTI i campi (anche isActive: false)
    const campi = await Campo.find({
      struttura: req.params.id,
    }).populate('sport').sort({ name: 1 });
    
    console.log(`✅ Trovati ${campi.length} campi totali`);
    console.log("📤 Invio lista tutti campi");
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
      console.log("❌ Dati mancanti: strutturaId o campi");
      return res.status(400).json({ 
        message: "ID struttura e campi sono obbligatori" 
      });
    }

    console.log("🔍 Verificando ownership struttura...");
    // Verifica ownership
    const struttura = await Struttura.findOne({
      _id: strutturaId,
      owner: req.user!.id,
      isDeleted: false,
    });

    if (!struttura) {
      console.log("❌ Struttura non trovata o non autorizzato:", strutturaId);
      return res.status(404).json({ 
        message: "Struttura non trovata o non autorizzato" 
      });
    }

    // Validazione
    for (const campo of campi) {
      if (!campo.name || !campo.sport || !campo.surface || !campo.pricePerHour) {
        console.log("❌ Validazione fallita per campo:", campo.name);
        return res.status(400).json({ 
          message: "Tutti i campi devono avere nome, sport, superficie e prezzo" 
        });
      }
    }

    console.log("💾 Creando campi nel database...");
    // ✅ CORREZIONE: Crea i campi includendo pricingRules
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
      // ✅ AGGIUNTO: pricingRules (usa quello inviato dal frontend o crea default)
      pricingRules: c.pricingRules || {
        mode: "flat",
        flatPrices: { 
          oneHour: c.pricePerHour || 20, 
          oneHourHalf: (c.pricePerHour || 20) * 1.4 
        },
        basePrices: { 
          oneHour: c.pricePerHour || 20, 
          oneHourHalf: (c.pricePerHour || 20) * 1.4 
        },
        timeSlotPricing: { enabled: false, slots: [] },
        dateOverrides: { enabled: false, dates: [] },
        periodOverrides: { enabled: false, periods: [] },
        playerCountPricing: { enabled: false, prices: [] },
      },
    }));

    const createdCampi = await Campo.insertMany(campiToCreate);
    console.log(`✅ ${createdCampi.length} campi creati per struttura ${strutturaId}`);

    console.log("📅 Generando calendari annuali...");
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

    console.log("📤 Invio risposta creazione campi");
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
    
    console.log("🔍 Cercando campo...");
    const campo = await Campo.findById(req.params.id).populate("struttura").populate("sport");

    if (!campo) {
      console.log("❌ Campo non trovato:", req.params.id);
      return res.status(404).json({ message: "Campo non trovato" });
    }

    console.log("📋 Campo caricato:", campo.name, "- isActive:", campo.isActive);
    console.log("🏟️  Struttura popolata:", campo.struttura?.name || "N/A");
    console.log("📤 Invio dettaglio campo");
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
      console.log("❌ Mese non fornito o invalido");
      return res.status(400).json({ message: "month richiesto (YYYY-MM)" });
    }

    console.log("🔍 Cercando giorni calendario per mese:", month);
    const days = await CampoCalendarDay.find({
      campo: id,
      date: { $regex: `^${month}` },
    }).sort({ date: 1 });

    console.log(`✅ Trovati ${days.length} giorni per ${month}`);
    console.log("📤 Invio calendario mensile");
    res.json(days);
  } catch (err) {
    console.error("❌ getCampoCalendarByMonth error:", err);
    res.status(500).json({ message: "Errore caricamento calendario" });
  }
};

/* =====================================================
   PUT /campi/:id (OWNER)
===================================================== */
export const updateCampo = async (req: AuthRequest, res: Response) => {
  try {
    console.log("🔄 PUT /campi/:id");
    const { id } = req.params;
    const { 
      name, 
      sport, 
      surface, 
      maxPlayers, 
      indoor, 
      pricePerHour, 
      isActive,
      weeklySchedule,
      forceUpdate // Flag per forzare l'aggiornamento ignorando i warning
    } = req.body;

    console.log("🔍 Cercando campo da aggiornare...");
    const campo = await Campo.findById(id).populate("struttura");
    if (!campo) {
      console.log("❌ Campo non trovato:", id);
      return res.status(404).json({ message: "Campo non trovato" });
    }

    // Verifica ownership
    if ((campo.struttura as any).owner.toString() !== req.user!.id) {
      console.log("❌ Non autorizzato per campo:", id);
      return res.status(403).json({ message: "Non autorizzato" });
    }

    console.log("⚠️ Controllando impatto prenotazioni...");
    // ✅ Se cambiano gli orari, controlla l'impatto sulle prenotazioni
    if (weeklySchedule && !forceUpdate) {
      const impact = await checkBookingsImpact(campo, weeklySchedule);
      
      if (impact.affected > 0) {
        console.log(`⚠️ ${impact.affected} prenotazioni future verrebbero cancellate`);
        return res.status(409).json({
          message: "Attenzione: modificando gli orari alcune prenotazioni saranno cancellate",
          warning: true,
          affectedBookings: impact.affected,
          bookings: impact.bookings.map((b: any) => ({
            _id: b._id,
            date: b.date,
            startTime: b.startTime,
            endTime: b.endTime,
            user: b.user,
          })),
        });
      }
    }

    // Aggiorna solo i campi forniti
    if (name !== undefined) campo.name = name;
    if (sport !== undefined) campo.sport = sport;
    if (surface !== undefined) campo.surface = surface;
    if (maxPlayers !== undefined) campo.maxPlayers = maxPlayers;
    if (indoor !== undefined) campo.indoor = indoor;
    if (pricePerHour !== undefined) campo.pricePerHour = pricePerHour;
    if (isActive !== undefined) campo.isActive = isActive;
    
    // Se cambiano gli orari settimanali, rigenera il calendario
    if (weeklySchedule) {
      campo.weeklySchedule = weeklySchedule;
      console.log("📅 weeklySchedule modificato, rigenerazione calendario...");
      
      // Se forceUpdate è true, cancella le prenotazioni impattate
      if (forceUpdate) {
        const impact = await checkBookingsImpact(campo, weeklySchedule);
        if (impact.affected > 0) {
          console.log(`🗑️ Cancellazione di ${impact.affected} prenotazioni...`);
          const bookingIds = impact.bookings.map((b: any) => b._id);
          await Booking.updateMany(
            { _id: { $in: bookingIds } },
            { $set: { status: "cancelled", cancelledBy: "system", cancelledReason: "Orari campo modificati" } }
          );
          console.log(`✅ ${impact.affected} prenotazioni cancellate`);
        }
      }
      
      await generateAnnualCalendarForCampo(campo);
    }

    console.log("💾 Salvando aggiornamenti campo...");
    await campo.save();

    console.log("✅ Campo aggiornato:", campo.name);
    console.log("📤 Invio risposta aggiornamento campo");
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
    
    console.log("🔍 Cercando campo da eliminare...");
    const campo = await Campo.findById(req.params.id);

    if (!campo) {
      console.log("❌ Campo non trovato");
      return res.status(404).json({ message: "Campo non trovato" });
    }

    console.log("🔍 Verificando ownership...");
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
    
    console.log("🗑️ Eliminando calendario associato...");
    // Elimina anche il calendario associato
    await CampoCalendarDay.deleteMany({ campo: req.params.id });
    console.log("✅ Calendario eliminato");
    
    console.log("🗑️ Eliminando campo...");
    await Campo.findByIdAndDelete(req.params.id);

    console.log("✅ Campo eliminato:", campoNome);
    console.log("📤 Invio conferma eliminazione campo");
    res.json({ message: "Campo eliminato con successo" });
  } catch (err) {
    console.error("❌ deleteCampo error:", err);
    res.status(500).json({ message: "Errore eliminazione campo" });
  }
};

/**
 * 📌 CHIUDE UN GIORNO COMPLETAMENTE
 * DELETE /campi/:campoId/calendar/:date
 */
export const closeCalendarDay = async (req: AuthRequest, res: Response) => {
  try {
    const { campoId, date } = req.params;
    const ownerId = req.user!.id;

    console.log(`🔒 Chiusura giorno ${date} per campo ${campoId}`);

    console.log("🔍 Verificando campo ownership...");
    // Verifica che il campo appartenga all'owner
    const campo = await Campo.findById(campoId).populate("struttura");
    if (!campo) {
      console.log("❌ Campo non trovato:", campoId);
      return res.status(404).json({ message: "Campo non trovato" });
    }

    if ((campo.struttura as any).owner.toString() !== ownerId) {
      console.log("❌ Non autorizzato per campo:", campoId);
      return res.status(403).json({ message: "Non autorizzato" });
    }

    console.log("🔍 Cercando giorno calendario...");
    // Trova il giorno nel calendario
    let calendarDay = await CampoCalendarDay.findOne({
      campo: campoId,
      date,
    });

    if (!calendarDay) {
      console.log("❌ Giorno non trovato:", date);
      return res.status(404).json({ message: "Giorno non trovato" });
    }

    console.log("🔍 Cercando prenotazioni da cancellare...");
    // ❌ Cancella tutte le prenotazioni confermate per questo giorno
    const bookingsToCancel = await Booking.find({
      campo: campoId,
      date,
      status: "confirmed",
    });

    if (bookingsToCancel.length > 0) {
      console.log(`⚠️ Trovate ${bookingsToCancel.length} prenotazioni da cancellare`);
      
      console.log("🗑️ Cancellando prenotazioni...");
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

    console.log("🔒 Salvando chiusura giorno...");
    // 🔒 Svuota tutti gli slot (giorno chiuso)
    calendarDay.slots = [];
    calendarDay.isClosed = true;
    await calendarDay.save();

    console.log("✅ Giorno chiuso completamente");
    console.log("📤 Invio risposta chiusura giorno");
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

    console.log("🔍 Verificando campo ownership...");
    // Verifica che il campo appartenga all'owner
    const campo = await Campo.findById(campoId).populate("struttura");
    if (!campo) {
      console.log("❌ Campo non trovato:", campoId);
      return res.status(404).json({ message: "Campo non trovato" });
    }

    if ((campo.struttura as any).owner.toString() !== ownerId) {
      console.log("❌ Non autorizzato per campo:", campoId);
      return res.status(403).json({ message: "Non autorizzato" });
    }

    console.log("🔍 Cercando giorno calendario...");
    // Trova o crea il giorno nel calendario
    let calendarDay = await CampoCalendarDay.findOne({
      campo: campoId,
      date,
    });

    if (!calendarDay) {
      console.log("❌ Giorno non trovato:", date);
      return res.status(404).json({ message: "Giorno non trovato" });
    }

    console.log("🔓 Ricreando slot per riapertura...");
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
    console.log("📤 Invio risposta riapertura giorno");
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

    console.log("🔍 Verificando campo ownership...");
    // Verifica che il campo appartenga all'owner
    const campo = await Campo.findById(campoId).populate("struttura");
    if (!campo) {
      console.log("❌ Campo non trovato:", campoId);
      return res.status(404).json({ message: "Campo non trovato" });
    }

    if ((campo.struttura as any).owner.toString() !== ownerId) {
      console.log("❌ Non autorizzato per campo:", campoId);
      return res.status(403).json({ message: "Non autorizzato" });
    }

    console.log("🔍 Cercando giorno calendario...");
    const calendarDay = await CampoCalendarDay.findOne({
      campo: campoId,
      date,
    });

    if (!calendarDay) {
      console.log("❌ Giorno non trovato:", date);
      return res.status(404).json({ message: "Giorno non trovato" });
    }

    const slot = calendarDay.slots.find((s: any) => s.time === time);
    if (!slot) {
      console.log("❌ Slot non trovato:", time);
      return res.status(404).json({ message: "Slot non trovato" });
    }

    console.log("🔍 Cercando prenotazione per slot...");
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
        console.log("🗑️ Cancellando prenotazione...");
        bookingToCancel.status = "cancelled";
        await bookingToCancel.save();
        console.log("✅ Prenotazione cancellata");
      }
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