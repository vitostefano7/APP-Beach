import { Response } from "express";
import Campo from "../models/Campo";
import Struttura from "../models/Strutture";
import CampoCalendarDay from "../models/campoCalendarDay";
import { AuthRequest } from "../middleware/authMiddleware";

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

/**
 * Aggiorna la disponibilità settimanale di un campo
 * e rigenera automaticamente il calendario annuale
 */
export const updateCampoAvailability = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    console.log("🧩 updateCampoAvailability", req.params.id);
    console.log("📦 Body:", req.body);

    const { day, enabled, open, close } = req.body;

    // Validazione input
    if (!day || !WEEK_MAP.includes(day as any)) {
      console.log("❌ Giorno non valido:", day);
      return res.status(400).json({ 
        message: "Giorno non valido. Usa: monday, tuesday, etc." 
      });
    }

    if (enabled && (!open || !close)) {
      console.log("❌ Parametri mancanti per enabled=true");
      return res.status(400).json({ 
        message: "Se enabled=true, open e close sono obbligatori" 
      });
    }

    console.log("🔍 Cercando campo...");
    // Trova campo e verifica ownership
    const campo = await Campo.findById(req.params.id);
    if (!campo) {
      console.log("❌ Campo non trovato:", req.params.id);
      return res.status(404).json({ message: "Campo non trovato" });
    }

    console.log("🔍 Verificando ownership struttura...");
    const struttura = await Struttura.findOne({
      _id: campo.struttura,
      owner: req.user!.id,
    });

    if (!struttura) {
      console.log("❌ Non autorizzato per campo:", req.params.id);
      return res.status(403).json({ message: "Non autorizzato" });
    }

    console.log("💾 Salvando weeklySchedule...");
    // Aggiorna weeklySchedule
    campo.weeklySchedule[day] = {
      enabled: enabled ?? false,
      open: enabled ? open : "09:00",
      close: enabled ? close : "22:00",
    };

    await campo.save();
    console.log(`✅ weeklySchedule.${day} aggiornato`);

    console.log("🔄 Rigenerando calendario annuale...");
    // 🔥 RIGENERA IL CALENDARIO ANNUALE
    await regenerateAnnualCalendar(campo);

    console.log("📤 Invio risposta aggiornamento disponibilità");
    res.json({
      message: "Disponibilità e calendario aggiornati",
      weeklySchedule: campo.weeklySchedule,
    });
  } catch (err) {
    console.error("❌ updateCampoAvailability error:", err);
    res.status(500).json({ message: "Errore aggiornamento disponibilità" });
  }
};

/**
 * Rigenera il calendario annuale per l'anno corrente
 * basandosi sul weeklySchedule del campo
 */
async function regenerateAnnualCalendar(campo: any) {
  const year = new Date().getFullYear();
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);

  console.log(`📅 Rigenerazione calendario per ${campo.name}...`);

  const updates: any[] = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const weekday = WEEK_MAP[d.getDay()];
    const daySchedule = campo.weeklySchedule[weekday];
    const date = d.toISOString().split("T")[0];

    const slots = daySchedule.enabled
      ? generateHalfHourSlots(daySchedule.open, daySchedule.close)
      : [];

    updates.push({
      updateOne: {
        filter: { campo: campo._id, date },
        update: { $set: { slots } },
        upsert: true,
      },
    });
  }

  await CampoCalendarDay.bulkWrite(updates);
  console.log(`✅ Calendario aggiornato: ${updates.length} giorni`);
}