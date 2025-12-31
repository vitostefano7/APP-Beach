import express from 'express';
import { requireAuth } from "../middleware/authMiddleware";

import {
  getConversations,
  getOrCreateConversation,
  getOrCreateConversationWithUser,
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

// Messaggi di una conversazione
router.get('/:conversationId/messages', requireAuth, getMessages);

// Invia messaggio
router.post('/:conversationId/messages', requireAuth, sendMessage);

export default router;