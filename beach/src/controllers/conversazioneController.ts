import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../middleware/authMiddleware';
import Conversation from '../models/Conversazione';
import Message from '../models/Message';
import Struttura from '../models/Strutture';
import User from '../models/User';
import Match from '../models/Match';

/**
 * GET /api/conversations
 * Lista conversazioni dell'utente loggato (direct + group)
 */
export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Non autorizzato' });
    }

    const user = await User.findById(userId);
    const isOwner = user?.role === 'owner';

    // Query per chat dirette (vecchia logica)
    const directQuery = isOwner ? { type: 'direct', owner: userId } : { type: 'direct', user: userId };
    
    // Query per chat di gruppo
    const groupQuery = { type: 'group', participants: userId };

    const [directConversations, groupConversations] = await Promise.all([
      Conversation.find(directQuery)
        .populate('user', 'name email avatarUrl')
        .populate('struttura', 'name images')
        .populate('owner', 'name email')
        .sort({ lastMessageAt: -1 }),
      
      Conversation.find(groupQuery)
        .populate('participants', 'name email')
        .populate('struttura', 'name images')
        .populate({
          path: 'match',
          populate: {
            path: 'booking',
            populate: [
              {
                path: 'campo',
                populate: {
                  path: 'struttura',
                  select: 'name'
                }
              },
              {
                path: 'struttura',
                select: 'name images'
              }
            ]
          }
        })
        .sort({ lastMessageAt: -1 })
    ]);

    // Assicurati che tutte le strutture abbiano images anche se undefined
    directConversations.forEach(conv => {
      if (conv.struttura && typeof conv.struttura === 'object' && '_id' in conv.struttura) {
        const struttura = conv.struttura as any;
        if (!struttura.images) {
          struttura.images = [];
        }
      }
    });

    let allConversations = [...directConversations, ...groupConversations];

    // Se è owner, aggiungi anche le conversazioni di gruppo dei suoi match
    if (isOwner) {
      console.log(`🔍 Owner ${userId} - Cercando conversazioni di gruppo dei suoi match...`);
      
      // Trova tutte le conversazioni di gruppo con match
      const allGroupConversations = await Conversation.find({ type: 'group', match: { $exists: true } })
        .populate('participants', 'name email')
        .populate({
          path: 'match',
          populate: {
            path: 'booking',
            populate: {
              path: 'campo',
              populate: {
                path: 'struttura',
                select: 'name owner',
              },
            },
          },
        })
        .sort({ lastMessageAt: -1 });

      console.log(`🔍 Totale conversazioni di gruppo con match: ${allGroupConversations.length}`);

      // Filtra solo quelle dei suoi match
      const ownerGroupConversations = allGroupConversations.filter((conv: any) => {
        const match = conv.match;
        if (!match) {
          console.log(`⚠️ Conversazione ${conv._id} - match non popolato`);
          return false;
        }
        if (!match.booking) {
          console.log(`⚠️ Match ${match._id} - booking non popolato`);
          return false;
        }
        const booking = match.booking;
        if (!booking.campo) {
          console.log(`⚠️ Booking ${booking._id} - campo non popolato`);
          return false;
        }
        if (!booking.campo.struttura) {
          console.log(`⚠️ Campo ${booking.campo._id} - struttura non popolata`);
          return false;
        }
        const strutturaOwnerId = booking.campo.struttura.owner?.toString();
        const isOwnerMatch = strutturaOwnerId === userId;
        console.log(`🔍 Conversazione ${conv._id} - Struttura owner: ${strutturaOwnerId}, Current user: ${userId}, Match: ${isOwnerMatch}`);
        return isOwnerMatch;
      });

      console.log(`📬 Owner group conversations trovate: ${ownerGroupConversations.length}`);

      // Aggiungi senza duplicati
      const existingIds = new Set(allConversations.map(c => c._id.toString()));
      const newConversations = ownerGroupConversations.filter(
        (conv: any) => !existingIds.has(conv._id.toString())
      );
      
      console.log(`📬 Nuove conversazioni da aggiungere: ${newConversations.length}`);
      allConversations = [...allConversations, ...newConversations];
    }

    // ✅ FILTRA SOLO CONVERSAZIONI CON MESSAGGI REALI
    const activeConversations = allConversations.filter(
      conv => conv.lastMessage && conv.lastMessage.trim().length > 0
    );

    console.log(`📬 Conversazioni - Direct: ${directConversations.length}, Group: ${groupConversations.length}, Attive: ${activeConversations.length}`);

    res.json(activeConversations);
  } catch (error) {
    console.error('Errore caricamento conversazioni:', error);
    res.status(500).json({ message: 'Errore server' });
  }
};

/**
 * GET /api/conversations/struttura/:strutturaId
 * Ottieni o crea conversazione con una struttura (PLAYER → STRUTTURA)
 */
export const getOrCreateConversation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { strutturaId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Non autorizzato' });
    }

    const struttura = await Struttura.findById(strutturaId);
    if (!struttura) {
      return res.status(404).json({ message: 'Struttura non trovata' });
    }

    let conversation = await Conversation.findOne({
      user: userId,
      struttura: strutturaId,
    })
      .populate('user', 'name email')
      .populate('struttura', 'name images')
      .populate('owner', 'name email');

    if (!conversation) {
      conversation = await Conversation.create({
        user: userId,
        struttura: strutturaId,
        owner: struttura.owner,
        lastMessage: '',
        lastMessageAt: new Date(),
        unreadByUser: 0,
        unreadByOwner: 0,
      });

      conversation = await Conversation.findById(conversation._id)
        .populate('user', 'name email')
        .populate('struttura', 'name images')
        .populate('owner', 'name email');
    }

    // Assicurati che struttura abbia images anche se undefined
    if (conversation && conversation.struttura && typeof conversation.struttura === 'object') {
      const struttura = conversation.struttura as any;
      if (!struttura.images) {
        struttura.images = [];
      }
    }

    res.json(conversation);
  } catch (error) {
    console.error('Errore get/create conversazione:', error);
    res.status(500).json({ message: 'Errore server' });
  }
};

/**
 * GET /api/conversations/user/:userId
 * Ottieni o crea conversazione con un cliente specifico (OWNER → USER)
 */
export const getOrCreateConversationWithUser = async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = req.user?.id;
    const { userId } = req.params;

    if (!ownerId) {
      return res.status(401).json({ message: 'Non autorizzato' });
    }

    // Verifica che chi chiama sia un owner
    const owner = await User.findById(ownerId);
    if (owner?.role !== 'owner') {
      return res.status(403).json({ message: 'Solo i proprietari possono usare questo endpoint' });
    }

    // Verifica che lo user esista
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Cliente non trovato' });
    }

    // Trova la struttura dell'owner
    const struttura = await Struttura.findOne({ owner: ownerId });
    if (!struttura) {
      return res.status(404).json({ message: 'Struttura non trovata' });
    }

    // Cerca conversazione esistente tra owner e user per questa struttura
    let conversation = await Conversation.findOne({
      user: userId,
      owner: ownerId,
      struttura: struttura._id,
    })
      .populate('user', 'name email')
      .populate('struttura', 'name images')
      .populate('owner', 'name email');

    // Se non esiste, creala
    if (!conversation) {
      conversation = await Conversation.create({
        user: userId,
        struttura: struttura._id,
        owner: ownerId,
        lastMessage: '',
        lastMessageAt: new Date(),
        unreadByUser: 0,
        unreadByOwner: 0,
      });

      conversation = await Conversation.findById(conversation._id)
        .populate('user', 'name email')
        .populate('struttura', 'name images')
        .populate('owner', 'name email');
    }

    // Assicurati che struttura abbia images anche se undefined
    if (conversation && conversation.struttura && typeof conversation.struttura === 'object') {
      const struttura = conversation.struttura as any;
      if (!struttura.images) {
        struttura.images = [];
      }
    }

    console.log(`💬 Conversazione owner-user: ${owner.name} ↔ ${targetUser.name}`);

    res.json(conversation);
  } catch (error) {
    console.error('Errore get/create conversazione con user:', error);
    res.status(500).json({ message: 'Errore server' });
  }
};

/**
 * GET /api/conversations/:conversationId/messages
 * Messaggi di una conversazione (direct o group)
 */
export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { conversationId } = req.params;
    const { limit = 50, before } = req.query;

    if (!userId) {
      return res.status(401).json({ message: 'Non autorizzato' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversazione non trovata' });
    }

    // Verifica autorizzazione
    const user = await User.findById(userId);
    const isOwner = user?.role === 'owner';
    
    let isAuthorized = false;
    
    if (conversation.type === 'direct') {
      // Chat diretta - vecchia logica
      isAuthorized = 
        (!isOwner && conversation.user?.toString() === userId) ||
        (isOwner && conversation.owner?.toString() === userId);
    } else if (conversation.type === 'group') {
      // Chat di gruppo - verifica sia nei participants
      isAuthorized = conversation.participants.some(
        (p: any) => p.toString() === userId
      );
      
      // Se è una chat di gruppo di un match, verifica se è l'owner della struttura
      if (!isAuthorized && isOwner && conversation.match) {
        const match = await Match.findById(conversation.match).populate({
          path: 'booking',
          populate: {
            path: 'campo',
            populate: {
              path: 'struttura',
              select: 'owner',
            },
          },
        });
        
        if (match) {
          const booking = match.booking as any;
          const isMatchOwner = booking?.campo?.struttura?.owner?.toString() === userId;
          if (isMatchOwner) {
            isAuthorized = true;
          }
        }
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Non autorizzato' });
    }

    const query: any = { conversationId };
    if (before) {
      query.createdAt = { $lt: new Date(before as string) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate('sender', 'name email');

    // Segna messaggi come letti
    if (conversation.type === 'direct') {
      const updateField = isOwner ? 'unreadByOwner' : 'unreadByUser';
      console.log(`✅ Marcando messaggi come letti per ${updateField}`);
      
      await Conversation.findByIdAndUpdate(conversationId, {
        [updateField]: 0,
      });
    } else if (conversation.type === 'group') {
      // Per gruppi: azzera unreadCount per questo user
      const unreadCountMap = conversation.unreadCount || new Map();
      unreadCountMap.set(userId, 0);
      
      await Conversation.findByIdAndUpdate(conversationId, {
        unreadCount: unreadCountMap,
      });
      
      console.log(`✅ Marcando messaggi gruppo come letti per user ${userId}`);
    }

    await Message.updateMany(
      {
        conversationId,
        sender: { $ne: userId },
        read: false,
      },
      { read: true }
    );

    res.json(messages.reverse());
  } catch (error) {
    console.error('Errore caricamento messaggi:', error);
    res.status(500).json({ message: 'Errore server' });
  }
};

/**
 * POST /api/conversations/:conversationId/messages
 * Invia un messaggio (direct o group)
 */
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { conversationId } = req.params;
    const { content } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Non autorizzato' });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Messaggio vuoto' });
    }

    const conversation = await Conversation.findById(conversationId).populate('match');
    if (!conversation) {
      return res.status(404).json({ message: 'Conversazione non trovata' });
    }

    const user = await User.findById(userId);
    const isOwner = user?.role === 'owner';

    // Verifica autorizzazione
    let isAuthorized = false;
    let canSend = true;
    let isMatchOwner = false;
    
    if (conversation.type === 'direct') {
      isAuthorized = 
        (!isOwner && conversation.user?.toString() === userId) ||
        (isOwner && conversation.owner?.toString() === userId);
    } else if (conversation.type === 'group') {
      // Verifica se è un partecipante
      isAuthorized = conversation.participants.some(
        (p: any) => p.toString() === userId
      );
      
      // Se è una chat di gruppo di un match, verifica se è l'owner della struttura
      if (!isAuthorized && isOwner && conversation.match) {
        const match = await Match.findById(conversation.match).populate({
          path: 'booking',
          populate: {
            path: 'campo',
            populate: {
              path: 'struttura',
              select: 'owner',
            },
          },
        });
        
        if (match) {
          const booking = match.booking as any;
          isMatchOwner = booking?.campo?.struttura?.owner?.toString() === userId;
          if (isMatchOwner) {
            isAuthorized = true;
          }
        }
      }
      
      // Opzione B: Verifica se può inviare (solo players con status 'confirmed')
      // L'owner della struttura può sempre inviare messaggi
      if (isAuthorized && !isMatchOwner && conversation.match) {
        const match = conversation.match as any;
        const playerInMatch = match.players?.find(
          (p: any) => p.user?.toString() === userId || p.user?._id?.toString() === userId
        );
        
        if (playerInMatch && playerInMatch.status !== 'confirmed') {
          canSend = false;
          return res.status(403).json({ 
            message: 'Devi confermare la partecipazione per inviare messaggi',
            reason: 'not_confirmed'
          });
        }
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Non autorizzato' });
    }

    const message = await Message.create({
      conversationId,
      sender: userId,
      senderType: isOwner ? 'owner' : 'user',
      content: content.trim(),
      read: false,
    });

    // Aggiorna conversazione
    const updateData: any = {
      lastMessage: content.trim().substring(0, 100),
      lastMessageAt: new Date(),
    };

    if (conversation.type === 'direct') {
      // Chat diretta - vecchia logica
      if (isOwner) {
        updateData.$inc = { unreadByUser: 1 };
        console.log('📨 Owner invia → incrementa unreadByUser');
      } else {
        updateData.$inc = { unreadByOwner: 1 };
        console.log('📨 User invia → incrementa unreadByOwner');
      }
    } else if (conversation.type === 'group') {
      // Chat di gruppo - incrementa per tutti gli altri partecipanti
      const unreadCountMap = conversation.unreadCount || new Map();
      
      conversation.participants.forEach((participantId: any) => {
        const pId = participantId.toString();
        if (pId !== userId) {
          const current = unreadCountMap.get(pId) || 0;
          unreadCountMap.set(pId, current + 1);
        }
      });
      
      updateData.unreadCount = unreadCountMap;
      console.log(`📨 Messaggio gruppo da ${user?.name} → incrementa unread per ${conversation.participants.length - 1} utenti`);
    }

    await Conversation.findByIdAndUpdate(conversationId, updateData);

    const populatedMessage = await Message.findById(message._id).populate(
      'sender',
      'name email'
    );

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Errore invio messaggio:', error);
    res.status(500).json({ message: 'Errore server' });
  }
};

/**
 * GET /api/conversations/unread-count
 * Numero messaggi non letti
 */
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Non autorizzato' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }

    const isOwner = user.role === 'owner';

    const field = isOwner ? 'unreadByOwner' : 'unreadByUser';
    const query = isOwner ? { owner: userId } : { user: userId };

    const conversations = await Conversation.find(query);
    const unreadCount = conversations.reduce(
      (sum, conv) => sum + (conv[field] || 0),
      0
    );

    console.log(`🔔 Unread count per ${user.name} (${field}): ${unreadCount}`);

    res.json({ unreadCount });
  } catch (error) {
    console.error('Errore conteggio non letti:', error);
    res.status(500).json({ message: 'Errore server' });
  }
};

/**
 * GET /api/conversations/match/:matchId
 * Ottieni o crea conversazione di gruppo per un match
 */
export const getOrCreateGroupConversation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { matchId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Non autorizzato' });
    }

    if (!matchId || matchId === 'undefined' || !Types.ObjectId.isValid(matchId)) {
      return res.status(400).json({ message: 'Match non valido' });
    }

    // Carica il match con i players
    const match = await Match.findById(matchId)
      .populate({
        path: 'booking',
        populate: {
          path: 'campo',
          populate: {
            path: 'struttura',
            select: 'owner',
          },
        },
      })
      .populate('players.user', 'name email');

    if (!match) {
      return res.status(404).json({ message: 'Match non trovato' });
    }

    // Verifica che l'utente sia parte del match O sia l'owner della struttura
    const userInMatch = match.players.find(
      (p: any) => p.user._id.toString() === userId
    );

    const booking = match.booking as any;
    const isOwner = booking?.campo?.struttura?.owner?.toString() === userId;

    if (!userInMatch && !isOwner) {
      return res.status(403).json({ message: 'Non fai parte di questo match' });
    }

    // Cerca conversazione esistente
    let conversation = await Conversation.findOne({
      type: 'group',
      match: matchId,
    })
      .populate('participants', 'name email')
      .populate({
        path: 'match',
        populate: {
          path: 'booking',
          populate: {
            path: 'struttura',
            select: 'name images'
          }
        }
      });

    if (!conversation) {
      // Crea nuova conversazione di gruppo
      // Include tutti i players, anche quelli con status 'declined' (Opzione B - possono leggere)
      const participants = match.players.map((p: any) => p.user._id);
      
      // Genera nome gruppo dal booking
      const groupName = booking ? 
        `Partita ${new Date(booking.date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })} - ${booking.startTime}` :
        'Chat di Gruppo';

      conversation = await Conversation.create({
        type: 'group',
        match: matchId,
        participants,
        groupName,
        lastMessage: '',
        lastMessageAt: new Date(),
        unreadCount: new Map(),
      });

      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'name email')
        .populate({
          path: 'match',
          populate: {
            path: 'booking',
            populate: {
              path: 'struttura',
              select: 'name images'
            }
          }
        });

      console.log(`✅ Creata chat di gruppo: ${groupName} con ${participants.length} partecipanti`);
    }

    res.json(conversation);
  } catch (error) {
    console.error('Errore get/create conversazione gruppo:', error);
    res.status(500).json({ message: 'Errore server' });
  }
};
