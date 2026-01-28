// routes/userPreferencesRoutes.ts
import express from 'express';
import { requireAuth } from "../middleware/authMiddleware";
import {
  getUserPreferences,
  updateUserPreferences,
  addFavoriteStruttura,
  removeFavoriteStruttura,
  getFavoriteStrutture,
  updatePreferredLocation,
} from '../controllers/userPreferencesController';

const router = express.Router();

// Tutte queste route sono sotto /users
// Quindi router.get('/preferences') diventa GET /users/preferences

// GET /users/preferences - Ottieni preferenze utente
router.get('/preferences', requireAuth, getUserPreferences);

// PUT /users/preferences - Aggiorna preferenze generali
router.put('/preferences', requireAuth, updateUserPreferences);

// PUT /users/preferences/location - Aggiorna location preferita
router.put('/preferences/location', requireAuth, updatePreferredLocation);

// POST /users/preferences/favorites/:strutturaId - Aggiungi ai preferiti
router.post('/preferences/favorites/:strutturaId', requireAuth, addFavoriteStruttura);

// DELETE /users/preferences/favorites/:strutturaId - Rimuovi dai preferiti
router.delete('/preferences/favorites/:strutturaId', requireAuth, removeFavoriteStruttura);

// GET /users/preferences/favorites - Ottieni strutture favorite (con dettagli)
router.get('/preferences/favorites', requireAuth, getFavoriteStrutture);

export default router;