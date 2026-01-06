import express from "express";
import { friendshipController } from "../controllers/friendshipController";
import { requireAuth, AuthRequest } from "../middleware/authMiddleware";

const router = express.Router();

console.log("🚀 Friendship routes - Middleware setup");

/**
 * MIDDLEWARE DI AUTENTICAZIONE
 * Tutte le routes richiedono autenticazione
 */
router.use((req, res, next) => {
  console.log(`🔐 [friendshipRoutes] Richiesta a: ${req.method} ${req.originalUrl}`);
  requireAuth(req as AuthRequest, res, next);
});

/**
 * RICHIESTE DI AMICIZIA
 */

// Invia richiesta di amicizia
router.post("/request", (req, res) => friendshipController.sendRequest(req as AuthRequest, res));

// Accetta richiesta di amicizia
router.put("/request/:id/accept", (req, res) => friendshipController.acceptRequest(req as AuthRequest, res));

// Rifiuta richiesta di amicizia
router.put("/request/:id/reject", (req, res) => friendshipController.rejectRequest(req as AuthRequest, res));

// Cancella/revoca richiesta di amicizia
router.delete("/request/:id", (req, res) => friendshipController.deleteRequest(req as AuthRequest, res));

/**
 * GESTIONE AMICIZIE
 */

// Lista amici (con ricerca opzionale)
router.get("/", (req, res) => friendshipController.getFriends(req as AuthRequest, res));

// Blocca utente
router.post("/block", (req, res) => friendshipController.blockUser(req as AuthRequest, res));

// Sblocca utente
router.post("/unblock", (req, res) => friendshipController.unblockUser(req as AuthRequest, res));

/**
 * RICHIESTE PENDING
 */

// Richieste in arrivo (pendenti)
router.get("/requests/incoming", (req, res) => friendshipController.getIncomingRequests(req as AuthRequest, res));

// Richieste in uscita (pendenti)
router.get("/requests/outgoing", (req, res) => friendshipController.getOutgoingRequests(req as AuthRequest, res));

/**
 * SUGGERIMENTI E STATISTICHE
 */

// Suggerimenti amici (con logica priorità)
router.get("/suggestions", (req, res) => friendshipController.getFriendSuggestions(req as AuthRequest, res));

// Stato amicizia con utente specifico
router.get("/status/:userId", (req, res) => friendshipController.getFriendshipStatus(req as AuthRequest, res));

// Statistiche amicizie
router.get("/stats", (req, res) => friendshipController.getFriendshipStats(req as AuthRequest, res));

export default router;