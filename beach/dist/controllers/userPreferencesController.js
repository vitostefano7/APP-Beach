"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFavoriteStrutture = exports.removeFavoriteStruttura = exports.addFavoriteStruttura = exports.updatePreferredLocation = exports.updateUserPreferences = exports.getUserPreferences = void 0;
exports.calculateDistance = calculateDistance;
const UserPreferences_1 = __importDefault(require("../models/UserPreferences"));
const Strutture_1 = __importDefault(require("../models/Strutture"));
const Campo_1 = __importDefault(require("../models/Campo"));
/**
 * 📌 GET /users/preferences
 * Ottieni preferenze dell'utente loggato
 */
const getUserPreferences = async (req, res) => {
    try {
        let preferences = await UserPreferences_1.default.findOne({ user: req.user.id });
        // Se non esistono, creale con valori default
        if (!preferences) {
            preferences = await UserPreferences_1.default.create({
                user: req.user.id,
            });
        }
        res.json(preferences);
    }
    catch (err) {
        console.error('Errore getUserPreferences:', err);
        res.status(500).json({ message: 'Errore caricamento preferenze' });
    }
};
exports.getUserPreferences = getUserPreferences;
/**
 * 📌 PUT /users/preferences
 * Aggiorna preferenze generali
 */
const updateUserPreferences = async (req, res) => {
    try {
        const { pushNotifications, darkMode, privacyLevel, favoriteSports, preferredTimeSlot, } = req.body;
        let preferences = await UserPreferences_1.default.findOne({ user: req.user.id });
        if (!preferences) {
            preferences = new UserPreferences_1.default({ user: req.user.id });
        }
        // Aggiorna solo i campi forniti
        if (pushNotifications !== undefined)
            preferences.pushNotifications = pushNotifications;
        if (darkMode !== undefined)
            preferences.darkMode = darkMode;
        if (privacyLevel)
            preferences.privacyLevel = privacyLevel;
        if (favoriteSports)
            preferences.favoriteSports = favoriteSports;
        if (preferredTimeSlot !== undefined)
            preferences.preferredTimeSlot = preferredTimeSlot;
        await preferences.save();
        res.json({
            message: 'Preferenze aggiornate con successo',
            preferences,
        });
    }
    catch (err) {
        console.error('Errore updateUserPreferences:', err);
        res.status(500).json({ message: 'Errore aggiornamento preferenze' });
    }
};
exports.updateUserPreferences = updateUserPreferences;
/**
 * 📌 PUT /users/preferences/location
 * Aggiorna location preferita
 */
const updatePreferredLocation = async (req, res) => {
    try {
        const { city, address, lat, lng, radius } = req.body;
        if (!city || !lat || !lng) {
            return res.status(400).json({
                message: 'City, lat e lng sono obbligatori',
            });
        }
        let preferences = await UserPreferences_1.default.findOne({ user: req.user.id });
        if (!preferences) {
            preferences = new UserPreferences_1.default({ user: req.user.id });
        }
        preferences.preferredLocation = {
            city,
            address,
            lat,
            lng,
            radius: radius || 10,
        };
        await preferences.save();
        res.json({
            message: 'Location preferita aggiornata',
            preferredLocation: preferences.preferredLocation,
        });
    }
    catch (err) {
        console.error('Errore updatePreferredLocation:', err);
        res.status(500).json({ message: 'Errore aggiornamento location' });
    }
};
exports.updatePreferredLocation = updatePreferredLocation;
/**
 * 📌 POST /users/preferences/favorites/:strutturaId
 * Aggiungi struttura ai preferiti (stellina)
 */
const addFavoriteStruttura = async (req, res) => {
    try {
        const { strutturaId } = req.params;
        // Verifica che la struttura esista
        const struttura = await Strutture_1.default.findOne({
            _id: strutturaId,
            isActive: true,
            isDeleted: false,
        });
        if (!struttura) {
            return res.status(404).json({ message: 'Struttura non trovata' });
        }
        let preferences = await UserPreferences_1.default.findOne({ user: req.user.id });
        if (!preferences) {
            preferences = new UserPreferences_1.default({ user: req.user.id });
        }
        // Aggiungi solo se non è già nei preferiti
        if (!preferences.favoriteStrutture.includes(strutturaId)) {
            preferences.favoriteStrutture.push(strutturaId);
            await preferences.save();
        }
        res.json({
            message: 'Struttura aggiunta ai preferiti',
            favoriteStrutture: preferences.favoriteStrutture,
        });
    }
    catch (err) {
        console.error('Errore addFavoriteStruttura:', err);
        res.status(500).json({ message: 'Errore aggiunta preferito' });
    }
};
exports.addFavoriteStruttura = addFavoriteStruttura;
/**
 * 📌 DELETE /users/preferences/favorites/:strutturaId
 * Rimuovi struttura dai preferiti
 */
const removeFavoriteStruttura = async (req, res) => {
    try {
        const { strutturaId } = req.params;
        const preferences = await UserPreferences_1.default.findOne({ user: req.user.id });
        if (!preferences) {
            return res.status(404).json({ message: 'Preferenze non trovate' });
        }
        // Rimuovi dai preferiti
        preferences.favoriteStrutture = preferences.favoriteStrutture.filter((id) => id.toString() !== strutturaId);
        await preferences.save();
        res.json({
            message: 'Struttura rimossa dai preferiti',
            favoriteStrutture: preferences.favoriteStrutture,
        });
    }
    catch (err) {
        console.error('Errore removeFavoriteStruttura:', err);
        res.status(500).json({ message: 'Errore rimozione preferito' });
    }
};
exports.removeFavoriteStruttura = removeFavoriteStruttura;
/**
 * 📌 GET /users/preferences/favorites
 * Ottieni strutture favorite con dettagli completi
 */
const getFavoriteStrutture = async (req, res) => {
    try {
        const preferences = await UserPreferences_1.default.findOne({ user: req.user.id });
        if (!preferences || preferences.favoriteStrutture.length === 0) {
            return res.json([]);
        }
        // Carica le strutture favorite con i dettagli completi
        const strutture = await Strutture_1.default.find({
            _id: { $in: preferences.favoriteStrutture },
            isActive: true,
            isDeleted: false,
        }).lean();
        // Aggrega sport dai campi (come in getStrutture)
        const struttureWithSports = await Promise.all(strutture.map(async (struttura) => {
            const campi = await Campo_1.default.find({
                struttura: struttura._id,
                isActive: true,
            })
                .select('sport indoor pricePerHour')
                .lean();
            const sportsSet = new Set();
            campi.forEach((campo) => {
                if (campo.sport === 'beach_volley') {
                    sportsSet.add('Beach Volley');
                }
                else if (campo.sport === 'volley') {
                    sportsSet.add('Volley');
                }
            });
            const sports = Array.from(sportsSet);
            const pricePerHour = campi.length > 0 ? Math.min(...campi.map((c) => c.pricePerHour)) : 0;
            const indoor = campi.some((c) => c.indoor);
            return {
                ...struttura,
                sports,
                pricePerHour,
                indoor,
                isFavorite: true, // Flag per il frontend
            };
        }));
        res.json(struttureWithSports);
    }
    catch (err) {
        console.error('Errore getFavoriteStrutture:', err);
        res.status(500).json({ message: 'Errore caricamento preferiti' });
    }
};
exports.getFavoriteStrutture = getFavoriteStrutture;
/**
 * 📌 UTILITY: Calcola distanza tra due coordinate (formula Haversine)
 * Usata per trovare strutture vicine alla location preferita
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raggio della Terra in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
function toRad(deg) {
    return deg * (Math.PI / 180);
}
