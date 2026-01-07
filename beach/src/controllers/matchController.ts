import { Response } from "express";
import mongoose, { Types } from "mongoose";
import Match from "../models/Match";
import Booking from "../models/Booking";
import User from "../models/User";
import { AuthRequest } from "../middleware/authMiddleware";

// Tipo per user popolato
interface PopulatedUser {
  _id: Types.ObjectId;
  name: string;
  username: string;
  avatarUrl?: string;
}

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

    await match.populate("players.user", "username name surname avatarUrl");
    await match.populate("createdBy", "username name surname avatarUrl");

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

    await match.populate("players.user", "username name surname avatarUrl");
    await match.populate("createdBy", "username name surname avatarUrl");
    
    // Se hai bisogno di event, decommenta questa riga e importa il modello Event
    // if (event) {
    //   await match.populate("event");
    // }

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
    const { username, team } = req.body;
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

    // Valida team se fornito
    if (team && team !== "A" && team !== "B") {
      return res.status(400).json({ message: "Team deve essere 'A' o 'B'" });
    }

    // Team obbligatorio se maxPlayers > 2 e match non è in draft
    if (match.maxPlayers > 2 && match.status !== "draft" && !team) {
      return res.status(400).json({ message: "Team obbligatorio per questo match" });
    }

    // Aggiungi player con team opzionale
    match.players.push({
      user: userToInvite._id,
      status: "pending",
      team: team || undefined,
      joinedAt: new Date(),
    });

    await match.save();
    await match.populate("players.user", "username name surname avatarUrl");

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
    await match.populate("players.user", "username name surname avatarUrl");

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

    // Trova player - deve essere pending
    const playerIndex = match.players.findIndex(
      (p) => p.user.toString() === userId && p.status === "pending"
    );

    if (playerIndex === -1) {
      return res.status(404).json({ 
        message: "Invito non trovato o già risposto"
      });
    }

    console.log(`🤔 Risposta invito: userId=${userId}, action=${action}`);

    if (action === "decline") {
      // Cambia status a "declined"
      match.players[playerIndex].status = "declined";
      match.players[playerIndex].respondedAt = new Date();
      console.log(`✅ Player rifiutato - status impostato a "declined"`);
    } else {
      // Accept
      if (match.maxPlayers > 2 && !team) {
        return res.status(400).json({ message: "Team obbligatorio" });
      }

      match.players[playerIndex].status = "confirmed";
      match.players[playerIndex].respondedAt = new Date();
      if (team) {
        match.players[playerIndex].team = team;
      }
      console.log(`✅ Player accettato - status impostato a "confirmed"`);

      // Aggiorna status se pieno
      const confirmed = match.players.filter((p) => p.status === "confirmed").length;
      if (confirmed === match.maxPlayers) {
        match.status = "full";
      }
    }

    await match.save();
    
    await match.populate("players.user", "username name surname avatarUrl");
    await match.populate("createdBy", "username name surname avatarUrl");

    console.log(`📊 Match aggiornato:`, {
      matchId: match._id,
      players: (match.players as any[]).map(p => ({
        userId: p.user._id.toString(),
        name: p.user.name,
        status: p.status
      }))
    });

    res.json(match);
  } catch (err) {
    console.error("❌ respondToInvite error:", err);
    res.status(500).json({ 
      message: "Errore server",
      error: err instanceof Error ? err.message : "Errore sconosciuto"
    });
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
    await match.populate("players.user", "username name surname avatarUrl");

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
    await match.populate("players.user", "username name surname avatarUrl");
    await match.populate("createdBy", "username name surname avatarUrl");

    res.json(match);
  } catch (err) {
    console.error("❌ submitResult error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * GET /matches/me
 * Lista miei match (creati o joinati) - VERSIONE CORRETTA
 */
export const getMyMatches = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { status, role } = req.query;

    console.log('🔍 [getMyMatches] Richiesta per:', { userId, status, role });

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

    console.log('📋 [getMyMatches] Query:', JSON.stringify(query));

    // Trova i match SENZA popolare event
    const matches = await Match.find(query)
      .sort({ createdAt: -1 })
      .populate("players.user", "username name surname avatarUrl")
      .populate("createdBy", "username name surname avatarUrl")
      .populate({
        path: "booking",
        select: "date startTime endTime campo user price",
        populate: [
          {
            path: "campo",
            select: "name sport pricingRules",
            populate: {
              path: "struttura",
              select: "name location images",
            },
          },
          {
            path: "user",
            select: "name email",
          },
        ],
      });

    console.log(`✅ [getMyMatches] Trovati ${matches.length} match`);

    res.json(matches);
  } catch (err) {
    console.error("❌ getMyMatches error:", err);
    res.status(500).json({ 
      message: "Errore server",
      error: err instanceof Error ? err.message : "Errore sconosciuto"
    });
  }
};

/**
 * GET /matches/:matchId
 * Dettaglio match
 */
export const getMatchById = async (req: AuthRequest, res: Response) => {
  try {
    const { matchId } = req.params;
    const userId = req.user!.id;

    if (!mongoose.Types.ObjectId.isValid(matchId)) {
      console.log('❌ [getMatchById] ID non valido:', matchId);
      return res.status(400).json({ 
        message: "ID match non valido",
        receivedId: matchId 
      });
    }

    console.log('🔍 [getMatchById] Richiesta per:', {
      matchId,
      userId,
      userAgent: req.headers['user-agent']
    });

    // Cerca il match con tutte le popolazioni necessarie
    const match = await Match.findById(matchId)
      .populate("players.user", "name surname username avatarUrl")
      .populate("createdBy", "name surname username avatarUrl")
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
      console.log('❌ [getMatchById] Match non trovato');
      return res.status(404).json({ message: "Match non trovato" });
    }

    const matchObj = match.toObject();

    console.log('📊 [getMatchById] Match trovato:', {
      matchId: match._id,
      status: match.status,
      isPublic: match.isPublic,
      createdByName: (matchObj as any).createdBy?.name,
      playersCount: (matchObj as any).players?.length,
    });

    // Verifica se l'utente è un player
    const isPlayer = (matchObj as any).players?.some((p: any) => {
      const playerUserId = p.user?._id?.toString();
      return playerUserId === userId;
    }) || false;
    
    const isCreator = (matchObj as any).createdBy?._id?.toString() === userId;

    console.log('🔐 [getMatchById] Controllo autorizzazione:', {
      isPublic: match.isPublic,
      isPlayer,
      isCreator,
      shouldAllow: match.isPublic || isPlayer || isCreator
    });

    // Se il match è privato, controlla i permessi
    if (!match.isPublic && !isPlayer && !isCreator) {
      console.log('🔒 [getMatchById] Accesso negato - Match privato');
      console.log('📋 [DEBUG] Dettagli utente richiedente:', {
        userId,
        userMatchesPlayers: (matchObj as any).players?.map((p: any) => p.user?._id),
        createdById: (matchObj as any).createdBy?._id
      });
      
      return res.status(403).json({ 
        message: "Non sei autorizzato a visualizzare questo match",
        debug: {
          isPublic: match.isPublic,
          isPlayer,
          isCreator,
          userId,
          matchId: match._id
        }
      });
    }

    res.json(matchObj);
  } catch (err) {
    console.error("❌ [getMatchById] error:", err);
    res.status(500).json({ 
      message: "Errore server",
      error: err instanceof Error ? err.message : "Errore sconosciuto"
    });
  }
};

/**
 * GET /matches/pending-invites
 * Restituisce gli inviti pendenti dell'utente
 */
export const getPendingInvites = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    
    console.log('🔍 [getPendingInvites] Richiesta per userId:', userId);

    // Carica tutti i match dell'utente
    const allMatches = await Match.find({
      'players.user': userId
    })
    .populate('createdBy', 'name surname username avatarUrl')
    .populate('players.user', 'name surname username avatarUrl')
    .populate({
      path: 'booking',
      populate: [
        { 
          path: 'campo', 
          populate: { 
            path: 'struttura', 
            select: 'name location' 
          } 
        },
        { path: 'user', select: 'name email' }
      ]
    })
    .sort({ createdAt: -1 });

    // Filtra solo gli inviti pending dove:
    // 1. L'utente NON è il creatore
    // 2. Lo status del player è "pending"
    const pendingInvites = allMatches.filter(match => {
      const isCreator = (match.createdBy as any)._id.toString() === userId;
      
      // Trova il player corrispondente all'utente
      const myPlayer = match.players.find((p: any) => 
        (p.user as any)._id.toString() === userId
      );
      
      const isPending = myPlayer?.status === 'pending';
      
      return !isCreator && isPending;
    });

    console.log(`✅ [getPendingInvites] Trovati ${pendingInvites.length} inviti pendenti`);

    res.json(pendingInvites);
  } catch (err) {
    console.error('❌ [getPendingInvites] error:', err);
    res.status(500).json({ 
      message: 'Errore server',
      error: err instanceof Error ? err.message : 'Errore sconosciuto'
    });
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

/**
 * PATCH /matches/:matchId/players/:userId/team
 * Assegna team a giocatore
 */
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

    // Il creatore può assegnare qualsiasi giocatore, il giocatore può cambiare solo se stesso
    const isCreator = match.createdBy.toString() === currentUserId;
    const isSelf = playerId === currentUserId;

    if (!isCreator && !isSelf) {
      return res.status(403).json({ message: "Non puoi modificare il team di altri giocatori" });
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
      .populate("players.user", "username name surname avatarUrl")
      .populate("createdBy", "username name surname avatarUrl");

    res.json(populatedMatch);
  } catch (err) {
    console.error("❌ assignPlayerTeam error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};

export const updateInviteResponse = async (req: AuthRequest, res: Response) => {
  try {
    const { matchId } = req.params;
    const { action } = req.body;
    const userId = req.user!.id;

    if (action !== "accept") {
      return res.status(400).json({ message: "Azione non valida. Solo 'accept' permesso" });
    }

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: "Match non trovato" });
    }

    // Trova player con status "declined"
    const playerIndex = match.players.findIndex(
      (p) => p.user.toString() === userId && p.status === "declined"
    );

    if (playerIndex === -1) {
      return res.status(404).json({ 
        message: "Invito rifiutato non trovato",
        debug: {
          userId,
          players: match.players.map(p => ({
            userId: p.user.toString(),
            status: p.status
          }))
        }
      });
    }

    // Controlla se il match è già pieno
    const confirmedPlayers = match.players.filter(p => p.status === "confirmed").length;
    if (confirmedPlayers >= match.maxPlayers) {
      return res.status(400).json({ 
        message: "Match pieno", 
        debug: {
          confirmedPlayers,
          maxPlayers: match.maxPlayers
        }
      });
    }

    // Controlla se può ancora accettare (30 minuti prima)
    const booking = await Booking.findById(match.booking);
    if (booking) {
      const matchDateTime = new Date(`${booking.date}T${booking.startTime}`);
      const now = new Date();
      const minutesDiff = (matchDateTime.getTime() - now.getTime()) / (1000 * 60);
      
      if (minutesDiff <= 30) {
        return res.status(400).json({ 
          message: "Non puoi più accettare l'invito (mancano meno di 30 minuti)",
          debug: {
            minutesRemaining: minutesDiff
          }
        });
      }
    }

    // Cambia status a "confirmed"
    match.players[playerIndex].status = "confirmed";
    match.players[playerIndex].respondedAt = new Date();
    
    // Aggiorna status match se pieno
    const newConfirmedCount = match.players.filter(p => p.status === "confirmed").length;
    if (newConfirmedCount === match.maxPlayers) {
      match.status = "full";
    } else if (match.status === "full") {
      match.status = "open";
    }

    await match.save();
    
    // Popola per la risposta
    await match.populate("players.user", "username name surname avatarUrl");
    await match.populate("createdBy", "username name surname avatarUrl");

    console.log(`✅ Risposta cambiata: userId=${userId}, da declined a confirmed`);

    res.json({
      message: "Risposta cambiata con successo",
      match
    });
  } catch (err) {
    console.error("❌ updateInviteResponse error:", err);
    res.status(500).json({ 
      message: "Errore server",
      error: err instanceof Error ? err.message : "Errore sconosciuto"
    });
  }
}

/**
 * PATCH /matches/:matchId/leave
 * Abbandona un match (cambia status da "confirmed" a "declined")
 */
export const leaveMatch = async (req: AuthRequest, res: Response) => {
  try {
    const { matchId } = req.params;
    const userId = req.user!.id;

    console.log(`🚪 [leaveMatch] User ${userId} sta abbandonando match ${matchId}`);

    if (!mongoose.Types.ObjectId.isValid(matchId)) {
      return res.status(400).json({ message: "ID match non valido" });
    }

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: "Match non trovato" });
    }

    // Trova il player
    const playerIndex = match.players.findIndex(
      (p) => p.user.toString() === userId && p.status === "confirmed"
    );

    if (playerIndex === -1) {
      return res.status(404).json({ 
        message: "Non sei un giocatore confermato in questo match" 
      });
    }

    // Non può abbandonare se è il creatore
    if (match.createdBy.toString() === userId) {
      return res.status(403).json({ 
        message: "Il creatore non può abbandonare il match. Puoi cancellarlo invece." 
      });
    }

    // Non può abbandonare se il match è già completato o cancellato
    if (match.status === "completed" || match.status === "cancelled") {
      return res.status(400).json({ 
        message: "Non puoi abbandonare un match completato o cancellato" 
      });
    }

    // ✅ INVECE DI RIMUOVERE, CAMBIA STATUS A "declined"
    match.players[playerIndex].status = "declined";
    match.players[playerIndex].respondedAt = new Date();
    
    // Rimuovi anche il team assignment
    match.players[playerIndex].team = undefined;

    console.log(`✅ [leaveMatch] Player status cambiato da "confirmed" a "declined"`);

    // Aggiorna lo status del match se necessario
    const confirmedCount = match.players.filter(p => p.status === "confirmed").length;
    
    if (match.status === "full" && confirmedCount < match.maxPlayers) {
      match.status = "open";
      console.log(`📊 [leaveMatch] Match status cambiato da "full" a "open"`);
    }

    await match.save();
    
    // Popola per la risposta
    await match.populate("players.user", "username name surname avatarUrl");
    await match.populate("createdBy", "username name surname avatarUrl");

    console.log(`✅ [leaveMatch] Match aggiornato con successo`);

    res.json({
      message: "Hai abbandonato il match con successo",
      match
    });
  } catch (err) {
    console.error("❌ [leaveMatch] error:", err);
    res.status(500).json({ 
      message: "Errore server",
      error: err instanceof Error ? err.message : "Errore sconosciuto"
    });
  }
};

/**
 * PATCH /matches/:matchId/score
 * Inserisce o aggiorna il risultato del match (solo creatore)
 */
export const submitScore = async (req: AuthRequest, res: Response) => {
  try {
    const { matchId } = req.params;
    const { winner, sets } = req.body;
    const userId = req.user!.id;

    console.log(`🏆 [submitScore] User ${userId} sta inserendo il risultato per match ${matchId}`);

    if (!mongoose.Types.ObjectId.isValid(matchId)) {
      return res.status(400).json({ message: "ID match non valido" });
    }

    // Validazione input
    if (!winner || !["A", "B"].includes(winner)) {
      return res.status(400).json({ message: "Winner deve essere 'A' o 'B'" });
    }

    if (!sets || !Array.isArray(sets) || sets.length === 0) {
      return res.status(400).json({ message: "Sets è obbligatorio e deve essere un array non vuoto" });
    }

    // Valida ogni set
    for (const set of sets) {
      if (typeof set.teamA !== "number" || typeof set.teamB !== "number") {
        return res.status(400).json({ message: "Ogni set deve avere teamA e teamB numerici" });
      }
      if (set.teamA < 0 || set.teamB < 0 || set.teamA > 99 || set.teamB > 99) {
        return res.status(400).json({ message: "I punteggi devono essere tra 0 e 99" });
      }
    }

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: "Match non trovato" });
    }

    // Solo il creatore può inserire il risultato
    if (match.createdBy.toString() !== userId) {
      return res.status(403).json({ message: "Solo il creatore può inserire il risultato" });
    }

    // Il match non deve essere cancellato
    if (match.status === "cancelled") {
      return res.status(400).json({ message: "Non puoi inserire il risultato di un match cancellato" });
    }

    // Aggiorna il risultato
    match.winner = winner;
    match.score = { sets };
    match.status = "completed";
    match.playedAt = new Date();

    await match.save();

    // Popola per la risposta
    await match.populate("players.user", "username name surname avatarUrl");
    await match.populate("createdBy", "username name surname avatarUrl");

    console.log(`✅ [submitScore] Risultato salvato: Team ${winner} vince ${sets.length} set(s)`);

    res.json({
      message: "Risultato salvato con successo",
      match
    });
  } catch (err) {
    console.error("❌ [submitScore] error:", err);
    res.status(500).json({ 
      message: "Errore server",
      error: err instanceof Error ? err.message : "Errore sconosciuto"
    });
  }
};
