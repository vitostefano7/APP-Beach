import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/authMiddleware";
import Strutture from "../models/Strutture";
import Booking from "../models/Booking";
import Match from "../models/Match";
import Campo from "../models/Campo";
import User from "../models/User";
import Friendship from "../models/Friendship";

// Interfaccia per i suggerimenti owner
interface OwnerSuggestedUser {
  user: {
    _id: mongoose.Types.ObjectId;
    name: string;
    username: string;
    avatarUrl?: string;
    preferredSports?: string[];
  };
  reason: {
    type: "most_games_played" | "follows_structure" | "vip_user";
    details: {
      matchCount?: number;
      strutturaName?: string;
      vipLevel?: string;
    };
  };
  score: number;
  friendshipStatus?: "none" | "pending" | "accepted";
}

/**
 * CREA STRUTTURA
 */
export const createStruttura = async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;

    console.log('📌 [createStruttura] Inizio:', { ownerId, body: req.body });

    console.log('🏗️ [createStruttura] Creazione struttura');
    const struttura = new Strutture({
      ...req.body,
      owner: new mongoose.Types.ObjectId(ownerId),
      location: {
        ...req.body.location,
        coordinates: [
          req.body.location.lng,
          req.body.location.lat,
        ],
      },
    });
    await struttura.save();

    console.log('✅ [createStruttura] Struttura creata:', struttura._id);
    console.log('📤 [createStruttura] Risposta struttura');
    res.status(201).json(struttura);
  } catch (err) {
    console.error('❌ [createStruttura] Errore:', err);
    res.status(500).json({ message: "Errore creazione struttura" });
  }
};

/**
 * STRUTTURE OWNER
 */
export const getMyStrutture = async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;

    console.log('📌 [getMyStrutture] Inizio:', { ownerId });

    console.log('🔍 [getMyStrutture] Ricerca strutture owner');
    const strutture = await Strutture.find({
      owner: new mongoose.Types.ObjectId(ownerId),
      isDeleted: false,
    });

    console.log('✅ [getMyStrutture] Strutture trovate:', strutture.length);
    res.json(strutture);
  } catch (err) {
    console.error('❌ [getMyStrutture] Errore:', err);
    res.status(500).json({ message: "Errore" });
  }
};

/**
 * UPDATE STRUTTURA
 */
export const updateStruttura = async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const { id } = req.params;

    console.log('📌 [updateStruttura] Inizio:', { ownerId, id, body: req.body });

    console.log('🔍 [updateStruttura] Ricerca struttura:', { id, ownerId });
    const struttura = await Strutture.findOne({
      _id: id,
      owner: new mongoose.Types.ObjectId(ownerId),
    });

    if (!struttura) {
      console.log('⚠️ [updateStruttura] Struttura non trovata');
      return res.status(404).json({ message: "Struttura non trovata" });
    }

    console.log('📝 [updateStruttura] Aggiornamento struttura');
    Object.assign(struttura, req.body);

    if (req.body.location?.lat && req.body.location?.lng) {
      struttura.location.coordinates = [
        req.body.location.lng,
        req.body.location.lat,
      ];
    }

    console.log('💾 [updateStruttura] Salvataggio struttura');
    await struttura.save();

    console.log('✅ [updateStruttura] Struttura aggiornata');
    res.json(struttura);
  } catch (err) {
    console.error('❌ [updateStruttura] Errore:', err);
    res.status(500).json({ message: "Errore update" });
  }
};

/**
 * PRENOTAZIONI OWNER
 */
export const getOwnerBookings = async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const { campoId, month, strutturaId, date } = req.query;

    console.log('📌 [getOwnerBookings] Inizio:', { ownerId, campoId, month, strutturaId, date });
    console.log("📋 getOwnerBookings chiamato:", { campoId, month, strutturaId, date });

    // ✅ Trova le strutture dell'owner
    const strutture = await Strutture.find({
      owner: new mongoose.Types.ObjectId(ownerId),
    }).select("_id");

    const struttureIds = strutture.map(s => s._id);
    console.log("🏢 Strutture owner:", struttureIds.length);

    // ✅ Costruisci filtro dinamico
    const filter: any = {
      status: "confirmed",
    };

    // Filtra per campo specifico (questo è il filtro più importante per noi)
    if (campoId) {
      filter.campo = new mongoose.Types.ObjectId(campoId as string);
      console.log("🎯 Filtro per campo:", campoId);
    } else if (strutturaId) {
      // Filtra per struttura specifica
      filter.struttura = new mongoose.Types.ObjectId(strutturaId as string);
    } else {
      // Altrimenti filtra per tutte le strutture dell'owner
      filter.struttura = { $in: struttureIds };
    }

    // Filtra per data specifica (YYYY-MM-DD)
    if (date && typeof date === "string") {
      filter.date = date;
      console.log("📅 Filtro per data:", date);
    }
    // Filtra per mese (YYYY-MM)
    else if (month && typeof month === "string") {
      const [year, monthNum] = month.split("-").map(Number);
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);
      
      filter.date = {
        $gte: startDate.toISOString().split("T")[0],
        $lte: endDate.toISOString().split("T")[0],
      };
      console.log("📅 Filtro per mese:", month);
    }

    console.log("🔍 Filtro finale:", JSON.stringify(filter, null, 2));

    const bookings = await Booking.find(filter)
      .populate("user", "name surname email phone")
      .populate("campo", "name")
      .populate("struttura", "name location")
      .sort({ date: 1, startTime: 1 });

    console.log(`✅ Prenotazioni trovate: ${bookings.length}`);
    if (bookings.length > 0) {
      console.log("📋 Prima prenotazione:", {
        date: bookings[0].date,
        startTime: (bookings[0] as any).startTime,
        user: (bookings[0] as any).user?.name,
      });
    }

    // ✅ Formatta risposta con dati user accessibili
    const formattedBookings = bookings.map((b: any) => ({
      _id: b._id,
      userId: b.user?._id,
      userName: b.user?.name || "N/A",
      userSurname: b.user?.surname || "",
      userPhone: b.user?.phone,
      userEmail: b.user?.email,
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      duration: b.duration || 1,
      totalPrice: b.price,
      status: b.status,
      campo: b.campo,
      struttura: b.struttura,
      createdAt: b.createdAt,
    }));

    res.json(formattedBookings);
  } catch (err) {
    console.error("❌ Errore getOwnerBookings:", err);
    res.status(500).json({ message: "Errore bookings" });
  }
};

/**
 * GET /owner/matches
 * Ottiene i match delle strutture del proprietario
 */
export const getOwnerMatches = async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const { status } = req.query;

    console.log('📌 [getOwnerMatches] Inizio:', { ownerId, status });
    console.log("🏐 [getOwnerMatches] Richiesta per owner:", ownerId);

    // Trova le strutture dell'owner
    const strutture = await Strutture.find({
      owner: new mongoose.Types.ObjectId(ownerId),
    }).select("_id");

    const struttureIds = strutture.map(s => s._id);
    console.log("🏢 [getOwnerMatches] Strutture owner:", struttureIds.length);

    // Trova tutti i campi delle strutture dell'owner
    const campi = await Campo.find({
      struttura: { $in: struttureIds },
    }).select("_id");

    const campiIds = campi.map(c => c._id);
    console.log("⚽ [getOwnerMatches] Campi owner:", campiIds.length);

    // Trova booking dei campi dell'owner con data >= oggi
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    // Recupera tutti i booking da oggi in poi con i campi necessari per il filtro
    const allBookings = await Booking.find({
      campo: { $in: campiIds },
      date: { $gte: todayStr },
    }).select("_id date endTime");

    // Filtra manualmente per escludere quelli già terminati
    const now = new Date();
    const bookings = allBookings.filter(b => {
      const bookingEndDateTime = new Date(`${b.date}T${b.endTime}:00`);
      return bookingEndDateTime > now;
    });

    const bookingIds = bookings.map(b => b._id);
    console.log("📋 [getOwnerMatches] Booking owner futuri/in corso:", bookingIds.length);

    // Costruisci filtro per i match
    const filter: any = {
      booking: { $in: bookingIds },
    };

    if (status) {
      filter.status = status;
    }

    // Trova i match
    const matches = await Match.find(filter)
      .populate("players.user", "username name surname avatarUrl")
      .populate("createdBy", "username name surname avatarUrl")
      .populate({
        path: "booking",
        populate: [
          {
            path: "campo",
            select: "name sport",
            populate: {
              path: "struttura",
              select: "name location",
            },
          },
          {
            path: "user",
            select: "name surname",
          },
        ],
      })
      .sort({ createdAt: -1 });

    // Filtra match con booking valido e campo/struttura popolati
    const validMatches = matches.filter(m => {
      if (!m.booking) {
        console.log("⚠️ Match senza booking:", m._id);
        return false;
      }
      const booking = m.booking as any;
      if (!booking.campo) {
        console.log("⚠️ Booking senza campo:", booking._id);
        return false;
      }
      if (!booking.campo.struttura) {
        console.log("⚠️ Campo senza struttura:", booking.campo._id);
        return false;
      }
      return true;
    });

    // Ordina per data e ora
    validMatches.sort((a, b) => {
      const bookingA = a.booking as any;
      const bookingB = b.booking as any;
      const dateA = new Date(`${bookingA.date}T${bookingA.startTime}`);
      const dateB = new Date(`${bookingB.date}T${bookingB.startTime}`);
      return dateA.getTime() - dateB.getTime();
    });

    console.log(`✅ [getOwnerMatches] Match validi trovati: ${validMatches.length}`);

    res.json(validMatches);
  } catch (err) {
    console.error("❌ [getOwnerMatches] Errore:", err);
    res.status(500).json({ message: "Errore caricamento match" });
  }
};

/**
 * GET OWNER USER SUGGESTIONS
 * Suggerisce utenti per gli owner basati su:
 * 1. Utenti che hanno giocato più partite nelle loro strutture
 * 2. Utenti che seguono le loro strutture
 * 3. Utenti VIP
 */
export const getOwnerUserSuggestions = async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = new mongoose.Types.ObjectId(req.user!.id);
    const { limit = 10, strutturaId } = req.query;

    console.log('📌 [getOwnerUserSuggestions] Inizio:', { ownerId: ownerId.toString(), limit, strutturaId });
    console.log(`🎯 [getOwnerUserSuggestions] Calcolo suggerimenti per owner: ${ownerId}, strutturaId: ${strutturaId}`);

    let strutture: any[];
    let struttureIds: mongoose.Types.ObjectId[];

    if (strutturaId) {
      // Valida che la struttura appartenga all'owner
      const struttura = await Strutture.findOne({
        _id: new mongoose.Types.ObjectId(strutturaId as string),
        owner: ownerId,
        isDeleted: false,
      }).select("_id name");

      if (!struttura) {
        return res.status(403).json({ message: "Access denied to this structure" });
      }

      strutture = [struttura];
      struttureIds = [struttura._id];
    } else {
      // Trova tutte le strutture dell'owner
      strutture = await Strutture.find({
        owner: ownerId,
        isDeleted: false,
      }).select("_id name");

      struttureIds = strutture.map(s => s._id);
    }

    if (struttureIds.length === 0) {
      return res.json({
        success: true,
        suggestions: [],
        total: 0,
        limit: parseInt(limit as string),
      });
    }

    console.log(`🏢 [getOwnerUserSuggestions] Strutture filtrate: ${struttureIds.length}`);

    // STEP 1: Utenti esclusi (già amici/follow)
    const excludedUsers = await getExcludedUsersForOwner(ownerId);
    console.log(`✅ [getOwnerUserSuggestions] Utenti esclusi: ${excludedUsers.length}`);

    // STEP 2: Calcola suggerimenti per ogni categoria
    const mostGamesSuggestions = await getMostGamesPlayedSuggestions(ownerId, struttureIds, excludedUsers);
    const followsStructureSuggestions = await getFollowsStructureSuggestions(ownerId, struttureIds, excludedUsers, strutture);
    const vipSuggestions = await getVipUserSuggestionsForOwner(ownerId, excludedUsers);

    console.log(`📊 Most games suggestions: ${mostGamesSuggestions.length}`);
    console.log(`📊 Follows structure suggestions: ${followsStructureSuggestions.length}`);
    console.log(`📊 VIP suggestions: ${vipSuggestions.length}`);

    // STEP 3: Combina e ordina per punteggio
    let allSuggestions = [
      ...mostGamesSuggestions,
      ...followsStructureSuggestions,
      ...vipSuggestions,
    ];

    // Rimuovi duplicati (stesso utente)
    const uniqueSuggestions = allSuggestions.filter((suggestion, index, self) =>
      index === self.findIndex(s => s.user._id.toString() === suggestion.user._id.toString())
    );

    // Ordina per punteggio e limita
    const sortedSuggestions = uniqueSuggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, parseInt(limit as string));

    console.log(`✅ [getOwnerUserSuggestions] Suggerimenti finali: ${sortedSuggestions.length}`);

    res.json({
      success: true,
      suggestions: sortedSuggestions,
      total: sortedSuggestions.length,
      limit: parseInt(limit as string),
    });
  } catch (err) {
    console.error("❌ [getOwnerUserSuggestions] Errore:", err);
    res.status(500).json({ message: "Errore caricamento suggerimenti" });
  }
};

/**
 * Helper: Utenti da escludere (già amici/follow dell'owner)
 */
async function getExcludedUsersForOwner(ownerId: mongoose.Types.ObjectId): Promise<mongoose.Types.ObjectId[]> {
  const friendships = await Friendship.find({
    $or: [
      { requester: ownerId },
      { recipient: ownerId },
    ],
    status: { $in: ["accepted", "pending"] },
  }).select("requester recipient");

  const excludedUsers = new Set<string>();
  excludedUsers.add(ownerId.toString()); // Escludi se stesso

  friendships.forEach(friendship => {
    excludedUsers.add(friendship.requester.toString());
    excludedUsers.add(friendship.recipient.toString());
  });

  return Array.from(excludedUsers).map(id => new mongoose.Types.ObjectId(id));
}

/**
 * Helper: Utenti che hanno giocato più partite nelle strutture dell'owner
 */
async function getMostGamesPlayedSuggestions(
  ownerId: mongoose.Types.ObjectId,
  struttureIds: mongoose.Types.ObjectId[],
  excludedUsers: mongoose.Types.ObjectId[]
): Promise<OwnerSuggestedUser[]> {
  try {
    // Trova tutti i campi delle strutture
    const campi = await Campo.find({
      struttura: { $in: struttureIds },
    }).select("_id");

    const campiIds = campi.map(c => c._id);

    // Conta i match per utente nei campi dell'owner
    const matchStats = await Match.aggregate([
      {
        $match: {
          booking: {
            $in: await Booking.find({
              campo: { $in: campiIds },
              status: "confirmed",
            }).distinct("_id"),
          },
        },
      },
      {
        $unwind: "$players",
      },
      {
        $group: {
          _id: "$players.user",
          matchCount: { $sum: 1 },
          lastPlayed: { $max: "$createdAt" },
        },
      },
      {
        $match: {
          _id: { $nin: excludedUsers },
        },
      },
      {
        $sort: { matchCount: -1, lastPlayed: -1 },
      },
      {
        $limit: 20,
      },
    ]);

    // Popola i dati utente
    const userIds = matchStats.map(stat => stat._id);
    const users = await User.find({
      _id: { $in: userIds },
      isActive: true,
    }).select("_id name username avatarUrl preferredSports");

    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    const suggestions: OwnerSuggestedUser[] = [];

    for (const stat of matchStats) {
      const user = userMap.get(stat._id.toString());
      if (user) {
        suggestions.push({
          user: {
            _id: user._id,
            name: user.name,
            username: user.username,
            avatarUrl: user.avatarUrl,
            preferredSports: user.preferredSports,
          },
          reason: {
            type: "most_games_played",
            details: {
              matchCount: stat.matchCount,
            },
          },
          score: Math.min(stat.matchCount * 10, 100), // Max 100 punti
          friendshipStatus: "none",
        });
      }
    }

    return suggestions;
  } catch (error) {
    console.error("❌ [getMostGamesPlayedSuggestions] Errore:", error);
    return [];
  }
}

/**
 * Helper: Utenti che seguono le strutture dell'owner
 */
async function getFollowsStructureSuggestions(
  ownerId: mongoose.Types.ObjectId,
  struttureIds: mongoose.Types.ObjectId[],
  excludedUsers: mongoose.Types.ObjectId[],
  strutture: any[]
): Promise<OwnerSuggestedUser[]> {
  try {
    // Per ora, suggeriamo utenti che hanno fatto prenotazioni recenti nelle strutture
    // In futuro potremmo avere una tabella separata per i "follow" delle strutture

    const recentBookings = await Booking.find({
      struttura: { $in: struttureIds },
      status: "confirmed",
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Ultimi 30 giorni
    })
      .populate("user", "_id name username avatarUrl preferredSports")
      .select("user createdAt")
      .sort({ createdAt: -1 })
      .limit(20);

    const suggestions: OwnerSuggestedUser[] = [];
    const processedUsers = new Set<string>();

    for (const booking of recentBookings) {
      const user = (booking as any).user;
      if (
        user &&
        !processedUsers.has(user._id.toString()) &&
        !excludedUsers.some(excluded => excluded.equals(user._id))
      ) {
        processedUsers.add(user._id.toString());

        // Trova il nome della struttura
        const struttura = strutture.find((s: any) => s._id.equals((booking as any).struttura));
        const strutturaName = struttura ? struttura.name : "struttura";

        suggestions.push({
          user: {
            _id: user._id,
            name: user.name,
            username: user.username,
            avatarUrl: user.avatarUrl,
            preferredSports: user.preferredSports,
          },
          reason: {
            type: "follows_structure",
            details: {
              strutturaName,
            },
          },
          score: 50, // Punteggio fisso per ora
          friendshipStatus: "none",
        });
      }
    }

    return suggestions;
  } catch (error) {
    console.error("❌ [getFollowsStructureSuggestions] Errore:", error);
    return [];
  }
}

/**
 * Helper: Utenti VIP
 */
async function getVipUserSuggestionsForOwner(
  ownerId: mongoose.Types.ObjectId,
  excludedUsers: mongoose.Types.ObjectId[]
): Promise<OwnerSuggestedUser[]> {
  try {
    // Per ora, consideriamo VIP gli utenti con più prenotazioni totali
    // In futuro potremmo avere un campo specifico per il VIP status

    const vipUsers = await Booking.aggregate([
      {
        $match: {
          status: "confirmed",
        },
      },
      {
        $group: {
          _id: "$user",
          bookingCount: { $sum: 1 },
          totalSpent: { $sum: "$price" },
        },
      },
      {
        $match: {
          _id: { $nin: excludedUsers },
          bookingCount: { $gte: 5 }, // Almeno 5 prenotazioni
        },
      },
      {
        $sort: { bookingCount: -1, totalSpent: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // Popola i dati utente
    const userIds = vipUsers.map(stat => stat._id);
    const users = await User.find({
      _id: { $in: userIds },
      isActive: true,
    }).select("_id name username avatarUrl preferredSports");

    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    const suggestions: OwnerSuggestedUser[] = [];

    for (const stat of vipUsers) {
      const user = userMap.get(stat._id.toString());
      if (user) {
        suggestions.push({
          user: {
            _id: user._id,
            name: user.name,
            username: user.username,
            avatarUrl: user.avatarUrl,
            preferredSports: user.preferredSports,
          },
          reason: {
            type: "vip_user",
            details: {
              vipLevel: stat.bookingCount >= 10 ? "Gold" : "Silver",
            },
          },
          score: Math.min(stat.bookingCount * 5, 80), // Max 80 punti
          friendshipStatus: "none",
        });
      }
    }

    return suggestions;
  } catch (error) {
    console.error("❌ [getVipUserSuggestionsForOwner] Errore:", error);
    return [];
  }
};
