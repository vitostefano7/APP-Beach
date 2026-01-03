"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const conversazioneController_1 = require("../controllers/conversazioneController");
const router = express_1.default.Router();
// Lista conversazioni
router.get('/', authMiddleware_1.requireAuth, conversazioneController_1.getConversations);
// Conteggio non letti
router.get('/unread-count', authMiddleware_1.requireAuth, conversazioneController_1.getUnreadCount);
// Ottieni/crea conversazione con struttura (PLAYER usa questo)
router.get('/struttura/:strutturaId', authMiddleware_1.requireAuth, conversazioneController_1.getOrCreateConversation);
// Ottieni/crea conversazione con user (OWNER usa questo)
router.get('/user/:userId', authMiddleware_1.requireAuth, conversazioneController_1.getOrCreateConversationWithUser);
// Messaggi di una conversazione
router.get('/:conversationId/messages', authMiddleware_1.requireAuth, conversazioneController_1.getMessages);
// Invia messaggio
router.post('/:conversationId/messages', authMiddleware_1.requireAuth, conversazioneController_1.sendMessage);
exports.default = router;
