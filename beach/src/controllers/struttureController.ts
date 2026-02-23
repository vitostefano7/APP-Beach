import { Request, Response } from "express";
import Struttura from "../models/Strutture";
import Campo from "../models/Campo";
import Booking from "../models/Booking";
import CampoCalendarDay from "../models/campoCalendarDay";
import Match from "../models/Match";
import { AuthRequest } from "../middleware/authMiddleware";
import axios from "axios";
import cloudinary from "../config/cloudinary";

/**
 * 🌍 Calcola distanza tra due coordinate geografiche (formula Haversine)
 * @param lat1 Latitudine punto 1
 * @param lng1 Longitudine punto 1
 * @param lat2 Latitudine punto 2
 * @param lng2 Longitudine punto 2
 * @returns Distanza in km
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Raggio della Terra in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 📌 GET /strutture
 * Tutte le strutture pubbliche (PLAYER) - CON SPORTS AGGREGATI
 * Query params: 
 *   - date (YYYY-MM-DD), timeSlot (Mattina|Pomeriggio|Sera)
 *   - city (string): filtra per città
 *   - lat, lng, radius (number): filtra per coordinate geografiche e raggio in km
 */
export const getStrutture = async (req: Request, res: Response) => {
  try {
    const { date, timeSlot, city, lat, lng, radius } = req.query;

    console.log('📌 [getStrutture] Inizio:', { date, timeSlot, city, lat, lng, radius });

    // 🔍 Costruisci query di base
    const query: any = {
      isActive: true,
      isDeleted: false,
    };

    // 🌍 Filtro geografico per città
    if (city && typeof city === 'string') {
      query['location.city'] = { $regex: new RegExp(`^${city.trim()}$`, 'i') };
      console.log('📍 [getStrutture] Filtro per città:', city);
    }

    console.log('🔍 [getStrutture] Ricerca strutture con filtri:', query);
    let strutture = await Struttura.find(query)
      .sort({ isFeatured: -1, createdAt: -1 })
      .lean();

    // 📏 Filtro geografico per coordinate e raggio
    if (lat && lng && radius) {
      const centerLat = parseFloat(lat as string);
      const centerLng = parseFloat(lng as string);
      const maxRadius = parseFloat(radius as string);

      if (!isNaN(centerLat) && !isNaN(centerLng) && !isNaN(maxRadius)) {
        console.log('📍 [getStrutture] Filtro per coordinate:', { centerLat, centerLng, maxRadius });
        
        // Calcola distanza per ogni struttura e filtra
        strutture = strutture.filter((s) => {
          if (!s.location?.lat || !s.location?.lng) return false;
          
          const distance = calculateDistance(
            centerLat, 
            centerLng, 
            s.location.lat, 
            s.location.lng
          );
          
          return distance <= maxRadius;
        });
        
        console.log(`✅ [getStrutture] Strutture entro ${maxRadius}km: ${strutture.length}`);
      }
    }

    // Se sono specificati date e timeSlot, filtra per disponibilità
    if (date && timeSlot) {
      const dateStr = date as string;
      const timeSlotStr = timeSlot as string;
      
      // Determina l'intervallo orario basato sul timeSlot
      let startHour: number, endHour: number;
      if (timeSlotStr === "Mattina (6:00 - 12:00)") {
        startHour = 6;
        endHour = 12;
      } else if (timeSlotStr === "Pomeriggio (12:00 - 18:00)") {
        startHour = 12;
        endHour = 18;
      } else if (timeSlotStr === "Sera (18:00 - 24:00)") {
        startHour = 18;
        endHour = 24;
      } else {
        return res.status(400).json({ message: "TimeSlot non valido" });
      }

      // Verifica che la data/orario sia nel futuro
      const now = new Date();
      const selectedDate = new Date(dateStr);
      const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      if (selectedDate < currentDate) {
        // Data nel passato - nessuna struttura disponibile
        strutture = [];
      } else if (selectedDate.toDateString() === currentDate.toDateString()) {
        // Oggi - verifica orario corrente
        if (now.getHours() >= endHour) {
          strutture = [];
        } else {
          startHour = Math.max(startHour, now.getHours());
        }
      }

      if (strutture.length > 0) {
        // Filtra strutture che hanno almeno un campo disponibile
        const availableStrutture = [];
        
        for (const struttura of strutture) {
          const campi = await Campo.find({
            struttura: struttura._id,
            isActive: true,
          }).select('_id');
          
          let hasAvailableSlot = false;
          
          for (const campo of campi) {
            // Verifica disponibilità nel calendario
            const calendarDay = await CampoCalendarDay.findOne({
              campo: campo._id,
              date: dateStr,
            });
            
            if (calendarDay) {
              // Controlla se ci sono slot disponibili nell'intervallo
              const availableSlots = (calendarDay as any).slots.filter((slot: any) => {
                if (!slot.enabled) return false;
                
                const [slotHour] = slot.time.split(':').map(Number);
                return slotHour >= startHour && slotHour < endHour;
              });
              
              if (availableSlots.length > 0) {
                // Verifica che non ci siano prenotazioni confermate
                const conflicts = await Booking.find({
                  campo: campo._id,
                  date: dateStr,
                  startTime: { $in: availableSlots.map((s: any) => s.time) },
                  status: 'confirmed'
                });
                
                if (conflicts.length < availableSlots.length) {
                  hasAvailableSlot = true;
                  break;
                }
              }
            }
          }
          
          if (hasAvailableSlot) {
            availableStrutture.push(struttura);
          }
        }
        
        strutture = availableStrutture;
      }
    }

    const struttureWithSports = await Promise.all(
      strutture.map(async (struttura) => {
        const campi = await Campo.find({
          struttura: struttura._id,
          isActive: true,
        })
          .select('sport indoor pricePerHour')
          .populate('sport', 'name code')
          .lean();

        const sportsSet = new Set<string>();
        campi.forEach((campo: any) => {
          const sportValue = campo.sport;

          if (sportValue && typeof sportValue === 'object') {
            const normalizedSport = sportValue.name || sportValue.code;
            if (normalizedSport) {
              sportsSet.add(String(normalizedSport));
            }
            return;
          }

          if (typeof sportValue === 'string' && sportValue.trim()) {
            sportsSet.add(sportValue.trim());
          }
        });
        const sports = Array.from(sportsSet);

        const pricePerHour =
          campi.length > 0 
            ? Math.min(...campi.map((c) => c.pricePerHour))
            : 0;

        const indoor = campi.some((c) => c.indoor);

        // ✅ Conta le partite aperte SOLO se la struttura ha split payment abilitato
        const campoIds = campi.map(c => c._id);
        let openMatchesCount = 0;
        
        if (struttura.isCostSplittingEnabled) {
          openMatchesCount = await Match.countDocuments({
            booking: {
              $in: await Booking.find({
                campo: { $in: campoIds },
                status: 'confirmed'
              }).distinct('_id')
            },
            status: 'open'
          });
        }

        return {
          ...struttura,
          sports,
          pricePerHour,
          indoor,
          hasOpenGames: openMatchesCount > 0 && struttura.isCostSplittingEnabled,
          openGamesCount: openMatchesCount,
        };
      })
    );

    // Debug: verifica se openingHours è presente
    if (struttureWithSports.length > 0) {
      console.log('=== DEBUG STRUTTURE CON SPORTS ===');
      console.log('Prima struttura ID:', struttureWithSports[0]._id);
      console.log('Nome:', struttureWithSports[0].name);
      console.log('OpeningHours presente:', !!struttureWithSports[0].openingHours);
      console.log('OpeningHours:', JSON.stringify(struttureWithSports[0].openingHours, null, 2));
    }

    res.json(struttureWithSports);
  } catch (err) {
    console.error("Errore getStrutture:", err);
    res.status(500).json({ message: "Errore caricamento strutture" });
  }
};

/**
 * 📌 GET /strutture/:id
 * Dettaglio singola struttura
 */
export const getStrutturaById = async (req: Request, res: Response) => {
  try {
    console.log('📌 [getStrutturaById] Inizio:', { id: req.params.id });

    console.log('🔍 [getStrutturaById] Ricerca struttura');
    const struttura = await Struttura.findOne({
      _id: req.params.id,
      isDeleted: false,
    });
    if (!struttura) {
      console.log('⚠️ [getStrutturaById] Struttura non trovata');
      return res.status(404).json({ message: "Struttura non trovata" });
    }

    console.log('✅ [getStrutturaById] Struttura trovata');
    res.json(struttura);
  } catch (err) {
    console.error("❌ [getStrutturaById] Errore:", err);
    res.status(500).json({ message: "Errore struttura" });
  }
};

/**
 * 📌 GET /strutture/:id/campi
 * Tutti i campi di una struttura
 */
export const getCampiByStruttura = async (
  req: Request,
  res: Response
) => {
  try {
    console.log('📌 [getCampiByStruttura] Inizio:', { strutturaId: req.params.id });

    console.log('🔍 [getCampiByStruttura] Ricerca campi');
    const campi = await Campo.find({
      struttura: req.params.id,
      isActive: true,
    }).populate('sport').sort({ pricePerHour: 1 });

    console.log('✅ [getCampiByStruttura] Campi trovati:', campi.length);
    res.json(campi);
  } catch (err) {
    console.error("❌ [getCampiByStruttura] Errore:", err);
    res.status(500).json({ message: "Errore caricamento campi" });
  }
};

/**
 * 📌 GET /strutture/owner/me
 * Strutture dell'owner loggato
 */
export const getOwnerStrutture = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    console.log('📌 [getOwnerStrutture] Inizio:', { ownerId: req.user!.id });

    console.log('🔍 [getOwnerStrutture] Ricerca strutture owner');
    const strutture = await Struttura.find({
      owner: req.user!.id,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    console.log('✅ [getOwnerStrutture] Strutture trovate:', strutture.length);
    res.json(strutture);
  } catch (err) {
    console.error("❌ [getOwnerStrutture] Errore:", err);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * 📌 POST /strutture
 * Crea nuova struttura (OWNER)
 */
export const createStruttura = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { name, description, phone, phoneNumber, location, amenities, openingHours, isCostSplittingEnabled } = req.body;

    console.log('📌 [createStruttura] Inizio:', { ownerId: req.user!.id, name, location });

    if (!name || !location?.city) {
      console.log('⚠️ [createStruttura] Nome o città mancanti');
      return res.status(400).json({ 
        message: "Nome e citta sono obbligatori" 
      });
    }

    if (!location.lat || !location.lng) {
      console.log('⚠️ [createStruttura] Coordinate mancanti');
      return res.status(400).json({ 
        message: "Coordinate mancanti. Seleziona un indirizzo valido" 
      });
    }

    console.log('🏗️ [createStruttura] Creazione struttura');
    const struttura = new Struttura({
      name,
      description,
      phone: phone ?? phoneNumber,
      owner: req.user!.id,
      location: {
        address: location.address,
        city: location.city,
        lat: location.lat,
        lng: location.lng,
        coordinates: location.coordinates || [location.lng, location.lat],
      },
      amenities: amenities || [],
      openingHours: openingHours || {},
      isActive: true,
      isFeatured: false,
      isDeleted: false,
      isCostSplittingEnabled: !!isCostSplittingEnabled,
    });

    await struttura.save();
    console.log("✅ Struttura creata:", struttura._id);

    res.status(201).json({
      message: "Struttura creata con successo",
      struttura,
    });
  } catch (err) {
    console.error("❌ [createStruttura] Errore:", err);
    res.status(500).json({ message: "Errore creazione struttura" });
  }
};

/**
 * 📌 PUT /strutture/:id
 * Modifica struttura (OWNER)
 */
export const updateStruttura = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    console.log('📌 [updateStruttura] Inizio:', { id: req.params.id, ownerId: req.user!.id });
    console.log("\n💾 === UPDATE STRUTTURA ===");
    console.log("🆔 Struttura ID:", req.params.id);
    console.log("👤 User ID:", req.user?.id);
    console.log("📦 Body:");
    console.log(JSON.stringify(req.body, null, 2));

    const struttura = await Struttura.findOne({
      _id: req.params.id,
      owner: req.user!.id,
      isDeleted: false,
    });

    if (!struttura) {
      console.log("❌ Struttura non trovata o non autorizzato");
      return res.status(404).json({ 
        message: "Struttura non trovata o non autorizzato" 
      });
    }

    console.log("✅ Struttura trovata:", struttura.name);

    const { name, description, phone, phoneNumber, location, amenities, openingHours, isActive, forceUpdate, isCostSplittingEnabled } = req.body;

    // ✅ Se cambiano gli orari di apertura, controlla l'impatto sui campi e prenotazioni
    if (openingHours && !forceUpdate) {
      console.log("🔍 Controllo impatto sui campi e prenotazioni...");
      
      const campi = await Campo.find({ struttura: struttura._id });
      console.log(`📋 Trovati ${campi.length} campi`);
      
      let totalAffectedBookings = 0;
      const affectedBookingsDetails = [];

      for (const campo of campi) {
        console.log(`\n🔍 Analizzando campo: ${campo.name}`);
        
        // Controlla se il campo ha orari personalizzati o usa quelli della struttura
        const usesStrutturaHours = !campo.weeklySchedule || 
          Object.keys(campo.weeklySchedule).length === 0;

        console.log(`   📅 Usa orari struttura: ${usesStrutturaHours}`);

        if (usesStrutturaHours) {
          // Simula il nuovo weeklySchedule basato sui nuovi openingHours
          const newWeeklySchedule: any = {};
          const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
          
          for (const day of DAYS) {
            const dayHours = openingHours[day];
            newWeeklySchedule[day] = {
              enabled: dayHours && !dayHours.closed,
              slots: dayHours?.slots || [],
            };
          }

          console.log(`   📆 Nuovo schedule generato`);

          // Usa la funzione checkBookingsImpact (devi importarla o copiarla)
          const today = new Date().toISOString().split("T")[0];
          const WEEK_MAP = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
          
          const futureBookings = await Booking.find({
            campo: campo._id,
            date: { $gte: today },
            status: { $in: ["confirmed", "pending"] },
          }).lean();

          console.log(`   📅 Prenotazioni future trovate: ${futureBookings.length}`);

          for (const booking of futureBookings) {
            const bookingDate = new Date(booking.date + "T12:00:00");
            const weekday = WEEK_MAP[bookingDate.getDay()];
            const newDaySchedule = newWeeklySchedule[weekday];

            if (!newDaySchedule?.enabled || !newDaySchedule.slots || newDaySchedule.slots.length === 0) {
              console.log(`   ❌ Prenotazione ${booking._id} (${booking.date} ${booking.startTime}) - Giorno chiuso`);
              totalAffectedBookings++;
              affectedBookingsDetails.push({
                ...booking,
                campoName: campo.name,
              });
              continue;
            }

            const bookingStartTime = booking.startTime;
            let slotAvailable = false;

            for (const timeSlot of newDaySchedule.slots) {
              if (bookingStartTime >= timeSlot.open && bookingStartTime < timeSlot.close) {
                slotAvailable = true;
                break;
              }
            }

            if (!slotAvailable) {
              console.log(`   ❌ Prenotazione ${booking._id} (${booking.date} ${booking.startTime}) - Slot non disponibile`);
              totalAffectedBookings++;
              affectedBookingsDetails.push({
                ...booking,
                campoName: campo.name,
              });
            } else {
              console.log(`   ✅ Prenotazione ${booking._id} (${booking.date} ${booking.startTime}) - OK`);
            }
          }
        }
      }

      if (totalAffectedBookings > 0) {
        console.log(`\n⚠️ TOTALE: ${totalAffectedBookings} prenotazioni future verrebbero cancellate`);
        return res.status(409).json({
          message: "Attenzione: modificando gli orari alcune prenotazioni saranno cancellate",
          warning: true,
          affectedBookings: totalAffectedBookings,
          bookings: affectedBookingsDetails.slice(0, 10), // Limita a 10 per non appesantire
        });
      }
      
      console.log("✅ Nessuna prenotazione impattata, procedo con l'aggiornamento");
    }

    // Aggiorna flag isCostSplittingEnabled se specificato
    if (typeof isCostSplittingEnabled !== "undefined") {
      struttura.isCostSplittingEnabled = !!isCostSplittingEnabled;
    }

    if (name) struttura.name = name;
    if (description !== undefined) struttura.description = description;
    if (phone !== undefined || phoneNumber !== undefined) {
      struttura.phone = phone ?? phoneNumber;
    }
    
    if (location) {
      struttura.location = {
        ...struttura.location,
        ...location,
        coordinates: location.coordinates || [location.lng, location.lat],
      };
    }
    
    // ✅ AMENITIES - Supporta array e oggetto legacy
    if (amenities !== undefined) {
      if (Array.isArray(amenities)) {
        console.log("✅ Amenities array:", amenities);
        struttura.amenities = amenities;
      } else if (typeof amenities === 'object' && amenities !== null) {
        console.log("⚠️ Amenities oggetto (legacy), converto");
        
        const italianToEnglish: Record<string, string> = {
          'Bagni': 'toilets',
          'Spogliatoi': 'lockerRoom',
          'Docce': 'showers',
          'Parcheggio': 'parking',
          'Ristorante': 'restaurant',
          'Bar': 'bar',
        };
        
        struttura.amenities = Object.entries(amenities)
          .filter(([_, value]) => value === true)
          .map(([key]) => italianToEnglish[key] || key);
          
        console.log("✅ Convertito in:", struttura.amenities);
      }
    }
    
    if (openingHours !== undefined) {
      // ✅ SEMPRE rigenera quando arrivano openingHours (l'utente ha modificato qualcosa)
      const openingHoursChanged = true; // Forza rigenerazione
      console.log("🔍 OpeningHours ricevuti, forzo rigenerazione");
      console.log("📊 Vecchi:", JSON.stringify(struttura.openingHours));
      console.log("📊 Nuovi:", JSON.stringify(openingHours));
      
      struttura.openingHours = openingHours;
      
      // ✅ SEMPRE rigenera i calendari se gli orari cambiano
      if (openingHoursChanged) {
        console.log("🔄 Orari modificati, rigenerazione calendari...");
        const campi = await Campo.find({ struttura: struttura._id });
        console.log(`📋 Trovati ${campi.length} campi da rigenerare`);
        
        const today = new Date().toISOString().split("T")[0];
        const WEEK_MAP = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
        
        for (const campo of campi) {
          // Sincronizza weeklySchedule del campo con openingHours della struttura
          const newWeeklySchedule: any = {};
          
          for (const day of DAYS) {
            const dayHours = openingHours[day];
            newWeeklySchedule[day] = {
              enabled: dayHours && !dayHours.closed,
              slots: dayHours?.slots || [],
            };
          }
          
          campo.weeklySchedule = newWeeklySchedule;
          await campo.save();
          console.log(`✅ Campo "${campo.name}" sincronizzato`);
          
          // ✅ Se forceUpdate, cancella anche le prenotazioni incompatibili
          if (forceUpdate) {
            const futureBookings = await Booking.find({
              campo: campo._id,
              date: { $gte: today },
              status: { $in: ["confirmed", "pending"] },
            });

            for (const booking of futureBookings) {
              const bookingDate = new Date(booking.date + "T12:00:00");
              const weekday = WEEK_MAP[bookingDate.getDay()];
              const newDaySchedule = newWeeklySchedule[weekday];

              let shouldCancel = false;

              if (!newDaySchedule?.enabled || !newDaySchedule.slots || newDaySchedule.slots.length === 0) {
                shouldCancel = true;
              } else {
                const bookingStartTime = booking.startTime;
                let slotAvailable = false;

                for (const timeSlot of newDaySchedule.slots) {
                  if (bookingStartTime >= timeSlot.open && bookingStartTime < timeSlot.close) {
                    slotAvailable = true;
                    break;
                  }
                }

                if (!slotAvailable) {
                  shouldCancel = true;
                }
              }

              if (shouldCancel) {
                booking.status = "cancelled";
                booking.cancelledBy = "system";
                booking.cancelledReason = "Orari struttura modificati";
                await booking.save();
                console.log(`🗑️ Prenotazione ${booking._id} cancellata`);
              }
            }
          }
          
          // Rigenera calendario
          await regenerateCalendarForCampo(campo);
        }
        
        console.log(`✅ ${campi.length} campi rigenerati`);
      }
    }
    
    if (isActive !== undefined) struttura.isActive = isActive;

    await struttura.save();
    console.log("✅ Struttura salvata:", struttura._id);

    res.json({
      message: "Struttura aggiornata con successo",
      struttura,
    });
  } catch (err) {
    console.error("❌ Errore updateStruttura:", err);
    res.status(500).json({ message: "Errore aggiornamento struttura" });
  }
};

/**
 * 📌 DELETE /strutture/:id
 * Elimina struttura (OWNER) con cleanup Cloudinary
 */
export const deleteStruttura = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    console.log('📌 [deleteStruttura] Inizio:', { id: req.params.id, ownerId: req.user!.id });
    console.log("🗑️ Eliminazione struttura:", req.params.id);
    
    const struttura = await Struttura.findOne({
      _id: req.params.id,
      owner: req.user!.id,
      isDeleted: false,
    });

    if (!struttura) {
      return res.status(404).json({ 
        message: "Struttura non trovata o non autorizzato" 
      });
    }

    // ✅ Elimina immagini da Cloudinary
    if (struttura.images && struttura.images.length > 0) {
      console.log(`🗑️ Eliminazione di ${struttura.images.length} immagini da Cloudinary...`);
      
      for (const imageUrl of struttura.images) {
        if (imageUrl.includes("cloudinary.com")) {
          try {
            // Estrai public_id dall'URL
            const urlParts = imageUrl.split("/");
            const uploadIndex = urlParts.indexOf("upload");
            if (uploadIndex !== -1) {
              const publicIdWithExt = urlParts.slice(uploadIndex + 2).join("/");
              const publicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf("."));
              
              await cloudinary.uploader.destroy(publicId, {
                invalidate: true,
                resource_type: "image"
              });
              console.log("✅ Immagine eliminata:", publicId);
            }
          } catch (cloudError) {
            console.error("⚠️ Errore eliminazione immagine Cloudinary:", cloudError);
            // Continua con le altre
          }
        }
      }
    }

    // Elimina campi associati
    const campiEliminati = await Campo.deleteMany({ struttura: req.params.id });
    console.log(`✅ ${campiEliminati.deletedCount} campi eliminati`);

    // Elimina struttura
    await Struttura.findByIdAndDelete(req.params.id);
    console.log("✅ Struttura eliminata:", struttura.name);

    res.json({ message: "Struttura, campi e immagini eliminati con successo" });
  } catch (err) {
    console.error("❌ Errore deleteStruttura:", err);
    res.status(500).json({ message: "Errore eliminazione struttura" });
  }
};

/**
 * 📌 GET /strutture/search-address
 * Proxy per Nominatim
 */
export const searchAddress = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;

    console.log('📌 [searchAddress] Inizio:', { query });

    if (!query || typeof query !== "string" || query.length < 3) {
      console.log('⚠️ [searchAddress] Query troppo corta');
      return res.status(400).json({ 
        message: "Query deve essere almeno 3 caratteri" 
      });
    }

    console.log("🔍 Cercando:", query);

    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: query,
          countrycodes: "it",
          format: "json",
          addressdetails: 1,
          limit: 5,
        },
        headers: {
          "User-Agent": "SportApp/1.0 (contact@sportapp.com)",
        },
        timeout: 5000,
      }
    );

    console.log("✅ Risultati:", response.data.length);

    const suggestions = response.data.map((item: any) => ({
      place_id: item.place_id,
      display_name: item.display_name,
      lat: item.lat,
      lon: item.lon,
      address: {
        city: item.address?.city,
        town: item.address?.town,
        village: item.address?.village,
        municipality: item.address?.municipality,
        road: item.address?.road,
        postcode: item.address?.postcode,
      },
    }));

    res.json(suggestions);
  } catch (err: any) {
    console.error("❌ Errore searchAddress:", err.message);
    
    if (err.response) {
      return res.status(err.response.status).json({ 
        message: "Errore dal servizio di geocoding" 
      });
    }
    
    res.status(500).json({ message: "Errore ricerca indirizzo" });
  }
};

/* =====================================================
   HELPER FUNCTIONS
===================================================== */

const generateHalfHourSlots = (open: string, close: string) => {
  const slots = [];
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

const regenerateCalendarForCampo = async (campo: any) => {
  const WEEK_MAP = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const currentYear = new Date().getFullYear();
  
  for (const year of [currentYear, currentYear + 1]) {
    const operations = [];

    // ✅ Itera per ogni giorno dell'anno usando solo le date (senza ore)
    for (let dayOfYear = 0; dayOfYear < 365 + (year % 4 === 0 ? 1 : 0); dayOfYear++) {
      const d = new Date(year, 0, 1 + dayOfYear);
      const weekday = WEEK_MAP[d.getDay()];
      const campoSchedule = campo.weeklySchedule[weekday];
      const date = `${year}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      let allSlots: { time: string; enabled: boolean }[] = [];

      if (campoSchedule?.enabled && campoSchedule.slots && Array.isArray(campoSchedule.slots)) {
        campoSchedule.slots.forEach((timeSlot: any) => {
          const slotsForThisRange = generateHalfHourSlots(timeSlot.open, timeSlot.close);
          allSlots.push(...slotsForThisRange);
        });
      }

      operations.push({
        updateOne: {
          filter: { campo: campo._id, date },
          update: { 
            $set: { 
              slots: allSlots,
              isClosed: allSlots.length === 0 
            } 
          },
          upsert: true,
        },
      });
    }

    await CampoCalendarDay.bulkWrite(operations);
  }
  
  console.log(`✅ Calendario rigenerato per ${campo.name}`);
};