import { Router } from "express";
import {
  createMatchFromBooking,
  createMatch,
  invitePlayer,
  joinMatch,
  respondToInvite,
  removePlayer,
  submitResult,
  getMyMatches,
  getMatchById,
  deleteMatch,
  assignPlayerTeam, // 🆕 Aggiunto
} from "../controllers/matchController";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

// Crea match da booking
router.post("/from-booking/:bookingId", requireAuth, createMatchFromBooking);

// Crea match standalone
router.post("/", requireAuth, createMatch);

// Lista miei match
router.get("/me", requireAuth, getMyMatches);

// Invita giocatore
router.post("/:matchId/invite", requireAuth, invitePlayer);

// Join match pubblico
router.post("/:matchId/join", requireAuth, joinMatch);

// Rispondi a invito
router.patch("/:matchId/respond", requireAuth, respondToInvite);

// Rimuovi giocatore
router.delete("/:matchId/players/:userId", requireAuth, removePlayer);

// 🆕 Assegna giocatore a team
router.patch("/:matchId/players/:userId/team", requireAuth, assignPlayerTeam);

// Inserisci risultato
router.patch("/:matchId/result", requireAuth, submitResult);

// Dettaglio match
router.get("/:matchId", requireAuth, getMatchById);

// Cancella match
router.delete("/:matchId", requireAuth, deleteMatch);

export default router;