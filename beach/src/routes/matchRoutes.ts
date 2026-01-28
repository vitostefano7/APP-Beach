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
  getPublicMatches,
  getMatchById,
  deleteMatch,
  assignPlayerTeam,
  getPendingInvites,
  updateInviteResponse,
  leaveMatch,
  addPlayerToMatch,
} from "../controllers/matchController";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

// ⚠️ IMPORTANTE: Route specifiche PRIMA di quelle generiche

// Lista miei match
router.get("/me", requireAuth, getMyMatches);

// Inviti pendenti - DEVE ESSERE PRIMA di /:matchId
router.get('/pending-invites', requireAuth, getPendingInvites);

// Lista match pubblici disponibili (GET prima di POST)
router.get("/", requireAuth, getPublicMatches);

// Crea match da booking
router.post("/from-booking/:bookingId", requireAuth, createMatchFromBooking);

// Crea match standalone
router.post("/", requireAuth, createMatch);

// Gestione giocatori - route specifiche
router.post("/:matchId/invite", requireAuth, invitePlayer);
router.post("/:matchId/players", requireAuth, addPlayerToMatch);
router.post("/:matchId/join", requireAuth, joinMatch);
router.patch("/:matchId/respond", requireAuth, respondToInvite);
router.patch("/:matchId/update-response", requireAuth, updateInviteResponse);
router.patch("/:matchId/leave", requireAuth, leaveMatch); // ✅ AGGIUNGI requireAuth
router.patch("/:matchId/result", requireAuth, submitResult);
router.patch("/:matchId/players/:userId/team", requireAuth, assignPlayerTeam);
router.delete("/:matchId/players/:userId", requireAuth, removePlayer);

// Route generiche - DEVONO ESSERE ALLA FINE
router.get("/:matchId", requireAuth, getMatchById);
router.delete("/:matchId", requireAuth, deleteMatch);

export default router;