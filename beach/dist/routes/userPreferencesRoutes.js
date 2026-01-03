"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/userPreferencesRoutes.ts
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const userPreferencesController_1 = require("../controllers/userPreferencesController");
const router = express_1.default.Router();
// Tutte queste route sono sotto /users
// Quindi router.get('/preferences') diventa GET /users/preferences
// GET /users/preferences - Ottieni preferenze utente
router.get('/preferences', authMiddleware_1.requireAuth, userPreferencesController_1.getUserPreferences);
// PUT /users/preferences - Aggiorna preferenze generali
router.put('/preferences', authMiddleware_1.requireAuth, userPreferencesController_1.updateUserPreferences);
// PUT /users/preferences/location - Aggiorna location preferita
router.put('/preferences/location', authMiddleware_1.requireAuth, userPreferencesController_1.updatePreferredLocation);
// POST /users/preferences/favorites/:strutturaId - Aggiungi ai preferiti
router.post('/preferences/favorites/:strutturaId', authMiddleware_1.requireAuth, userPreferencesController_1.addFavoriteStruttura);
// DELETE /users/preferences/favorites/:strutturaId - Rimuovi dai preferiti
router.delete('/preferences/favorites/:strutturaId', authMiddleware_1.requireAuth, userPreferencesController_1.removeFavoriteStruttura);
// GET /users/preferences/favorites - Ottieni strutture favorite (con dettagli)
router.get('/preferences/favorites', authMiddleware_1.requireAuth, userPreferencesController_1.getFavoriteStrutture);
exports.default = router;
