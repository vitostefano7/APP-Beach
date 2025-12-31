import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Conversation from '../models/Conversazione';
import Message from '../models/Message';
import Struttura from '../models/Strutture';
import User from '../models/User';

/**
 * GET /api/conversations
 * Lista conversazioni dell'utente loggato
 */
export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Non autorizzato' });
    }

    const user = await User.findById(userId);
    const isOwner = user?.role === 'owner';

    const query = isOwner ? { owner: userId } : { user: userId };

    const conversations = await Conversation.find(query)
      .populate('user', 'name email')
      .populate('struttura', 'name images')
      .populate('owner', 'name email')
      .sort({ lastMessageAt: -1 });

    // ✅ FILTRA SOLO CONVERSAZIONI CON MESSAGGI REALI
    const activeConversations = conversations.filter(
      conv => conv.lastMessage && conv.lastMessage.trim().length > 0
    );

    console.log(`📬 Conversazioni - Totali: ${conversations.length}, Attive: ${activeConversations.length}`);

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

    console.log(`💬 Conversazione owner-user: ${owner.name} ↔ ${targetUser.name}`);

    res.json(conversation);
  } catch (error) {
    console.error('Errore get/create conversazione con user:', error);
    res.status(500).json({ message: 'Errore server' });
  }
};

/**
 * GET /api/conversations/:conversationId/messages
 * Messaggi di una conversazione
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

    // Verifica che l'utente sia parte della conversazione
    const user = await User.findById(userId);
    const isOwner = user?.role === 'owner';

    if (
      (!isOwner && conversation.user.toString() !== userId) ||
      (isOwner && conversation.owner.toString() !== userId)
    ) {
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
    const updateField = isOwner ? 'unreadByOwner' : 'unreadByUser';
    console.log(`✅ Marcando messaggi come letti per ${updateField}`);
    
    await Conversation.findByIdAndUpdate(conversationId, {
      [updateField]: 0,
    });

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
 * Invia un messaggio
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

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversazione non trovata' });
    }

    const user = await User.findById(userId);
    const isOwner = user?.role === 'owner';

    // Verifica autorizzazione
    if (
      (!isOwner && conversation.user.toString() !== userId) ||
      (isOwner && conversation.owner.toString() !== userId)
    ) {
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

    if (isOwner) {
      updateData.$inc = { unreadByUser: 1 };
      console.log('📨 Owner invia → incrementa unreadByUser');
    } else {
      updateData.$inc = { unreadByOwner: 1 };
      console.log('📨 User invia → incrementa unreadByOwner');
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