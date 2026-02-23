import { Response } from "express";
import mongoose from "mongoose";
import Booking from "../models/Booking";
import Campo from "../models/Campo";
import CampoCalendarDay from "../models/campoCalendarDay";
import Match from "../models/Match";
import Struttura from "../models/Strutture";
import Sport from "../models/Sport";
import User from "../models/User";
import { AuthRequest } from "../middleware/authMiddleware";
import { calculatePrice } from "../utils/pricingUtils";
import { getDefaultMaxPlayersForSport } from "../utils/matchSportRules";
import { createNotification } from "../utils/notificationHelper";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

const parsePagination = (query: any) => {
  const rawPage = Number(query?.page ?? 1);
  const rawLimit = Number(query?.limit ?? DEFAULT_PAGE_SIZE);

  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const limit = Number.isFinite(rawLimit) && rawLimit > 0
    ? Math.min(Math.floor(rawLimit), MAX_PAGE_SIZE)
    : DEFAULT_PAGE_SIZE;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

const isPastBookingTime = (booking: any, now: Date) => {
  if (booking.status === "cancelled") return true;
  const end = new Date(`${booking.date}T${booking.endTime}:00`);
  return end.getTime() < now.getTime();
};

const isUpcomingBookingTime = (booking: any, now: Date) => {
  if (booking.status === "cancelled") return false;
  const start = new Date(`${booking.date}T${booking.startTime}:00`);
  return start.getTime() > now.getTime();
};

const isOngoingBookingTime = (booking: any, now: Date) => {
  if (booking.status === "cancelled") return false;
  const start = new Date(`${booking.date}T${booking.startTime}:00`);
  const end = new Date(`${booking.date}T${booking.endTime}:00`);
  return now.getTime() >= start.getTime() && now.getTime() <= end.getTime();
};

const getNowParts = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const today = `${year}-${month}-${day}`;
  const nowTime = now.toTimeString().slice(0, 5);
  return { today, nowTime };
};

const buildPastCondition = (today: string, nowTime: string) => ({
  $or: [
    { status: "cancelled" },
    { date: { $lt: today } },
    { date: today, endTime: { $lt: nowTime } },
  ],
});

const buildUpcomingCondition = (today: string, nowTime: string) => ({
  status: { $ne: "cancelled" },
  $or: [
    { date: { $gt: today } },
    { date: today, startTime: { $gt: nowTime } },
  ],
});

const buildOngoingCondition = (today: string, nowTime: string) => ({
  status: { $ne: "cancelled" },
  date: today,
  startTime: { $lte: nowTime },
  endTime: { $gte: nowTime },
});

const isValidPendingInviteBooking = (booking: any, now: Date, cutoffHours = 2) => {
  if (!booking) return false;
  if (booking.status === "cancelled") return false;
  if (!booking.date || !booking.startTime) return false;

  try {
    const start = new Date(`${booking.date}T${booking.startTime}:00`);
    const cutoff = new Date(start.getTime() - cutoffHours * 60 * 60 * 1000);
    return now.getTime() <= cutoff.getTime();
  } catch {
    return false;
  }
};

const buildUserMatchFlags = ({
  userId,
  bookingOwnerId,
  matchData,
}: {
  userId: string;
  bookingOwnerId: string;
  matchData?: any;
}) => {
  const isMyBooking = bookingOwnerId === userId;
  const myPlayer = matchData?.players?.find((p: any) => p?.user?._id?.toString?.() === userId);

  const isParticipant = myPlayer?.status === "confirmed";
  const isPendingInvite = !isMyBooking && myPlayer?.status === "pending";
  const isInviteAccepted = !isMyBooking && myPlayer?.status === "confirmed" && !!myPlayer?.respondedAt;
  const isInviteDeclined = !isMyBooking && myPlayer?.status === "declined" && !!myPlayer?.respondedAt;
  const isOpenJoinParticipant = !isMyBooking && myPlayer?.status === "confirmed" && !myPlayer?.respondedAt;

  const isInvitedPlayer = isPendingInvite || isInviteAccepted || isInviteDeclined;

  const participationType = isMyBooking
    ? "created"
    : isOpenJoinParticipant
      ? "open_join"
      : isInviteAccepted
        ? "invite_accepted"
        : isInviteDeclined
          ? "invite_declined"
          : isPendingInvite
            ? "invite_pending"
            : null;

  return {
    isMyBooking,
    isParticipant,
    isInvitedPlayer,
    isPendingInvite,
    isInviteAccepted,
    isInviteDeclined,
    isOpenJoinParticipant,
    participationType,
  };
};

/* =====================================================
   PLAYER
===================================================== */

/**
 * 📌 CREA PRENOTAZIONE
 * POST /bookings
 * Body: { campoId, date, startTime, duration }
 */
export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { campoId, date, startTime, duration = "1h", bookingType = "public", paymentMode, maxPlayers, numberOfPeople } = req.body;

    console.log("🏐 Nuova prenotazione:", {
      campoId,
      date,
      startTime,
      duration,
      bookingType,
      maxPlayers,
      userId: user?.id,
    });

    if (!campoId || !date || !startTime) {
      return res
        .status(400)
        .json({ message: "Dati mancanti: campoId, date, startTime richiesti" });
    }

    // Valida duration
    if (duration !== "1h" && duration !== "1.5h") {
      return res
        .status(400)
        .json({ message: "Duration non valida: ammessi solo '1h' o '1.5h'" });
    }

    // Valida bookingType
    if (bookingType !== "private" && bookingType !== "public") {
      return res
        .status(400)
        .json({ message: "bookingType non valido: ammessi solo 'private' o 'public'" });
    }

    // Valida paymentMode
    if (paymentMode && paymentMode !== "full" && paymentMode !== "split") {
      return res.status(400).json({ message: "paymentMode non valido: ammessi solo 'full' o 'split'" });
    }

    // Deriva paymentMode se non fornito
    const paymentModeDerived = paymentMode || (bookingType === "public" ? "split" : "full");

    // Se bookingType è public, paymentMode deve essere split
    if (bookingType === "public" && paymentModeDerived !== "split") {
      return res.status(400).json({ message: "Per prenotazioni pubbliche, paymentMode deve essere 'split'" });
    }

    if (user.role === "owner") {
      return res.status(403).json({ message: "Un owner non può prenotare" });
    }

    console.log("🔍 Verificando campo esistente...");
    // 🔍 Verifica campo
    const campo = await Campo.findById(campoId).populate("struttura");
    if (!campo || !(campo as any).isActive) {
      console.log("❌ Campo non trovato o non attivo:", campoId);
      return res.status(404).json({ message: "Campo non disponibile" });
    }

    console.log("🔍 Verificando disponibilità slot nel calendario...");
    // 🔍 Verifica slot disponibile nel calendario
    const calendarDay = await CampoCalendarDay.findOne({
      campo: campoId,
      date,
    });

    if (!calendarDay) {
      console.log("❌ Giorno non trovato nel calendario:", { campoId, date });
      return res.status(404).json({ message: "Giorno non trovato nel calendario" });
    }

    const slot = (calendarDay as any).slots.find((s: any) => s.time === startTime);

    if (!slot) {
      return res.status(404).json({ message: "Slot non trovato" });
    }

    if (!slot.enabled) {
      return res.status(400).json({ message: "Slot non disponibile" });
    }

    console.log("⛔ Verificando conflitti prenotazione...");
    // ⛔ Verifica conflitto prenotazione
    const conflict = await Booking.findOne({
      campo: campoId,
      date,
      startTime,
      status: "confirmed",
    });

    if (conflict) {
      console.log("❌ Conflitto prenotazione trovato:", conflict._id);
      return res.status(400).json({ message: "Orario già prenotato" });
    }

    // 🔍 Se durata è 1.5h, verifica che anche il secondo slot sia disponibile
    let secondSlot = null;
    if (duration === "1.5h") {
      const [h, m] = startTime.split(":").map(Number);
      let nextH = h;
      let nextM = m + 30;
      if (nextM >= 60) {
        nextH++;
        nextM = 0;
      }
      const nextSlotTime = `${String(nextH).padStart(2, "0")}:${String(nextM).padStart(2, "0")}`;

      secondSlot = (calendarDay as any).slots.find((s: any) => s.time === nextSlotTime);

      if (!secondSlot) {
        return res.status(400).json({
          message: "Slot successivo non trovato per prenotazione da 1.5h",
        });
      }

      if (!secondSlot.enabled) {
        return res.status(400).json({
          message: "Slot successivo non disponibile per prenotazione da 1.5h",
        });
      }

      // Verifica conflitto anche sul secondo slot
      const secondConflict = await Booking.findOne({
        campo: campoId,
        date,
        startTime: nextSlotTime,
        status: "confirmed",
      });

      if (secondConflict) {
        return res.status(400).json({
          message: "Slot successivo già prenotato",
        });
      }
    }

    const struttura = (campo as any).struttura;

    // Regola operativa: le partite pubbliche sono permesse solo se la struttura permette lo split dei costi
    if (bookingType === "public" && !struttura?.isCostSplittingEnabled) {
      return res.status(400).json({ message: "Partite pubbliche non consentite: la struttura non permette la divisione del costo" });
    }

    // 🔢 Validazione numberOfPeople (se fornito)
    if (typeof numberOfPeople !== "undefined") {
      const np = Number(numberOfPeople);
      if (!Number.isInteger(np) || np < 2) {
        return res.status(400).json({ message: "numberOfPeople deve essere un intero >= 2" });
      }
      if (np > (campo as any).maxPlayers) {
        return res.status(400).json({ message: `numberOfPeople non può superare maxPlayers del campo (${(campo as any).maxPlayers})` });
      }

      // Popola il campo sport per verificare se richiede numero pari
      await campo.populate("sport");
      const sport = (campo as any).sport;
      
      // Verifica se lo sport richiede numero pari di giocatori
      if (sport && sport.requiresEvenPlayers && np % 2 !== 0) {
        return res.status(400).json({ 
          message: `${sport.name} richiede un numero pari di giocatori` 
        });
      }

      // Se la struttura richiede l'uso delle tariffe per player, verifica che esista una voce corrispondente
      if (struttura?.isCostSplittingEnabled && (campo as any).pricingRules?.playerCountPricing?.enabled) {
        const prices = (campo as any).pricingRules.playerCountPricing.prices || [];
        const match = prices.find((p: any) => p.count === np);
        if (!match) {
          return res.status(400).json({ message: `Nessuna tariffa per ${np} giocatori presente nel campo` });
        }
      }
    }

    console.log("💰 Calcolando prezzo prenotazione...");
    // 💰 Calcola prezzo usando il sistema deterministico (ora restituisce totalPrice/unitPrice)
    const priceResult = calculatePrice(
      (campo as any).pricingRules,
      date,
      startTime,
      duration,
      { isCostSplittingEnabled: !!struttura?.isCostSplittingEnabled, numberOfPeople: numberOfPeople }
    );

    console.log(`💰 Prezzo calcolato: €${priceResult.totalPrice} (${duration})`, priceResult);

    // Calcola endTime
    const durationMinutes = duration === "1h" ? 60 : 90;
    const [h, m] = String(startTime).split(":").map(Number);
    let endH = h;
    let endM = m + durationMinutes;
    if (endM >= 60) {
      endH += Math.floor(endM / 60);
      endM = endM % 60;
    }
    const endTime = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

    // 💰 Calcola guadagno owner (100% del prezzo della prenotazione)
    const ownerEarnings = priceResult.totalPrice;

    console.log("✅ Creando prenotazione nel database...");
    // ✅ Crea booking
    const booking = await Booking.create({
      bookingType,
      paymentMode: paymentModeDerived,
      user: user.id,
      campo: campoId,
      struttura: (campo as any).struttura._id || (campo as any).struttura,
      date,
      startTime,
      endTime,
      duration: duration === "1h" ? 1 : 1.5,
      price: priceResult.totalPrice,
      unitPrice: priceResult.unitPrice,
      numberOfPeople: typeof numberOfPeople !== "undefined" ? Number(numberOfPeople) : undefined,
      status: "confirmed",
      ownerEarnings,
    });

    console.log("🔒 Disabilitando slot nel calendario...");
    // 🔒 Disabilita lo slot nel calendario
    slot.enabled = false;
    if (secondSlot) {
      secondSlot.enabled = false;
    }
    await calendarDay.save();

    console.log("✅ Prenotazione creata:", booking._id);

    // � Registra guadagno per l'owner
    try {
      const strutturaOwnerId = struttura.owner;
      if (strutturaOwnerId) {
        const ownerUser = await User.findById(strutturaOwnerId);
        if (ownerUser) {
          // Aggiungi transazione ai guadagni
          if (!ownerUser.earnings) {
            ownerUser.earnings = [];
          }
          ownerUser.earnings.push({
            type: "booking",
            amount: ownerEarnings,
            booking: new mongoose.Types.ObjectId(booking._id),
            description: `Guadagno da prenotazione ${campo.name} - ${date} ${startTime}`,
            createdAt: new Date(),
          } as any);
          
          // Aggiorna bilancio totale
          ownerUser.totalEarnings = (ownerUser.totalEarnings || 0) + ownerEarnings;
          
          await ownerUser.save();
          console.log(`💰 Guadagno di €${ownerEarnings} registrato per owner ${strutturaOwnerId}`);
        }
      }
    } catch (earningsError) {
      console.error("❌ Errore registrazione guadagni owner:", earningsError);
      // Non fallire la prenotazione per un errore di guadagni
    }

    // �📢 Crea notifica per il proprietario della struttura
    try {
      console.log("🔍 [NOTIFICA] Controllo proprietario struttura...");
      const strutturaOwner = struttura.owner;
      console.log("🔍 [NOTIFICA] Proprietario struttura:", strutturaOwner);
      
      if (strutturaOwner) {
        console.log("📝 [NOTIFICA] Creazione notifica per:", strutturaOwner);
        console.log("📝 [NOTIFICA] Dettagli: campo =", campo.name, ", date =", date, ", startTime =", startTime);
        
        const userDoc = await User.findById(user.id).select('name');
        const userName = userDoc?.name || 'Utente';
        
        await createNotification(
          new mongoose.Types.ObjectId(strutturaOwner),
          new mongoose.Types.ObjectId(user.id),
          "new_booking",
          "Nuova prenotazione confermata",
          `Prenotazione per ${campo.name} presso ${struttura.name} da ${userName} {userSurname} il ${date} alle ${startTime}`,
          new mongoose.Types.ObjectId(booking._id),
          "Booking"
        );
        console.log("✅ [NOTIFICA] Notifica creata con successo per il proprietario:", strutturaOwner);
      } else {
        console.log("⚠️ [NOTIFICA] Nessun proprietario trovato per la struttura:", struttura._id);
      }
    } catch (notificationError) {
      console.error("❌ [NOTIFICA] Errore creazione notifica:", notificationError);
      // Non fallire la prenotazione per un errore di notifica
    }

    // 🆕 Determina maxPlayers basandosi sul tipo di sport del campo
    await campo.populate("sport");
    const sport = campo.sport as any;
    
    // Se l'utente ha specificato maxPlayers (numberOfPeople), usa quello
    // Altrimenti usa il maxPlayers del campo (che è già validato contro lo sport)
    const finalMaxPlayers = (typeof numberOfPeople !== "undefined" && numberOfPeople)
      ? Number(numberOfPeople)
      : campo.maxPlayers;

    console.log("🆕 Creando match associato...");
    // 🆕 Crea automaticamente un Match associato
    const match = await Match.create({
      booking: new mongoose.Types.ObjectId(booking._id),
      createdBy: new mongoose.Types.ObjectId(user.id),
      players: [
        {
          user: new mongoose.Types.ObjectId(user.id),
          status: "confirmed",
          team: "A", // Assegna automaticamente al Team A
          joinedAt: new Date(),
        },
      ],
      maxPlayers: finalMaxPlayers, // Usa il valore selezionato o il default
      isPublic: bookingType === "public",
      status: "open", // Cambiato da "draft" a "open" per rendere visibile il match
    });

    console.log("✅ Match creato automaticamente:", match._id, `con ${finalMaxPlayers} giocatori max (${sport?.name || 'sport non specificato'})`);

    console.log("📤 Popolando dati prenotazione per risposta...");
    // Popola i dati per la risposta
    const populatedBooking = await Booking.findById(booking._id)
      .populate({
        path: "campo",
        populate: {
          path: "struttura",
          select: "name location images",
        },
      })
      .populate("user", "name email");

    console.log("📤 Invio risposta prenotazione creata");
    res.status(201).json(populatedBooking);
  } catch (err) {
    console.error("❌ createBooking error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * Registra un pagamento per una prenotazione
 * POST /bookings/:id/payments
 * Body: { amount, method?, status? }
 */
export const addPaymentToBooking = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { amount, method, status } = req.body;

    console.log("💳 Aggiungendo pagamento a prenotazione:", { id, amount, method, status });

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("❌ ID prenotazione non valido:", id);
      return res.status(400).json({ message: "ID prenotazione non valido" });
    }

    console.log("🔍 Cercando prenotazione per pagamento...");
    const booking = await Booking.findById(id).populate({
      path: "campo",
      populate: { path: "struttura", select: "name location images" },
    });

    if (!booking) {
      console.log("❌ Prenotazione non trovata per pagamento:", id);
      return res.status(404).json({ message: "Prenotazione non trovata" });
    }

    // Minimal: accetta qualsiasi utente autenticato come pagatore.
    const payment = {
      user: user.id,
      amount: Number(amount) || 0,
      method: method || "manual",
      status: status || "completed",
      createdAt: new Date(),
    };

    console.log("✅ Aggiungendo pagamento al database...");
    (booking as any).payments.push(payment);
    await booking.save();

    // Calcola paidAmount e remainingAmount
    const paidAmount = (booking as any).payments
      .filter((p: any) => p.status === "completed")
      .reduce((s: number, p: any) => s + Number(p.amount || 0), 0);

    const remainingAmount = Number((booking as any).price || 0) - paidAmount;

    console.log("📤 Popolando dati aggiornati per risposta...");
    // Rispondi con lo stato aggiornato
    const populated = await Booking.findById(booking._id)
      .populate({ path: "campo", populate: { path: "struttura", select: "name location images" } })
      .populate("user", "name email");

    const responseObj: any = populated ? populated.toObject({ versionKey: false }) : booking;
    responseObj.paidAmount = paidAmount;
    responseObj.remainingAmount = remainingAmount;

    console.log("📤 Invio risposta pagamento aggiunto");
    res.status(201).json(responseObj);
  } catch (err) {
    console.error("❌ addPaymentToBooking error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * 📌 PRENOTAZIONI DEL PLAYER (con hasMatch)
 * GET /bookings/me
 */
// In bookingController.ts - getMyBookings
// bookingController.ts - getMyBookings (VERSIONE CORRETTA)
/**
 * 📌 PRENOTAZIONI DEL PLAYER (con hasMatch)
 * GET /bookings/me
 */
/**
 * 📌 PRENOTAZIONI DEL PLAYER (con hasMatch)
 * GET /bookings/me
 */
export const getMyBookings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    console.log("📋 Caricamento prenotazioni utente:", userId);

    console.log("🔍 Cercando match dell'utente (confermati e pendenti)...");
    // 1. Trova tutti i match dove l'utente è un player (confermato O pendente)
    const myMatches = await Match.find({
      'players.user': userId
    }).select('booking');

    // Estrai gli ID delle prenotazioni dai match e converti in ObjectId
    const matchBookingIds = myMatches.map(m => new mongoose.Types.ObjectId(m.booking.toString()));
    
    console.log(`✅ Trovati ${matchBookingIds.length} match (confermati e pendenti)`);

    console.log("🔍 Cercando prenotazioni dell'utente...");
    // 2. Trova tutte le prenotazioni:
    //    - create dall'utente OPPURE
    //    - associate a match dove l'utente è confermato
    const bookings = await Booking.find({
      $or: [
        { user: new mongoose.Types.ObjectId(userId) }, // Prenotazioni create dall'utente
        { _id: { $in: matchBookingIds } } // Prenotazioni dei match dove è player
      ]
    })
      .populate({
        path: "campo",
        populate: [
          {
            path: "struttura",
            select: "name location images",
          },
          {
            path: "sport",
            select: "name code icon",
          }
        ],
      })
      .sort({ date: -1, startTime: -1 });

    // 3. Prende tutti i match collegati con populate dei player
    const bookingIds = bookings.map(b => b._id);
    const matches = await Match.find({ booking: { $in: bookingIds } })
      .populate("players.user", "name surname username avatarUrl")
      .populate("createdBy", "name surname username avatarUrl")
      .select('booking status players maxPlayers isPublic winner score createdBy');

    // 4. Crea una mappa bookingId -> match
    const matchMap = new Map();
    matches.forEach(match => {
      matchMap.set(match.booking.toString(), {
        _id: match._id,
        status: match.status,
        players: match.players,
        maxPlayers: match.maxPlayers,
        isPublic: match.isPublic,
        winner: match.winner,
        sets: match.score?.sets || [],
        createdBy: match.createdBy,
      });
    });

    // 5. Costruisci il risultato con info aggiuntive
    const result = bookings.map(booking => {
      const bookingObj = (booking as any).toObject();
      const matchData = matchMap.get(booking._id.toString());
      
      const {
        isMyBooking,
        isParticipant,
        isInvitedPlayer,
        isPendingInvite,
        isInviteAccepted,
        isInviteDeclined,
        isOpenJoinParticipant,
        participationType,
      } = buildUserMatchFlags({
        userId,
        bookingOwnerId: bookingObj.user.toString(),
        matchData,
      });
      
      // Crea matchSummary se il match ha un risultato
      let matchSummary = null;
      if (matchData?.winner && matchData?.sets && matchData.sets.length > 0) {
        matchSummary = {
          winner: matchData.winner,
          sets: matchData.sets,
        };
      }
      
      return {
        ...bookingObj,
        hasMatch: !!matchData,
        matchId: matchData?._id,
        matchSummary,
        isMyBooking, // true se hai creato tu la prenotazione
        isInvitedPlayer, // true se sei stato invitato da qualcun altro
        isParticipant, // true se partecipi alla partita (status confirmed)
        isPendingInvite,
        isInviteAccepted,
        isInviteDeclined,
        isOpenJoinParticipant,
        participationType,
        players: matchData?.players || [],
        maxPlayers: matchData?.maxPlayers || 4,
      };
    });

    console.log(`✅ ${result.length} prenotazioni totali trovate`);
    console.log(`   - ${result.filter((b: any) => b.isMyBooking).length} create da te`);
    console.log(`   - ${result.filter((b: any) => b.isInvitedPlayer).length} come player invitato`);
    
    console.log("📤 Invio lista prenotazioni utente");
    res.json(result);
  } catch (err) {
    console.error("❌ getMyBookings error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * 📌 PRENOTAZIONI DEL PLAYER PAGINATE
 * GET /bookings/me/paginated?page=1&limit=10&timeFilter=upcoming|past|invites
 */
export const getMyBookingsPaginated = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const { page, limit, skip } = parsePagination(req.query);
    const timeFilter = String(req.query?.timeFilter || "upcoming");
    const now = new Date();
    const { today, nowTime } = getNowParts();

    const [participantBookingIdsRaw, pendingInviteBookingIdsRaw] = await Promise.all([
      Match.distinct("booking", {
        players: { $elemMatch: { user: userObjectId, status: "confirmed" } },
      }),
      Match.distinct("booking", {
        createdBy: { $ne: userObjectId },
        players: { $elemMatch: { user: userObjectId, status: "pending" } },
      }),
    ]);

    const participantBookingIds = Array.from(new Set(participantBookingIdsRaw.map((id: any) => id.toString()))).map(
      (id) => new mongoose.Types.ObjectId(id)
    );
    const pendingInviteBookingIdsCandidates = Array.from(new Set(pendingInviteBookingIdsRaw.map((id: any) => id.toString()))).map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    const pendingInviteBookings = pendingInviteBookingIdsCandidates.length
      ? await Booking.find({ _id: { $in: pendingInviteBookingIdsCandidates } }).select("_id date startTime status")
      : [];

    const pendingInviteBookingIds = pendingInviteBookings
      .filter((booking) => isValidPendingInviteBooking(booking, now))
      .map((booking) => booking._id);

    const baseQuery: any = {
      $or: [
        { user: userObjectId },
        { _id: { $in: participantBookingIds } },
      ],
    };

    const upcomingOrOngoingCondition = {
      $or: [buildUpcomingCondition(today, nowTime), buildOngoingCondition(today, nowTime)],
    };

    const andQuery = (...conditions: any[]) => ({
      $and: conditions.filter(Boolean),
    });

    const countsQuery = {
      all: Booking.countDocuments(baseQuery),
      upcoming: Booking.countDocuments(andQuery(baseQuery, upcomingOrOngoingCondition)),
      past: Booking.countDocuments(andQuery(baseQuery, buildPastCondition(today, nowTime))),
      invites: pendingInviteBookingIds.length
        ? Booking.countDocuments(
            andQuery({ _id: { $in: pendingInviteBookingIds }, user: { $ne: userObjectId } })
          )
        : Promise.resolve(0),
    };

    let listQuery: any = { ...baseQuery };
    let sort: any = { date: 1, startTime: 1 };

    if (timeFilter === "past") {
      listQuery = andQuery(baseQuery, buildPastCondition(today, nowTime));
      sort = { date: -1, startTime: -1 };
    } else if (timeFilter === "invites") {
      listQuery = andQuery({ _id: { $in: pendingInviteBookingIds }, user: { $ne: userObjectId } });
      sort = { date: 1, startTime: 1 };
    } else {
      listQuery = andQuery(baseQuery, upcomingOrOngoingCondition);
      sort = { date: 1, startTime: 1 };
    }

    const [counts, total, pageBookings] = await Promise.all([
      Promise.all([countsQuery.all, countsQuery.upcoming, countsQuery.past, countsQuery.invites]).then(
        ([all, upcoming, past, invites]) => ({ all, upcoming, past, invites })
      ),
      Booking.countDocuments(listQuery),
      Booking.find(listQuery)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate({
          path: "campo",
          populate: [
            {
              path: "struttura",
              select: "name location images",
            },
            {
              path: "sport",
              select: "name code icon",
            },
          ],
        }),
    ]);

    const bookingIds = pageBookings.map((b) => b._id);
    const matches = bookingIds.length
      ? await Match.find({ booking: { $in: bookingIds } })
          .populate("players.user", "name surname username avatarUrl")
          .populate("createdBy", "name surname username avatarUrl")
          .select("booking status players maxPlayers isPublic winner score createdBy")
      : [];

    const matchMap = new Map<string, any>();
    matches.forEach((match) => {
      matchMap.set(match.booking.toString(), {
        _id: match._id,
        status: match.status,
        players: match.players,
        maxPlayers: match.maxPlayers,
        isPublic: match.isPublic,
        winner: match.winner,
        sets: match.score?.sets || [],
        createdBy: match.createdBy,
      });
    });

    const items = pageBookings.map((booking) => {
      const bookingObj = (booking as any).toObject();
      const matchData = matchMap.get(booking._id.toString());
      const {
        isMyBooking,
        isParticipant,
        isInvitedPlayer,
        isPendingInvite,
        isInviteAccepted,
        isInviteDeclined,
        isOpenJoinParticipant,
        participationType,
      } = buildUserMatchFlags({
        userId,
        bookingOwnerId: bookingObj.user.toString(),
        matchData,
      });

      let matchSummary = null;
      if (matchData?.winner && matchData?.sets && matchData.sets.length > 0) {
        matchSummary = {
          winner: matchData.winner,
          sets: matchData.sets,
        };
      }

      return {
        ...bookingObj,
        hasMatch: !!matchData,
        matchId: matchData?._id,
        matchSummary,
        isMyBooking,
        isInvitedPlayer,
        isParticipant,
        isPendingInvite,
        isInviteAccepted,
        isInviteDeclined,
        isOpenJoinParticipant,
        participationType,
        players: matchData?.players || [],
        maxPlayers: matchData?.maxPlayers || 4,
      };
    });

    return res.json({
      items,
      pagination: {
        page,
        limit,
        total,
        hasNext: page * limit < total,
      },
      counts,
    });
  } catch (err) {
    console.error("❌ getMyBookingsPaginated error:", err);
    return res.status(500).json({ message: "Errore server" });
  }
};


/**
 * 📌 SINGOLA PRENOTAZIONE
 * GET /bookings/:id
 * Accesso consentito a:
 * - creatore della prenotazione
 * - player del match associato
 */
/**
 * 📌 SINGOLA PRENOTAZIONE
 * GET /bookings/:id
 * Accesso consentito a:
 * - creatore della prenotazione
 * - player del match associato
 */
export const getBookingById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    console.log("📋 Caricamento dettaglio prenotazione:", id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("❌ ID prenotazione non valido:", id);
      return res.status(400).json({ message: "ID prenotazione non valido" });
    }

    console.log("🔍 Cercando prenotazione...");
    // 🔍 Recupera prenotazione
    const booking = await Booking.findById(id)
      .populate({
        path: "campo",
        populate: [
          {
            path: "struttura",
            select: "name location images",
          },
          {
            path: "sport",
            select: "name code icon",
          }
        ],
      })
      .populate("user", "name email");

    if (!booking) {
      console.log("❌ Prenotazione non trovata:", id);
      return res.status(404).json({ message: "Prenotazione non trovata" });
    }

    // ✅ 1. Verifica se è il creatore della prenotazione
    const isOwner = (booking as any).user._id.toString() === userId;

    console.log("🔍 Cercando match associato...");
    // 🔍 Recupera match associato (se esiste)
    const match = await Match.findOne({ booking: booking._id })
      .populate("players.user", "name surname username avatarUrl")
      .populate("createdBy", "name surname username avatarUrl")
      .populate({
        path: "booking",
        populate: {
          path: "campo",
          populate: {
            path: "struttura",
            select: "name location images",
          },
        },
      });

    // ✅ 2. Verifica se è player del match
    const isPlayer =
      match &&
      match.players.some(
        (p: any) => p.user._id.toString() === userId
      );

    // ✅ 3. Verifica se è un match pubblico con booking pubblico
    const isPublicBooking = (booking as any).bookingType === "public";
    const isPublicMatch = match && match.isPublic;

    // ❌ Non autorizzato se:
    // - Non è owner
    // - Non è player
    // - E il booking/match NON sono pubblici
    if (!isOwner && !isPlayer && !(isPublicBooking && isPublicMatch)) {
      console.log("❌ Accesso non autorizzato alla prenotazione:", id);
      return res.status(403).json({ message: "Non autorizzato" });
    }

    // 🧱 Costruzione risposta
    const bookingObj = booking.toObject({ versionKey: false });
    
    // Type assertion per campo e struttura
    const campo = bookingObj.campo as any;
    const struttura = campo?.struttura as any;

    const responseData: any = {
      ...bookingObj,
      _id: bookingObj._id.toString(),
      user: {
        ...bookingObj.user,
        _id: bookingObj.user._id.toString(),
      },
      campo: {
        ...campo,
        _id: campo._id.toString(),
        struttura: {
          ...struttura,
          _id: struttura._id.toString(),
        },
      },
      hasMatch: !!match,
      match: null,
    };

    // Calcola paidAmount e remainingAmount se ci sono pagamenti
    const payments = (bookingObj as any).payments || [];
    const paidAmount = payments.filter((p: any) => p.status === "completed").reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
    const remainingAmount = Number(bookingObj.price || 0) - paidAmount;
    responseData.paidAmount = paidAmount;
    responseData.remainingAmount = remainingAmount;

    // Breakdown per giocatore se presente numberOfPeople/unitPrice
    if (bookingObj.numberOfPeople && bookingObj.unitPrice) {
      // Raggruppa pagamenti per user
      const perPlayerPayments: any = {};
      payments.forEach((p: any) => {
        const uid = p.user?.toString() || "unknown";
        perPlayerPayments[uid] = (perPlayerPayments[uid] || 0) + Number(p.amount || 0);
      });
      responseData.perPlayerPayments = perPlayerPayments;
      responseData.playerShare = Number(bookingObj.unitPrice || 0);
    }

    // ➕ Aggiungi match se presente
    if (match) {
      const matchObj = match.toObject({ versionKey: false });

      responseData.matchId = matchObj._id.toString();
      responseData.match = {
        _id: matchObj._id.toString(),
        status: matchObj.status,
        maxPlayers: matchObj.maxPlayers,
        isPublic: matchObj.isPublic,
        winner: matchObj.winner,
        score: matchObj.score || { sets: [] },
        booking: matchObj.booking?.toString(),
        createdBy: {
          ...matchObj.createdBy,
          _id: matchObj.createdBy._id.toString(),
        },
        players: matchObj.players.map((p: any) => ({
          _id: p._id?.toString(),
          status: p.status,
          team: p.team,
          joinedAt: p.joinedAt,
          user: {
            ...p.user,
            _id: p.user._id.toString(),
          },
        })),
      };
    }

    console.log("📤 Invio dettaglio prenotazione");
    res.json(responseData);
  } catch (err) {
    console.error("❌ getBookingById error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};


/**
 * 📌 CANCELLA PRENOTAZIONE
 * DELETE /bookings/:id
 */
export const cancelBooking = async (req: AuthRequest, res: Response) => {
  try {
    console.log("🗑️ Cancellazione prenotazione:", req.params.id);

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("❌ ID non valido:", id);
      return res.status(400).json({ message: "ID non valido" });
    }

    console.log("🔍 Cercando prenotazione da cancellare...");
    const booking = await Booking.findById(id);

    if (!booking) {
      console.log("❌ Prenotazione non trovata:", id);
      return res.status(404).json({ message: "Prenotazione non trovata" });
    }

    if ((booking as any).user.toString() !== req.user!.id) {
      console.log("❌ Non autorizzato a cancellare prenotazione:", id);
      return res.status(403).json({ message: "Non autorizzato" });
    }

    if ((booking as any).status === "cancelled") {
      console.log("❌ Prenotazione già cancellata:", id);
      return res.status(400).json({ message: "Prenotazione già cancellata" });
    }

    console.log("✅ Cancellando prenotazione...");
    // Aggiorna status
    (booking as any).status = "cancelled";
    (booking as any).cancelledBy = "user";
    await booking.save();

    // 💰 Gestione rimborsi fittizi e deduzione guadagni owner
    try {
      const bookingPopulated = await Booking.findById(id).populate('campo');
      if (bookingPopulated) {
        const campo = await Campo.findById((bookingPopulated as any).campo._id).populate('struttura');
        if (campo) {
          const struttura = (campo as any).struttura;
          const ownerId = struttura?.owner;
          const ownerEarnings = (booking as any).ownerEarnings || 0;

          if (ownerId && ownerEarnings > 0) {
            const ownerUser = await User.findById(ownerId);
            if (ownerUser) {
              // Aggiungi transazione di rimborso (negativa)
              if (!ownerUser.earnings) {
                ownerUser.earnings = [];
              }
              ownerUser.earnings.push({
                type: "refund",
                amount: -ownerEarnings,
                booking: new mongoose.Types.ObjectId(id),
                description: `Rimborso per cancellazione prenotazione ${campo.name} - ${(booking as any).date} ${(booking as any).startTime}`,
                createdAt: new Date(),
              } as any);

              // Aggiorna bilancio totale
              ownerUser.totalEarnings = (ownerUser.totalEarnings || 0) - ownerEarnings;

              await ownerUser.save();
              console.log(`💰 Rimborso di €${ownerEarnings} dedotto dall'owner ${ownerId}`);

              // Marca tutti i pagamenti come "refunded"
              (booking as any).payments.forEach((payment: any) => {
                if (payment.status === "completed") {
                  payment.status = "refunded";
                }
              });
              await booking.save();

              // Invia notifica rimborso all'owner
              await createNotification(
                new mongoose.Types.ObjectId(ownerId),
                new mongoose.Types.ObjectId(req.user!.id),
                "booking_cancelled",
                "Prenotazione cancellata - Rimborso elaborato",
                `Prenotazione ${campo.name} cancellata. Rimborso di €${ownerEarnings} dedotto dai tuoi guadagni.`,
                new mongoose.Types.ObjectId(booking._id),
                "Booking"
              );
            }
          }
        }
      }
    } catch (refundError) {
      console.error("❌ Errore gestione rimborso:", refundError);
      // Non fallire la cancellazione per un errore di rimborso
    }

    console.log("🔓 Riabilitando slot nel calendario...");
    // 🔓 Riabilita lo slot nel calendario
    const calendarDay = await CampoCalendarDay.findOne({
      campo: (booking as any).campo,
      date: (booking as any).date,
    });

    if (calendarDay) {
      const slot = (calendarDay as any).slots.find(
        (s: any) => s.time === (booking as any).startTime
      );
      if (slot) {
        slot.enabled = true;

        // Se la prenotazione durava 1.5h, riabilita anche il secondo slot
        const startTime = (booking as any).startTime;
        const endTime = (booking as any).endTime;
        const [startH, startM] = startTime.split(":").map(Number);
        const [endH, endM] = endTime.split(":").map(Number);
        const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);

        if (durationMinutes === 90) {
          let nextH = startH;
          let nextM = startM + 30;
          if (nextM >= 60) {
            nextH++;
            nextM = 0;
          }
          const nextSlotTime = `${String(nextH).padStart(2, "0")}:${String(nextM).padStart(2, "0")}`;
          const secondSlot = (calendarDay as any).slots.find((s: any) => s.time === nextSlotTime);
          if (secondSlot) {
            secondSlot.enabled = true;
          }
        }

        await calendarDay.save();
        console.log("✅ Slot riabilitato nel calendario");
      }
    }

    console.log("✅ Prenotazione cancellata");
    res.json({ message: "Prenotazione cancellata con successo" });
  } catch (err) {
    console.error("❌ cancelBooking error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};

/* =====================================================
   OWNER
===================================================== */

/**
 * 📌 PRENOTAZIONI RICEVUTE DALL'OWNER
 * GET /bookings/owner
 */
export const getOwnerBookings = async (req: AuthRequest, res: Response) => {
  try {
    console.log("📋 Caricamento prenotazioni owner:", req.user!.id);

    const ownerId = req.user!.id;

    console.log("🔍 Caricamento strutture owner...");
    const ownerStrutture = await Struttura.find({ owner: ownerId }).select("_id").lean();

    if (!ownerStrutture.length) {
      console.log("ℹ️ Nessuna struttura per questo owner");
      return res.json([]);
    }

    const strutturaIds = ownerStrutture.map((s: any) => s._id);

    console.log("🔍 Caricamento campi owner...");
    const ownerCampi = await Campo.find({ struttura: { $in: strutturaIds } })
      .select("_id")
      .lean();

    if (!ownerCampi.length) {
      console.log("ℹ️ Nessun campo trovato per questo owner");
      return res.json([]);
    }

    const campoIds = ownerCampi.map((c: any) => c._id);

    console.log("🔍 Caricamento prenotazioni owner (query mirata)...");
    const bookings = await Booking.find({ campo: { $in: campoIds } })
      .populate({
        path: "campo",
        populate: [
          {
            path: "struttura",
            select: "name location",
          },
          {
            path: "sport",
          },
        ],
      })
      .populate("user", "name surname email avatarUrl")
      .sort({ date: 1, startTime: 1 })
      .lean();

    const matchIds = Array.from(
      new Set(
        bookings
          .map((b: any) => b.match)
          .filter((id: any) => id)
          .map((id: any) => String(id))
      )
    );

    let matchMap = new Map<string, any>();
    if (matchIds.length > 0) {
      const matches = await Match.find({ _id: { $in: matchIds } })
        .populate("players.user", "name surname username avatarUrl email")
        .populate("createdBy", "name surname username avatarUrl email")
        .lean();
      matchMap = new Map(matches.map((m: any) => [String(m._id), m]));
    }

    const bookingsWithMatch = bookings.map((booking: any) => {
      if (!booking.match) return booking;
      const populatedMatch = matchMap.get(String(booking.match));
      return populatedMatch ? { ...booking, match: populatedMatch } : booking;
    });

    console.log(`✅ ${bookingsWithMatch.length} prenotazioni trovate`);
    console.log("📤 Invio prenotazioni owner");
    res.json(bookingsWithMatch);
  } catch (err) {
    console.error("❌ getOwnerBookings error:", err);
    console.error("Error details:", err);
    res.status(500).json({ message: "Errore server", error: String(err) });
  }
};

/**
 * 📌 PRENOTAZIONI RICEVUTE DALL'OWNER PAGINATE
 * GET /bookings/owner/paginated?page=1&limit=10&timeFilter=all|upcoming|past|ongoing
 */
export const getOwnerBookingsPaginated = async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const { page, limit, skip } = parsePagination(req.query);
    const timeFilter = String(req.query?.timeFilter || "upcoming");
    const username = String(req.query?.username || "").trim().toLowerCase();
    const strutturaId = String(req.query?.strutturaId || "").trim();
    const campoId = String(req.query?.campoId || "").trim();
    const sportCode = String(req.query?.sport || "").trim().toLowerCase();
    const date = String(req.query?.date || "").trim();
    const { today, nowTime } = getNowParts();

    const emptyResponse = {
      items: [],
      pagination: { page, limit, total: 0, hasNext: false },
      counts: { all: 0, upcoming: 0, past: 0, ongoing: 0 },
    };

    const ownerStrutture = await Struttura.find({ owner: ownerId }).select("_id").lean();
    if (!ownerStrutture.length) {
      return res.json(emptyResponse);
    }

    const ownerStrutturaIds = ownerStrutture.map((s: any) => s._id.toString());

    let selectedStrutturaIds = ownerStrutturaIds;
    if (strutturaId) {
      if (!mongoose.Types.ObjectId.isValid(strutturaId) || !ownerStrutturaIds.includes(strutturaId)) {
        return res.json(emptyResponse);
      }
      selectedStrutturaIds = [strutturaId];
    }

    const campoQuery: any = {
      struttura: { $in: selectedStrutturaIds.map((id) => new mongoose.Types.ObjectId(id)) },
    };

    if (campoId) {
      if (!mongoose.Types.ObjectId.isValid(campoId)) {
        return res.json(emptyResponse);
      }
      campoQuery._id = new mongoose.Types.ObjectId(campoId);
    }

    if (sportCode) {
      const sport = await Sport.findOne({ code: sportCode }).select("_id").lean();
      if (!sport) {
        return res.json(emptyResponse);
      }
      campoQuery.sport = sport._id;
    }

    const filteredCampi = await Campo.find(campoQuery).select("_id").lean();
    if (!filteredCampi.length) {
      return res.json(emptyResponse);
    }

    const bookingBaseQuery: any = {
      campo: { $in: filteredCampi.map((c: any) => c._id) },
    };

    if (date) {
      bookingBaseQuery.date = date;
    }

    if (username) {
      const usernameRegex = new RegExp(username.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const matchingUsers = await User.find({
        $or: [{ name: usernameRegex }, { surname: usernameRegex }, { username: usernameRegex }],
      })
        .select("_id")
        .lean();

      if (!matchingUsers.length) {
        return res.json(emptyResponse);
      }

      bookingBaseQuery.user = { $in: matchingUsers.map((u: any) => u._id) };
    }

    const pastCondition = buildPastCondition(today, nowTime);
    const upcomingCondition = buildUpcomingCondition(today, nowTime);
    const ongoingCondition = buildOngoingCondition(today, nowTime);

    const counts = await Promise.all([
      Booking.countDocuments(bookingBaseQuery),
      Booking.countDocuments({ ...bookingBaseQuery, ...upcomingCondition }),
      Booking.countDocuments({ ...bookingBaseQuery, ...pastCondition }),
      Booking.countDocuments({ ...bookingBaseQuery, ...ongoingCondition }),
    ]).then(([all, upcoming, past, ongoing]) => ({ all, upcoming, past, ongoing }));

    let finalQuery: any = { ...bookingBaseQuery };
    let sort: any = { date: -1, startTime: -1 };

    if (timeFilter === "upcoming") {
      finalQuery = { ...bookingBaseQuery, ...upcomingCondition };
      sort = { date: 1, startTime: 1 };
    } else if (timeFilter === "past") {
      finalQuery = { ...bookingBaseQuery, ...pastCondition };
      sort = { date: -1, startTime: -1 };
    } else if (timeFilter === "ongoing") {
      finalQuery = { ...bookingBaseQuery, ...ongoingCondition };
      sort = { date: 1, startTime: 1 };
    }

    const [total, pageBookings] = await Promise.all([
      Booking.countDocuments(finalQuery),
      Booking.find(finalQuery)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate({
          path: "campo",
          populate: [
            {
              path: "struttura",
              select: "name location",
            },
            {
              path: "sport",
            },
          ],
        })
        .populate("user", "name surname email avatarUrl")
        .lean(),
    ]);

    const matchIds = Array.from(
      new Set(
        pageBookings
          .map((b: any) => b.match)
          .filter((id: any) => id)
          .map((id: any) => String(id))
      )
    );

    let matchMap = new Map<string, any>();
    if (matchIds.length > 0) {
      const matches = await Match.find({ _id: { $in: matchIds } })
        .populate("players.user", "name surname username avatarUrl email")
        .populate("createdBy", "name surname username avatarUrl email")
        .lean();
      matchMap = new Map(matches.map((m: any) => [String(m._id), m]));
    }

    const items = pageBookings.map((booking: any) => {
      if (!booking.match) return booking;
      const populatedMatch = matchMap.get(String(booking.match));
      return populatedMatch ? { ...booking, match: populatedMatch } : booking;
    });

    return res.json({
      items,
      pagination: {
        page,
        limit,
        total,
        hasNext: page * limit < total,
      },
      counts,
    });
  } catch (err) {
    console.error("❌ getOwnerBookingsPaginated error:", err);
    return res.status(500).json({ message: "Errore server" });
  }
};

/**
 * 📌 PRENOTAZIONI PER UN CAMPO SPECIFICO
 * GET /bookings/campo/:campoId?date=YYYY-MM-DD
 */
export const getBookingsByCampo = async (req: AuthRequest, res: Response) => {
  try {
    const { campoId } = req.params;
    const { date } = req.query;

    console.log("📋 Caricamento prenotazioni per campo:", campoId);

    if (!mongoose.Types.ObjectId.isValid(campoId)) {
      console.log("❌ ID campo non valido:", campoId);
      return res.status(400).json({ message: "ID campo non valido" });
    }

    const query: any = {
      campo: campoId,
      status: "confirmed",
    };

    if (date && typeof date === "string") {
      query.date = date;
    }

    console.log("🔍 Cercando prenotazioni per campo...");
    const bookings = await Booking.find(query)
      .populate("user", "name surname email")
      .sort({ startTime: 1 });

    console.log(`✅ ${bookings.length} prenotazioni trovate per campo`);
    console.log("📤 Invio prenotazioni campo");
    res.json(bookings);
  } catch (err) {
    console.error("❌ getBookingsByCampo error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * 📌 SINGOLA PRENOTAZIONE (OWNER)
 * GET /bookings/owner/:id
 */
export const getOwnerBookingById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ownerId = req.user!.id;

    console.log("📋 Caricamento dettaglio prenotazione owner:", id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("❌ ID non valido:", id);
      return res.status(400).json({ message: "ID non valido" });
    }

    console.log("🔍 Cercando prenotazione owner...");
    const booking = await Booking.findById(id)
      .populate({
        path: "campo",
        populate: [
          {
            path: "struttura",
            select: "name location images owner",
          },
          {
            path: "sport",
            select: "name code icon",
          }
        ],
      })
      .populate("user", "name surname email username avatarUrl");

    if (!booking) {
      console.log("❌ Prenotazione non trovata:", id);
      return res.status(404).json({ message: "Prenotazione non trovata" });
    }

    // Verifica che l'owner sia proprietario della struttura
    const struttura = (booking as any).campo?.struttura;
    if (!struttura || struttura.owner.toString() !== ownerId) {
      console.log("❌ Non autorizzato per prenotazione:", id);
      return res.status(403).json({ message: "Non autorizzato" });
    }

    console.log("🔍 Cercando match associato...");
    // Cerca il match associato con populate completo
    const match = await Match.findOne({ booking: booking._id })
      .populate("createdBy", "name surname username")
      .populate({
        path: "players.user",
        select: "name surname username avatarUrl",
      });

    console.log("📤 Invio dettaglio prenotazione owner");
    res.json({
      ...booking.toObject(),
      match: match
        ? {
            _id: match._id,
            maxPlayers: match.maxPlayers,
            status: match.status,
            createdBy: match.createdBy,
            players: match.players,
            score: match.score,
            winner: match.winner,
            sets: match.score?.sets ?? [],
          }
        : null,
    });
  } catch (err) {
    console.error("❌ getOwnerBookingById error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * 📌 CANCELLA PRENOTAZIONE (OWNER)
 * DELETE /bookings/owner/:id
 */
export const cancelOwnerBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ownerId = req.user!.id;

    console.log("🗑️ Owner cancellazione prenotazione:", id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("❌ ID non valido:", id);
      return res.status(400).json({ message: "ID non valido" });
    }

    console.log("🔍 Cercando prenotazione da cancellare owner...");
    const booking = await Booking.findById(id).populate({
      path: "campo",
      populate: {
        path: "struttura",
        select: "owner name",
      },
    });

    if (!booking) {
      console.log("❌ Prenotazione non trovata:", id);
      return res.status(404).json({ message: "Prenotazione non trovata" });
    }

    // Verifica che l'owner sia proprietario della struttura
    const struttura = (booking as any).campo?.struttura;
    const campo = (booking as any).campo;
    if (!struttura || struttura.owner.toString() !== ownerId) {
      console.log("❌ Non autorizzato per cancellazione:", id);
      return res.status(403).json({ message: "Non autorizzato" });
    }

    if ((booking as any).status === "cancelled") {
      console.log("❌ Prenotazione già cancellata:", id);
      return res.status(400).json({ message: "Prenotazione già cancellata" });
    }

    console.log("✅ Cancellando prenotazione owner...");
    // Aggiorna status
    (booking as any).status = "cancelled";
    (booking as any).cancelledBy = "owner";
    await booking.save();

    // 💰 Gestione rimborsi fittizi e deduzione guadagni owner
    try {
      const ownerEarnings = (booking as any).ownerEarnings || 0;

      if (ownerEarnings > 0) {
        const ownerUser = await User.findById(ownerId);
        if (ownerUser) {
          // Aggiungi transazione di rimborso (negativa)
          if (!ownerUser.earnings) {
            ownerUser.earnings = [];
          }
          ownerUser.earnings.push({
            type: "refund",
            amount: -ownerEarnings,
            booking: new mongoose.Types.ObjectId(id),
            description: `Rimborso per cancellazione prenotazione ${campo.name} - ${(booking as any).date} ${(booking as any).startTime}`,
            createdAt: new Date(),
          } as any);

          // Aggiorna bilancio totale
          ownerUser.totalEarnings = (ownerUser.totalEarnings || 0) - ownerEarnings;

          await ownerUser.save();
          console.log(`💰 Rimborso di €${ownerEarnings} dedotto dall'owner ${ownerId}`);

          // Marca tutti i pagamenti come "refunded"
          (booking as any).payments.forEach((payment: any) => {
            if (payment.status === "completed") {
              payment.status = "refunded";
            }
          });
          await booking.save();
        }
      }
    } catch (refundError) {
      console.error("❌ Errore gestione rimborso:", refundError);
      // Non fallire la cancellazione per un errore di rimborso
    }

    console.log("🔓 Riabilitando slot nel calendario...");
    // 🔓 Riabilita lo slot nel calendario
    const calendarDay = await CampoCalendarDay.findOne({
      campo: (booking as any).campo._id,
      date: (booking as any).date,
    });

    if (calendarDay) {
      const slot = (calendarDay as any).slots.find(
        (s: any) => s.time === (booking as any).startTime
      );
      if (slot) {
        slot.enabled = true;

        // Se la prenotazione durava 1.5h, riabilita anche il secondo slot
        const startTime = (booking as any).startTime;
        const endTime = (booking as any).endTime;
        const [startH, startM] = startTime.split(":").map(Number);
        const [endH, endM] = endTime.split(":").map(Number);
        const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);

        if (durationMinutes === 90) {
          let nextH = startH;
          let nextM = startM + 30;
          if (nextM >= 60) {
            nextH++;
            nextM = 0;
          }
          const nextSlotTime = `${String(nextH).padStart(2, "0")}:${String(nextM).padStart(2, "0")}`;
          const secondSlot = (calendarDay as any).slots.find((s: any) => s.time === nextSlotTime);
          if (secondSlot) {
            secondSlot.enabled = true;
          }
        }

        await calendarDay.save();
        console.log("✅ Slot riabilitato nel calendario");
      }
    }

    console.log("✅ Prenotazione cancellata dall'owner");

    // 📢 Invia notifica agli utenti coinvolti
    try {
      const match = await Match.findOne({ booking: booking._id }).populate('players.user', 'name surname');
      if (match) {
        const ownerEarnings = (booking as any).ownerEarnings || 0;
        const confirmedPlayersCount = match.players.filter((p: any) => p.status === 'confirmed').length;
        const refundPerPlayer = confirmedPlayersCount > 0 ? ownerEarnings / confirmedPlayersCount : 0;
        
        for (const player of match.players) {
          if (player.status === 'confirmed') {
            await createNotification(
              new mongoose.Types.ObjectId(player.user._id),
              new mongoose.Types.ObjectId(ownerId),
              "booking_cancelled",
              "Prenotazione cancellata - Rimborso",
              `La prenotazione per ${campo.name} presso ${struttura.name} il ${(booking as any).date} alle ${(booking as any).startTime} è stata cancellata. Riceverai un rimborso di €${refundPerPlayer.toFixed(2)}.`,
              new mongoose.Types.ObjectId(booking._id),
              "Booking"
            );
          }
        }
      }
    } catch (notificationError) {
      console.error("❌ Errore invio notifica cancellazione:", notificationError);
    }

    console.log("📤 Invio conferma cancellazione owner");
    res.json({ message: "Prenotazione cancellata con successo" });
  } catch (err) {
    console.error("❌ cancelOwnerBooking error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * GET /bookings/by-match/:matchId
 * Recupera booking da matchId
 */
export const getBookingByMatchId = async (req: AuthRequest, res: Response) => {
  try {
    const { matchId } = req.params;
    const userId = req.user!.id;

    console.log('🔍 [getBookingByMatchId] Ricerca booking per matchId:', matchId);

    if (!matchId) {
      return res.status(400).json({ message: "matchId richiesto" });
    }

    const booking = await Booking.findOne({ match: matchId })
      .populate('campo')
      .populate({
        path: 'campo',
        populate: { path: 'struttura' }
      })
      .populate({
        path: 'match',
        populate: [
          { path: 'players.user', select: 'username name surname avatarUrl' },
          { path: 'createdBy', select: 'username name surname avatarUrl' }
        ]
      });

    if (!booking) {
      console.log('⚠️ [getBookingByMatchId] Booking non trovato per matchId:', matchId);
      return res.status(404).json({ message: "Prenotazione non trovata" });
    }

    console.log('✅ [getBookingByMatchId] Booking trovato:', booking._id);
    res.json(booking);
  } catch (err) {
    console.error("❌ getBookingByMatchId error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};
