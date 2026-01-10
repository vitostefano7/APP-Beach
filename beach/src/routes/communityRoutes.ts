import { Router } from "express";
import {
  createPost,
  getPosts,
  deletePost,
  likePost,
  addComment,
  createEvent,
  getEvents,
  joinEvent,
  getRankings,
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

export default router;
