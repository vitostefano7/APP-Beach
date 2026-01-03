"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUnreadCount = exports.sendMessage = exports.getMessages = exports.getOrCreateConversationWithUser = exports.getOrCreateConversation = exports.getConversations = void 0;
const Conversazione_1 = __importDefault(require("../models/Conversazione"));
const Message_1 = __importDefault(require("../models/Message"));
const Strutture_1 = __importDefault(require("../models/Strutture"));
const User_1 = __importDefault(require("../models/User"));
/**
 * GET /api/conversations
 * Lista conversazioni dell'utente loggato
 */
const getConversations = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Non autorizzato' });
        }
        const user = await User_1.default.findById(userId);
        const isOwner = user?.role === 'owner';
        const query = isOwner ? { owner: userId } : { user: userId };
        const conversations = await Conversazione_1.default.find(query)
            .populate('user', 'name email')
            .populate('struttura', 'name images')
            .populate('owner', 'name email')
            .sort({ lastMessageAt: -1 });
        // ✅ FILTRA SOLO CONVERSAZIONI CON MESSAGGI REALI
        const activeConversations = conversations.filter(conv => conv.lastMessage && conv.lastMessage.trim().length > 0);
        console.log(`📬 Conversazioni - Totali: ${conversations.length}, Attive: ${activeConversations.length}`);
        res.json(activeConversations);
    }
    catch (error) {
        console.error('Errore caricamento conversazioni:', error);
        res.status(500).json({ message: 'Errore server' });
    }
};
exports.getConversations = getConversations;
/**
 * GET /api/conversations/struttura/:strutturaId
 * Ottieni o crea conversazione con una struttura (PLAYER → STRUTTURA)
 */
const getOrCreateConversation = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { strutturaId } = req.params;
        if (!userId) {
            return res.status(401).json({ message: 'Non autorizzato' });
        }
        const struttura = await Strutture_1.default.findById(strutturaId);
        if (!struttura) {
            return res.status(404).json({ message: 'Struttura non trovata' });
        }
        let conversation = await Conversazione_1.default.findOne({
            user: userId,
            struttura: strutturaId,
        })
            .populate('user', 'name email')
            .populate('struttura', 'name images')
            .populate('owner', 'name email');
        if (!conversation) {
            conversation = await Conversazione_1.default.create({
                user: userId,
                struttura: strutturaId,
                owner: struttura.owner,
                lastMessage: '',
                lastMessageAt: new Date(),
                unreadByUser: 0,
                unreadByOwner: 0,
            });
            conversation = await Conversazione_1.default.findById(conversation._id)
                .populate('user', 'name email')
                .populate('struttura', 'name images')
                .populate('owner', 'name email');
        }
        res.json(conversation);
    }
    catch (error) {
        console.error('Errore get/create conversazione:', error);
        res.status(500).json({ message: 'Errore server' });
    }
};
exports.getOrCreateConversation = getOrCreateConversation;
/**
 * GET /api/conversations/user/:userId
 * Ottieni o crea conversazione con un cliente specifico (OWNER → USER)
 */
const getOrCreateConversationWithUser = async (req, res) => {
    try {
        const ownerId = req.user?.id;
        const { userId } = req.params;
        if (!ownerId) {
            return res.status(401).json({ message: 'Non autorizzato' });
        }
        // Verifica che chi chiama sia un owner
        const owner = await User_1.default.findById(ownerId);
        if (owner?.role !== 'owner') {
            return res.status(403).json({ message: 'Solo i proprietari possono usare questo endpoint' });
        }
        // Verifica che lo user esista
        const targetUser = await User_1.default.findById(userId);
        if (!targetUser) {
            return res.status(404).json({ message: 'Cliente non trovato' });
        }
        // Trova la struttura dell'owner
        const struttura = await Strutture_1.default.findOne({ owner: ownerId });
        if (!struttura) {
            return res.status(404).json({ message: 'Struttura non trovata' });
        }
        // Cerca conversazione esistente tra owner e user per questa struttura
        let conversation = await Conversazione_1.default.findOne({
            user: userId,
            owner: ownerId,
            struttura: struttura._id,
        })
            .populate('user', 'name email')
            .populate('struttura', 'name images')
            .populate('owner', 'name email');
        // Se non esiste, creala
        if (!conversation) {
            conversation = await Conversazione_1.default.create({
                user: userId,
                struttura: struttura._id,
                owner: ownerId,
                lastMessage: '',
                lastMessageAt: new Date(),
                unreadByUser: 0,
                unreadByOwner: 0,
            });
            conversation = await Conversazione_1.default.findById(conversation._id)
                .populate('user', 'name email')
                .populate('struttura', 'name images')
                .populate('owner', 'name email');
        }
        console.log(`💬 Conversazione owner-user: ${owner.name} ↔ ${targetUser.name}`);
        res.json(conversation);
    }
    catch (error) {
        console.error('Errore get/create conversazione con user:', error);
        res.status(500).json({ message: 'Errore server' });
    }
};
exports.getOrCreateConversationWithUser = getOrCreateConversationWithUser;
/**
 * GET /api/conversations/:conversationId/messages
 * Messaggi di una conversazione
 */
const getMessages = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { conversationId } = req.params;
        const { limit = 50, before } = req.query;
        if (!userId) {
            return res.status(401).json({ message: 'Non autorizzato' });
        }
        const conversation = await Conversazione_1.default.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: 'Conversazione non trovata' });
        }
        // Verifica che l'utente sia parte della conversazione
        const user = await User_1.default.findById(userId);
        const isOwner = user?.role === 'owner';
        if ((!isOwner && conversation.user.toString() !== userId) ||
            (isOwner && conversation.owner.toString() !== userId)) {
            return res.status(403).json({ message: 'Non autorizzato' });
        }
        const query = { conversationId };
        if (before) {
            query.createdAt = { $lt: new Date(before) };
        }
        const messages = await Message_1.default.find(query)
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .populate('sender', 'name email');
        // Segna messaggi come letti
        const updateField = isOwner ? 'unreadByOwner' : 'unreadByUser';
        console.log(`✅ Marcando messaggi come letti per ${updateField}`);
        await Conversazione_1.default.findByIdAndUpdate(conversationId, {
            [updateField]: 0,
        });
        await Message_1.default.updateMany({
            conversationId,
            sender: { $ne: userId },
            read: false,
        }, { read: true });
        res.json(messages.reverse());
    }
    catch (error) {
        console.error('Errore caricamento messaggi:', error);
        res.status(500).json({ message: 'Errore server' });
    }
};
exports.getMessages = getMessages;
/**
 * POST /api/conversations/:conversationId/messages
 * Invia un messaggio
 */
const sendMessage = async (req, res) => {
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
        const conversation = await Conversazione_1.default.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: 'Conversazione non trovata' });
        }
        const user = await User_1.default.findById(userId);
        const isOwner = user?.role === 'owner';
        // Verifica autorizzazione
        if ((!isOwner && conversation.user.toString() !== userId) ||
            (isOwner && conversation.owner.toString() !== userId)) {
            return res.status(403).json({ message: 'Non autorizzato' });
        }
        const message = await Message_1.default.create({
            conversationId,
            sender: userId,
            senderType: isOwner ? 'owner' : 'user',
            content: content.trim(),
            read: false,
        });
        // Aggiorna conversazione
        const updateData = {
            lastMessage: content.trim().substring(0, 100),
            lastMessageAt: new Date(),
        };
        if (isOwner) {
            updateData.$inc = { unreadByUser: 1 };
            console.log('📨 Owner invia → incrementa unreadByUser');
        }
        else {
            updateData.$inc = { unreadByOwner: 1 };
            console.log('📨 User invia → incrementa unreadByOwner');
        }
        await Conversazione_1.default.findByIdAndUpdate(conversationId, updateData);
        const populatedMessage = await Message_1.default.findById(message._id).populate('sender', 'name email');
        res.status(201).json(populatedMessage);
    }
    catch (error) {
        console.error('Errore invio messaggio:', error);
        res.status(500).json({ message: 'Errore server' });
    }
};
exports.sendMessage = sendMessage;
/**
 * GET /api/conversations/unread-count
 * Numero messaggi non letti
 */
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Non autorizzato' });
        }
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Utente non trovato' });
        }
        const isOwner = user.role === 'owner';
        const field = isOwner ? 'unreadByOwner' : 'unreadByUser';
        const query = isOwner ? { owner: userId } : { user: userId };
        const conversations = await Conversazione_1.default.find(query);
        const unreadCount = conversations.reduce((sum, conv) => sum + (conv[field] || 0), 0);
        console.log(`🔔 Unread count per ${user.name} (${field}): ${unreadCount}`);
        res.json({ unreadCount });
    }
    catch (error) {
        console.error('Errore conteggio non letti:', error);
        res.status(500).json({ message: 'Errore server' });
    }
};
exports.getUnreadCount = getUnreadCount;
