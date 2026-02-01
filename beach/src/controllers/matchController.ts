import { Response } from "express";
import mongoose, { Types } from "mongoose";
import Match from "../models/Match";
import Booking from "../models/Booking";
import User from "../models/User";
import Struttura from "../models/Strutture";
import StrutturaFollower from "../models/StrutturaFollower";
import { AuthRequest } from "../middleware/authMiddleware";
import { getDefaultMaxPlayersForSport, validateMaxPlayersForSport } from "../utils/matchSportRules";
import { createNotification } from "../utils/notificationHelper";

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

    console.log('⚽ [createMatchFromBooking] Inizio creazione match:', { bookingId, userId, maxPlayers, isPublic });

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      console.log('❌ ID prenotazione non valido');
      return res.status(400).json({ message: "ID prenotazione non valido" });
    }

    console.log('🔍 Caricamento prenotazione...');
    const booking = await Booking.findById(bookingId).populate('campo');
    if (!booking) {
      console.log('❌ Prenotazione non trovata');
      return res.status(404).json({ message: "Prenotazione non trovata" });
    }

    console.log('🔐 Verifica autorizzazione...');
    // Solo chi ha prenotato può creare il match
    if (booking.user.toString() !== userId) {
      console.log('❌ Non autorizzato - prenotazione non dell\'utente');
      return res.status(403).json({ message: "Non autorizzato" });
    }

    console.log('🔍 Controllo match esistente...');
    // Match già esistente?
    const existing = await Match.findOne({ booking: bookingId });
    if (existing) {
      console.log('❌ Match già esistente per questa prenotazione');
      return res.status(400).json({ message: "Match già creato per questa prenotazione" });
    }

    console.log('⚙️ Determinazione maxPlayers...');
    // Determina maxPlayers basandosi sul tipo di sport del campo
    const campo = (booking as any).campo;
    let finalMaxPlayers = maxPlayers;
    
    if (campo?.sport) {
      const sportType = campo.sport as "beach volley" | "volley";
      
      // Se maxPlayers non è fornito, usa il default per lo sport
      if (!maxPlayers) {
        finalMaxPlayers = getDefaultMaxPlayersForSport(sportType);
        console.log('✅ MaxPlayers default per sport:', sportType, '->', finalMaxPlayers);
      } else {
        // Valida che maxPlayers sia valido per lo sport
        const validation = validateMaxPlayersForSport(maxPlayers, sportType);
        if (!validation.valid) {
          console.log('❌ MaxPlayers non valido:', validation.error);
          return res.status(400).json({ message: validation.error });
        }
        finalMaxPlayers = maxPlayers;
        console.log('✅ MaxPlayers validato:', finalMaxPlayers);
      }
    } else {
      // Fallback se non c'è sport
      finalMaxPlayers = maxPlayers || 4;
      console.log('⚠️ Fallback maxPlayers:', finalMaxPlayers);
    }

    console.log('💾 Creazione match nel DB...');
    // Crea match
    const match = await Match.create({
      booking: bookingId,
      createdBy: userId,
      maxPlayers: finalMaxPlayers,
      isPublic: isPublic || false,
      players: players || [],
      status: "open",
    });

    await match.populate("players.user", "username name surname avatarUrl");
    await match.populate("createdBy", "username name surname avatarUrl");
    console.log('✅ Match creato:', match._id);

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

    console.log('⚽ [createMatch] Creazione match standalone:', { booking, event, maxPlayers, isPublic, userId });

    if (!booking) {
      console.log('❌ Booking obbligatorio mancante');
      return res.status(400).json({ message: "booking è obbligatorio" });
    }

    console.log('🔍 Caricamento booking...');
    const bookingDoc = await Booking.findById(booking).populate('campo');
    if (!bookingDoc) {
      console.log('❌ Prenotazione non trovata');
      return res.status(404).json({ message: "Prenotazione non trovata" });
    }

    console.log('⚙️ Determinazione maxPlayers...');
    // Determina maxPlayers basandosi sul tipo di sport del campo
    const campo = (bookingDoc as any).campo;
    let finalMaxPlayers = maxPlayers;
    
    if (campo?.sport) {
      const sportType = campo.sport as "beach volley" | "volley";
      
      // Se maxPlayers non è fornito, usa il default per lo sport
      if (!maxPlayers) {
        finalMaxPlayers = getDefaultMaxPlayersForSport(sportType);
        console.log('✅ MaxPlayers default per sport:', sportType, '->', finalMaxPlayers);
      } else {
        // Valida che maxPlayers sia valido per lo sport
        const validation = validateMaxPlayersForSport(maxPlayers, sportType);
        if (!validation.valid) {
          console.log('❌ MaxPlayers non valido:', validation.error);
          return res.status(400).json({ message: validation.error });
        }
        finalMaxPlayers = maxPlayers;
        console.log('✅ MaxPlayers validato:', finalMaxPlayers);
      }
    } else {
      // Fallback se non c'è sport
      finalMaxPlayers = maxPlayers || 4;
      console.log('⚠️ Fallback maxPlayers:', finalMaxPlayers);
    }

    console.log('💾 Creazione match nel DB...');
    const match = await Match.create({
      booking,
      createdBy: userId,
      maxPlayers: finalMaxPlayers,
      isPublic: isPublic || false,
      players: players || [],
      event: event || undefined,
      status: "open",
    });

    await match.populate("players.user", "username name surname avatarUrl");
    await match.populate("createdBy", "username name surname avatarUrl");
    console.log('✅ Match creato:', match._id);
    
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

    console.log('📨 [invitePlayer] Invito giocatore:', { matchId, username, team, userId });

    const match = await Match.findById(matchId);
    if (!match) {
      console.log('❌ Match non trovato');
      return res.status(404).json({ message: "Match non trovato" });
    }

    console.log('🔐 Verifica autorizzazione...');
    // Controlla se l'utente è il creatore o l'owner della struttura
    const isCreator = match.createdBy.toString() === userId;
    
    // Trova la prenotazione per ottenere l'owner della struttura
    const booking = await Booking.findById(match.booking).populate({
      path: 'campo',
      populate: {
        path: 'struttura'
      }
    });
    if (!booking) {
      console.log('❌ Prenotazione non trovata');
      return res.status(404).json({ message: "Prenotazione non trovata" });
    }
    
    const strutturaOwner = (booking.campo as any).struttura.owner.toString();
    const isOwner = strutturaOwner === userId;
    
    if (!isCreator && !isOwner) {
      console.log('❌ Non autorizzato - non creatore né owner');
      return res.status(403).json({ message: "Solo il creatore o l'owner della struttura possono invitare" });
    }

    console.log('🔍 Controllo status match...');
    // Match deve essere open
    if (!["open"].includes(match.status)) {
      console.log('❌ Match non aperto a nuovi giocatori');
      return res.status(400).json({ message: "Match non aperto a nuovi giocatori" });
    }

    console.log('👤 Ricerca utente da invitare...');
    // Trova utente da username
    const userToInvite = await User.findOne({ username: username.toLowerCase() });
    if (!userToInvite) {
      console.log('❌ Utente non trovato:', username);
      return res.status(404).json({ message: "Utente non trovato" });
    }

    console.log('🔍 Controllo se già invitato...');
    // Già presente?
    const alreadyInvited = match.players.some(
      (p) => p.user.toString() === userToInvite._id.toString()
    );
    if (alreadyInvited) {
      console.log('❌ Utente già invitato');
      return res.status(400).json({ message: "Utente già invitato" });
    }

    console.log('🔍 Controllo limite giocatori...');
    // Max players raggiunto?
    if (match.players.length >= match.maxPlayers) {
      console.log('❌ Match pieno');
      return res.status(400).json({ message: "Match pieno" });
    }

    console.log('🔍 Validazione team...');
    // Valida team se fornito
    if (team && team !== "A" && team !== "B") {
      console.log('❌ Team non valido');
      return res.status(400).json({ message: "Team deve essere 'A' o 'B'" });
    }

    // Team obbligatorio se maxPlayers > 2
    if (match.maxPlayers > 2 && !team) {
      console.log('❌ Team obbligatorio');
      return res.status(400).json({ message: "Team obbligatorio per questo match" });
    }

    console.log('➕ Aggiunta player al match...');
    // Aggiungi player con team opzionale
    // Se è l'owner ad invitare, aggiungi direttamente come confirmed
    const playerStatus = isOwner ? "confirmed" : "pending";
    
    match.players.push({
      user: userToInvite._id,
      status: playerStatus,
      team: team || undefined,
      joinedAt: new Date(),
    });

    await match.save();
    await match.populate("players.user", "username name surname avatarUrl");
    console.log('✅ Player aggiunto, status:', playerStatus);

    // Invia notifica diversa in base a chi invita
    try {
      if (isOwner) {
        // Notifica di aggiunta diretta da parte dell'owner
        await createNotification(
          userToInvite._id,
          new mongoose.Types.ObjectId(userId),
          "match_join",
          "Aggiunto a una partita",
          `Sei stato aggiunto a una partita presso ${(booking.campo as any).struttura.name}`,
          match._id,
          "Match"
        );
        console.log('📢 Notifica owner inviata');
      } else {
        // Notifica di invito normale da parte del creator
        await createNotification(
          userToInvite._id,
          new mongoose.Types.ObjectId(userId),
          "match_invite",
          "Invito a partita",
          `Sei stato invitato a una partita`,
          match._id,
          "Match"
        );
        console.log('📢 Notifica invito inviata');
      }
    } catch (notifError) {
      console.error("❌ Errore invio notifica:", notifError);
    }

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

    console.log("🎯 [JOIN MATCH] Richiesta join per match:", matchId, "da user:", userId);

    const match = await Match.findById(matchId).populate({
      path: 'booking',
      populate: [
        {
          path: 'struttura',
          select: 'owner name'
        },
        {
          path: 'campo',
          select: 'name sport struttura',
          populate: {
            path: 'struttura',
            select: 'name'
          }
        }
      ]
    }) as any;

    console.log("🔍 [DEBUG] Match popolato - struttura:", {
      matchId: match?._id,
      bookingStruttura: match?.booking?.struttura,
      strutturaName: (match?.booking as any)?.struttura?.name,
      strutturaOwner: (match?.booking as any)?.struttura?.owner,
      campoStruttura: (match?.booking as any)?.campo?.struttura,
      campoStrutturaName: (match?.booking as any)?.campo?.struttura?.name
    });

    // Ottieni i dati dell'utente che si unisce
    const joiningUser = await User.findById(userId).select('name surname username');
    if (!match) {
      return res.status(404).json({ message: "Match non trovato" });
    }

    // Match deve essere pubblico
    if (!match.isPublic) {
      return res.status(403).json({ message: "Match privato" });
    }

    // Verifica che il booking sia pubblico
    const booking = (match as any).booking;
    if (booking && booking.bookingType === "private") {
      return res.status(403).json({ message: "Prenotazione privata - solo su invito" });
    }

    // Match deve essere open
    if (match.status !== "open") {
      return res.status(400).json({ message: "Match non aperto" });
    }

    // Già presente?
    const alreadyJoined = match.players.some(
      (p: any) => p.user.toString() === userId
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

    console.log("✅ [JOIN MATCH] Join completato per match:", matchId, "nuovo totale giocatori:", match.players.length);
    
    // Debug struttura
    console.log("🔍 [DEBUG] Booking struttura info:", {
      bookingId: booking?._id,
      strutturaId: booking?.struttura,
      strutturaName: booking?.struttura?.name,
      strutturaOwner: booking?.struttura?.owner,
      campoName: booking?.campo?.name,
      campoSport: booking?.campo?.sport
    });

    // 📢 Notifiche per join match
    try {
      const creatorId = match.createdBy;
      const strutturaOwner = booking?.struttura?.owner;
      const userFullName = joiningUser ? `${joiningUser.name} ${joiningUser.surname}` : 'Un giocatore';
      
      console.log("🔍 [NOTIFICA] Controllo destinatari - Creatore:", creatorId, "Proprietario struttura:", strutturaOwner, "User che si unisce:", userId);
      
      // Notifica al creatore del match (se diverso dal giocatore che si unisce)
      if (creatorId && creatorId.toString() !== userId) {
        console.log("📝 [NOTIFICA] Creazione notifica per creatore match:", creatorId);
        
        console.log("📋 [NOTIFICA] Dettagli notifica creatore:", JSON.stringify({
          recipientId: creatorId,
          senderId: userId,
          type: "match_join",
          title: `Nuovo giocatore: ${userFullName}`,
          message: `${userFullName} si è unito al tuo match di ${booking?.campo?.sport || 'beach volley'} sul campo ${booking?.campo?.name || 'campo'} (${(booking?.campo as any)?.struttura?.name || booking?.struttura?.name || 'struttura'})`,
          relatedId: booking?._id,
          relatedModel: "Booking"
        }, null, 2));
        
        await createNotification(
          new mongoose.Types.ObjectId(creatorId),
          new mongoose.Types.ObjectId(userId),
          "match_join",
          `Nuovo giocatore: ${userFullName}`,
          `${userFullName} si è unito al tuo match di ${booking?.campo?.sport || 'beach volley'} sul campo ${booking?.campo?.name || 'campo'} (${(booking?.campo as any)?.struttura?.name || booking?.struttura?.name || 'struttura'})`,
          new mongoose.Types.ObjectId(booking?._id), // Passiamo la bookingId invece del matchId
          "Booking" // Cambiamo il relatedModel a Booking
        );
        console.log("✅ [NOTIFICA] Notifica inviata al creatore del match");
      }
      
      // Notifica al proprietario della struttura (se diverso dal creatore e dal giocatore)
      if (strutturaOwner && strutturaOwner.toString() !== userId && strutturaOwner.toString() !== creatorId?.toString()) {
        console.log("📝 [NOTIFICA] Creazione notifica per proprietario struttura:", strutturaOwner);
        
        const notificationData = {
          recipientId: strutturaOwner,
          senderId: userId,
          type: "match_join",
          title: `Nuovo giocatore: ${userFullName}`,
          message: `${userFullName} si è unito a un match di ${booking?.campo?.sport || 'beach volley'} sul campo ${booking?.campo?.name || 'campo'} (${(booking?.campo as any)?.struttura?.name || booking?.struttura?.name || 'struttura'})`,
          relatedId: booking?._id,
          relatedModel: "Booking"
        };
        console.log("📋 [NOTIFICA] Dettagli notifica proprietario:", JSON.stringify({
          recipientId: strutturaOwner,
          senderId: userId,
          type: "match_join",
          title: `Nuovo giocatore: ${userFullName}`,
          message: `${userFullName} si è unito a un match di ${booking?.campo?.sport || 'beach volley'} sul campo ${booking?.campo?.name || 'campo'} (${(booking?.campo as any)?.struttura?.name || booking?.struttura?.name || 'struttura'})`,
          relatedId: booking?._id,
          relatedModel: "Booking"
        }, null, 2));
        
        await createNotification(
          new mongoose.Types.ObjectId(strutturaOwner),
          new mongoose.Types.ObjectId(userId),
          "match_join",
          `Nuovo giocatore: ${userFullName}`,
          `${userFullName} si è unito a un match di ${booking?.campo?.sport || 'beach volley'} sul campo ${booking?.campo?.name || 'campo'} (${(booking?.campo as any)?.struttura?.name || booking?.struttura?.name || 'struttura'})`,
          new mongoose.Types.ObjectId(booking?._id), // Passiamo la bookingId invece del matchId
          "Booking" // Cambiamo il relatedModel a Booking
        );
        console.log("✅ [NOTIFICA] Notifica inviata al proprietario della struttura");
      } else {
        console.log("⚠️ [NOTIFICA] Proprietario struttura non notificato - stesso del creatore o del giocatore");
      }
    } catch (notificationError) {
      console.error("❌ [NOTIFICA] Errore creazione notifiche join:", notificationError);
      // Non fallire il join per un errore di notifica
    }

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

    // Invia notifica all'organizzatore
    try {
      const organizerId = match.createdBy._id || match.createdBy;
      if (organizerId.toString() !== userId) {
        const playerUser = await User.findById(userId);
        const playerName = playerUser?.username || playerUser?.name || 'Un giocatore';
        
        // Recupera la prenotazione per ottenere struttura e data
        const booking = await Booking.findOne({ match: match._id })
          .populate('campo')
          .populate({
            path: 'campo',
            populate: { path: 'struttura', select: 'name' }
          });
        
        console.log('🔍 [Backend] Booking trovato:', {
          found: !!booking,
          bookingId: booking?._id?.toString(),
          matchId: match._id.toString()
        });

        if (!booking) {
          console.warn('⚠️ [Backend] Nessun booking trovato per matchId:', match._id);
        }
        
        const strutturaName = (booking?.campo as any)?.struttura?.name || 'la struttura';
        const bookingDate = booking?.date ? new Date(booking.date).toLocaleDateString('it-IT', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        }) : 'data non disponibile';
        
        const notificationType = action === "accept" ? "invite_accepted" : "invite_declined";
        const actionText = action === "accept" ? "accettato" : "rifiutato";
        const notificationMessage = `${playerName} ha ${actionText} l'invito per la partita presso ${strutturaName} del ${bookingDate}`;

        // Usa il booking._id se disponibile, altrimenti usa match._id
        const relatedId = booking?._id || match._id;
        const relatedModel = booking?._id ? "Booking" : "Match";

        console.log('📤 [Backend] Creazione notifica per organizzatore:', {
          recipientId: organizerId.toString(),
          senderId: userId,
          type: notificationType,
          matchId: match._id.toString(),
          relatedId: relatedId.toString(),
          relatedModel,
          message: notificationMessage
        });

        await createNotification(
          organizerId,
          new Types.ObjectId(userId),
          notificationType as any,
          notificationMessage.substring(0, 50),
          notificationMessage,
          relatedId,
          relatedModel as any
        );

        console.log('✅ [Backend] Notifica creata con successo');
      } else {
        console.log('⚠️ [Backend] Notifica non inviata: organizzatore stesso');
      }
    } catch (notifError) {
      console.error('❌ [Backend] Errore creazione notifica:', notifError);
      // Non bloccare il flusso se la notifica fallisce
    }

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

    // Controlla se l'utente è il creatore o l'owner della struttura
    const isCreator = match.createdBy.toString() === userId;
    
    // Trova la prenotazione per ottenere l'owner della struttura
    const booking = await Booking.findById(match.booking).populate({
      path: 'campo',
      populate: {
        path: 'struttura'
      }
    });
    if (!booking) {
      return res.status(404).json({ message: "Prenotazione non trovata" });
    }
    
    const strutturaOwner = (booking.campo as any).struttura.owner.toString();
    const isOwner = strutturaOwner === userId;
    
    if (!isCreator && !isOwner) {
      return res.status(403).json({ message: "Solo il creatore o l'owner della struttura possono rimuovere giocatori" });
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

    console.log('🏆 [submitResult] Inizio inserimento risultato:', {
      matchId,
      userId,
      score
    });

    const match = await Match.findById(matchId);
    if (!match) {
      console.log('❌ [submitResult] Match non trovato:', matchId);
      return res.status(404).json({ message: "Match non trovato" });
    }

    console.log('✅ [submitResult] Match trovato:', {
      matchId: match._id,
      createdBy: match.createdBy,
      players: match.players.map(p => ({ user: p.user, status: p.status }))
    });

    // Verifica autorizzazione: createdBy, players o owner della struttura
    const isCreator = match.createdBy.toString() === userId;
    const isPlayer = match.players.some((p) => p.user.toString() === userId);
    
    console.log('🔍 [submitResult] Check autorizzazione base:', {
      userId,
      isCreator,
      isPlayer,
      createdBy: match.createdBy.toString()
    });
    
    let isOwner = false;
    // Verifica se l'utente è l'owner della struttura
    const booking = await Booking.findOne({ match: matchId }).populate({
      path: 'campo',
      populate: {
        path: 'struttura',
        select: 'owner name'
      }
    });
    
    console.log('📋 [submitResult] Booking trovato:', {
      bookingId: booking?._id,
      hasCampo: !!booking?.campo,
      hasStruttura: !!(booking as any)?.campo?.struttura
    });
    
    if (booking && booking.campo) {
      const struttura = (booking as any).campo?.struttura;
      if (struttura) {
        console.log('🏢 [submitResult] Struttura trovata:', {
          strutturaId: struttura._id,
          ownerId: struttura.owner?.toString(),
          userId
        });
        if (struttura.owner.toString() === userId) {
          isOwner = true;
        }
      } else {
        console.log('⚠️ [submitResult] Campo trovato ma struttura non popolata');
      }
    }

    console.log('🔐 [submitResult] Autorizzazione finale:', {
      isCreator,
      isPlayer,
      isOwner,
      authorized: isCreator || isPlayer || isOwner
    });

    if (!isCreator && !isPlayer && !isOwner) {
      console.log('❌ [submitResult] Non autorizzato');
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

    // Verifica se è una modifica o un inserimento
    const isUpdate = match.score && match.score.sets && match.score.sets.length > 0;

    // Aggiorna match
    match.score = { sets: score.sets };
    match.winner = winner;
    match.playedAt = new Date();
    match.status = "completed";

    await match.save();
    await match.populate("players.user", "username name surname avatarUrl");
    await match.populate("createdBy", "username name surname avatarUrl");

    // Invia notifiche a tutti i partecipanti e all'owner della struttura
    try {
      // Ri-popola il booking per le notifiche se non già fatto
      let notifBooking = booking;
      if (!booking || !booking.campo) {
        notifBooking = await Booking.findOne({ match: matchId }).populate({
          path: 'campo',
          populate: {
            path: 'struttura',
            select: 'name owner'
          }
        });
      }
      
      if (notifBooking && notifBooking.campo) {
        const struttura = (notifBooking as any).campo?.struttura;
        const strutturaName = struttura?.name || 'la struttura';
        const strutturaOwnerId = struttura?.owner;
        const bookingDate = new Date(notifBooking.date).toLocaleDateString('it-IT', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        
        // Prepara i dati del risultato per il messaggio
        const scoreDetails = `Team ${winner} ha vinto ${winsA > winsB ? winsA : winsB}-${winsA > winsB ? winsB : winsA}`;
        
        // Notifica per i GIOCATORI
        const playerNotificationTitle = isUpdate ? "Risultato partita modificato" : "Risultato partita inserito";
        const playerNotificationMessage = isUpdate
          ? `Il risultato della partita presso ${strutturaName} del ${bookingDate} è stato aggiornato. ${scoreDetails}`
          : `È stato inserito un risultato per la partita presso ${strutturaName} del ${bookingDate}. ${scoreDetails}`;
        
        // Invia notifica a tutti i giocatori confermati (eccetto chi ha inserito il risultato)
        const confirmedPlayers = match.players.filter(p => p.status === 'confirmed');
        let playerNotificationsCount = 0;
        
        for (const player of confirmedPlayers) {
          const playerId = typeof player.user === 'object' ? (player.user as any)._id : player.user;
          
          // Non inviare notifica a chi ha inserito il risultato
          if (playerId.toString() !== userId) {
            await createNotification(
              playerId,
              new Types.ObjectId(userId),
              'match_result',
              playerNotificationTitle,
              playerNotificationMessage,
              notifBooking._id as Types.ObjectId,
              'Booking'
            );
            playerNotificationsCount++;
          }
        }
        
        console.log(`✅ [submitResult] Notifiche inviate a ${playerNotificationsCount} giocatori`);
        
        // Notifica per l'OWNER DELLA STRUTTURA (se diverso da chi ha inserito il risultato)
        if (strutturaOwnerId && strutturaOwnerId.toString() !== userId) {
          const ownerNotificationTitle = isUpdate ? "Risultato partita aggiornato" : "Partita conclusa";
          const ownerNotificationMessage = isUpdate
            ? `Il risultato della partita del ${bookingDate} presso ${strutturaName} è stato aggiornato: ${scoreDetails}`
            : `La partita del ${bookingDate} presso ${strutturaName} è stata conclusa con risultato: ${scoreDetails}`;
          
          await createNotification(
            strutturaOwnerId,
            new Types.ObjectId(userId),
            'match_result',
            ownerNotificationTitle,
            ownerNotificationMessage,
            notifBooking._id as Types.ObjectId,
            'Booking'
          );
          
          console.log(`✅ [submitResult] Notifica inviata all'owner della struttura`);
        }
      }
    } catch (notifError) {
      console.error("⚠️ [submitResult] Errore invio notifiche:", notifError);
      // Non blocchiamo la risposta se le notifiche falliscono
    }

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
 * GET /matches
 * Lista match pubblici disponibili per unirsi
 */
export const getPublicMatches = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { status } = req.query;

    console.log('🔍 [getPublicMatches] Richiesta per userId:', userId);

    // Query per match pubblici non completi
    let query: any = {
      isPublic: true,
      status: { $in: ["open", "draft"] },
      // Escludi match dove l'utente è già presente
      "players.user": { $ne: userId }
    };

    // Se richiesto solo status=open
    if (status === "open") {
      query.status = "open";
    }

    const matches = await Match.find(query)
      .sort({ createdAt: -1 })
      .populate("players.user", "username name surname avatarUrl")
      .populate("createdBy", "username name surname avatarUrl")
      .populate({
        path: "booking",
        select: "date startTime endTime campo user price bookingType",
        populate: {
          path: "campo",
          select: "name sport",
          populate: {
            path: "struttura",
            select: "name location images",
          },
        },
      });

    // Filtra match che hanno booking con bookingType pubblico
    const publicMatches = matches.filter(match => {
      if (!match.booking) return false;
      const booking = match.booking as any;
      return !booking.bookingType || booking.bookingType === "public";
    });

    console.log(`✅ [getPublicMatches] Trovati ${publicMatches.length} match pubblici`);

    res.json(publicMatches);
  } catch (err) {
    console.error("❌ getPublicMatches error:", err);
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

    // Match deve essere open
    if (match.status !== "open") {
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

    // Calcola la capacità massima per squadra
    const maxPlayersPerTeam = Math.floor(match.maxPlayers / 2);

    // Conta giocatori confermati per squadra
    const teamAPlayers = match.players.filter(p => p.status === "confirmed" && p.team === "A").length;
    const teamBPlayers = match.players.filter(p => p.status === "confirmed" && p.team === "B").length;
    const unassignedPlayers = match.players.filter(p => p.status === "confirmed" && !p.team).length;

    console.log(`🔍 [assignPlayerTeam] Stato iniziale team per match ${matchId}:`);
    console.log(`   Team A: ${teamAPlayers}/${maxPlayersPerTeam} giocatori`);
    console.log(`   Team B: ${teamBPlayers}/${maxPlayersPerTeam} giocatori`);
    console.log(`   Non assegnati: ${unassignedPlayers} giocatori`);
    console.log(`   Assegnazione richiesta: player ${playerId} → Team ${team || 'null'}`);

    // Validazione: nessun team deve superare il limite massimo
    if (teamAPlayers > maxPlayersPerTeam || teamBPlayers > maxPlayersPerTeam) {
      const overcrowdedTeam = teamAPlayers > maxPlayersPerTeam ? "A" : "B";
      const availableTeam = overcrowdedTeam === "A" ? "B" : "A";
      console.log(`🚨 [assignPlayerTeam] ERRORE: Team ${overcrowdedTeam} sovraffollato (${teamAPlayers > maxPlayersPerTeam ? teamAPlayers : teamBPlayers}/${maxPlayersPerTeam})`);
      return res.status(400).json({
        message: `Team ${overcrowdedTeam} ha troppi giocatori. Sposta manualmente un giocatore dal Team ${overcrowdedTeam} al Team ${availableTeam} o rimuovilo prima di continuare.`,
        overcrowdedTeam,
        availableTeam,
        currentCount: teamAPlayers > maxPlayersPerTeam ? teamAPlayers : teamBPlayers,
        maxAllowed: maxPlayersPerTeam
      });
    }

    // Se il team target è già pieno, bilancia spostando un giocatore dal team pieno al team con meno giocatori
    if (team && ((team === "A" && teamAPlayers >= maxPlayersPerTeam) || (team === "B" && teamBPlayers >= maxPlayersPerTeam))) {
      const targetTeam = team;
      const otherTeam = team === "A" ? "B" : "A";
      const targetTeamPlayers = match.players.filter(p => p.status === "confirmed" && p.team === targetTeam);

      const targetTeamCount = targetTeam === "A" ? teamAPlayers : teamBPlayers;
      const otherTeamCount = otherTeam === "A" ? teamAPlayers : teamBPlayers;

      console.log(`⚖️ [assignPlayerTeam] Bilanciamento necessario: ${targetTeam}(${targetTeamCount}/${maxPlayersPerTeam}) pieno, ${otherTeam}(${otherTeamCount}/${maxPlayersPerTeam}) ha spazio`);

      if (targetTeamPlayers.length > 0) {
        // Sposta il primo giocatore del team pieno al team con spazio
        const playerToMove = targetTeamPlayers[0];
        playerToMove.team = otherTeam;
        console.log(`🚀 [assignPlayerTeam] Spostamento bilanciato: ${playerToMove.user} da Team ${targetTeam} a Team ${otherTeam}`);
      } else {
        console.log(`❌ [assignPlayerTeam] Impossibile bilanciare: nessun giocatore nel team ${targetTeam} da spostare`);
        return res.status(400).json({ message: `Impossibile assegnare al Team ${team}: squadra piena e nessun giocatore da spostare` });
      }
    }

    // Assegna il team
    player.team = team as any;
    console.log(`✅ [assignPlayerTeam] Assegnazione completata: player ${playerId} → Team ${team || 'null'}`);

    // Ricalcola i conteggi finali
    const finalTeamAPlayers = match.players.filter(p => p.status === "confirmed" && p.team === "A").length;
    const finalTeamBPlayers = match.players.filter(p => p.status === "confirmed" && p.team === "B").length;
    const finalUnassignedPlayers = match.players.filter(p => p.status === "confirmed" && !p.team).length;

    console.log(`📊 [assignPlayerTeam] Stato finale team:`);
    console.log(`   Team A: ${finalTeamAPlayers}/${maxPlayersPerTeam} giocatori`);
    console.log(`   Team B: ${finalTeamBPlayers}/${maxPlayersPerTeam} giocatori`);
    console.log(`   Non assegnati: ${finalUnassignedPlayers} giocatori`);
    console.log(`   Totale confermati: ${finalTeamAPlayers + finalTeamBPlayers + finalUnassignedPlayers}`);

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

    // Verifica se l'utente è il creatore del match o l'owner della struttura
    let isAuthorized = match.createdBy.toString() === userId;
    
    // Se non è il creatore, verifica se è l'owner della struttura
    if (!isAuthorized) {
      const booking = await Booking.findOne({ match: matchId }).populate({
        path: 'campo',
        populate: {
          path: 'struttura',
          select: 'owner name'
        }
      });
      if (booking && booking.campo) {
        const struttura = (booking as any).campo?.struttura;
        if (struttura && struttura.owner.toString() === userId) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ message: "Non autorizzato" });
    }

    // Il match non deve essere cancellato
    if (match.status === "cancelled") {
      return res.status(400).json({ message: "Non puoi inserire il risultato di un match cancellato" });
    }

    // Verifica se è una modifica o un inserimento
    const isUpdate = match.score && match.score.sets && match.score.sets.length > 0;

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

    // Invia notifiche a tutti i partecipanti e all'owner della struttura
    try {
      const booking = await Booking.findOne({ match: matchId }).populate({
        path: 'campo',
        populate: {
          path: 'struttura',
          select: 'name owner'
        }
      });
      
      if (booking) {
        const struttura = (booking as any).campo?.struttura;
        const strutturaName = struttura?.name || 'la struttura';
        const strutturaOwnerId = struttura?.owner;
        const bookingDate = new Date(booking.date).toLocaleDateString('it-IT', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        
        // Prepara i dati del risultato per il messaggio
        const scoreDetails = `Team ${winner} ha vinto ${sets.length === 2 ? '2-0' : sets.filter((s: any) => 
          (winner === 'A' && s.teamA > s.teamB) || (winner === 'B' && s.teamB > s.teamA)
        ).length + '-' + sets.filter((s: any) => 
          (winner === 'A' && s.teamA < s.teamB) || (winner === 'B' && s.teamB < s.teamA)
        ).length}`;
        
        // Notifica per i GIOCATORI
        const playerNotificationTitle = isUpdate ? "Risultato partita modificato" : "Risultato partita inserito";
        const playerNotificationMessage = isUpdate 
          ? `Il risultato della partita presso ${strutturaName} del ${bookingDate} è stato aggiornato. ${scoreDetails}`
          : `È stato inserito un risultato per la partita presso ${strutturaName} del ${bookingDate}. ${scoreDetails}`;
        
        // Invia notifica a tutti i giocatori confermati (eccetto chi ha inserito il risultato)
        const confirmedPlayers = match.players.filter(p => p.status === 'confirmed');
        let playerNotificationsCount = 0;
        
        for (const player of confirmedPlayers) {
          const playerId = typeof player.user === 'object' ? (player.user as any)._id : player.user;
          
          // Non inviare notifica a chi ha inserito il risultato
          if (playerId.toString() !== userId) {
            await createNotification(
              playerId,
              new Types.ObjectId(userId),
              'match_result',
              playerNotificationTitle,
              playerNotificationMessage,
              booking._id as Types.ObjectId,
              'Booking'
            );
            playerNotificationsCount++;
          }
        }
        
        console.log(`✅ [submitScore] Notifiche inviate a ${playerNotificationsCount} giocatori`);
        
        // Notifica per l'OWNER DELLA STRUTTURA (se diverso da chi ha inserito il risultato)
        if (strutturaOwnerId && strutturaOwnerId.toString() !== userId) {
          const ownerNotificationTitle = isUpdate ? "Risultato partita aggiornato" : "Partita conclusa";
          const ownerNotificationMessage = isUpdate
            ? `Il risultato della partita del ${bookingDate} presso ${strutturaName} è stato aggiornato: ${scoreDetails}`
            : `La partita del ${bookingDate} presso ${strutturaName} è stata conclusa con risultato: ${scoreDetails}`;
          
          await createNotification(
            strutturaOwnerId,
            new Types.ObjectId(userId),
            'match_result',
            ownerNotificationTitle,
            ownerNotificationMessage,
            booking._id as Types.ObjectId,
            'Booking'
          );
          
          console.log(`✅ [submitScore] Notifica inviata all'owner della struttura`);
        }
      }
    } catch (notifError) {
      console.error("⚠️ [submitScore] Errore invio notifiche:", notifError);
      // Non blocchiamo la risposta se le notifiche falliscono
    }

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

/**
 * POST /matches/:matchId/players
 * Aggiunge un giocatore al match (per owner)
 */
export const addPlayerToMatch = async (req: AuthRequest, res: Response) => {
  try {
    const { matchId } = req.params;
    const { userId, team } = req.body;

    if (!mongoose.Types.ObjectId.isValid(matchId)) {
      return res.status(400).json({ message: "ID match non valido" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "ID utente non valido" });
    }

    const match = await Match.findById(matchId).populate('booking');
    if (!match) {
      return res.status(404).json({ message: "Match non trovato" });
    }

    // Match deve essere draft o open
    if (!["draft", "open"].includes(match.status)) {
      return res.status(400).json({ message: "Match non aperto a nuovi giocatori" });
    }

    // Verifica che l'utente esista
    const userToAdd = await User.findById(userId);
    if (!userToAdd) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    // Già presente?
    const alreadyInMatch = match.players.some(
      (p) => p.user.toString() === userId
    );
    if (alreadyInMatch) {
      return res.status(400).json({ message: "Utente già nel match" });
    }

    // Max players raggiunto?
    if (match.players.length >= match.maxPlayers) {
      return res.status(400).json({ message: "Match pieno" });
    }

    // Valida team se fornito
    if (team && team !== "A" && team !== "B") {
      return res.status(400).json({ message: "Team deve essere 'A' o 'B'" });
    }

    // Aggiungi player direttamente confermato (owner bypass)
    match.players.push({
      user: new mongoose.Types.ObjectId(userId),
      status: "confirmed",
      team: team || undefined,
      joinedAt: new Date(),
    });

    await match.save();
    await match.populate("players.user", "username name surname avatarUrl");
    await match.populate("createdBy", "username name surname avatarUrl");

    res.json(match);
  } catch (err) {
    console.error("❌ addPlayerToMatch error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * GET /matches/future-followed
 * Ottiene le partite future delle strutture seguite
 */
export const getFutureMatchesFromFollowedStructures = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user!.id;
    console.log('getFutureMatchesFromFollowedStructures called for user:', userId);

    // Importa User per controllare il ruolo
    const user = await User.findById(userId);
    const isOwner = user?.role === 'owner';
    console.log('User role:', user?.role, 'isOwner:', isOwner);

    let strutturaIds: any[] = [];

    if (isOwner) {
      // Per owner, usa le proprie strutture
      const strutture = await Struttura.find({ owner: userId }).select('_id');
      strutturaIds = strutture.map((s: any) => s._id);
      console.log('Owner strutture:', strutturaIds);
    } else {
      // Per player, usa strutture seguite
      const followedStructures = await StrutturaFollower.find({
        follower: userId,
        active: true
      }).select('followed');
      console.log('followedStructures:', followedStructures);
      strutturaIds = followedStructures.map((f: any) => f.followed);
    }

    console.log('strutturaIds:', strutturaIds);

    if (strutturaIds.length === 0) {
      console.log('No strutture, returning empty array');
      return res.json([]);
    }

    // Trova match futuri
    const now = new Date();
    console.log('Current date:', now);
    const matches = await Match.find({
      status: { $in: ['open', 'full', 'in_progress'] }
    })
    .populate({
      path: 'booking',
      populate: {
        path: 'campo',
        populate: {
          path: 'struttura'
        }
      }
    })
    .populate('players.user', 'username name surname avatarUrl')
    .populate('createdBy', 'username name surname avatarUrl')
    .sort({ 'booking.date': 1 });
    console.log('All matches found:', matches.length);

    // Filtra per strutture e date future
    const futureMatches = matches.filter(match => {
      const booking = match.booking as any;
      if (!booking || !booking.campo || !booking.campo.struttura) return false;
      const strutturaId = booking.campo.struttura._id.toString();
      const isInStruttura = strutturaIds.some((id: any) => id.toString() === strutturaId);
      const isFuture = new Date(booking.date) > now;
      console.log('Match:', match._id, 'strutturaId:', strutturaId, 'isInStruttura:', isInStruttura, 'isFuture:', isFuture);
      return isInStruttura && isFuture;
    });
    console.log('Future matches after filter:', futureMatches.length);

    res.json(futureMatches);
  } catch (err) {
    console.error("❌ getFutureMatchesFromFollowedStructures error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};
