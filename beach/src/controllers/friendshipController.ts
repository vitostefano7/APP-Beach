import { Response } from "express";
import mongoose, { Types } from "mongoose";
import Friendship, { IFriendship } from "../models/Friendship";
import User from "../models/User";
import Match from "../models/Match";
import Booking from "../models/Booking";
import Struttura from "../models/Strutture";
import { AuthRequest } from "../middleware/authMiddleware";
import { createNotification } from "../utils/notificationHelper";

// Interfaccia per i suggerimenti
interface SuggestedUser {
  user: {
    _id: Types.ObjectId;
    name: string;
    username: string;
    avatarUrl?: string;
    preferredSports?: string[];
  };
  reason: {
    type: "match_together" | "mutual_friends" | "same_venue";
    details: {
      matchCount?: number;
      mutualFriendsCount?: number;
      venueName?: string;
      lastPlayed?: Date;
    };
  };
  score: number;
  friendshipStatus?: "none" | "pending" | "accepted";
}

/**
 * CONTROLLER PER GESTIONE AMICIZIE
 */
export const friendshipController = {
  /**
   * 1. INVIA RICHIESTA DI AMICIZIA
   * POST /api/friends/request
   */
  async sendRequest(req: AuthRequest, res: Response) {
    try {
      console.log("📤 [sendRequest] User:", req.user?.id);
      
      if (!req.user?.id) {
        return res.status(401).json({ error: "Non autenticato" });
      }
      
      const requesterId = new Types.ObjectId(req.user.id);
      const { recipientId } = req.body;

      if (!recipientId) {
        return res.status(400).json({ error: "ID destinatario richiesto" });
      }

      const recipientObjectId = new Types.ObjectId(recipientId);

      // Verifica che il destinatario esista
      const recipient = await User.findById(recipientObjectId);
      if (!recipient || !recipient.isActive) {
        return res.status(404).json({ error: "Utente non trovato" });
      }

      // Non puoi inviare richiesta a te stesso
      if (requesterId.equals(recipientObjectId)) {
        return res.status(400).json({ error: "Non puoi inviare una richiesta a te stesso" });
      }

      // Controlla se esiste già un follow nella stessa direzione (requester → recipient)
      const existingFriendship = await Friendship.findOne({
        requester: requesterId,
        recipient: recipientObjectId,
      });

      if (existingFriendship) {
        let message = "";
        switch (existingFriendship.status) {
          case "pending":
            message = "Hai già inviato una richiesta a questo utente";
            break;
          case "accepted":
            message = "Stai già seguendo questo utente";
            break;
          case "rejected":
            message = "Richiesta precedentemente rifiutata";
            break;
          case "blocked":
            message = "Non puoi inviare richieste a questo utente";
            break;
        }
        return res.status(400).json({ error: message });
      }

      // Controlla la privacy del recipient
      const recipientPrivacy = recipient.profilePrivacy || "public";
      const isPrivate = recipientPrivacy === "private";

      // Crea nuovo follow
      const friendship = new Friendship({
        requester: requesterId,
        recipient: recipientObjectId,
        status: isPrivate ? "pending" : "accepted", // Se privato: pending, altrimenti accettato
        acceptedAt: isPrivate ? undefined : new Date(),
      });

      await friendship.save();

      // Popola i dati per la risposta
      await friendship.populate([
        { path: "requester", select: "name username avatarUrl" },
        { path: "recipient", select: "name username avatarUrl profilePrivacy" },
      ]);

      // Se è pubblico, verifica se è reciproco
      let isReciprocal = false;
      if (!isPrivate) {
        const reciprocalFriendship = await Friendship.findOne({
          requester: recipientObjectId,
          recipient: requesterId,
          status: "accepted",
        });
        isReciprocal = !!reciprocalFriendship;
      }

      // Crea notifica per il recipient
      try {
        const requester = friendship.requester as any;
        
        if (isPrivate) {
          // Profilo privato: notifica di richiesta follow con ID della Friendship
          await createNotification(
            recipientObjectId,
            requesterId,
            "new_follower",
            `${requester.name} vuole seguirti`,
            `${requester.name} (@${requester.username}) ti ha inviato una richiesta per seguirti`,
            friendship._id, // ID della Friendship per poterla accettare/rifiutare
            "Friendship"
          );
        } else {
          // Profilo pubblico: notifica di follow automatico con ID dell'utente
          await createNotification(
            recipientObjectId,
            requesterId,
            "new_follower",
            `${requester.name} ha iniziato a seguirti`,
            `${requester.name} (@${requester.username}) ti sta seguendo`,
            requesterId, // ID dell'utente per navigare al profilo
            "User"
          );

          // Se è reciproco, notifica anche il requester
          if (isReciprocal) {
            const recipientUser = friendship.recipient as any;
            await createNotification(
              requesterId,
              recipientObjectId,
              "follow_back",
              `${recipientUser.name} ti segue ora`,
              `Ora tu e ${recipientUser.name} vi seguite a vicenda`,
              recipientObjectId,
              "User"
            );
          }
        }
      } catch (notifError) {
        console.error("⚠️ Errore creazione notifiche (non bloccante):", notifError);
      }

      const responseMessage = isPrivate 
        ? "Richiesta di follow inviata" 
        : (isReciprocal ? "Ora vi seguite a vicenda" : "Ora segui questo utente");

      res.status(201).json({
        message: responseMessage,
        friendship,
        isReciprocal: !isPrivate && isReciprocal,
        isPending: isPrivate,
      });
    } catch (error) {
      console.log("❌ [sendRequest] Errore:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  },

  /**
   * 2. ACCETTA RICHIESTA DI AMICIZIA
   * PUT /api/friends/request/:id/accept
   */
  async acceptRequest(req: AuthRequest, res: Response) {
    try {
      console.log("✅ [acceptRequest] User:", req.user?.id);
      
      if (!req.user?.id) {
        return res.status(401).json({ error: "Non autenticato" });
      }
      
      const userId = new Types.ObjectId(req.user.id);
      const { id } = req.params;

      const friendship = await Friendship.findById(id);

      if (!friendship) {
        return res.status(404).json({ error: "Richiesta non trovata" });
      }

      // Verifica che l'utente sia il destinatario
      if (!friendship.recipient.equals(userId)) {
        return res.status(403).json({ error: "Non autorizzato" });
      }

      // Verifica che la richiesta sia in pending
      if (friendship.status !== "pending") {
        return res.status(400).json({ error: `Richiesta già ${friendship.status}` });
      }

      // Aggiorna lo stato
      friendship.status = "accepted";
      await friendship.save();

      // Popola i dati per la risposta
      await friendship.populate([
        { path: "requester", select: "name username avatarUrl" },
        { path: "recipient", select: "name username avatarUrl" },
      ]);

      res.json({
        message: "Richiesta di amicizia accettata",
        friendship,
      });
    } catch (error) {
      console.log("❌ [acceptRequest] Errore:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  },

  /**
   * 3. RIFIUTA RICHIESTA DI AMICIZIA
   * PUT /api/friends/request/:id/reject
   */
  async rejectRequest(req: AuthRequest, res: Response) {
    try {
      console.log("❌ [rejectRequest] User:", req.user?.id);
      
      if (!req.user?.id) {
        return res.status(401).json({ error: "Non autenticato" });
      }
      
      const userId = new Types.ObjectId(req.user.id);
      const { id } = req.params;

      const friendship = await Friendship.findById(id);

      if (!friendship) {
        return res.status(404).json({ error: "Richiesta non trovata" });
      }

      // Verifica che l'utente sia il destinatario
      if (!friendship.recipient.equals(userId)) {
        return res.status(403).json({ error: "Non autorizzato" });
      }

      // Verifica che la richiesta sia in pending
      if (friendship.status !== "pending") {
        return res.status(400).json({ error: `Richiesta già ${friendship.status}` });
      }

      // Aggiorna lo stato
      friendship.status = "rejected";
      await friendship.save();

      res.json({
        message: "Richiesta di amicizia rifiutata",
        friendshipId: friendship._id,
      });
    } catch (error) {
      console.log("❌ [rejectRequest] Errore:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  },

  /**
   * 4. CANCELLA/REVOCA RICHIESTA DI AMICIZIA
   * DELETE /api/friends/request/:id
   */
  async deleteRequest(req: AuthRequest, res: Response) {
    try {
      console.log("🗑️ [deleteRequest] User:", req.user?.id);
      
      if (!req.user?.id) {
        return res.status(401).json({ error: "Non autenticato" });
      }
      
      const userId = new Types.ObjectId(req.user.id);
      const { id } = req.params;

      const friendship = await Friendship.findById(id);

      if (!friendship) {
        return res.status(404).json({ error: "Richiesta non trovata" });
      }

      // Verifica che l'utente sia il mittente O il destinatario
      const isRequester = friendship.requester.equals(userId);
      const isRecipient = friendship.recipient.equals(userId);

      if (!isRequester && !isRecipient) {
        return res.status(403).json({ error: "Non autorizzato" });
      }

      // Solo il mittente può cancellare richieste pending
      if (friendship.status === "pending" && !isRequester) {
        return res.status(403).json({ error: "Solo il mittente può cancellare una richiesta pendente" });
      }

      await Friendship.findByIdAndDelete(id);

      res.json({
        message: "Richiesta di amicizia eliminata",
        friendshipId: id,
      });
    } catch (error) {
      console.log("❌ [deleteRequest] Errore:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  },

  /**
   * 5. BLOCCA UTENTE
   * POST /api/friends/block
   */
  async blockUser(req: AuthRequest, res: Response) {
    try {
      console.log("🚫 [blockUser] User:", req.user?.id);
      
      if (!req.user?.id) {
        return res.status(401).json({ error: "Non autenticato" });
      }
      
      const userId = new Types.ObjectId(req.user.id);
      const { targetUserId, reason } = req.body;

      if (!targetUserId) {
        return res.status(400).json({ error: "ID utente richiesto" });
      }

      const targetUserObjectId = new Types.ObjectId(targetUserId);

      // Verifica che l'utente esista
      const targetUser = await User.findById(targetUserObjectId);
      if (!targetUser) {
        return res.status(404).json({ error: "Utente non trovato" });
      }

      // Non puoi bloccare te stesso
      if (userId.equals(targetUserObjectId)) {
        return res.status(400).json({ error: "Non puoi bloccare te stesso" });
      }

      // Trova o crea la relazione di blocco
      let friendship = await Friendship.findOne({
        $or: [
          { requester: userId, recipient: targetUserObjectId },
          { requester: targetUserObjectId, recipient: userId },
        ],
      });

      if (friendship) {
        // Aggiorna lo stato esistente
        friendship.status = "blocked";
        friendship.blockedBy = userId;
        if (reason) friendship.blockReason = reason;
      } else {
        // Crea nuova relazione di blocco
        friendship = new Friendship({
          requester: userId,
          recipient: targetUserObjectId,
          status: "blocked",
          blockedBy: userId,
          blockReason: reason,
        });
      }

      await friendship.save();

      res.json({
        message: "Utente bloccato con successo",
        friendship,
      });
    } catch (error) {
      console.log("❌ [blockUser] Errore:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  },

  /**
   * 6. SBLOCCA UTENTE
   * POST /api/friends/unblock
   */
  async unblockUser(req: AuthRequest, res: Response) {
    try {
      console.log("🔓 [unblockUser] User:", req.user?.id);
      
      if (!req.user?.id) {
        return res.status(401).json({ error: "Non autenticato" });
      }
      
      const userId = new Types.ObjectId(req.user.id);
      const { targetUserId } = req.body;

      if (!targetUserId) {
        return res.status(400).json({ error: "ID utente richiesto" });
      }

      const targetUserObjectId = new Types.ObjectId(targetUserId);

      // Trova la relazione di blocco
      const friendship = await Friendship.findOne({
        $or: [
          { requester: userId, recipient: targetUserObjectId },
          { requester: targetUserObjectId, recipient: userId },
        ],
        status: "blocked",
        blockedBy: userId,
      });

      if (!friendship) {
        return res.status(404).json({ error: "Blocco non trovato" });
      }

      // Elimina la relazione di blocco
      await Friendship.findByIdAndDelete(friendship._id);

      res.json({
        message: "Utente sbloccato con successo",
        friendshipId: friendship._id,
      });
    } catch (error) {
      console.log("❌ [unblockUser] Errore:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  },

  /**
   * 7. LISTA AMICI
   * GET /api/friends
   */
  async getFriends(req: AuthRequest, res: Response) {
    try {
      console.log("👥 [getFriends] User:", req.user?.id);
      
      if (!req.user?.id) {
        return res.status(401).json({ error: "Non autenticato" });
      }
      
      const userId = new Types.ObjectId(req.user.id);
      const { limit = 50, skip = 0, search, type } = req.query;

      // Query base per trovare amici accettati
      let query: any;
      const listType = typeof type === "string" ? type : undefined;

      if (listType === "followers") {
        query = { recipient: userId, status: "accepted" };
      } else if (listType === "following") {
        query = { requester: userId, status: "accepted" };
      } else {
        query = {
          $or: [
            { requester: userId, status: "accepted" },
            { recipient: userId, status: "accepted" },
          ],
        };
      }

      // Se c'è una ricerca, aggiungiamo filtro per nome/username
      if (search && typeof search === "string") {
        const searchRegex = new RegExp(search, "i");
        
        // Popoliamo prima per filtrare
        const friendships = await Friendship.find(query)
          .populate([
            { 
              path: "requester", 
              select: "name username avatarUrl",
              match: { 
                $or: [
                  { name: searchRegex },
                  { username: searchRegex }
                ]
              }
            },
            { 
              path: "recipient", 
              select: "name username avatarUrl",
              match: { 
                $or: [
                  { name: searchRegex },
                  { username: searchRegex }
                ]
              }
            }
          ]);

        // Filtriamo i risultati dove almeno uno degli utenti matcha la ricerca
        const filteredFriendships = friendships.filter(friendship => {
          return friendship.requester || friendship.recipient;
        });

        // Trasformiamo in formato lista amici
        const friends = filteredFriendships.map(friendship => {
          const friend = friendship.requester._id.equals(userId) 
            ? friendship.recipient 
            : friendship.requester;
          
          return {
            user: friend,
            friendshipId: friendship._id,
            friendsSince: friendship.acceptedAt,
          };
        });

        return res.json({
          friends,
          total: friends.length,
          limit: parseInt(limit as string),
          skip: parseInt(skip as string),
        });
      }

      // Senza ricerca, query normale
      const friendships = await Friendship.find(query)
        .populate([
          { path: "requester", select: "name username avatarUrl" },
          { path: "recipient", select: "name username avatarUrl" },
        ])
        .sort({ acceptedAt: -1 })
        .skip(parseInt(skip as string))
        .limit(parseInt(limit as string));

      // Trasforma in formato lista amici
      const friends = friendships.map(friendship => {
        const friend = friendship.requester._id.equals(userId) 
          ? friendship.recipient 
          : friendship.requester;
        
        return {
          user: friend,
          friendshipId: friendship._id,
          friendsSince: friendship.acceptedAt,
        };
      });

      // Conta totale
      const total = await Friendship.countDocuments(query);

      res.json({
        friends,
        total,
        limit: parseInt(limit as string),
        skip: parseInt(skip as string),
      });
    } catch (error) {
      console.log("❌ [getFriends] Errore:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  },

  /**
   * 8. LISTA RICHIESTE IN ARRIVO (PENDING)
   * GET /api/friends/requests/incoming
   */
  async getIncomingRequests(req: AuthRequest, res: Response) {
    try {
      console.log("📩 [getIncomingRequests] User:", req.user?.id);
      
      if (!req.user?.id) {
        return res.status(401).json({ error: "Non autenticato" });
      }
      
      const userId = new Types.ObjectId(req.user.id);
      const { limit = 20, skip = 0 } = req.query;

      const requests = await Friendship.find({
        recipient: userId,
        status: "pending",
      })
        .populate("requester", "name username avatarUrl")
        .sort({ createdAt: -1 })
        .skip(parseInt(skip as string))
        .limit(parseInt(limit as string));

      const total = await Friendship.countDocuments({
        recipient: userId,
        status: "pending",
      });

      res.json({
        requests,
        total,
        limit: parseInt(limit as string),
        skip: parseInt(skip as string),
      });
    } catch (error) {
      console.log("❌ [getIncomingRequests] Errore:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  },

  /**
   * 9. LISTA RICHIESTE INVIATE (PENDING)
   * GET /api/friends/requests/outgoing
   */
  async getOutgoingRequests(req: AuthRequest, res: Response) {
    try {
      console.log("📤 [getOutgoingRequests] User:", req.user?.id);
      
      if (!req.user?.id) {
        return res.status(401).json({ error: "Non autenticato" });
      }
      
      const userId = new Types.ObjectId(req.user.id);
      const { limit = 20, skip = 0 } = req.query;

      const requests = await Friendship.find({
        requester: userId,
        status: "pending",
      })
        .populate("recipient", "name username avatarUrl")
        .sort({ createdAt: -1 })
        .skip(parseInt(skip as string))
        .limit(parseInt(limit as string));

      const total = await Friendship.countDocuments({
        requester: userId,
        status: "pending",
      });

      res.json({
        requests,
        total,
        limit: parseInt(limit as string),
        skip: parseInt(skip as string),
      });
    } catch (error) {
      console.log("❌ [getOutgoingRequests] Errore:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  },

  /**
   * 10. STATO AMICIZIA CON UTENTE SPECIFICO
   * GET /api/friends/status/:userId
   */
  async getFriendshipStatus(req: AuthRequest, res: Response) {
    try {
      console.log("🔍 [getFriendshipStatus] User:", req.user?.id);
      
      if (!req.user?.id) {
        return res.status(401).json({ error: "Non autenticato" });
      }
      
      const userId = new Types.ObjectId(req.user.id);
      const { userId: targetUserId } = req.params;

      const targetUserObjectId = new Types.ObjectId(targetUserId);

      const friendship = await Friendship.findOne({
        $or: [
          { requester: userId, recipient: targetUserObjectId },
          { requester: targetUserObjectId, recipient: userId },
        ],
      });

      let status = "none";
      let friendshipId = null;
      let direction = null;

      if (friendship) {
        status = friendship.status;
        friendshipId = friendship._id;
        
        if (friendship.requester.equals(userId)) {
          direction = "outgoing";
        } else {
          direction = "incoming";
        }
      }

      res.json({
        status,
        friendshipId,
        direction,
        targetUserId: targetUserObjectId,
      });
    } catch (error) {
      console.log("❌ [getFriendshipStatus] Errore:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  },

  /**
   * 11. SUGGERIMENTI AMICI (LOGICA PRIORITÀ)
   * GET /api/friends/suggestions
   */
  async getFriendSuggestions(req: AuthRequest, res: Response) {
    try {
      console.log("🎯 ============ GET FRIEND SUGGESTIONS CALLED ============");
      console.log("📋 Request path:", req.path);
      console.log("👤 User object from req:", req.user);
      console.log("👤 User ID from req.user:", req.user?.id);
      console.log("🔑 Auth header:", req.headers.authorization ? "Present" : "Missing");
      
      // VERIFICA AGGIUNTIVA: controlla se req.user esiste
      if (!req.user) {
        console.log("❌ No user object in request (middleware failed)");
        return res.status(401).json({ error: "Non autenticato - nessun oggetto utente" });
      }
      
      if (!req.user.id) {
        console.log("❌ No userId in user object");
        return res.status(401).json({ error: "Non autenticato - ID utente mancante" });
      }

      const userId = new Types.ObjectId(req.user.id);
      const { limit = 10 } = req.query;

      console.log(`🔢 Calcolo suggerimenti per utente: ${userId}`);
      console.log(`📊 Limit: ${limit}`);

      // STEP 1: Recupera tutti gli utenti esclusi
      console.log("🔄 STEP 1: Recupero utenti esclusi...");
      const excludedUsers = await friendshipController.getExcludedUsers(userId);
      console.log(`✅ Utenti esclusi: ${excludedUsers.length}`);

      // STEP 2: Calcola suggerimenti per ogni priorità
      console.log("🔄 STEP 2: Calcolo suggerimenti match...");
      const matchSuggestions = await friendshipController.getMatchBasedSuggestions(userId, excludedUsers);
      console.log("🔄 STEP 2: Calcolo suggerimenti amici in comune...");
      const mutualFriendSuggestions = await friendshipController.getMutualFriendSuggestions(userId, excludedUsers);
      console.log("🔄 STEP 2: Calcolo suggerimenti strutture...");
      const venueSuggestions = await friendshipController.getVenueBasedSuggestions(userId, excludedUsers);

      console.log(`📊 Match suggestions: ${matchSuggestions.length}`);
      console.log(`📊 Mutual friend suggestions: ${mutualFriendSuggestions.length}`);
      console.log(`📊 Venue suggestions: ${venueSuggestions.length}`);

      // STEP 3: Combina e calcola punteggi
      console.log("🔄 STEP 3: Combinazione suggerimenti...");
      const allSuggestions = friendshipController.combineSuggestions(
        matchSuggestions,
        mutualFriendSuggestions,
        venueSuggestions
      );

      // STEP 4: Ordina per punteggio e applica limite
      console.log("🔄 STEP 4: Ordinamento suggerimenti...");
      const sortedSuggestions = allSuggestions
        .sort((a, b) => b.score - a.score)
        .slice(0, parseInt(limit as string));

      console.log(`✅ Suggerimenti finali: ${sortedSuggestions.length}`);
      
      // Log dettagliato di alcuni suggerimenti
      sortedSuggestions.slice(0, 3).forEach((suggestion, index) => {
        console.log(`   ${index + 1}. ${suggestion.user.name} - Punteggio: ${suggestion.score.toFixed(2)} - Motivo: ${suggestion.reason.type}`);
      });
      
      console.log("🎯 ============ FRIEND SUGGESTIONS COMPLETED ============");

      res.json({
        success: true,
        suggestions: sortedSuggestions,
        total: sortedSuggestions.length,
        limit: parseInt(limit as string),
      });
    } catch (error) {
      console.log("❌ [getFriendSuggestions] Errore:", error);
      console.log("Stack trace:", error instanceof Error ? error.stack : "N/A");
      res.status(500).json({ 
        error: "Errore interno del server",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  },

  /**
   * 12. CONTATI AMICIZIE (STATISTICHE)
   * GET /api/friends/stats
   */
  async getFriendshipStats(req: AuthRequest, res: Response) {
    try {
      console.log("📊 [getFriendshipStats] User:", req.user?.id);
      
      if (!req.user?.id) {
        return res.status(401).json({ error: "Non autenticato" });
      }
      
      const userId = new Types.ObjectId(req.user.id);

      const [
        friendCount,
        followersCount,
        followingCount,
        incomingRequestsCount,
        outgoingRequestsCount,
        mutualFriendCount,
      ] = await Promise.all([
        // Conta amici
        Friendship.countDocuments({
          $or: [
            { requester: userId, status: "accepted" },
            { recipient: userId, status: "accepted" },
          ],
        }),

        // Conta follower (utenti che seguono me)
        Friendship.countDocuments({
          recipient: userId,
          status: "accepted",
        }),

        // Conta following (utenti che seguo)
        Friendship.countDocuments({
          requester: userId,
          status: "accepted",
        }),

        // Conta richieste in arrivo
        Friendship.countDocuments({
          recipient: userId,
          status: "pending",
        }),

        // Conta richieste in uscita
        Friendship.countDocuments({
          requester: userId,
          status: "pending",
        }),

        // Conta utenti con amici in comune (statistica avanzata)
        friendshipController.calculateMutualFriendStats(userId),
      ]);

      res.json({
        friendCount,
        followersCount,
        followingCount,
        incomingRequestsCount,
        outgoingRequestsCount,
        mutualFriendCount,
        lastUpdated: new Date(),
      });
    } catch (error) {
      console.log("❌ [getFriendshipStats] Errore:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  },

  /**
   * METODI HELPER PER SUGGERIMENTI
   */

  // Utenti da escludere (già amici, bloccati, se stesso)
  async getExcludedUsers(userId: Types.ObjectId): Promise<Types.ObjectId[]> {
    const friendships = await Friendship.find({
      $and: [
        {
          $or: [
            { requester: userId },
            { recipient: userId },
          ]
        },
        {
          status: { $in: ["accepted", "blocked"] }
        }
      ]
    });

    const excludedIds = friendships.map(friendship => {
      return friendship.requester.equals(userId) 
        ? friendship.recipient 
        : friendship.requester;
    });

    // Aggiungi se stesso
    excludedIds.push(userId);

    return excludedIds;
  },

  // Priorità 1: Utenti con cui hai giocato insieme
  async getMatchBasedSuggestions(
    userId: Types.ObjectId, 
    excludedUsers: Types.ObjectId[]
  ): Promise<SuggestedUser[]> {
    try {
      // Trova match completati negli ultimi 60 giorni
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const matches = await Match.find({
        status: "completed",
        "players.user": userId,
        "players.status": "confirmed",
        playedAt: { $gte: sixtyDaysAgo },
      });

      // Raccogli tutti gli avversari/compagni
      const opponentMap = new Map<string, { count: number; lastPlayed: Date }>();

      for (const match of matches) {
        const opponents = match.players
          .filter(p => 
            !p.user.equals(userId) && 
            p.status === "confirmed" &&
            !excludedUsers.some(excluded => excluded.equals(p.user))
          );

        for (const opponent of opponents) {
          const opponentId = opponent.user.toString();
          const current = opponentMap.get(opponentId) || { count: 0, lastPlayed: new Date(0) };
          
          opponentMap.set(opponentId, {
            count: current.count + 1,
            lastPlayed: match.playedAt && match.playedAt > current.lastPlayed 
              ? match.playedAt 
              : current.lastPlayed,
          });
        }
      }

      // Recupera info utenti
      const opponentIds = Array.from(opponentMap.keys()).map(id => new Types.ObjectId(id));
      if (opponentIds.length === 0) return [];

      const users = await User.find(
        { _id: { $in: opponentIds } },
        "name username avatarUrl preferredSports"
      );

      // Crea suggerimenti
      const suggestions: SuggestedUser[] = [];

      for (const user of users) {
        const opponentData = opponentMap.get(user._id.toString());
        if (!opponentData) continue;
        
        // Calcola punteggio: 20 punti per match + 10 se recente (ultimi 7 giorni)
        let score = opponentData.count * 20;
        
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        if (opponentData.lastPlayed > sevenDaysAgo) {
          score += 10;
        }

        // Bonus frequenza: +5 punti per ogni match oltre il primo
        if (opponentData.count > 1) {
          score += (opponentData.count - 1) * 5;
        }

        suggestions.push({
          user: {
            _id: user._id,
            name: user.name,
            username: user.username,
            avatarUrl: user.avatarUrl,
            preferredSports: user.preferredSports,
          },
          reason: {
            type: "match_together",
            details: {
              matchCount: opponentData.count,
              lastPlayed: opponentData.lastPlayed,
            },
          },
          score: score * 0.5, // Peso 50%
          friendshipStatus: await friendshipController.getFriendshipStatusForUser(userId, user._id),
        });
      }

      return suggestions;
    } catch (error) {
      console.log("❌ [getMatchBasedSuggestions] Errore:", error);
      return [];
    }
  },

  // Priorità 2: Amici in comune
  async getMutualFriendSuggestions(
    userId: Types.ObjectId, 
    excludedUsers: Types.ObjectId[]
  ): Promise<SuggestedUser[]> {
    try {
      // Trova gli amici dell'utente corrente
      const userFriendships = await Friendship.find({
        $or: [
          { requester: userId, status: "accepted" },
          { recipient: userId, status: "accepted" },
        ],
      });

      const userFriendIds = userFriendships.map(friendship => 
        friendship.requester.equals(userId) 
          ? friendship.recipient 
          : friendship.requester
      );

      if (userFriendIds.length === 0) return [];

      // Trova gli amici degli amici (esclusi già esclusi)
      const potentialFriends = await Friendship.aggregate([
        {
          $match: {
            $or: [
              { requester: { $in: userFriendIds }, status: "accepted" },
              { recipient: { $in: userFriendIds }, status: "accepted" },
            ],
          },
        },
        {
          $project: {
            friendId: {
              $cond: {
                if: { $eq: ["$requester", userId] },
                then: "$recipient",
                else: {
                  $cond: {
                    if: { $eq: ["$recipient", userId] },
                    then: "$requester",
                    else: null,
                  },
                },
              },
            },
            otherUser: {
              $cond: {
                if: { $in: ["$requester", userFriendIds] },
                then: "$recipient",
                else: "$requester",
              },
            },
          },
        },
        {
          $match: {
            friendId: { $ne: null },
            otherUser: { $nin: [...excludedUsers, ...userFriendIds, userId] },
          },
        },
        {
          $group: {
            _id: "$otherUser",
            mutualFriendsCount: { $sum: 1 },
            mutualFriendIds: { $push: "$friendId" },
          },
        },
        {
          $match: {
            mutualFriendsCount: { $gte: 1 },
          },
        },
        {
          $sort: { mutualFriendsCount: -1 },
        },
        {
          $limit: 50,
        },
      ]);

      if (potentialFriends.length === 0) return [];

      // Recupera info utenti
      const userIds = potentialFriends.map(pf => pf._id);
      const users = await User.find(
        { _id: { $in: userIds } },
        "name username avatarUrl preferredSports"
      );

      const userMap = new Map(users.map(user => [user._id.toString(), user]));

      // Crea suggerimenti
      const suggestions: SuggestedUser[] = [];

      for (const pf of potentialFriends) {
        const user = userMap.get(pf._id.toString());
        if (!user) continue;

        // Calcola punteggio: 15 punti per ogni amico in comune, max 45
        const mutualScore = Math.min(pf.mutualFriendsCount * 15, 45);

        suggestions.push({
          user: {
            _id: user._id,
            name: user.name,
            username: user.username,
            avatarUrl: user.avatarUrl,
            preferredSports: user.preferredSports,
          },
          reason: {
            type: "mutual_friends",
            details: {
              mutualFriendsCount: pf.mutualFriendsCount,
            },
          },
          score: mutualScore * 0.3, // Peso 30%
          friendshipStatus: await friendshipController.getFriendshipStatusForUser(userId, user._id),
        });
      }

      return suggestions;
    } catch (error) {
      console.log("❌ [getMutualFriendSuggestions] Errore:", error);
      return [];
    }
  },

  // Priorità 3: Strutture in comune
  async getVenueBasedSuggestions(
    userId: Types.ObjectId, 
    excludedUsers: Types.ObjectId[]
  ): Promise<SuggestedUser[]> {
    try {
      // Trova le strutture più prenotate dall'utente (top 3)
      const userBookings = await Booking.aggregate([
        {
          $match: {
            user: userId,
            status: "confirmed",
          },
        },
        {
          $lookup: {
            from: "campos",
            localField: "campo",
            foreignField: "_id",
            as: "campoInfo",
          },
        },
        {
          $unwind: "$campoInfo",
        },
        {
          $group: {
            _id: "$campoInfo.struttura",
            bookingCount: { $sum: 1 },
            lastBooking: { $max: "$createdAt" },
          },
        },
        {
          $sort: { bookingCount: -1 },
        },
        {
          $limit: 3,
        },
      ]);

      if (userBookings.length === 0) return [];

      const strutturaIds = userBookings.map(booking => booking._id);

      // Trova altri utenti che hanno prenotato nelle stesse strutture
      const otherUsersBookings = await Booking.aggregate([
        {
          $match: {
            user: { $nin: [...excludedUsers, userId] },
            status: "confirmed",
          },
        },
        {
          $lookup: {
            from: "campos",
            localField: "campo",
            foreignField: "_id",
            as: "campoInfo",
          },
        },
        {
          $unwind: "$campoInfo",
        },
        {
          $match: {
            "campoInfo.struttura": { $in: strutturaIds },
          },
        },
        {
          $group: {
            _id: "$user",
            commonStructures: {
              $addToSet: "$campoInfo.struttura",
            },
            bookingCount: { $sum: 1 },
            lastBooking: { $max: "$createdAt" },
          },
        },
        {
          $project: {
            userId: "$_id",
            commonStructureCount: { $size: "$commonStructures" },
            bookingCount: 1,
            lastBooking: 1,
          },
        },
        {
          $sort: { commonStructureCount: -1, bookingCount: -1 },
        },
        {
          $limit: 50,
        },
      ]);

      if (otherUsersBookings.length === 0) return [];

      // Recupera info utenti e strutture
      const userIds = otherUsersBookings.map(booking => booking.userId);
      const users = await User.find(
        { _id: { $in: userIds } },
        "name username avatarUrl preferredSports"
      );

      const strutturaDetails = await Struttura.find(
        { _id: { $in: strutturaIds } },
        "name"
      );

      const strutturaMap = new Map(strutturaDetails.map(s => [s._id.toString(), s]));

      const userMap = new Map(users.map(user => [user._id.toString(), user]));

      // Crea suggerimenti
      const suggestions: SuggestedUser[] = [];

      for (const booking of otherUsersBookings) {
        const user = userMap.get(booking.userId.toString());
        if (!user) continue;

        // Trova i nomi delle strutture in comune
        const commonStructureNames = userBookings
          .filter(ub => 
            otherUsersBookings.find(oub => 
              oub.userId.equals(booking.userId) && 
              oub.commonStructures?.includes(ub._id)
            )
          )
          .map(ub => {
            const struttura = strutturaMap.get(ub._id.toString());
            return struttura?.name || "Struttura sconosciuta";
          });

        if (commonStructureNames.length === 0) continue;

        // Calcola punteggio: 10 punti per struttura + 2 punti per ogni prenotazione extra
        let score = commonStructureNames.length * 10;
        score += Math.min(booking.bookingCount * 2, 10); // Max 10 punti extra

        suggestions.push({
          user: {
            _id: user._id,
            name: user.name,
            username: user.username,
            avatarUrl: user.avatarUrl,
            preferredSports: user.preferredSports,
          },
          reason: {
            type: "same_venue",
            details: {
              venueName: commonStructureNames[0], // Prendi la prima
            },
          },
          score: score * 0.2, // Peso 20%
          friendshipStatus: await friendshipController.getFriendshipStatusForUser(userId, user._id),
        });
      }

      return suggestions;
    } catch (error) {
      console.log("❌ [getVenueBasedSuggestions] Errore:", error);
      return [];
    }
  },

  // Combina i suggerimenti da tutte le fonti
  combineSuggestions(
    matchSuggestions: SuggestedUser[],
    mutualFriendSuggestions: SuggestedUser[],
    venueSuggestions: SuggestedUser[]
  ): SuggestedUser[] {
    const suggestionMap = new Map<string, SuggestedUser>();

    // Funzione helper per aggiungere/aggiornare suggerimenti
    const addOrUpdateSuggestion = (suggestion: SuggestedUser) => {
      const key = suggestion.user._id.toString();
      const existing = suggestionMap.get(key);

      if (existing) {
        // Aggiorna punteggio sommando
        existing.score += suggestion.score;
        
        // Mantieni il motivo con punteggio più alto
        if (suggestion.score > existing.score - suggestion.score) {
          existing.reason = suggestion.reason;
        }
      } else {
        suggestionMap.set(key, { ...suggestion });
      }
    };

    // Aggiungi tutti i suggerimenti
    matchSuggestions.forEach(addOrUpdateSuggestion);
    mutualFriendSuggestions.forEach(addOrUpdateSuggestion);
    venueSuggestions.forEach(addOrUpdateSuggestion);

    return Array.from(suggestionMap.values());
  },

  // Ottieni stato amicizia per un utente specifico
  // Restituisce lo stato solo se userId è il REQUESTER (outgoing request)
  async getFriendshipStatusForUser(
    userId: Types.ObjectId, 
    targetUserId: Types.ObjectId
  ): Promise<"none" | "pending" | "accepted"> {
    console.log(`🔍 [getFriendshipStatusForUser] Checking OUTGOING request: userId=${userId} → targetUserId=${targetUserId}`);
    
    // Cerca solo la richiesta DA userId VERSO targetUserId
    const friendship = await Friendship.findOne({
      requester: userId,
      recipient: targetUserId
    });

    console.log(`🔍 [getFriendshipStatusForUser] Friendship found:`, friendship ? {
      _id: friendship._id,
      status: friendship.status
    } : 'NONE');

    if (!friendship) {
      console.log(`❌ [getFriendshipStatusForUser] No outgoing request found, returning 'none'`);
      return "none";
    }
    
    console.log(`🔍 [getFriendshipStatusForUser] Friendship status: ${friendship.status}`);
    
    if (friendship.status === "pending") {
      console.log(`⏳ [getFriendshipStatusForUser] Returning 'pending'`);
      return "pending";
    }
    if (friendship.status === "accepted") {
      console.log(`✅ [getFriendshipStatusForUser] Returning 'accepted'`);
      return "accepted";
    }
    
    console.log(`❌ [getFriendshipStatusForUser] Returning 'none' (rejected/blocked)`);
    return "none"; // Per rejected o blocked
  },

  // Helper per statistiche amici in comune
  async calculateMutualFriendStats(userId: Types.ObjectId): Promise<number> {
    const userFriendships = await Friendship.find({
      $or: [
        { requester: userId, status: "accepted" },
        { recipient: userId, status: "accepted" },
      ],
    });

    const userFriendIds = userFriendships.map(friendship => 
      friendship.requester.equals(userId) 
        ? friendship.recipient 
        : friendship.requester
    );

    if (userFriendIds.length === 0) return 0;

    const result = await Friendship.aggregate([
      {
        $match: {
          $or: [
            { requester: { $in: userFriendIds }, status: "accepted" },
            { recipient: { $in: userFriendIds }, status: "accepted" },
          ],
        },
      },
      {
        $project: {
          otherUser: {
            $cond: {
              if: { $in: ["$requester", userFriendIds] },
              then: "$recipient",
              else: "$requester",
            },
          },
        },
      },
      {
        $match: {
          otherUser: { $ne: userId, $nin: userFriendIds },
        },
      },
      {
        $group: {
          _id: "$otherUser",
        },
      },
      {
        $count: "uniqueUsers",
      },
    ]);

    return result.length > 0 ? result[0].uniqueUsers : 0;
  },
};
