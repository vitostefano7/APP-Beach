import { Router } from "express";
import {
  createPost,
  getPosts,
  getPost,
  deletePost,
  likePost,
  addComment,
  createEvent,
  getEvents,
  joinEvent,
  getRankings,
  followStruttura,
  unfollowStruttura,
  getStrutturaFollowers,
  getStrutturaFollowStatus,
  getStrutturaDetails,
  getStrutturaPosts,
  searchStrutture,
  getStrutturaSuggestions,
  followUser,
  unfollowUser,
  getUserFollowStatus,
} from "../controllers/communityController";
import { requireAuth } from "../middleware/authMiddleware";
import multer from "multer";

const router = Router();

// Configurazione Multer per upload immagini in memoria
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (_req, file, cb) => {
    // Solo immagini
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

/* =========================
   POSTS ROUTES
========================= */

// GET /community/posts - Recupera tutti i post
router.get("/posts", requireAuth, getPosts);

// GET /community/posts/:postId - Recupera singolo post
router.get("/posts/:postId", requireAuth, getPost);

// POST /community/posts - Crea nuovo post
router.post("/posts", requireAuth, upload.single("image"), createPost);

// POST /community/posts/:postId/like - Like/Unlike post
router.post("/posts/:postId/like", requireAuth, likePost);

// POST /community/posts/:postId/comments - Aggiungi commento
router.post("/posts/:postId/comments", requireAuth, addComment);

// DELETE /community/posts/:postId - Elimina post
router.delete("/posts/:postId", requireAuth, deletePost);

/* =========================
   EVENTS ROUTES
========================= */

// GET /community/events - Recupera eventi
router.get("/events", requireAuth, getEvents);

// POST /community/events - Crea nuovo evento
router.post("/events", requireAuth, upload.single("image"), createEvent);

// POST /community/events/:eventId/join - Iscriviti/Disiscriviti evento
router.post("/events/:eventId/join", requireAuth, joinEvent);

/* =========================
   RANKINGS ROUTES
========================= */

// GET /community/rankings - Recupera classifiche
router.get("/rankings", requireAuth, getRankings);

/* =========================
   STRUTTURA FOLLOW ROUTES
========================= */

// GET /community/strutture/search - Cerca strutture (DEVE ESSERE PRIMA di :strutturaId)
router.get("/strutture/search", requireAuth, searchStrutture);

// GET /community/strutture/suggestions - Suggerimenti strutture
router.get("/strutture/suggestions", requireAuth, getStrutturaSuggestions);

// GET /community/strutture/:strutturaId - Dettagli struttura
router.get("/strutture/:strutturaId", requireAuth, getStrutturaDetails);

// GET /community/strutture/:strutturaId/posts - Post della struttura
router.get("/strutture/:strutturaId/posts", requireAuth, getStrutturaPosts);

// POST /community/strutture/:strutturaId/follow - Segui struttura
router.post("/strutture/:strutturaId/follow", requireAuth, followStruttura);

// DELETE /community/strutture/:strutturaId/follow - Smetti di seguire struttura
router.delete("/strutture/:strutturaId/follow", requireAuth, unfollowStruttura);

// GET /community/strutture/:strutturaId/followers - Ottieni follower struttura
router.get("/strutture/:strutturaId/followers", requireAuth, getStrutturaFollowers);

// GET /community/strutture/:strutturaId/follow-status - Verifica se segui la struttura
router.get("/strutture/:strutturaId/follow-status", requireAuth, getStrutturaFollowStatus);

/* =========================
   USER FOLLOW ROUTES (Struttura -> User)
========================= */

// POST /community/users/:userId/follow - Struttura segue utente
router.post("/users/:userId/follow", requireAuth, followUser);

// DELETE /community/users/:userId/follow - Struttura smette di seguire utente
router.delete("/users/:userId/follow", requireAuth, unfollowUser);

// GET /community/users/:userId/follow-status - Verifica se struttura segue utente
router.get("/users/:userId/follow-status", requireAuth, getUserFollowStatus);

export default router;
