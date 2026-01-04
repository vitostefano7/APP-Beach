import { Response } from "express";
import mongoose from "mongoose";
import Match from "../models/Match";
import Booking from "../models/Booking";
import User from "../models/User";
import { AuthRequest } from "../middleware/authMiddleware";

/**
 * POST /matches/from-booking/:bookingId
 * Crea match da prenotazione esistente
 */
export const createMatchFromBooking = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { bookingId } = req.params;
    const { maxPlayers, isPublic, players } = req.body;
    const userId = req.user!.id;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: "ID prenotazione non valido" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Prenotazione non trovata" });
    }

    // Solo chi ha prenotato può creare il match
    if (booking.user.toString() !== userId) {
      return res.status(403).json({ message: "Non autorizzato" });
    }

    // Match già esistente?
    const existing = await Match.findOne({ booking: bookingId });
    if (existing) {
      return res.status(400).json({ message: "Match già creato per questa prenotazione" });
    }

    // Crea match
    const match = await Match.create({
      booking: bookingId,
      createdBy: userId,
      maxPlayers: maxPlayers || 4,
      isPublic: isPublic || false,
      players: players || [],
      status: "draft",
    });

    await match.populate("players.user", "username name avatarUrl");
    await match.populate("createdBy", "username name avatarUrl");

    res.status(201).json(match);
  } catch (err) {
    console.error("❌ createMatchFromBooking error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * POST /matches
 * Crea match standalone (per eventi)
 */
export const createMatch = async (req: AuthRequest, res: Response) => {
  try {
    const { booking, event, maxPlayers, isPublic, players } = req.body;
    const userId = req.user!.id;

    if (!booking) {
      return res.status(400).json({ message: "booking è obbligatorio" });
    }

    const bookingDoc = await Booking.findById(booking);
    if (!bookingDoc) {
      return res.status(404).json({ message: "Prenotazione non trovata" });
    }

    const match = await Match.create({
      booking,
      createdBy: userId,
      maxPlayers: maxPlayers || 4,
      isPublic: isPublic || false,
      players: players || [],
      event: event || undefined,
      status: "draft",
    });

    await match.populate("players.user", "username name avatarUrl");
    await match.populate("createdBy", "username name avatarUrl");
    if (event) {
      await match.populate("event");
    }

    res.status(201).json(match);
  } catch (err) {
    console.error("❌ createMatch error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * POST /matches/:matchId/invite
 * Invita un giocatore (solo createdBy)
 */
export const invitePlayer = async (req: AuthRequest, res: Response) => {
  try {
    const { matchId } = req.params;
    const { username, team } = req.body; // 🆕 Aggiungo team opzionale
    const userId = req.user!.id;

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: "Match non trovato" });
    }

    // Solo createdBy può invitare
    if (match.createdBy.toString() !== userId) {
      return res.status(403).json({ message: "Solo il creatore può invitare" });
    }

    // Match deve essere draft o open
    if (!["draft", "open"].includes(match.status)) {
      return res.status(400).json({ message: "Match non aperto a nuovi giocatori" });
    }

    // Trova utente da username
    const userToInvite = await User.findOne({ username: username.toLowerCase() });
    if (!userToInvite) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    // Già presente?
    const alreadyInvited = match.players.some(
      (p) => p.user.toString() === userToInvite._id.toString()
    );
    if (alreadyInvited) {
      return res.status(400).json({ message: "Utente già invitato" });
    }

    // Max players raggiunto?
    if (match.players.length >= match.maxPlayers) {
      return res.status(400).json({ message: "Match pieno" });
    }

    // 🆕 Valida team se fornito
    if (team && team !== "A" && team !== "B") {
      return res.status(400).json({ message: "Team deve essere 'A' o 'B'" });
    }

    // Aggiungi player con team opzionale
    match.players.push({
      user: userToInvite._id,
      status: "pending",
      team: team || undefined, // 🆕 Assegna team se fornito
      joinedAt: new Date(),
    });

    await match.save();
    await match.populate("players.user", "username name avatarUrl");

    res.json(match);
  } catch (err) {
    console.error("❌ invitePlayer error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * POST /matches/:matchId/join
 * Join match pubblico
 */
export const joinMatch = async (req: AuthRequest, res: Response) => {
  try {
    const { matchId } = req.params;
    const { team } = req.body;
    const userId = req.user!.id;

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: "Match non trovato" });
    }

    // Match deve essere pubblico
    if (!match.isPublic) {
      return res.status(403).json({ message: "Match privato" });
    }

    // Match deve essere open
    if (match.status !== "open") {
      return res.status(400).json({ message: "Match non aperto" });
    }

    // Già presente?
    const alreadyJoined = match.players.some(
      (p) => p.user.toString() === userId
    );
    if (alreadyJoined) {
      return res.status(400).json({ message: "Già nel match" });
    }

    // Max players raggiunto?
    if (match.players.length >= match.maxPlayers) {
      return res.status(400).json({ message: "Match pieno" });
    }

    // Team obbligatorio se maxPlayers > 2
    if (match.maxPlayers > 2 && !team) {
      return res.status(400).json({ message: "Team obbligatorio" });
    }

    // Aggiungi player
    match.players.push({
      user: new mongoose.Types.ObjectId(userId),
      team: team || undefined,
      status: "confirmed",
      joinedAt: new Date(),
    });

    // Aggiorna status se pieno
    if (match.players.length === match.maxPlayers) {
      match.status = "full";
    }

    await match.save();
    await match.populate("players.user", "username name avatarUrl");

    res.json(match);
  } catch (err) {
    console.error("❌ joinMatch error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * PATCH /matches/:matchId/respond
 * Rispondi a invito (accept/decline)
 */
export const respondToInvite = async (req: AuthRequest, res: Response) => {
  try {
    const { matchId } = req.params;
    const { action, team } = req.body;
    const userId = req.user!.id;

    if (!["accept", "decline"].includes(action)) {
      return res.status(400).json({ message: "action deve essere accept o decline" });
    }

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: "Match non trovato" });
    }

    // Trova player
    const playerIndex = match.players.findIndex(
      (p) => p.user.toString() === userId && p.status === "pending"
    );

    if (playerIndex === -1) {
      return res.status(404).json({ message: "Invito non trovato" });
    }

    if (action === "decline") {
      // Rimuovi player
      match.players.splice(playerIndex, 1);
    } else {
      // Accept
      if (match.maxPlayers > 2 && !team) {
        return res.status(400).json({ message: "Team obbligatorio" });
      }

      match.players[playerIndex].status = "confirmed";
      if (team) {
        match.players[playerIndex].team = team;
      }

      // Aggiorna status se pieno
      const confirmed = match.players.filter((p) => p.status === "confirmed").length;
      if (confirmed === match.maxPlayers) {
        match.status = "full";
      }
    }

    await match.save();
    await match.populate("players.user", "username name avatarUrl");

    res.json(match);
  } catch (err) {
    console.error("❌ respondToInvite error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * DELETE /matches/:matchId/players/:userId
 * Rimuovi giocatore (solo createdBy)
 */
export const removePlayer = async (req: AuthRequest, res: Response) => {
  try {
    const { matchId, userId: playerUserId } = req.params;
    const userId = req.user!.id;

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: "Match non trovato" });
    }

    // Solo createdBy può rimuovere
    if (match.createdBy.toString() !== userId) {
      return res.status(403).json({ message: "Non autorizzato" });
    }

    // Rimuovi player
    const initialLength = match.players.length;
    match.players = match.players.filter(
      (p) => p.user.toString() !== playerUserId
    );

    if (match.players.length === initialLength) {
      return res.status(404).json({ message: "Giocatore non trovato" });
    }

    // Aggiorna status
    if (match.status === "full") {
      match.status = "open";
    }

    await match.save();
    await match.populate("players.user", "username name avatarUrl");

    res.json(match);
  } catch (err) {
    console.error("❌ removePlayer error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * PATCH /matches/:matchId/result
 * Inserisci risultato
 */
export const submitResult = async (req: AuthRequest, res: Response) => {
  try {
    const { matchId } = req.params;
    const { score } = req.body;
    const userId = req.user!.id;

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: "Match non trovato" });
    }

    // Solo createdBy o players possono inserire risultato
    const isCreator = match.createdBy.toString() === userId;
    const isPlayer = match.players.some((p) => p.user.toString() === userId);

    if (!isCreator && !isPlayer) {
      return res.status(403).json({ message: "Non autorizzato" });
    }

    // Validazione score
    if (!score?.sets || !Array.isArray(score.sets)) {
      return res.status(400).json({ message: "Score non valido" });
    }

    if (score.sets.length < 2 || score.sets.length > 3) {
      return res.status(400).json({ message: "Un match deve avere 2 o 3 set" });
    }

    // Calcola vincitore
    let winsA = 0;
    let winsB = 0;

    score.sets.forEach((set: any) => {
      if (set.teamA > set.teamB) winsA++;
      if (set.teamB > set.teamA) winsB++;
    });

    if (winsA === winsB) {
      return res.status(400).json({ message: "Risultato non valido" });
    }

    const winner: "A" | "B" = winsA > winsB ? "A" : "B";

    // Aggiorna match
    match.score = { sets: score.sets };
    match.winner = winner;
    match.playedAt = new Date();
    match.status = "completed";

    await match.save();
    await match.populate("players.user", "username name avatarUrl");
    await match.populate("createdBy", "username name avatarUrl");

    res.json(match);
  } catch (err) {
    console.error("❌ submitResult error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * GET /matches/me
 * Lista miei match (creati o joinati)
 */
export const getMyMatches = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { status, role } = req.query;

    let query: any = {
      $or: [
        { createdBy: userId },
        { "players.user": userId },
      ],
    };

    if (status) {
      query.status = status;
    }

    if (role === "created") {
      query = { createdBy: userId };
    } else if (role === "joined") {
      query = { "players.user": userId, createdBy: { $ne: userId } };
    }

    const matches = await Match.find(query)
      .sort({ createdAt: -1 })
      .populate("players.user", "username name avatarUrl")
      .populate("createdBy", "username name avatarUrl")
      .populate("booking")
      .populate("event");

    res.json(matches);
  } catch (err) {
    console.error("❌ getMyMatches error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * GET /matches/:matchId
 * Dettaglio match
 */
// matchController.ts - getMatchById (AGGIORNA)
// matchController.ts - getMatchById (VERSIONE COMPLETA)
export const getMatchById = async (req: AuthRequest, res: Response) => {
  try {
    const { matchId } = req.params;
    const userId = req.user!.id;

    console.log('🔍 Caricamento match ID:', matchId);

    const match = await Match.findById(matchId)
      .populate({
        path: "players.user",
        select: "name username avatarUrl",
      })
      .populate({
        path: "createdBy",
        select: "name username avatarUrl",
      })
      .populate({
        path: "booking",
        select: "date startTime endTime campo user",
        populate: [
          {
            path: "campo",
            select: "name sport struttura",
            populate: {
              path: "struttura",
              select: "name location",
            },
          },
          {
            path: "user",
            select: "name email",
          },
        ],
      });

    if (!match) {
      console.log('❌ Match non trovato');
      return res.status(404).json({ message: "Match non trovato" });
    }

    console.log('✅ Match trovato:', {
      id: match._id,
      status: match.status,
      players: match.players?.length,
      hasBooking: !!match.booking,
      hasCreatedBy: !!match.createdBy,
    });

    // Visibilità: pubblico o partecipante
    const isPlayer = match.players?.some((p: any) => 
      p.user && p.user._id.toString() === userId
    ) || false;
    
    const isCreator = match.createdBy?._id.toString() === userId;

    if (!match.isPublic && !isPlayer && !isCreator) {
      console.log('🔒 Accesso negato - Match privato');
      return res.status(403).json({ message: "Match privato" });
    }

    // Converti per il frontend
    const responseData = JSON.parse(JSON.stringify({
      ...match.toObject(),
      // Garantisce che i campi esistano anche se vuoti
      booking: match.booking || null,
      createdBy: match.createdBy || { 
        _id: userId, 
        name: "Utente sconosciuto",
        username: "unknown"
      },
      players: match.players?.map(p => ({
        ...p,
        user: p.user || { 
          _id: "unknown", 
          name: "Giocatore sconosciuto",
          username: "unknown" 
        }
      })) || [],
    }));

    console.log('📤 Invio match al frontend:', {
      matchId: responseData._id,
      status: responseData.status,
      booking: !!responseData.booking,
      createdBy: !!responseData.createdBy,
      players: responseData.players?.length,
    });

    res.json(responseData);
  } catch (err) {
    console.error("❌ getMatchById error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * DELETE /matches/:matchId
 * Cancella match (solo createdBy)
 */
export const deleteMatch = async (req: AuthRequest, res: Response) => {
  try {
    const { matchId } = req.params;
    const userId = req.user!.id;

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: "Match non trovato" });
    }

    if (match.createdBy.toString() !== userId) {
      return res.status(403).json({ message: "Non autorizzato" });
    }

    // Non eliminare match completed
    if (match.status === "completed") {
      return res.status(400).json({ message: "Impossibile eliminare match completato" });
    }

    match.status = "cancelled";
    await match.save();

    res.json({ message: "Match cancellato" });
  } catch (err) {
    console.error("❌ deleteMatch error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};

  export const assignPlayerTeam = async (req: AuthRequest, res: Response) => {
  try {
    const { matchId, userId: playerId } = req.params;
    const { team } = req.body;
    const currentUserId = req.user!.id;

    // Validazione team
    if (team !== "A" && team !== "B" && team !== null) {
      return res.status(400).json({ message: "Team deve essere 'A', 'B' o null" });
    }

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: "Match non trovato" });
    }

    // Solo il creatore può assegnare team
    if (match.createdBy.toString() !== currentUserId) {
      return res.status(403).json({ message: "Solo il creatore può assegnare i team" });
    }

    // Match deve essere draft o open
    if (match.status !== "draft" && match.status !== "open") {
      return res.status(400).json({ message: "Non puoi modificare i team in questo stato" });
    }

    // Trova il giocatore
    const player = match.players.find((p) => p.user.toString() === playerId);
    if (!player) {
      return res.status(404).json({ message: "Giocatore non trovato nel match" });
    }

    // Solo giocatori confermati possono essere assegnati
    if (player.status !== "confirmed") {
      return res.status(400).json({ message: "Solo giocatori confermati possono essere assegnati" });
    }

    // Assegna il team
    player.team = team as any;
    await match.save();

    const populatedMatch = await Match.findById(matchId)
      .populate("players.user", "username name avatarUrl")
      .populate("createdBy", "username name avatarUrl");

    res.json(populatedMatch);
  } catch (err) {
    console.error("❌ assignPlayerTeam error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};