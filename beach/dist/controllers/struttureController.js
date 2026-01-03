"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchAddress = exports.deleteStruttura = exports.updateStruttura = exports.createStruttura = exports.getOwnerStrutture = exports.getCampiByStruttura = exports.getStrutturaById = exports.getStrutture = void 0;
const Strutture_1 = __importDefault(require("../models/Strutture"));
const Campo_1 = __importDefault(require("../models/Campo"));
const axios_1 = __importDefault(require("axios"));
/**
 * 📌 GET /strutture
 * Tutte le strutture pubbliche (PLAYER) - CON SPORTS AGGREGATI
 */
const getStrutture = async (_req, res) => {
    try {
        const strutture = await Strutture_1.default.find({
            isActive: true,
            isDeleted: false,
        })
            .sort({ isFeatured: -1, createdAt: -1 })
            .lean();
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
            const pricePerHour = campi.length > 0
                ? Math.min(...campi.map((c) => c.pricePerHour))
                : 0;
            const indoor = campi.some((c) => c.indoor);
            return {
                ...struttura,
                sports,
                pricePerHour,
                indoor,
            };
        }));
        res.json(struttureWithSports);
    }
    catch (err) {
        console.error("Errore getStrutture:", err);
        res.status(500).json({ message: "Errore caricamento strutture" });
    }
};
exports.getStrutture = getStrutture;
/**
 * 📌 GET /strutture/:id
 * Dettaglio singola struttura
 */
const getStrutturaById = async (req, res) => {
    try {
        const struttura = await Strutture_1.default.findOne({
            _id: req.params.id,
            isDeleted: false,
        });
        if (!struttura) {
            return res.status(404).json({ message: "Struttura non trovata" });
        }
        res.json(struttura);
    }
    catch (err) {
        console.error("Errore getStrutturaById:", err);
        res.status(500).json({ message: "Errore struttura" });
    }
};
exports.getStrutturaById = getStrutturaById;
/**
 * 📌 GET /strutture/:id/campi
 * Tutti i campi di una struttura
 */
const getCampiByStruttura = async (req, res) => {
    try {
        const campi = await Campo_1.default.find({
            struttura: req.params.id,
            isActive: true,
        }).sort({ pricePerHour: 1 });
        res.json(campi);
    }
    catch (err) {
        console.error("Errore getCampiByStruttura:", err);
        res.status(500).json({ message: "Errore caricamento campi" });
    }
};
exports.getCampiByStruttura = getCampiByStruttura;
/**
 * 📌 GET /strutture/owner/me
 * Strutture dell'owner loggato
 */
const getOwnerStrutture = async (req, res) => {
    try {
        const strutture = await Strutture_1.default.find({
            owner: req.user.id,
            isDeleted: false,
        }).sort({ createdAt: -1 });
        res.json(strutture);
    }
    catch (err) {
        console.error("Errore getOwnerStrutture:", err);
        res.status(500).json({ message: "Errore server" });
    }
};
exports.getOwnerStrutture = getOwnerStrutture;
/**
 * 📌 POST /strutture
 * Crea nuova struttura (OWNER)
 */
const createStruttura = async (req, res) => {
    try {
        const { name, description, location, amenities, openingHours } = req.body;
        if (!name || !location?.city) {
            return res.status(400).json({
                message: "Nome e citta sono obbligatori"
            });
        }
        if (!location.lat || !location.lng) {
            return res.status(400).json({
                message: "Coordinate mancanti. Seleziona un indirizzo valido"
            });
        }
        const struttura = new Strutture_1.default({
            name,
            description,
            owner: req.user.id,
            location: {
                address: location.address,
                city: location.city,
                lat: location.lat,
                lng: location.lng,
                coordinates: location.coordinates || [location.lng, location.lat],
            },
            amenities: amenities || [],
            openingHours: openingHours || {},
            isActive: true,
            isFeatured: false,
            isDeleted: false,
        });
        await struttura.save();
        console.log("✅ Struttura creata:", struttura._id);
        res.status(201).json({
            message: "Struttura creata con successo",
            struttura,
        });
    }
    catch (err) {
        console.error("❌ Errore createStruttura:", err);
        res.status(500).json({ message: "Errore creazione struttura" });
    }
};
exports.createStruttura = createStruttura;
/**
 * 📌 PUT /strutture/:id
 * Modifica struttura (OWNER)
 */
const updateStruttura = async (req, res) => {
    try {
        const struttura = await Strutture_1.default.findOne({
            _id: req.params.id,
            owner: req.user.id,
            isDeleted: false,
        });
        if (!struttura) {
            return res.status(404).json({
                message: "Struttura non trovata o non autorizzato"
            });
        }
        const { name, description, location, amenities, openingHours, isActive } = req.body;
        if (name)
            struttura.name = name;
        if (description !== undefined)
            struttura.description = description;
        if (location) {
            struttura.location = {
                ...struttura.location,
                ...location,
                coordinates: location.coordinates || [location.lng, location.lat],
            };
        }
        // ✅ AMENITIES - Supporta array e oggetto legacy
        if (amenities !== undefined) {
            if (Array.isArray(amenities)) {
                // Array → Salva direttamente
                console.log("✅ Amenities array:", amenities);
                struttura.amenities = amenities;
            }
            else if (typeof amenities === 'object' && amenities !== null) {
                // Oggetto legacy → Converti
                console.log("⚠️ Amenities oggetto (legacy), converto");
                const italianToEnglish = {
                    'Bagni': 'toilets',
                    'Spogliatoi': 'lockerRoom',
                    'Docce': 'showers',
                    'Parcheggio': 'parking',
                    'Ristorante': 'restaurant',
                    'Bar': 'bar',
                };
                struttura.amenities = Object.entries(amenities)
                    .filter(([_, value]) => value === true)
                    .map(([key]) => italianToEnglish[key] || key);
                console.log("✅ Convertito in:", struttura.amenities);
            }
        }
        if (openingHours !== undefined)
            struttura.openingHours = openingHours;
        if (isActive !== undefined)
            struttura.isActive = isActive;
        await struttura.save();
        console.log("✅ Struttura salvata:", struttura._id);
        res.json({
            message: "Struttura aggiornata con successo",
            struttura,
        });
    }
    catch (err) {
        console.error("❌ Errore updateStruttura:", err);
        res.status(500).json({ message: "Errore aggiornamento struttura" });
    }
};
exports.updateStruttura = updateStruttura;
/**
 * 📌 DELETE /strutture/:id
 * Elimina struttura (OWNER)
 */
const deleteStruttura = async (req, res) => {
    try {
        console.log("🗑️ Eliminazione struttura:", req.params.id);
        const struttura = await Strutture_1.default.findOne({
            _id: req.params.id,
            owner: req.user.id,
            isDeleted: false,
        });
        if (!struttura) {
            return res.status(404).json({
                message: "Struttura non trovata o non autorizzato"
            });
        }
        const campiEliminati = await Campo_1.default.deleteMany({ struttura: req.params.id });
        console.log(`✅ ${campiEliminati.deletedCount} campi eliminati`);
        await Strutture_1.default.findByIdAndDelete(req.params.id);
        console.log("✅ Struttura eliminata:", struttura.name);
        res.json({ message: "Struttura e campi eliminati con successo" });
    }
    catch (err) {
        console.error("❌ Errore deleteStruttura:", err);
        res.status(500).json({ message: "Errore eliminazione struttura" });
    }
};
exports.deleteStruttura = deleteStruttura;
/**
 * 📌 GET /strutture/search-address
 * Proxy per Nominatim
 */
const searchAddress = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || typeof query !== "string" || query.length < 3) {
            return res.status(400).json({
                message: "Query deve essere almeno 3 caratteri"
            });
        }
        console.log("🔍 Cercando:", query);
        const response = await axios_1.default.get("https://nominatim.openstreetmap.org/search", {
            params: {
                q: query,
                countrycodes: "it",
                format: "json",
                addressdetails: 1,
                limit: 5,
            },
            headers: {
                "User-Agent": "SportApp/1.0 (contact@sportapp.com)",
            },
            timeout: 5000,
        });
        console.log("✅ Risultati:", response.data.length);
        const suggestions = response.data.map((item) => ({
            place_id: item.place_id,
            display_name: item.display_name,
            lat: item.lat,
            lon: item.lon,
            address: {
                city: item.address?.city,
                town: item.address?.town,
                village: item.address?.village,
                municipality: item.address?.municipality,
                road: item.address?.road,
                postcode: item.address?.postcode,
            },
        }));
        res.json(suggestions);
    }
    catch (err) {
        console.error("❌ Errore searchAddress:", err.message);
        if (err.response) {
            return res.status(err.response.status).json({
                message: "Errore dal servizio di geocoding"
            });
        }
        res.status(500).json({ message: "Errore ricerca indirizzo" });
    }
};
exports.searchAddress = searchAddress;
