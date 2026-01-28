import express from 'express';
import { requireAuth } from "../middleware/authMiddleware";

import {
  getConversations,
  getOrCreateConversation,
  getOrCreateConversationWithUser,
  getOrCreateGroupConversation,
  getOrCreateDirectConversationWithUser,
  getMessages,
  sendMessage,
  getUnreadCount,
} from '../controllers/conversazioneController';

const router = express.Router();

// Lista conversazioni
router.get('/', requireAuth, getConversations);

// Conteggio non letti
router.get('/unread-count', requireAuth, getUnreadCount);

// Ottieni/crea conversazione con struttura (PLAYER usa questo)
router.get('/struttura/:strutturaId', requireAuth, getOrCreateConversation);

// Ottieni/crea conversazione con user (OWNER usa questo)
router.get('/user/:userId', requireAuth, getOrCreateConversationWithUser);

// Ottieni/crea conversazione di gruppo per un match
router.get('/match/:matchId', requireAuth, getOrCreateGroupConversation);

// Ottieni/crea conversazione diretta con un altro utente
router.get('/direct/:userId', requireAuth, getOrCreateDirectConversationWithUser);

// Messaggi di una conversazione
router.get('/:conversationId/messages', requireAuth, getMessages);

// Invia messaggio
router.post('/:conversationId/messages', requireAuth, sendMessage);

export default router;